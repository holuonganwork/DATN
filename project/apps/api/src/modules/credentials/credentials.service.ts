import { randomBytes } from "node:crypto";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Batch,
  BatchEntry,
  BatchStatus,
  Course,
  Credential,
  CredentialStatus,
  EntryValidationStatus,
  Learner,
  OrganizationStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { ulid } from "ulid";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { assertOrgScope } from "../../common/auth/org-scope";
import { CLOCK_PORT, Clock } from "../../common/clock";
import { AppError } from "../../common/errors/app-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { IdempotencyService } from "../../common/idempotency/idempotency.service";
import { PaginationQueryDto } from "../../common/pagination.dto";
import { PaginatedPayload } from "../../common/response-envelope.interceptor";
import { AppEnv } from "../../config/env.schema";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import {
  buildMerkleTree,
  computeInputDigest,
  computePayloadDigest,
  CredentialAnchor,
  CredentialPackage,
  CredentialPayload,
  generateCredentialCode,
  normalizeAddress,
  normalizePayload,
  normalizeText,
  toRfc3339UtcSeconds,
} from "../credential-core";
import { ISSUANCE_PORT, IssuancePort } from "../issuance/issuance.port";
import { ReissueCredentialDto } from "./dto/reissue-credential.dto";
import { RevokeCredentialDto } from "./dto/revoke-credential.dto";

type CredentialWithRelations = Credential & {
  batch: Batch & { course: Course };
  batchEntry: BatchEntry;
  learner: Learner;
  reissuedTo: { id: string } | null;
};

export interface CredentialResponse {
  id: string;
  code: string;
  organizationId: string;
  batchId: string;
  batchEntryId: string;
  learnerId: string;
  subjectRef: string;
  holder: string;
  courseId: string;
  courseCode: string;
  course: string;
  score: string;
  issuedAt: string;
  expiresAt: string | null;
  nonce: string;
  pdfFileName: string | null;
  pdfSha256: string | null;
  payloadDigest: string;
  leaf: string;
  proofPath: string[];
  merkleRoot: string;
  chainId: number;
  registryAddress: string;
  issuanceRef: string | null;
  status: CredentialStatus;
  revokedAt: string | null;
  revokedReason: string | null;
  reissuedFromId: string | null;
  reissuedToId: string | null;
}

const mapCredential = (cred: CredentialWithRelations): CredentialResponse => ({
  id: cred.id,
  code: cred.code,
  organizationId: cred.organizationId,
  batchId: cred.batchId,
  batchEntryId: cred.batchEntryId,
  learnerId: cred.learnerId,
  subjectRef: cred.batchEntry.subjectRefSnapshot,
  holder: cred.batchEntry.holderNameSnapshot,
  courseId: cred.batch.courseId,
  courseCode: cred.batch.course.code,
  course: cred.batchEntry.courseNameSnapshot,
  score: cred.batchEntry.result,
  issuedAt: toRfc3339UtcSeconds(cred.issuedAt),
  expiresAt: cred.expiresAt ? toRfc3339UtcSeconds(cred.expiresAt) : null,
  nonce: cred.batchEntry.nonce,
  pdfFileName: cred.batchEntry.pdfFileName,
  pdfSha256: cred.pdfSha256,
  payloadDigest: cred.payloadDigest,
  leaf: cred.leaf,
  proofPath: Array.isArray(cred.batchEntry.proofJson)
    ? (cred.batchEntry.proofJson as string[])
    : [],
  merkleRoot: cred.batch.merkleRoot ?? "",
  chainId: cred.batch.anchorChainId,
  registryAddress: cred.batch.anchorRegistryAddress,
  issuanceRef: cred.batch.issuanceRef,
  status: cred.status,
  revokedAt: cred.revokedAt?.toISOString() ?? null,
  revokedReason: cred.revocationReason,
  reissuedFromId: cred.reissuedFromId,
  reissuedToId: cred.reissuedTo?.id ?? null,
});

const CREDENTIAL_INCLUDE = {
  batch: { include: { course: true } },
  batchEntry: true,
  learner: true,
  reissuedTo: { select: { id: true } },
} satisfies Prisma.CredentialInclude;

@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly auditService: AuditService,
    private readonly idempotencyService: IdempotencyService,
    @Inject(ISSUANCE_PORT) private readonly issuancePort: IssuancePort,
    @Inject(CLOCK_PORT) private readonly clock: Clock,
  ) {}

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & {
      organizationId?: string;
      status?: CredentialStatus;
      batchId?: string;
      learnerId?: string;
    },
  ): Promise<PaginatedPayload<CredentialResponse>> {
    const scopedOrgId =
      user.role === Role.SYSTEM_ADMIN ? query.organizationId : (user.organizationId ?? "__none__");

    const where: Prisma.CredentialWhereInput = {
      ...(scopedOrgId ? { organizationId: scopedOrgId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.batchId ? { batchId: query.batchId } : {}),
      ...(query.learnerId ? { learnerId: query.learnerId } : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.credential.findMany({
        where,
        include: CREDENTIAL_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      this.prisma.credential.count({ where }),
    ]);

    return {
      items: rows.map(mapCredential),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async findOne(user: AuthenticatedUser, idOrCode: string): Promise<CredentialResponse> {
    const cred = await this.prisma.credential.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode.trim().toUpperCase() }],
      },
      include: CREDENTIAL_INCLUDE,
    });
    if (!cred) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy chứng chỉ");
    }
    assertOrgScope(user, cred.organizationId);
    return mapCredential(cred);
  }

  async getPackage(user: AuthenticatedUser, idOrCode: string): Promise<CredentialPackage> {
    const cred = await this.prisma.credential.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode.trim().toUpperCase() }],
      },
      include: CREDENTIAL_INCLUDE,
    });
    if (!cred) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy chứng chỉ");
    }
    assertOrgScope(user, cred.organizationId);
    if (cred.status === CredentialStatus.PREPARED || cred.batch.status !== BatchStatus.CONFIRMED) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ERROR_CODES.INVALID_STATE_TRANSITION,
        "Chỉ xuất được gói chứng chỉ sau khi lô đã phát hành (CONFIRMED)",
      );
    }

    const payload = cred.batchEntry.payloadJson as unknown as CredentialPayload;
    const proofPath = Array.isArray(cred.batchEntry.proofJson)
      ? (cred.batchEntry.proofJson as string[])
      : [];

    return {
      payload,
      anchor: {
        chainId: cred.batch.anchorChainId,
        registryAddress: cred.batch.anchorRegistryAddress,
        batchId: cred.batchId,
        issuerId: cred.organizationId,
      },
      proof: {
        leaf: cred.leaf,
        path: proofPath,
        root: cred.batch.merkleRoot ?? "",
      },
    };
  }

  async revoke(
    actor: AuthenticatedUser,
    credentialId: string,
    dto: RevokeCredentialDto,
    idempotencyKey: string | undefined,
    correlationId: string,
  ): Promise<CredentialResponse> {
    const reason = normalizeText(dto.reason);

    return this.idempotencyService.executeInTransaction<CredentialResponse>({
      scope: `credential:revoke:${credentialId}`,
      idempotencyKey,
      requestBody: { credentialId, reason },
      statusCode: HttpStatus.OK,
      run: async (tx) => {
        const cred = await tx.credential.findUnique({
          where: { id: credentialId },
          include: {
            ...CREDENTIAL_INCLUDE,
            organization: true,
          },
        });
        if (!cred) {
          throw new AppError(
            HttpStatus.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            "Không tìm thấy chứng chỉ",
          );
        }
        assertOrgScope(actor, cred.organizationId);
        if (cred.organization.status !== OrganizationStatus.ACTIVE) {
          throw new AppError(
            HttpStatus.FORBIDDEN,
            ERROR_CODES.ORGANIZATION_NOT_ACTIVE,
            "Tổ chức phát hành không ở trạng thái ACTIVE",
          );
        }
        if (cred.batch.status !== BatchStatus.CONFIRMED) {
          throw new AppError(
            HttpStatus.CONFLICT,
            ERROR_CODES.INVALID_STATE_TRANSITION,
            "Chỉ thu hồi được chứng chỉ thuộc lô đã CONFIRMED",
          );
        }
        if (cred.status !== CredentialStatus.ISSUED) {
          throw new AppError(
            HttpStatus.CONFLICT,
            ERROR_CODES.INVALID_STATE_TRANSITION,
            `Chứng chỉ đang ở trạng thái ${cred.status}, không thể thu hồi`,
          );
        }

        const receipt = await this.issuancePort.revokeCredential({
          organizationId: cred.organizationId,
          batchId: cred.batchId,
          credentialId: cred.id,
          leaf: cred.leaf,
          reason,
        });

        if (receipt.status !== "CONFIRMED") {
          throw new AppError(
            HttpStatus.BAD_GATEWAY,
            ERROR_CODES.INVALID_STATE_TRANSITION,
            "Thu hồi chứng chỉ qua IssuancePort thất bại",
          );
        }

        const updated = await tx.credential.update({
          where: { id: cred.id },
          data: {
            status: CredentialStatus.REVOKED,
            revokedAt: receipt.confirmedAt,
            revocationReason: reason,
          },
          include: CREDENTIAL_INCLUDE,
        });

        await this.auditService.record(tx, {
          actorUserId: actor.userId,
          actorRole: actor.role,
          actorName: actor.displayName,
          organizationId: cred.organizationId,
          action: "CREDENTIAL_REVOKED",
          aggregateType: "CREDENTIAL",
          aggregateId: cred.id,
          correlationId,
          detail: `Thu hồi chứng chỉ ${cred.code} (${reason})`,
          metadata: {
            credentialCode: cred.code,
            batchId: cred.batchId,
            issuanceRef: receipt.reference,
            reason,
          },
        });

        return mapCredential(updated);
      },
    });
  }

  async reissue(
    actor: AuthenticatedUser,
    credentialId: string,
    dto: ReissueCredentialDto,
    idempotencyKey: string | undefined,
    correlationId: string,
  ): Promise<CredentialResponse> {
    const cleanResult = normalizeText(dto.result);
    const cleanReason = normalizeText(dto.reason);
    const cleanHolder = dto.holderName ? normalizeText(dto.holderName) : undefined;

    return this.idempotencyService.executeInTransaction<CredentialResponse>({
      scope: `credential:reissue:${credentialId}`,
      idempotencyKey,
      requestBody: {
        credentialId,
        holderName: cleanHolder ?? null,
        result: cleanResult,
        expiresAt: dto.expiresAt ?? null,
        reason: cleanReason,
      },
      statusCode: HttpStatus.CREATED,
      run: async (tx) => {
        const source = await tx.credential.findUnique({
          where: { id: credentialId },
          include: {
            ...CREDENTIAL_INCLUDE,
            organization: true,
          },
        });
        if (!source) {
          throw new AppError(
            HttpStatus.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            "Không tìm thấy chứng chỉ gốc để cấp lại",
          );
        }
        assertOrgScope(actor, source.organizationId);
        if (source.organization.status !== OrganizationStatus.ACTIVE) {
          throw new AppError(
            HttpStatus.FORBIDDEN,
            ERROR_CODES.ORGANIZATION_NOT_ACTIVE,
            "Tổ chức phát hành không ở trạng thái ACTIVE",
          );
        }
        if (
          source.status !== CredentialStatus.ISSUED &&
          source.status !== CredentialStatus.REVOKED
        ) {
          throw new AppError(
            HttpStatus.CONFLICT,
            ERROR_CODES.INVALID_STATE_TRANSITION,
            "Chỉ chứng chỉ đang ISSUED hoặc REVOKED mới có thể cấp lại",
          );
        }
        if (source.reissuedTo) {
          throw new AppError(
            HttpStatus.CONFLICT,
            ERROR_CODES.CONFLICT,
            "Chứng chỉ này đã có phiên bản cấp lại trước đó",
          );
        }

        const issuedAtDate = this.clock.now();
        const expiresAtDate = dto.expiresAt ? new Date(dto.expiresAt) : null;
        if (expiresAtDate && expiresAtDate.getTime() <= issuedAtDate.getTime()) {
          throw new AppError(
            HttpStatus.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
            "Ngày hết hạn phải sau thời điểm cấp lại",
          );
        }

        const chainId = this.config.get("ANCHOR_CHAIN_ID", { infer: true });
        const registryAddress = normalizeAddress(
          this.config.get("ANCHOR_REGISTRY_ADDRESS", { infer: true }),
        );
        const holderName = cleanHolder ?? source.batchEntry.holderNameSnapshot;
        const newBatchId = `bat_${ulid().toLowerCase()}`;
        const newBatchCode = `BATCH-R-${newBatchId.slice(-6).toUpperCase()}`;
        const newEntryId = `ent_${ulid().toLowerCase()}`;
        const newCredId = `cred_${ulid().toLowerCase()}`;
        const newCredCode = await this.allocateUniqueCredentialCode(tx);
        const nonce = `n_${randomBytes(8).toString("hex")}`;

        const payload = normalizePayload({
          credentialId: newCredId,
          issuerId: source.organizationId,
          holder: holderName,
          courseId: source.batch.courseId,
          courseName: source.batch.course.name,
          result: cleanResult,
          issuedAt: toRfc3339UtcSeconds(issuedAtDate),
          expiresAt: expiresAtDate ? toRfc3339UtcSeconds(expiresAtDate) : null,
          nonce,
          pdfSha256: null,
        });
        const payloadDigest = computePayloadDigest(payload);
        const anchor: CredentialAnchor = {
          chainId,
          registryAddress,
          batchId: newBatchId,
          issuerId: source.organizationId,
        };
        const tree = buildMerkleTree([{ key: newEntryId, anchor, payloadDigest }]);
        const leaf = tree.leaves[newEntryId];
        const proofPath = tree.proofs[newEntryId] ?? [];
        const inputDigest = computeInputDigest([payloadDigest]);

        const receipt = await this.issuancePort.publishBatch({
          organizationId: source.organizationId,
          batchId: newBatchId,
          merkleRoot: tree.root,
          entryCount: 1,
          anchorChainId: chainId,
          anchorRegistryAddress: registryAddress,
        });

        await tx.batch.create({
          data: {
            id: newBatchId,
            code: newBatchCode,
            organizationId: source.organizationId,
            courseId: source.batch.courseId,
            title: `Cấp lại từ ${source.code}`,
            status: BatchStatus.CONFIRMED,
            entryCount: 1,
            merkleRoot: tree.root,
            inputDigest,
            anchorChainId: chainId,
            anchorRegistryAddress: registryAddress,
            issuanceRef: receipt.reference,
            createdById: actor.userId,
            approvedById: actor.userId,
            frozenAt: issuedAtDate,
            confirmedAt: receipt.confirmedAt,
            reissueOfCredentialId: source.id,
          },
        });

        await tx.batchEntry.create({
          data: {
            id: newEntryId,
            batchId: newBatchId,
            learnerId: source.learnerId,
            credentialId: newCredId,
            subjectRefSnapshot: source.batchEntry.subjectRefSnapshot,
            holderNameSnapshot: holderName,
            courseNameSnapshot: source.batch.course.name,
            result: cleanResult,
            issuedAt: issuedAtDate,
            expiresAt: expiresAtDate,
            nonce,
            pdfFileName: null,
            pdfSha256: null,
            validationStatus: EntryValidationStatus.VALID,
            validationErrors: [],
            payloadJson: payload as unknown as Prisma.InputJsonValue,
            payloadDigest,
            leaf,
            proofJson: proofPath as unknown as Prisma.InputJsonValue,
          },
        });

        if (source.status === CredentialStatus.ISSUED) {
          await tx.credential.update({
            where: { id: source.id },
            data: { status: CredentialStatus.SUPERSEDED },
          });
        }

        const reissued = await tx.credential.create({
          data: {
            id: newCredId,
            code: newCredCode,
            organizationId: source.organizationId,
            batchId: newBatchId,
            batchEntryId: newEntryId,
            learnerId: source.learnerId,
            status: CredentialStatus.ISSUED,
            payloadDigest,
            leaf,
            pdfSha256: null,
            issuedAt: issuedAtDate,
            expiresAt: expiresAtDate,
            reissuedFromId: source.id,
          },
          include: CREDENTIAL_INCLUDE,
        });

        await this.auditService.record(tx, {
          actorUserId: actor.userId,
          actorRole: actor.role,
          actorName: actor.displayName,
          organizationId: source.organizationId,
          action: "CREDENTIAL_REISSUED",
          aggregateType: "CREDENTIAL",
          aggregateId: reissued.id,
          correlationId,
          detail: `Cấp lại chứng chỉ ${reissued.code} thay thế ${source.code} (${cleanReason})`,
          metadata: {
            newCredentialCode: reissued.code,
            sourceCredentialId: source.id,
            sourceCredentialCode: source.code,
            newBatchId,
            issuanceRef: receipt.reference,
            reason: cleanReason,
          },
        });

        return mapCredential(reissued);
      },
    });
  }

  private async allocateUniqueCredentialCode(tx: Prisma.TransactionClient): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateCredentialCode();
      const exists = await tx.credential.findUnique({ where: { code: candidate } });
      if (!exists) {
        return candidate;
      }
    }
    return `CERT-${ulid().slice(-8).toUpperCase()}`;
  }
}

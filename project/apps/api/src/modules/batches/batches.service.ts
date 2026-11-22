import { randomBytes } from "node:crypto";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Batch,
  BatchEntry,
  BatchStatus,
  CourseStatus,
  CredentialStatus,
  EntryValidationStatus,
  OrganizationStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { ulid } from "ulid";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { assertOrgScope, resolveActorOrganizationId } from "../../common/auth/org-scope";
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
  computeLeafHash,
  computePayloadDigest,
  CredentialAnchor,
  CredentialPayload,
  generateCredentialCode,
  normalizeAddress,
  normalizePayload,
  normalizeText,
  toRfc3339UtcSeconds,
} from "../credential-core";
import { ISSUANCE_PORT, IssuancePort } from "../issuance/issuance.port";
import {
  assertBatchApprovable,
  assertBatchEditable,
  assertBatchFreezable,
  assertBatchPublishable,
  assertBatchValidatable,
  BatchPolicyError,
  validateBatchEntries,
} from "./batch.policy";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { UpdateBatchEntryDto } from "./dto/update-batch-entry.dto";
import { UpsertBatchEntryDto } from "./dto/upsert-batch-entry.dto";

export interface BatchEntryResponse {
  id: string;
  batchId: string;
  learnerId: string;
  credentialId: string;
  subjectRef: string;
  holderName: string;
  courseName: string;
  result: string;
  issuedAt: string;
  expiresAt: string | null;
  nonce: string;
  pdfFileName: string | null;
  pdfSha256: string | null;
  validationStatus: EntryValidationStatus;
  validationErrors: string[];
  payloadDigest: string | null;
  leaf: string | null;
  proofPath: string[];
}

export interface BatchResponse {
  id: string;
  code: string;
  organizationId: string;
  courseId: string;
  title: string;
  status: BatchStatus;
  chainId: number;
  registryAddress: string;
  merkleRoot: string | null;
  inputDigest: string | null;
  entryCount: number;
  issuanceRef: string | null;
  failureCode: string | null;
  createdById: string;
  approvedById: string | null;
  frozenAt: string | null;
  confirmedAt: string | null;
  reissueOfCredentialId: string | null;
  createdAt: string;
  updatedAt: string;
  entries?: BatchEntryResponse[];
}

const mapEntry = (entry: BatchEntry): BatchEntryResponse => ({
  id: entry.id,
  batchId: entry.batchId,
  learnerId: entry.learnerId,
  credentialId: entry.credentialId,
  subjectRef: entry.subjectRefSnapshot,
  holderName: entry.holderNameSnapshot,
  courseName: entry.courseNameSnapshot,
  result: entry.result,
  issuedAt: toRfc3339UtcSeconds(entry.issuedAt),
  expiresAt: entry.expiresAt ? toRfc3339UtcSeconds(entry.expiresAt) : null,
  nonce: entry.nonce,
  pdfFileName: entry.pdfFileName,
  pdfSha256: entry.pdfSha256,
  validationStatus: entry.validationStatus,
  validationErrors: Array.isArray(entry.validationErrors)
    ? (entry.validationErrors as string[])
    : [],
  payloadDigest: entry.payloadDigest,
  leaf: entry.leaf,
  proofPath: Array.isArray(entry.proofJson) ? (entry.proofJson as string[]) : [],
});

const mapBatch = (batch: Batch, entries?: BatchEntry[]): BatchResponse => ({
  id: batch.id,
  code: batch.code,
  organizationId: batch.organizationId,
  courseId: batch.courseId,
  title: batch.title,
  status: batch.status,
  chainId: batch.anchorChainId,
  registryAddress: batch.anchorRegistryAddress,
  merkleRoot: batch.merkleRoot,
  inputDigest: batch.inputDigest,
  entryCount: batch.entryCount,
  issuanceRef: batch.issuanceRef,
  failureCode: batch.failureCode,
  createdById: batch.createdById,
  approvedById: batch.approvedById,
  frozenAt: batch.frozenAt?.toISOString() ?? null,
  confirmedAt: batch.confirmedAt?.toISOString() ?? null,
  reissueOfCredentialId: batch.reissueOfCredentialId,
  createdAt: batch.createdAt.toISOString(),
  updatedAt: batch.updatedAt.toISOString(),
  ...(entries ? { entries: entries.map(mapEntry) } : {}),
});

const runPolicy = <T>(fn: () => T): T => {
  try {
    return fn();
  } catch (error) {
    if (error instanceof BatchPolicyError) {
      throw new AppError(error.statusCode, error.code, error.message, error.details);
    }
    throw error;
  }
};

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly auditService: AuditService,
    private readonly idempotencyService: IdempotencyService,
    @Inject(ISSUANCE_PORT) private readonly issuancePort: IssuancePort,
    @Inject(CLOCK_PORT) private readonly clock: Clock,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateBatchDto,
    correlationId: string,
  ): Promise<BatchResponse> {
    const organizationId = resolveActorOrganizationId(actor, dto.organizationId);
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy tổ chức");
    }
    if (org.status !== OrganizationStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ORGANIZATION_NOT_ACTIVE,
        "Chỉ tổ chức đang ACTIVE mới được tạo lô chứng chỉ",
      );
    }

    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course || course.organizationId !== organizationId) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy khóa học thuộc tổ chức",
      );
    }
    if (course.status !== CourseStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLICT,
        "Không thể tạo lô mới cho khóa học đã lưu trữ",
      );
    }

    const chainId = this.config.get("ANCHOR_CHAIN_ID", { infer: true });
    const registryAddress = normalizeAddress(
      this.config.get("ANCHOR_REGISTRY_ADDRESS", { infer: true }),
    );
    const batchId = `bat_${ulid().toLowerCase()}`;
    const code = `BATCH-${batchId.slice(-6).toUpperCase()}`;

    const created = await this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          id: batchId,
          code,
          organizationId,
          courseId: course.id,
          title: normalizeText(dto.title),
          status: BatchStatus.DRAFT,
          anchorChainId: chainId,
          anchorRegistryAddress: registryAddress,
          createdById: actor.userId,
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId,
        action: "BATCH_CREATED",
        aggregateType: "BATCH",
        aggregateId: batch.id,
        correlationId,
        detail: `Tạo lô chứng chỉ ${batch.code} (${batch.title})`,
        metadata: { code: batch.code, courseId: course.id, status: batch.status },
      });
      return batch;
    });

    return mapBatch(created, []);
  }

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & {
      organizationId?: string;
      status?: BatchStatus;
      courseId?: string;
    },
  ): Promise<PaginatedPayload<BatchResponse>> {
    const scopedOrgId =
      user.role === Role.SYSTEM_ADMIN ? query.organizationId : (user.organizationId ?? "__none__");

    const where: Prisma.BatchWhereInput = {
      ...(scopedOrgId ? { organizationId: scopedOrgId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.batch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      this.prisma.batch.count({ where }),
    ]);

    return {
      items: rows.map((row) => mapBatch(row)),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<BatchResponse> {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        entries: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!batch) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy lô chứng chỉ",
      );
    }
    assertOrgScope(user, batch.organizationId);
    return mapBatch(batch, batch.entries);
  }

  async addEntry(
    actor: AuthenticatedUser,
    batchId: string,
    dto: UpsertBatchEntryDto,
    correlationId: string,
  ): Promise<BatchResponse> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });
    if (!batch) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy lô chứng chỉ",
      );
    }
    assertOrgScope(actor, batch.organizationId);
    runPolicy(() => assertBatchEditable(batch.status));

    const learner = await this.prisma.learner.findUnique({ where: { id: dto.learnerId } });
    if (!learner || learner.organizationId !== batch.organizationId) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy học viên thuộc tổ chức",
      );
    }

    const duplicate = await this.prisma.batchEntry.findUnique({
      where: { batchId_learnerId: { batchId, learnerId: learner.id } },
    });
    if (duplicate) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLICT,
        `Học viên ${learner.subjectRef} đã có trong lô ${batch.code}`,
      );
    }

    const entryId = `ent_${ulid().toLowerCase()}`;
    const credentialId = `cred_${ulid().toLowerCase()}`;
    const nonce = `n_${randomBytes(8).toString("hex")}`;

    const updatedBatch = await this.prisma.$transaction(async (tx) => {
      await tx.batchEntry.create({
        data: {
          id: entryId,
          batchId,
          learnerId: learner.id,
          credentialId,
          subjectRefSnapshot: normalizeText(learner.subjectRef),
          holderNameSnapshot: normalizeText(learner.displayName),
          courseNameSnapshot: normalizeText(batch.course.name),
          result: normalizeText(dto.result),
          issuedAt: new Date(dto.issuedAt),
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          nonce,
          pdfFileName: null,
          pdfSha256: null,
          validationStatus: EntryValidationStatus.PENDING,
          validationErrors: [],
        },
      });

      const count = await tx.batchEntry.count({ where: { batchId } });
      const saved = await tx.batch.update({
        where: { id: batchId },
        data: {
          status: BatchStatus.DRAFT,
          entryCount: count,
          merkleRoot: null,
          inputDigest: null,
        },
        include: { entries: { orderBy: { createdAt: "asc" } } },
      });

      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: batch.organizationId,
        action: "BATCH_ENTRY_ADDED",
        aggregateType: "BATCH",
        aggregateId: batch.id,
        correlationId,
        detail: `Thêm học viên ${learner.subjectRef} vào lô ${batch.code}`,
        metadata: { batchCode: batch.code, entryId, subjectRef: learner.subjectRef },
      });

      return saved;
    });

    return mapBatch(updatedBatch, updatedBatch.entries);
  }

  async updateEntry(
    actor: AuthenticatedUser,
    batchId: string,
    entryId: string,
    dto: UpdateBatchEntryDto,
    correlationId: string,
  ): Promise<BatchResponse> {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy lô chứng chỉ",
      );
    }
    assertOrgScope(actor, batch.organizationId);
    runPolicy(() => assertBatchEditable(batch.status));

    const entry = await this.prisma.batchEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.batchId !== batchId) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy dòng chứng chỉ",
      );
    }

    const updatedBatch = await this.prisma.$transaction(async (tx) => {
      await tx.batchEntry.update({
        where: { id: entryId },
        data: {
          ...(dto.result !== undefined ? { result: normalizeText(dto.result) } : {}),
          ...(dto.issuedAt !== undefined ? { issuedAt: new Date(dto.issuedAt) } : {}),
          ...(dto.expiresAt !== undefined
            ? { expiresAt: dto.expiresAt === null ? null : new Date(dto.expiresAt) }
            : {}),
          validationStatus: EntryValidationStatus.PENDING,
          validationErrors: [],
          payloadJson: Prisma.DbNull,
          payloadDigest: null,
          leaf: null,
          proofJson: Prisma.DbNull,
        },
      });

      const saved = await tx.batch.update({
        where: { id: batchId },
        data: {
          status: BatchStatus.DRAFT,
          merkleRoot: null,
          inputDigest: null,
        },
        include: { entries: { orderBy: { createdAt: "asc" } } },
      });

      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: batch.organizationId,
        action: "BATCH_ENTRY_UPDATED",
        aggregateType: "BATCH",
        aggregateId: batch.id,
        correlationId,
        detail: `Cập nhật dòng ${entryId} trong lô ${batch.code}`,
        metadata: { batchCode: batch.code, entryId },
      });

      return saved;
    });

    return mapBatch(updatedBatch, updatedBatch.entries);
  }

  async removeEntry(
    actor: AuthenticatedUser,
    batchId: string,
    entryId: string,
    correlationId: string,
  ): Promise<BatchResponse> {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy lô chứng chỉ",
      );
    }
    assertOrgScope(actor, batch.organizationId);
    runPolicy(() => assertBatchEditable(batch.status));

    const entry = await this.prisma.batchEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.batchId !== batchId) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy dòng chứng chỉ",
      );
    }

    const updatedBatch = await this.prisma.$transaction(async (tx) => {
      await tx.batchEntry.delete({ where: { id: entryId } });
      const count = await tx.batchEntry.count({ where: { batchId } });
      const saved = await tx.batch.update({
        where: { id: batchId },
        data: {
          status: BatchStatus.DRAFT,
          entryCount: count,
          merkleRoot: null,
          inputDigest: null,
        },
        include: { entries: { orderBy: { createdAt: "asc" } } },
      });

      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: batch.organizationId,
        action: "BATCH_ENTRY_REMOVED",
        aggregateType: "BATCH",
        aggregateId: batch.id,
        correlationId,
        detail: `Xóa dòng ${entryId} khỏi lô ${batch.code}`,
        metadata: { batchCode: batch.code, entryId },
      });

      return saved;
    });

    return mapBatch(updatedBatch, updatedBatch.entries);
  }

  async validate(
    actor: AuthenticatedUser,
    batchId: string,
    correlationId: string,
  ): Promise<BatchResponse> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        course: true,
        entries: {
          orderBy: { createdAt: "asc" },
          include: { learner: true },
        },
      },
    });
    if (!batch) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy lô chứng chỉ",
      );
    }
    assertOrgScope(actor, batch.organizationId);
    runPolicy(() => assertBatchValidatable(batch.status));

    const candidates = batch.entries.map((entry) => ({
      id: entry.id,
      learnerId: entry.learnerId,
      subjectRef: entry.learner.subjectRef,
      holderName: entry.learner.displayName,
      result: entry.result,
      issuedAt: entry.issuedAt,
      expiresAt: entry.expiresAt,
    }));

    const { allValid, outcomes } = runPolicy(() => validateBatchEntries(candidates));
    const outcomeMap = new Map(outcomes.map((o) => [o.entryId, o]));

    if (!allValid) {
      await this.prisma.$transaction(async (tx) => {
        for (const entry of batch.entries) {
          const outcome = outcomeMap.get(entry.id);
          await tx.batchEntry.update({
            where: { id: entry.id },
            data: {
              validationStatus:
                outcome?.status === "VALID"
                  ? EntryValidationStatus.VALID
                  : EntryValidationStatus.INVALID,
              validationErrors: outcome?.errors ?? [],
            },
          });
        }
        await tx.batch.update({
          where: { id: batch.id },
          data: { status: BatchStatus.DRAFT, merkleRoot: null, inputDigest: null },
        });
        await this.auditService.record(tx, {
          actorUserId: actor.userId,
          actorRole: actor.role,
          actorName: actor.displayName,
          organizationId: batch.organizationId,
          action: "BATCH_VALIDATION_FAILED",
          aggregateType: "BATCH",
          aggregateId: batch.id,
          correlationId,
          detail: `Kiểm tra lô ${batch.code} phát hiện dòng không hợp lệ`,
          metadata: {
            batchCode: batch.code,
            invalidCount: outcomes.filter((o) => o.status === "INVALID").length,
          },
        });
      });

      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "Phát hiện lỗi dữ liệu trong danh sách học viên",
        { invalidEntries: outcomes.filter((o) => o.status === "INVALID") },
      );
    }

    const anchor: CredentialAnchor = {
      chainId: batch.anchorChainId,
      registryAddress: batch.anchorRegistryAddress,
      batchId: batch.id,
      issuerId: batch.organizationId,
    };

    const builtItems = batch.entries.map((entry) => {
      const payload = normalizePayload({
        credentialId: entry.credentialId,
        issuerId: batch.organizationId,
        holder: entry.learner.displayName,
        courseId: batch.course.id,
        courseName: batch.course.name,
        result: entry.result,
        issuedAt: toRfc3339UtcSeconds(entry.issuedAt),
        expiresAt: entry.expiresAt ? toRfc3339UtcSeconds(entry.expiresAt) : null,
        nonce: entry.nonce,
        pdfSha256: null,
      });
      const payloadDigest = computePayloadDigest(payload);
      const leaf = computeLeafHash(anchor, payloadDigest);
      return { entry, payload, payloadDigest, leaf };
    });

    const tree = buildMerkleTree(
      builtItems.map((item) => ({
        key: item.entry.id,
        anchor,
        payloadDigest: item.payloadDigest,
      })),
    );
    const inputDigest = computeInputDigest(builtItems.map((item) => item.payloadDigest));

    const updatedBatch = await this.prisma.$transaction(async (tx) => {
      for (const item of builtItems) {
        await tx.batchEntry.update({
          where: { id: item.entry.id },
          data: {
            subjectRefSnapshot: normalizeText(item.entry.learner.subjectRef),
            holderNameSnapshot: normalizeText(item.entry.learner.displayName),
            courseNameSnapshot: normalizeText(batch.course.name),
            validationStatus: EntryValidationStatus.VALID,
            validationErrors: [],
            payloadJson: item.payload as unknown as Prisma.InputJsonValue,
            payloadDigest: item.payloadDigest,
            leaf: item.leaf,
          },
        });
      }

      const saved = await tx.batch.update({
        where: { id: batch.id },
        data: {
          status: BatchStatus.VALIDATED,
          entryCount: builtItems.length,
          merkleRoot: tree.root,
          inputDigest,
        },
        include: { entries: { orderBy: { createdAt: "asc" } } },
      });

      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: batch.organizationId,
        action: "BATCH_VALIDATED",
        aggregateType: "BATCH",
        aggregateId: batch.id,
        correlationId,
        detail: `Đã chuẩn hóa và kiểm tra hợp lệ ${builtItems.length} dòng trong lô ${batch.code}`,
        metadata: { batchCode: batch.code, entryCount: builtItems.length, merkleRoot: tree.root },
      });

      return saved;
    });

    return mapBatch(updatedBatch, updatedBatch.entries);
  }

  async approve(
    actor: AuthenticatedUser,
    batchId: string,
    correlationId: string,
  ): Promise<BatchResponse> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { entries: { orderBy: { createdAt: "asc" } } },
    });
    if (!batch) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy lô chứng chỉ",
      );
    }
    assertOrgScope(actor, batch.organizationId);
    runPolicy(() => assertBatchApprovable(batch.status));

    const updatedBatch = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.batch.update({
        where: { id: batch.id },
        data: {
          status: BatchStatus.APPROVED,
          approvedById: actor.userId,
        },
        include: { entries: { orderBy: { createdAt: "asc" } } },
      });

      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: batch.organizationId,
        action: "BATCH_APPROVED",
        aggregateType: "BATCH",
        aggregateId: batch.id,
        correlationId,
        detail: `Phê duyệt lô ${batch.code} (${batch.entryCount} học viên)`,
        metadata: { batchCode: batch.code, entryCount: batch.entryCount },
      });

      return saved;
    });

    return mapBatch(updatedBatch, updatedBatch.entries);
  }

  async freeze(
    actor: AuthenticatedUser,
    batchId: string,
    correlationId: string,
  ): Promise<BatchResponse> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        organization: true,
        course: true,
        entries: {
          orderBy: { createdAt: "asc" },
          include: { learner: true },
        },
      },
    });
    if (!batch) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy lô chứng chỉ",
      );
    }
    assertOrgScope(actor, batch.organizationId);
    if (batch.organization.status !== OrganizationStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ORGANIZATION_NOT_ACTIVE,
        "Tổ chức phát hành không ở trạng thái ACTIVE",
      );
    }
    runPolicy(() => assertBatchFreezable(batch.status));

    const candidates = batch.entries.map((entry) => ({
      id: entry.id,
      learnerId: entry.learnerId,
      subjectRef: entry.learner.subjectRef,
      holderName: entry.learner.displayName,
      result: entry.result,
      issuedAt: entry.issuedAt,
      expiresAt: entry.expiresAt,
    }));
    const { allValid } = runPolicy(() => validateBatchEntries(candidates));
    if (!allValid) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "Dữ liệu lô không còn hợp lệ để đóng băng",
      );
    }

    const anchor: CredentialAnchor = {
      chainId: batch.anchorChainId,
      registryAddress: batch.anchorRegistryAddress,
      batchId: batch.id,
      issuerId: batch.organizationId,
    };

    const snapshotItems = batch.entries.map((entry) => {
      const payload: CredentialPayload = normalizePayload({
        credentialId: entry.credentialId,
        issuerId: batch.organizationId,
        holder: entry.learner.displayName,
        courseId: batch.course.id,
        courseName: batch.course.name,
        result: entry.result,
        issuedAt: toRfc3339UtcSeconds(entry.issuedAt),
        expiresAt: entry.expiresAt ? toRfc3339UtcSeconds(entry.expiresAt) : null,
        nonce: entry.nonce,
        pdfSha256: null,
      });
      const payloadDigest = computePayloadDigest(payload);
      return { entry, payload, payloadDigest };
    });

    const tree = buildMerkleTree(
      snapshotItems.map((item) => ({
        key: item.entry.id,
        anchor,
        payloadDigest: item.payloadDigest,
      })),
    );
    const inputDigest = computeInputDigest(snapshotItems.map((item) => item.payloadDigest));
    const frozenAt = this.clock.now();

    const updatedBatch = await this.prisma.$transaction(async (tx) => {
      for (const item of snapshotItems) {
        const leaf = tree.leaves[item.entry.id];
        const proof = tree.proofs[item.entry.id] ?? [];

        await tx.batchEntry.update({
          where: { id: item.entry.id },
          data: {
            subjectRefSnapshot: normalizeText(item.entry.learner.subjectRef),
            holderNameSnapshot: normalizeText(item.entry.learner.displayName),
            courseNameSnapshot: normalizeText(batch.course.name),
            validationStatus: EntryValidationStatus.VALID,
            validationErrors: [],
            payloadJson: item.payload as unknown as Prisma.InputJsonValue,
            payloadDigest: item.payloadDigest,
            leaf,
            proofJson: proof as unknown as Prisma.InputJsonValue,
          },
        });

        const existingCred = await tx.credential.findUnique({
          where: { batchEntryId: item.entry.id },
        });
        if (!existingCred) {
          const code = await this.allocateUniqueCredentialCode(tx);
          await tx.credential.create({
            data: {
              id: item.entry.credentialId,
              code,
              organizationId: batch.organizationId,
              batchId: batch.id,
              batchEntryId: item.entry.id,
              learnerId: item.entry.learnerId,
              status: CredentialStatus.PREPARED,
              payloadDigest: item.payloadDigest,
              leaf,
              pdfSha256: null,
              issuedAt: item.entry.issuedAt,
              expiresAt: item.entry.expiresAt,
            },
          });
        }
      }

      const saved = await tx.batch.update({
        where: { id: batch.id },
        data: {
          status: BatchStatus.FROZEN,
          entryCount: snapshotItems.length,
          merkleRoot: tree.root,
          inputDigest,
          frozenAt,
        },
        include: { entries: { orderBy: { createdAt: "asc" } } },
      });

      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: batch.organizationId,
        action: "BATCH_FROZEN",
        aggregateType: "BATCH",
        aggregateId: batch.id,
        correlationId,
        detail: `Đóng băng lô ${batch.code} với Merkle root ${tree.root.slice(0, 18)}...`,
        metadata: {
          batchCode: batch.code,
          merkleRoot: tree.root,
          entryCount: snapshotItems.length,
        },
      });

      return saved;
    });

    return mapBatch(updatedBatch, updatedBatch.entries);
  }

  async publish(
    actor: AuthenticatedUser,
    batchId: string,
    idempotencyKey: string | undefined,
    correlationId: string,
  ): Promise<BatchResponse> {
    return this.idempotencyService.executeInTransaction<BatchResponse>({
      scope: `batch:publish:${batchId}`,
      idempotencyKey,
      requestBody: { batchId },
      statusCode: HttpStatus.OK,
      run: async (tx) => {
        const batch = await tx.batch.findUnique({
          where: { id: batchId },
          include: {
            organization: true,
            entries: { orderBy: { createdAt: "asc" } },
          },
        });
        if (!batch) {
          throw new AppError(
            HttpStatus.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            "Không tìm thấy lô chứng chỉ",
          );
        }
        assertOrgScope(actor, batch.organizationId);
        if (batch.organization.status !== OrganizationStatus.ACTIVE) {
          throw new AppError(
            HttpStatus.FORBIDDEN,
            ERROR_CODES.ORGANIZATION_NOT_ACTIVE,
            "Tổ chức phát hành đang không ở trạng thái ACTIVE",
          );
        }
        runPolicy(() => assertBatchPublishable(batch.status));
        if (!batch.merkleRoot) {
          throw new AppError(
            HttpStatus.CONFLICT,
            ERROR_CODES.INVALID_STATE_TRANSITION,
            "Lô chưa có Merkle root đã đóng băng",
          );
        }

        await tx.batch.update({
          where: { id: batch.id },
          data: { status: BatchStatus.PENDING_CHAIN, failureCode: null },
        });

        const receipt = await this.issuancePort.publishBatch({
          organizationId: batch.organizationId,
          batchId: batch.id,
          merkleRoot: batch.merkleRoot,
          entryCount: batch.entryCount,
          anchorChainId: batch.anchorChainId,
          anchorRegistryAddress: batch.anchorRegistryAddress,
        });

        if (receipt.status === "CONFIRMED") {
          await tx.credential.updateMany({
            where: { batchId: batch.id, status: CredentialStatus.PREPARED },
            data: { status: CredentialStatus.ISSUED },
          });
          const confirmed = await tx.batch.update({
            where: { id: batch.id },
            data: {
              status: BatchStatus.CONFIRMED,
              issuanceRef: receipt.reference,
              confirmedAt: receipt.confirmedAt,
              failureCode: null,
            },
            include: { entries: { orderBy: { createdAt: "asc" } } },
          });

          await this.auditService.record(tx, {
            actorUserId: actor.userId,
            actorRole: actor.role,
            actorName: actor.displayName,
            organizationId: batch.organizationId,
            action: "BATCH_CONFIRMED",
            aggregateType: "BATCH",
            aggregateId: batch.id,
            correlationId,
            detail: `Phát hành lô ${batch.code} thành công (${receipt.mode})`,
            metadata: {
              batchCode: batch.code,
              merkleRoot: batch.merkleRoot,
              issuanceRef: receipt.reference,
              mode: receipt.mode,
            },
          });

          return mapBatch(confirmed, confirmed.entries);
        }

        const failed = await tx.batch.update({
          where: { id: batch.id },
          data: {
            status: BatchStatus.FAILED,
            failureCode: receipt.failureCode ?? "ISSUANCE_FAILED",
          },
          include: { entries: { orderBy: { createdAt: "asc" } } },
        });

        await this.auditService.record(tx, {
          actorUserId: actor.userId,
          actorRole: actor.role,
          actorName: actor.displayName,
          organizationId: batch.organizationId,
          action: "BATCH_PUBLISH_FAILED",
          aggregateType: "BATCH",
          aggregateId: batch.id,
          correlationId,
          detail: `Phát hành lô ${batch.code} thất bại (${failed.failureCode})`,
          metadata: { batchCode: batch.code, failureCode: failed.failureCode },
        });

        return mapBatch(failed, failed.entries);
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

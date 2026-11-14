import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BatchStatus, CredentialStatus } from "@prisma/client";
import { z } from "zod";
import { CLOCK_PORT, Clock } from "../../common/clock";
import { AppError } from "../../common/errors/app-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { AppEnv } from "../../config/env.schema";
import { PrismaService } from "../../prisma/prisma.service";
import {
  computeLeafHash,
  computePayloadDigest,
  CredentialPackage,
  normalizeAddress,
  toRfc3339UtcSeconds,
  verifyMerkleProof,
} from "../credential-core";

export type CheckStatus = "PASS" | "FAIL" | "UNAVAILABLE" | "SKIPPED";

export type VerifyResult =
  "VALID" | "INVALID" | "REVOKED" | "SUPERSEDED" | "EXPIRED" | "INDETERMINATE" | "NOT_FOUND";

export interface VerificationCheckItem {
  name: string;
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface VerificationReportResponse {
  result: VerifyResult;
  checks: VerificationCheckItem[];
  credentialId: string | null;
  credentialCode: string | null;
  issuerId: string | null;
  batchId: string | null;
  verifiedAt: string;
}

const Hex32Schema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

const CredentialPackageSchema = z
  .object({
    payload: z.object({
      credentialId: z.string().min(1),
      issuerId: z.string().min(1),
      holder: z.string().min(1),
      courseId: z.string().min(1),
      courseName: z.string().min(1),
      result: z.string().min(1),
      issuedAt: z.string().datetime(),
      expiresAt: z.string().datetime().nullable(),
      nonce: z.string().min(1),
      pdfSha256: Hex32Schema.nullable(),
    }),
    anchor: z.object({
      chainId: z.number().int().positive(),
      registryAddress: AddressSchema,
      batchId: z.string().min(1),
      issuerId: z.string().min(1),
    }),
    proof: z.object({
      leaf: Hex32Schema,
      path: z.array(Hex32Schema),
      root: Hex32Schema,
    }),
  })
  .refine((pkg) => pkg.payload.issuerId === pkg.anchor.issuerId, {
    message: "payload.issuerId phải trùng với anchor.issuerId",
  });

const MAX_PACKAGE_BYTES = 64 * 1024;

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    @Inject(CLOCK_PORT) private readonly clock: Clock,
  ) {}

  async verifyByCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    const cred = await this.prisma.credential.findUnique({
      where: { code: normalizedCode },
      include: {
        organization: true,
        batch: { include: { course: true } },
        batchEntry: true,
        reissuedTo: { select: { code: true } },
      },
    });

    if (
      !cred ||
      cred.status === CredentialStatus.PREPARED ||
      cred.batch.status !== BatchStatus.CONFIRMED
    ) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy chứng chỉ đã phát hành với mã này",
      );
    }

    const pkg: CredentialPackage = {
      payload: cred.batchEntry.payloadJson as unknown as CredentialPackage["payload"],
      anchor: {
        chainId: cred.batch.anchorChainId,
        registryAddress: cred.batch.anchorRegistryAddress,
        batchId: cred.batchId,
        issuerId: cred.organizationId,
      },
      proof: {
        leaf: cred.leaf,
        path: Array.isArray(cred.batchEntry.proofJson)
          ? (cred.batchEntry.proofJson as string[])
          : [],
        root: cred.batch.merkleRoot ?? "",
      },
    };

    const verification = await this.verifyPackage(pkg);

    return {
      credential: {
        id: cred.id,
        code: cred.code,
        holder: cred.batchEntry.holderNameSnapshot,
        courseName: cred.batchEntry.courseNameSnapshot,
        courseCode: cred.batch.course.code,
        result: cred.batchEntry.result,
        issuedAt: toRfc3339UtcSeconds(cred.issuedAt),
        expiresAt: cred.expiresAt ? toRfc3339UtcSeconds(cred.expiresAt) : null,
        status: cred.status,
        revokedAt: cred.revokedAt?.toISOString() ?? null,
        revokedReason: cred.revocationReason,
        reissuedFromId: cred.reissuedFromId,
        reissuedToCode: cred.reissuedTo?.code ?? null,
        organization: {
          id: cred.organization.id,
          code: cred.organization.code,
          displayName: cred.organization.displayName,
        },
      },
      package: pkg,
      verification,
    };
  }

  async verifyPackage(rawPackage: unknown): Promise<VerificationReportResponse> {
    const serializedBytes = Buffer.byteLength(JSON.stringify(rawPackage ?? {}), "utf8");
    if (serializedBytes > MAX_PACKAGE_BYTES) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "Kích thước gói chứng chỉ vượt quá giới hạn 64 KB",
      );
    }

    const verifiedAt = this.clock.now().toISOString();
    const parsed = CredentialPackageSchema.safeParse(rawPackage);
    if (!parsed.success) {
      return {
        result: "INVALID",
        checks: [
          {
            name: "schema",
            key: "schema",
            label: "Cấu trúc gói JSON",
            status: "FAIL",
            detail: parsed.error.issues.map((i) => i.message).join("; "),
          },
          {
            name: "trusted_anchor",
            key: "trusted_anchor",
            label: "Cấu hình anchor tin cậy",
            status: "SKIPPED",
            detail: "Bỏ qua do cấu trúc gói không hợp lệ",
          },
          {
            name: "payload_digest",
            key: "payload_digest",
            label: "Toàn vẹn payload & leaf",
            status: "SKIPPED",
            detail: "Bỏ qua do cấu trúc gói không hợp lệ",
          },
          {
            name: "merkle_proof",
            key: "merkle_proof",
            label: "Bằng chứng Merkle",
            status: "SKIPPED",
            detail: "Bỏ qua do cấu trúc gói không hợp lệ",
          },
          {
            name: "issuer_record",
            key: "issuer_record",
            label: "Bản ghi lô phát hành (DB)",
            status: "SKIPPED",
            detail: "Bỏ qua do cấu trúc gói không hợp lệ",
          },
          {
            name: "revocation",
            key: "revocation",
            label: "Trạng thái thu hồi / cấp lại",
            status: "SKIPPED",
            detail: "Bỏ qua do cấu trúc gói không hợp lệ",
          },
          {
            name: "expiry",
            key: "expiry",
            label: "Thời hạn hiệu lực",
            status: "SKIPPED",
            detail: "Bỏ qua do cấu trúc gói không hợp lệ",
          },
          {
            name: "on_chain_anchor",
            key: "on_chain_anchor",
            label: "Neo trên Blockchain",
            status: "SKIPPED",
            detail: "Chế độ off-chain: chưa kết nối EVM RPC",
          },
          {
            name: "pdf_sha256",
            key: "pdf_sha256",
            label: "Đối chiếu tệp PDF",
            status: "SKIPPED",
            detail: "Chưa bật kiểm tra tệp PDF trong phạm vi hiện tại",
          },
        ],
        credentialId: null,
        credentialCode: null,
        issuerId: null,
        batchId: null,
        verifiedAt,
      };
    }

    const pkg = parsed.data;
    const checks: VerificationCheckItem[] = [];

    checks.push({
      name: "schema",
      key: "schema",
      label: "Cấu trúc gói JSON",
      status: "PASS",
      detail: "Đúng cấu trúc payload, anchor và proof",
    });

    const trustedChainId = this.config.get("ANCHOR_CHAIN_ID", { infer: true });
    const trustedRegistry = normalizeAddress(
      this.config.get("ANCHOR_REGISTRY_ADDRESS", { infer: true }),
    );
    const anchorTrusted =
      pkg.anchor.chainId === trustedChainId &&
      normalizeAddress(pkg.anchor.registryAddress) === trustedRegistry;

    checks.push({
      name: "trusted_anchor",
      key: "trusted_anchor",
      label: "Cấu hình anchor tin cậy",
      status: anchorTrusted ? "PASS" : "FAIL",
      detail: anchorTrusted
        ? `Khớp cấu hình anchor (chainId=${trustedChainId})`
        : `Anchor không khớp cấu hình tin cậy (chainId=${pkg.anchor.chainId})`,
    });

    const computedDigest = computePayloadDigest(pkg.payload);
    const computedLeaf = computeLeafHash(pkg.anchor, computedDigest);
    const leafMatched = computedLeaf === normalizeAddress(pkg.proof.leaf);

    checks.push({
      name: "payload_digest",
      key: "payload_digest",
      label: "Toàn vẹn payload & leaf",
      status: leafMatched ? "PASS" : "FAIL",
      detail: leafMatched
        ? "Keccak256 JCS digest và leaf khớp với gói dữ liệu"
        : "Payload hoặc anchor đã bị thay đổi so với leaf",
    });

    const merkleValid = verifyMerkleProof(
      pkg.anchor,
      computedDigest,
      pkg.proof.path,
      pkg.proof.root,
      pkg.proof.leaf,
    );

    checks.push({
      name: "merkle_proof",
      key: "merkle_proof",
      label: "Bằng chứng Merkle",
      status: merkleValid ? "PASS" : "FAIL",
      detail: merkleValid
        ? "Merkle proof khớp với root trong gói"
        : "Merkle proof không khớp hoặc không hợp lệ",
    });

    let dbUnavailable = false;
    let batchNotFound = false;
    let issuerRecordOk = false;
    let credentialCode: string | null = null;
    let credentialStatus: CredentialStatus | null = null;
    let revocationOk = false;
    let credentialMismatch = false;

    try {
      const batch = await this.prisma.batch.findUnique({
        where: { id: pkg.anchor.batchId },
      });

      if (!batch) {
        batchNotFound = true;
        checks.push({
          name: "issuer_record",
          key: "issuer_record",
          label: "Bản ghi lô phát hành (DB)",
          status: "FAIL",
          detail: "Không tìm thấy lô phát hành trong hệ thống",
        });
      } else if (batch.status !== BatchStatus.CONFIRMED) {
        checks.push({
          name: "issuer_record",
          key: "issuer_record",
          label: "Bản ghi lô phát hành (DB)",
          status: "FAIL",
          detail: `Lô đang ở trạng thái ${batch.status}, chưa CONFIRMED`,
        });
      } else if (
        batch.organizationId !== pkg.anchor.issuerId ||
        !batch.merkleRoot ||
        normalizeAddress(batch.merkleRoot) !== normalizeAddress(pkg.proof.root)
      ) {
        checks.push({
          name: "issuer_record",
          key: "issuer_record",
          label: "Bản ghi lô phát hành (DB)",
          status: "FAIL",
          detail: "Merkle root hoặc tổ chức phát hành không khớp bản ghi đã xác nhận",
        });
      } else {
        issuerRecordOk = true;
        checks.push({
          name: "issuer_record",
          key: "issuer_record",
          label: "Bản ghi lô phát hành (DB)",
          status: "PASS",
          detail: `Lô ${batch.code} đã CONFIRMED và khớp Merkle root`,
        });
      }

      const credential = await this.prisma.credential.findUnique({
        where: { id: pkg.payload.credentialId },
      });

      if (!credential || credential.batchId !== pkg.anchor.batchId) {
        credentialMismatch = true;
        checks.push({
          name: "revocation",
          key: "revocation",
          label: "Trạng thái thu hồi / cấp lại",
          status: "FAIL",
          detail: "Không tìm thấy bản ghi chứng chỉ tương ứng trong lô",
        });
      } else {
        credentialCode = credential.code;
        credentialStatus = credential.status;

        if (
          normalizeAddress(credential.leaf) !== normalizeAddress(pkg.proof.leaf) ||
          normalizeAddress(credential.payloadDigest) !== normalizeAddress(computedDigest)
        ) {
          credentialMismatch = true;
          checks.push({
            name: "revocation",
            key: "revocation",
            label: "Trạng thái thu hồi / cấp lại",
            status: "FAIL",
            detail: "Dữ liệu chứng chỉ không khớp với bản ghi gốc đã lưu",
          });
        } else if (credential.status === CredentialStatus.ISSUED) {
          revocationOk = true;
          checks.push({
            name: "revocation",
            key: "revocation",
            label: "Trạng thái thu hồi / cấp lại",
            status: "PASS",
            detail: "Chứng chỉ đang ở trạng thái ISSUED (chưa thu hồi)",
          });
        } else if (credential.status === CredentialStatus.REVOKED) {
          checks.push({
            name: "revocation",
            key: "revocation",
            label: "Trạng thái thu hồi / cấp lại",
            status: "FAIL",
            detail: `Chứng chỉ đã bị thu hồi (${credential.revocationReason ?? "không rõ lý do"})`,
          });
        } else if (credential.status === CredentialStatus.SUPERSEDED) {
          checks.push({
            name: "revocation",
            key: "revocation",
            label: "Trạng thái thu hồi / cấp lại",
            status: "FAIL",
            detail: "Chứng chỉ đã được thay thế bởi phiên bản cấp lại",
          });
        } else {
          checks.push({
            name: "revocation",
            key: "revocation",
            label: "Trạng thái thu hồi / cấp lại",
            status: "FAIL",
            detail: `Chứng chỉ đang ở trạng thái ${credential.status}`,
          });
        }
      }
    } catch (error) {
      dbUnavailable = true;
      this.logger.error("Verification DB lookup failed", error instanceof Error ? error.stack : "");
      checks.push({
        name: "issuer_record",
        key: "issuer_record",
        label: "Bản ghi lô phát hành (DB)",
        status: "UNAVAILABLE",
        detail: "Không thể truy vấn cơ sở dữ liệu kiểm tra lô",
      });
      checks.push({
        name: "revocation",
        key: "revocation",
        label: "Trạng thái thu hồi / cấp lại",
        status: "UNAVAILABLE",
        detail: "Không thể truy vấn trạng thái thu hồi",
      });
    }

    const expired =
      pkg.payload.expiresAt !== null &&
      new Date(pkg.payload.expiresAt).getTime() <= this.clock.now().getTime();

    checks.push({
      name: "expiry",
      key: "expiry",
      label: "Thời hạn hiệu lực",
      status: expired ? "FAIL" : "PASS",
      detail: pkg.payload.expiresAt
        ? expired
          ? `Đã hết hạn vào ${pkg.payload.expiresAt}`
          : `Còn hiệu lực tới ${pkg.payload.expiresAt}`
        : "Không giới hạn thời hạn",
    });

    checks.push({
      name: "on_chain_anchor",
      key: "on_chain_anchor",
      label: "Neo trên Blockchain",
      status: "SKIPPED",
      detail: "Chế độ off-chain: chưa kết nối EVM RPC",
    });

    checks.push({
      name: "pdf_sha256",
      key: "pdf_sha256",
      label: "Đối chiếu tệp PDF",
      status: "SKIPPED",
      detail: "Chưa bật kiểm tra tệp PDF trong phạm vi hiện tại",
    });

    const result = this.computeOverallResult({
      dbUnavailable,
      anchorTrusted,
      leafMatched,
      merkleValid,
      batchNotFound,
      issuerRecordOk,
      credentialMismatch,
      credentialStatus,
      revocationOk,
      expired,
    });

    return {
      result,
      checks,
      credentialId: pkg.payload.credentialId,
      credentialCode,
      issuerId: pkg.anchor.issuerId,
      batchId: pkg.anchor.batchId,
      verifiedAt,
    };
  }

  private computeOverallResult(input: {
    dbUnavailable: boolean;
    anchorTrusted: boolean;
    leafMatched: boolean;
    merkleValid: boolean;
    batchNotFound: boolean;
    issuerRecordOk: boolean;
    credentialMismatch: boolean;
    credentialStatus: CredentialStatus | null;
    revocationOk: boolean;
    expired: boolean;
  }): VerifyResult {
    if (input.dbUnavailable) {
      return "INDETERMINATE";
    }
    if (!input.anchorTrusted || !input.leafMatched || !input.merkleValid) {
      return "INVALID";
    }
    if (!input.issuerRecordOk) {
      return input.batchNotFound ? "NOT_FOUND" : "INVALID";
    }
    if (input.credentialMismatch) {
      return "INVALID";
    }
    if (input.credentialStatus === CredentialStatus.REVOKED) {
      return "REVOKED";
    }
    if (input.credentialStatus === CredentialStatus.SUPERSEDED) {
      return "SUPERSEDED";
    }
    if (!input.revocationOk) {
      return "INVALID";
    }
    if (input.expired) {
      return "EXPIRED";
    }
    return "VALID";
  }
}

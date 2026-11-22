import { BatchStatus } from "@prisma/client";
import { ERROR_CODES, ErrorCode } from "../../common/errors/error-codes";
import { normalizeText } from "../credential-core/payload";

export class BatchPolicyError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export interface BatchEntryCandidate {
  id: string;
  learnerId: string;
  subjectRef: string;
  holderName: string;
  result: string;
  issuedAt: Date;
  expiresAt: Date | null;
}

export interface EntryValidationOutcome {
  entryId: string;
  status: "VALID" | "INVALID";
  errors: string[];
}

export const assertBatchEditable = (status: BatchStatus): void => {
  if (status !== BatchStatus.DRAFT && status !== BatchStatus.VALIDATED) {
    throw new BatchPolicyError(
      409,
      ERROR_CODES.BATCH_NOT_MUTABLE,
      `Lô đang ở trạng thái ${status}, không được phép chỉnh sửa danh sách`,
      { status },
    );
  }
};

export const assertBatchValidatable = (status: BatchStatus): void => {
  if (status !== BatchStatus.DRAFT && status !== BatchStatus.VALIDATED) {
    throw new BatchPolicyError(
      409,
      ERROR_CODES.INVALID_STATE_TRANSITION,
      `Lô đang ở trạng thái ${status}, không thể kiểm tra lại`,
      { status },
    );
  }
};

export const assertBatchApprovable = (status: BatchStatus): void => {
  if (status !== BatchStatus.VALIDATED) {
    throw new BatchPolicyError(
      409,
      ERROR_CODES.INVALID_STATE_TRANSITION,
      "Chỉ lô ở trạng thái VALIDATED mới được phê duyệt",
      { status },
    );
  }
};

export const assertBatchFreezable = (status: BatchStatus): void => {
  if (status !== BatchStatus.APPROVED) {
    throw new BatchPolicyError(
      409,
      ERROR_CODES.INVALID_STATE_TRANSITION,
      "Lô phải ở trạng thái APPROVED trước khi đóng băng Merkle root",
      { status },
    );
  }
};

export const assertBatchPublishable = (status: BatchStatus): void => {
  if (status !== BatchStatus.FROZEN && status !== BatchStatus.FAILED) {
    throw new BatchPolicyError(
      409,
      ERROR_CODES.INVALID_STATE_TRANSITION,
      "Chỉ lô đã đóng băng (FROZEN) hoặc thất bại (FAILED) mới được phát hành",
      { status },
    );
  }
};

export const validateBatchEntries = (
  entries: BatchEntryCandidate[],
): { allValid: boolean; outcomes: EntryValidationOutcome[] } => {
  if (entries.length === 0) {
    throw new BatchPolicyError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Lô chứng chỉ phải có ít nhất 1 học viên trước khi kiểm tra",
    );
  }

  const subjectCounts = new Map<string, number>();
  const learnerCounts = new Map<string, number>();
  for (const entry of entries) {
    const subjectKey = normalizeText(entry.subjectRef).toUpperCase();
    subjectCounts.set(subjectKey, (subjectCounts.get(subjectKey) ?? 0) + 1);
    learnerCounts.set(entry.learnerId, (learnerCounts.get(entry.learnerId) ?? 0) + 1);
  }

  let allValid = true;
  const outcomes: EntryValidationOutcome[] = entries.map((entry) => {
    const errors: string[] = [];
    if (!normalizeText(entry.holderName)) {
      errors.push("Thiếu họ tên học viên");
    }
    if (!normalizeText(entry.subjectRef)) {
      errors.push("Thiếu mã học viên");
    }
    if (!normalizeText(entry.result)) {
      errors.push("Thiếu kết quả/điểm số");
    }
    if (Number.isNaN(entry.issuedAt.getTime())) {
      errors.push("Ngày cấp không hợp lệ");
    }
    if (entry.expiresAt !== null) {
      if (Number.isNaN(entry.expiresAt.getTime())) {
        errors.push("Ngày hết hạn không hợp lệ");
      } else if (entry.expiresAt.getTime() <= entry.issuedAt.getTime()) {
        errors.push("Ngày hết hạn phải sau ngày cấp");
      }
    }

    const subjectKey = normalizeText(entry.subjectRef).toUpperCase();
    if ((subjectCounts.get(subjectKey) ?? 0) > 1) {
      errors.push(`Trùng mã học viên ${entry.subjectRef} trong cùng lô`);
    }
    if ((learnerCounts.get(entry.learnerId) ?? 0) > 1) {
      errors.push("Học viên bị trùng trong cùng lô");
    }

    if (errors.length > 0) {
      allValid = false;
    }

    return {
      entryId: entry.id,
      status: errors.length === 0 ? "VALID" : "INVALID",
      errors,
    };
  });

  return { allValid, outcomes };
};

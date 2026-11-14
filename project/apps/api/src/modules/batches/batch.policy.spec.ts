import { BatchStatus } from "@prisma/client";
import { ERROR_CODES } from "../../common/errors/error-codes";
import {
  assertBatchApprovable,
  assertBatchEditable,
  assertBatchFreezable,
  assertBatchPublishable,
  assertBatchValidatable,
  BatchEntryCandidate,
  BatchPolicyError,
  validateBatchEntries,
} from "./batch.policy";

const catchPolicyError = (fn: () => void): BatchPolicyError => {
  try {
    fn();
  } catch (error) {
    if (error instanceof BatchPolicyError) {
      return error;
    }
    throw error;
  }
  throw new Error("Expected BatchPolicyError to be thrown");
};

describe("batch.policy", () => {
  describe("state transition guards", () => {
    it("assertBatchEditable allows DRAFT & VALIDATED and throws BATCH_NOT_MUTABLE otherwise", () => {
      expect(() => assertBatchEditable(BatchStatus.DRAFT)).not.toThrow();
      expect(() => assertBatchEditable(BatchStatus.VALIDATED)).not.toThrow();

      for (const blocked of [
        BatchStatus.APPROVED,
        BatchStatus.FROZEN,
        BatchStatus.PENDING_CHAIN,
        BatchStatus.CONFIRMED,
        BatchStatus.FAILED,
      ]) {
        const err = catchPolicyError(() => assertBatchEditable(blocked));
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(ERROR_CODES.BATCH_NOT_MUTABLE);
      }
    });

    it("assertBatchValidatable allows DRAFT & VALIDATED and throws INVALID_STATE_TRANSITION otherwise", () => {
      expect(() => assertBatchValidatable(BatchStatus.DRAFT)).not.toThrow();
      expect(() => assertBatchValidatable(BatchStatus.VALIDATED)).not.toThrow();

      for (const blocked of [
        BatchStatus.APPROVED,
        BatchStatus.FROZEN,
        BatchStatus.PENDING_CHAIN,
        BatchStatus.CONFIRMED,
        BatchStatus.FAILED,
      ]) {
        const err = catchPolicyError(() => assertBatchValidatable(blocked));
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(ERROR_CODES.INVALID_STATE_TRANSITION);
      }
    });

    it("assertBatchApprovable requires VALIDATED", () => {
      expect(() => assertBatchApprovable(BatchStatus.VALIDATED)).not.toThrow();

      for (const blocked of [
        BatchStatus.DRAFT,
        BatchStatus.APPROVED,
        BatchStatus.FROZEN,
        BatchStatus.CONFIRMED,
      ]) {
        const err = catchPolicyError(() => assertBatchApprovable(blocked));
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(ERROR_CODES.INVALID_STATE_TRANSITION);
      }
    });

    it("assertBatchFreezable requires APPROVED", () => {
      expect(() => assertBatchFreezable(BatchStatus.APPROVED)).not.toThrow();

      for (const blocked of [
        BatchStatus.DRAFT,
        BatchStatus.VALIDATED,
        BatchStatus.FROZEN,
        BatchStatus.CONFIRMED,
      ]) {
        const err = catchPolicyError(() => assertBatchFreezable(blocked));
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(ERROR_CODES.INVALID_STATE_TRANSITION);
      }
    });

    it("assertBatchPublishable allows FROZEN & FAILED only", () => {
      expect(() => assertBatchPublishable(BatchStatus.FROZEN)).not.toThrow();
      expect(() => assertBatchPublishable(BatchStatus.FAILED)).not.toThrow();

      for (const blocked of [
        BatchStatus.DRAFT,
        BatchStatus.VALIDATED,
        BatchStatus.APPROVED,
        BatchStatus.PENDING_CHAIN,
        BatchStatus.CONFIRMED,
      ]) {
        const err = catchPolicyError(() => assertBatchPublishable(blocked));
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(ERROR_CODES.INVALID_STATE_TRANSITION);
      }
    });
  });

  describe("validateBatchEntries", () => {
    const validEntry = (overrides: Partial<BatchEntryCandidate> = {}): BatchEntryCandidate => ({
      id: "ent_1",
      learnerId: "lrn_1",
      subjectRef: "HV-001",
      holderName: "Nguyễn Văn An",
      result: "Xuất sắc",
      issuedAt: new Date("2026-11-14T00:00:00Z"),
      expiresAt: null,
      ...overrides,
    });

    it("rejects empty batch entries list with VALIDATION_ERROR", () => {
      const err = catchPolicyError(() => validateBatchEntries([]));
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("marks completely valid unique entries as VALID", () => {
      const res = validateBatchEntries([
        validEntry(),
        validEntry({
          id: "ent_2",
          learnerId: "lrn_2",
          subjectRef: "HV-002",
          holderName: "Lê Bình",
        }),
      ]);
      expect(res.allValid).toBe(true);
      expect(res.outcomes.map((o) => o.status)).toEqual(["VALID", "VALID"]);
    });

    it("detects missing fields and invalid expiresAt <= issuedAt", () => {
      const res = validateBatchEntries([
        validEntry({
          id: "ent_bad",
          holderName: "   ",
          subjectRef: "",
          result: " ",
          expiresAt: new Date("2026-11-13T00:00:00Z"),
        }),
      ]);
      expect(res.allValid).toBe(false);
      expect(res.outcomes[0].status).toBe("INVALID");
      expect(res.outcomes[0].errors.length).toBeGreaterThanOrEqual(4);
    });

    it("detects case-insensitive duplicate subjectRef and duplicate learnerId", () => {
      const res = validateBatchEntries([
        validEntry({ id: "ent_1", learnerId: "lrn_1", subjectRef: "hv-001" }),
        validEntry({ id: "ent_2", learnerId: "lrn_1", subjectRef: "HV-001" }),
      ]);
      expect(res.allValid).toBe(false);
      expect(res.outcomes[0].status).toBe("INVALID");
      expect(res.outcomes[1].status).toBe("INVALID");
      expect(res.outcomes[1].errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Trùng mã học viên"),
          "Học viên bị trùng trong cùng lô",
        ]),
      );
    });
  });
});

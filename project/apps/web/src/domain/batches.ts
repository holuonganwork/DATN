import { TRUSTED_CHAINS } from "./constants";
import {
  computeDigestHex,
  isValidHexDigest,
  normalizeAddress,
  normalizeText,
} from "./crypto";
import { appendAuditEvent, createBuiltCredentialEntry } from "./helpers";
import { buildMerkleTree } from "./merkle";
import type {
  AppState,
  Batch,
  BatchEntry,
  BatchStatus,
  Credential,
  PublishIntent,
} from "./types";

// UC-03 & UC-04: Batch Creation, Entry Management, Validation, Approval & Freeze
export const createBatch = (
  state: AppState,
  input: {
    organizationId: string;
    courseId: string;
    title: string;
    chainId: number;
  },
): { state: AppState; batch?: Batch; error?: string } => {
  const title = normalizeText(input.title);
  const course = state.courses.find(
    (item) => item.id === input.courseId && item.organizationId === input.organizationId,
  );
  const chain =
    TRUSTED_CHAINS.find((item) => item.chainId === input.chainId) ?? TRUSTED_CHAINS[0];

  if (!course) return { state, error: "Vui lòng chọn khóa học hợp lệ của đơn vị." };
  if (!title) return { state, error: "Vui lòng nhập tên lô phát hành." };

  const seq = state.batches.length + 1;
  const batchId = `batch_${String(seq).padStart(2, "0")}`;
  const batchCode = `BATCH-${String(seq).padStart(3, "0")}`;
  const emptyTree = buildMerkleTree([]);

  const newBatch: Batch = {
    id: batchId,
    code: batchCode,
    organizationId: input.organizationId,
    courseId: course.id,
    title,
    status: "DRAFT",
    chainId: chain.chainId,
    registryAddress: chain.registryAddress,
    merkleRoot: emptyTree.root,
    inputDigest: computeDigestHex(`BATCH_INIT:${batchId}`, 64),
    idempotencyKey: `idem_publish_${batchId}`,
    createdBy: state.activeRole,
    createdAt: new Date().toISOString(),
    entries: [],
  };

  return {
    batch: newBatch,
    state: {
      ...state,
      batches: [newBatch, ...state.batches],
      events: appendAuditEvent(state, {
        action: "BATCH_CREATED",
        actorRole: state.activeRole,
        actorName: state.activeRole,
        organizationId: input.organizationId,
        aggregateType: "BATCH",
        aggregateId: newBatch.id,
        detail: `Khởi tạo lô ${batchCode} (${title}) ở trạng thái DRAFT`,
      }),
    },
  };
};

export const addEntryToBatch = (
  state: AppState,
  input: {
    batchId: string;
    learnerId: string;
    result: string;
    issuedAt: string;
    expiresAt: string | null;
    pdfFileName?: string;
    pdfSha256?: string;
  },
): { state: AppState; error?: string } => {
  const batch = state.batches.find((item) => item.id === input.batchId);
  if (!batch) return { state, error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "DRAFT" && batch.status !== "VALIDATED") {
    return {
      state,
      error: `Lô đang ở trạng thái ${batch.status}, không được phép chỉnh sửa danh sách.`,
    };
  }

  const learner = state.learners.find(
    (item) => item.id === input.learnerId && item.organizationId === batch.organizationId,
  );
  if (!learner) return { state, error: "Vui lòng chọn học viên hợp lệ thuộc đơn vị." };
  if (!normalizeText(input.result) || !normalizeText(input.issuedAt)) {
    return { state, error: "Vui lòng nhập đầy đủ kết quả đạt được và ngày cấp." };
  }

  const course = state.courses.find((item) => item.id === batch.courseId);
  const entryIndex = batch.entries.length + 1;
  const entryId = `entry_${batch.id}_${entryIndex}_${Date.now().toString(36).slice(-3)}`;
  const pdfFileName =
    normalizeText(input.pdfFileName ?? "") || `${batch.code}-${learner.subjectRef}.pdf`;
  const pdfSha256 =
    input.pdfSha256 && isValidHexDigest(input.pdfSha256)
      ? normalizeAddress(input.pdfSha256)
      : computeDigestHex(
          `PAYLOAD_ATTACHMENT:${batch.id}:${learner.subjectRef}:${normalizeText(input.result)}:${normalizeText(input.issuedAt)}`,
          64,
        );

  const entry = createBuiltCredentialEntry({
    entryId,
    batchId: batch.id,
    issuerId: batch.organizationId,
    chainId: batch.chainId,
    registryAddress: batch.registryAddress,
    learnerId: learner.id,
    subjectRef: learner.subjectRef,
    holderName: learner.displayName,
    courseId: course?.id ?? batch.courseId,
    courseName: course?.name ?? batch.title,
    result: input.result,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    nonce: `n_${batch.id}_${entryIndex}`,
    pdfFileName,
    pdfSha256,
  });

  const nextEntries = [
    ...batch.entries,
    { ...entry, validationStatus: "PENDING" as const },
  ];
  const nextTree = buildMerkleTree(nextEntries.map((item) => item.leaf));

  const updatedBatch: Batch = {
    ...batch,
    status: "DRAFT",
    merkleRoot: nextTree.root,
    entries: nextEntries,
  };

  return {
    state: {
      ...state,
      batches: state.batches.map((item) => (item.id === batch.id ? updatedBatch : item)),
      events: appendAuditEvent(state, {
        action: "BATCH_ENTRY_ADDED",
        actorRole: state.activeRole,
        actorName: state.activeRole,
        organizationId: batch.organizationId,
        aggregateType: "BATCH",
        aggregateId: batch.id,
        detail: `Thêm học viên ${learner.displayName} (${learner.subjectRef}) vào lô ${batch.code}`,
      }),
    },
  };
};

export const removeBatchEntry = (
  state: AppState,
  input: { batchId: string; entryId: string },
): { state: AppState; error?: string } => {
  const batch = state.batches.find((item) => item.id === input.batchId);
  if (!batch) return { state, error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "DRAFT" && batch.status !== "VALIDATED") {
    return { state, error: "Không thể xóa dòng khi lô đã duyệt hoặc đóng băng." };
  }

  const nextEntries = batch.entries.filter((entry) => entry.id !== input.entryId);
  const nextTree = buildMerkleTree(nextEntries.map((item) => item.leaf));

  return {
    state: {
      ...state,
      batches: state.batches.map((item) =>
        item.id === batch.id
          ? { ...batch, status: "DRAFT", merkleRoot: nextTree.root, entries: nextEntries }
          : item,
      ),
    },
  };
};

export const validateBatch = (
  state: AppState,
  batchId: string,
): { state: AppState; error?: string } => {
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch) return { state, error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "DRAFT" && batch.status !== "VALIDATED") {
    return {
      state,
      error: `Lô đang ở trạng thái ${batch.status}, không thể chạy kiểm tra lại.`,
    };
  }
  if (batch.entries.length === 0) {
    return { state, error: "Lô chứng chỉ phải có ít nhất 1 học viên trước khi kiểm tra." };
  }

  const course = state.courses.find((item) => item.id === batch.courseId);
  const subjectCounts = new Map<string, number>();
  for (const entry of batch.entries) {
    const key = entry.subjectRef.toUpperCase();
    subjectCounts.set(key, (subjectCounts.get(key) ?? 0) + 1);
  }

  let hasErrors = false;
  const validatedEntries: BatchEntry[] = batch.entries.map((entry) => {
    const errors: string[] = [];
    if (!normalizeText(entry.holderName)) errors.push("Thiếu họ tên học viên");
    if (!normalizeText(entry.subjectRef)) errors.push("Thiếu mã học viên");
    if (!normalizeText(entry.result)) errors.push("Thiếu kết quả/điểm số");
    if (!isValidHexDigest(entry.pdfSha256)) errors.push("Mã băm PDF SHA-256 không hợp lệ");
    if ((subjectCounts.get(entry.subjectRef.toUpperCase()) ?? 0) > 1) {
      errors.push(`Trùng mã học viên ${entry.subjectRef} trong cùng lô`);
    }

    const rebuilt = createBuiltCredentialEntry({
      entryId: entry.id,
      batchId: batch.id,
      issuerId: batch.organizationId,
      chainId: batch.chainId,
      registryAddress: batch.registryAddress,
      learnerId: entry.learnerId,
      subjectRef: entry.subjectRef,
      holderName: entry.holderName,
      courseId: course?.id ?? batch.courseId,
      courseName: course?.name ?? batch.title,
      result: entry.result,
      issuedAt: entry.issuedAt,
      expiresAt: entry.expiresAt,
      nonce: entry.nonce,
      pdfFileName: entry.pdfFileName,
      pdfSha256: entry.pdfSha256,
    });

    if (errors.length > 0) hasErrors = true;
    return {
      ...rebuilt,
      validationStatus: errors.length === 0 ? "VALID" : "INVALID",
      validationErrors: errors,
    };
  });

  const tree = buildMerkleTree(validatedEntries.map((item) => item.leaf));
  const nextStatus: BatchStatus = hasErrors ? "DRAFT" : "VALIDATED";

  const nextState: AppState = {
    ...state,
    batches: state.batches.map((item) =>
      item.id === batch.id
        ? {
            ...batch,
            status: nextStatus,
            merkleRoot: tree.root,
            entries: validatedEntries,
          }
        : item,
    ),
    events: appendAuditEvent(state, {
      action: hasErrors ? "BATCH_VALIDATION_FAILED" : "BATCH_VALIDATED",
      actorRole: state.activeRole,
      actorName: state.activeRole,
      organizationId: batch.organizationId,
      aggregateType: "BATCH",
      aggregateId: batch.id,
      detail: hasErrors
        ? `Kiểm tra lô ${batch.code} phát hiện dòng dữ liệu lỗi`
        : `Đã chuẩn hóa JCS và kiểm tra hợp lệ ${validatedEntries.length} hồ sơ trong lô ${batch.code}`,
    }),
  };

  return hasErrors
    ? {
        state: nextState,
        error: "Phát hiện lỗi trong danh sách học viên. Vui lòng xử lý các dòng báo đỏ.",
      }
    : { state: nextState };
};

export const approveBatch = (
  state: AppState,
  batchId: string,
  approverName = "ISSUER_APPROVER",
): { state: AppState; error?: string } => {
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch) return { state, error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "VALIDATED") {
    return { state, error: "Chỉ lô đã ở trạng thái VALIDATED mới được phê duyệt." };
  }

  return {
    state: {
      ...state,
      batches: state.batches.map((item) =>
        item.id === batch.id
          ? { ...batch, status: "APPROVED", approvedBy: normalizeText(approverName) }
          : item,
      ),
      events: appendAuditEvent(state, {
        action: "BATCH_APPROVED",
        actorRole: "ISSUER_APPROVER",
        actorName: normalizeText(approverName),
        organizationId: batch.organizationId,
        aggregateType: "BATCH",
        aggregateId: batch.id,
        detail: `Phê duyệt lô ${batch.code} (${batch.entries.length} học viên)`,
      }),
    },
  };
};

export const freezeBatch = (
  state: AppState,
  batchId: string,
): { state: AppState; error?: string } => {
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch) return { state, error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "APPROVED") {
    return { state, error: "Lô phải được APPROVED trước khi đóng băng Merkle root." };
  }

  const course = state.courses.find((item) => item.id === batch.courseId);
  const tree = buildMerkleTree(batch.entries.map((entry) => entry.leaf));
  const frozenEntries = batch.entries.map((entry) => ({
    ...entry,
    proofPath: tree.proofs[entry.leaf] ?? [],
  }));
  const frozenAt = new Date().toISOString();

  const existingBatchCredIds = new Set(
    state.credentials
      .filter((cred) => cred.batchId === batch.id)
      .map((cred) => cred.batchEntryId),
  );

  const newPreparedCredentials: Credential[] = frozenEntries
    .filter((entry) => !existingBatchCredIds.has(entry.id))
    .map((entry, idx) => ({
      id: `cred_${state.credentials.length + idx + 1}`,
      code: `CERT-${batch.code.replace(/[^A-Z0-9]/g, "").slice(-5)}-${String(
        state.credentials.length + idx + 1,
      ).padStart(3, "0")}`,
      organizationId: batch.organizationId,
      batchId: batch.id,
      batchEntryId: entry.id,
      learnerId: entry.learnerId,
      subjectRef: entry.subjectRef,
      holder: entry.holderName,
      courseId: course?.id ?? batch.courseId,
      courseCode: course?.code ?? batch.courseId,
      course: course?.name ?? batch.title,
      score: entry.result,
      issuedAt: entry.issuedAt,
      expiresAt: entry.expiresAt,
      nonce: entry.nonce,
      pdfFileName: entry.pdfFileName,
      pdfSha256: entry.pdfSha256,
      payloadDigest: entry.payloadDigest,
      leaf: entry.leaf,
      proofPath: entry.proofPath,
      merkleRoot: tree.root,
      chainId: batch.chainId,
      registryAddress: batch.registryAddress,
      status: "PREPARED",
    }));

  return {
    state: {
      ...state,
      batches: state.batches.map((item) =>
        item.id === batch.id
          ? {
              ...batch,
              status: "FROZEN",
              merkleRoot: tree.root,
              frozenAt,
              entries: frozenEntries,
            }
          : item,
      ),
      credentials: [...state.credentials, ...newPreparedCredentials],
      events: appendAuditEvent(state, {
        action: "BATCH_FROZEN",
        actorRole: "ISSUER_APPROVER",
        actorName: batch.approvedBy ?? "ISSUER_APPROVER",
        organizationId: batch.organizationId,
        aggregateType: "BATCH",
        aggregateId: batch.id,
        detail: `Đóng băng lô ${batch.code} · Merkle root ${tree.root.slice(0, 18)}...`,
      }),
    },
  };
};

// UC-05: Publish Intent, Wallet Sign & Worker Confirmation
export const buildPublishIntent = (
  state: AppState,
  batchId: string,
): { intent?: PublishIntent; error?: string } => {
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch) return { error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "FROZEN" && batch.status !== "FAILED") {
    return {
      error: "Chỉ lô đã đóng băng (FROZEN) hoặc cần gửi lại (FAILED) mới tạo được Publish Intent.",
    };
  }

  const org = state.organizations.find((item) => item.id === batch.organizationId);
  if (!org || org.status !== "ACTIVE") {
    return { error: "Tổ chức phát hành chưa ở trạng thái ACTIVE nên không thể ký phát hành." };
  }

  const wallet = state.wallets.find(
    (item) =>
      item.organizationId === batch.organizationId &&
      item.chainId === batch.chainId &&
      item.status === "AUTHORIZED",
  );
  if (!wallet) {
    return {
      error: `Tổ chức chưa có ví được ủy quyền (AUTHORIZED) trên mạng Chain ${batch.chainId}.`,
    };
  }

  const calldata = computeDigestHex(
    `publishBatch(${batch.organizationId},${batch.id},${batch.merkleRoot})`,
    64,
  );

  return {
    intent: {
      batchId: batch.id,
      chainId: batch.chainId,
      registryAddress: batch.registryAddress,
      issuerId: batch.organizationId,
      walletAddress: wallet.address,
      merkleRoot: batch.merkleRoot,
      entryCount: batch.entries.length,
      calldata,
      idempotencyKey: batch.idempotencyKey,
      status: "AWAITING_SIGNATURE",
    },
  };
};

export const submitPublishTransaction = (
  state: AppState,
  batchId: string,
): { state: AppState; error?: string } => {
  const intentCheck = buildPublishIntent(state, batchId);
  if (!intentCheck.intent) {
    return { state, error: intentCheck.error };
  }
  const { intent } = intentCheck;
  const txHash = computeDigestHex(
    `TX:${intent.batchId}:${intent.merkleRoot}:${intent.idempotencyKey}`,
    64,
  );

  return {
    state: {
      ...state,
      batches: state.batches.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              status: "PENDING_CHAIN",
              txHash,
              failureReason: undefined,
            }
          : batch,
      ),
      events: appendAuditEvent(state, {
        action: "CHAIN_TX_SUBMITTED",
        actorRole: "ISSUER_APPROVER",
        actorName: intent.walletAddress,
        organizationId: intent.issuerId,
        aggregateType: "BATCH",
        aggregateId: batchId,
        detail: `Đã ký publishBatch và gửi txHash ${txHash.slice(0, 18)}... (trạng thái PENDING_CHAIN)`,
      }),
    },
  };
};

export const confirmBatchPublish = (
  state: AppState,
  input: { batchId: string; blockNumber?: number; simulateFailureReason?: string },
): { state: AppState; error?: string } => {
  const batch = state.batches.find((item) => item.id === input.batchId);
  if (!batch) return { state, error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "PENDING_CHAIN" && batch.status !== "FROZEN") {
    return { state, error: "Lô chưa ở trạng thái chờ xác nhận on-chain." };
  }

  const txHash =
    batch.txHash ??
    computeDigestHex(`TX:${batch.id}:${batch.merkleRoot}:${batch.idempotencyKey}`, 64);

  if (input.simulateFailureReason) {
    const reason = normalizeText(input.simulateFailureReason);
    return {
      state: {
        ...state,
        batches: state.batches.map((item) =>
          item.id === batch.id
            ? { ...batch, status: "FAILED", txHash, failureReason: reason }
            : item,
        ),
        events: appendAuditEvent(state, {
          action: "BATCH_PUBLISH_FAILED",
          actorRole: "ISSUER_OPERATOR",
          actorName: "INDEXER",
          organizationId: batch.organizationId,
          aggregateType: "BATCH",
          aggregateId: batch.id,
          detail: `Đối chiếu receipt thất bại cho lô ${batch.code}: ${reason}`,
        }),
      },
    };
  }

  const confirmedAt = new Date().toISOString();
  const blockNumber = input.blockNumber;

  return {
    state: {
      ...state,
      batches: state.batches.map((item) =>
        item.id === batch.id
          ? {
              ...batch,
              status: "CONFIRMED",
              txHash,
              blockNumber,
              confirmedAt,
              failureReason: undefined,
            }
          : item,
      ),
      credentials: state.credentials.map((cred) =>
        cred.batchId === batch.id && cred.status === "PREPARED"
          ? { ...cred, status: "ISSUED", txHash }
          : cred,
      ),
      events: appendAuditEvent(state, {
        action: "BATCH_CONFIRMED",
        actorRole: "ISSUER_OPERATOR",
        actorName: "INDEXER",
        organizationId: batch.organizationId,
        aggregateType: "BATCH",
        aggregateId: batch.id,
        detail: `Đã đối chiếu receipt ${txHash.slice(0, 18)}... và BatchPublished event. Đã phát hành ${batch.entries.length} chứng chỉ.`,
      }),
    },
  };
};

import { computeDigestHex, normalizeText } from "./crypto";
import { appendAuditEvent, createBuiltCredentialEntry } from "./helpers";
import { buildMerkleTree } from "./merkle";
import type { AppState, Batch, Credential, CredentialPackage } from "./types";

export const buildCredentialPackage = (
  state: AppState,
  credentialIdOrCode: string,
): CredentialPackage | null => {
  const target = credentialIdOrCode.trim();
  if (!target) return null;
  const credential = state.credentials.find(
    (item) =>
      item.id.toLowerCase() === target.toLowerCase() ||
      item.code.toLowerCase() === target.toLowerCase(),
  );
  if (!credential) return null;

  return {
    payload: {
      credentialId: credential.batchEntryId,
      issuerId: credential.organizationId,
      holder: credential.holder,
      courseId: credential.courseId,
      courseName: credential.course,
      result: credential.score,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt,
      nonce: credential.nonce,
      pdfSha256: credential.pdfSha256,
    },
    anchor: {
      chainId: credential.chainId,
      registryAddress: credential.registryAddress,
      batchId: credential.batchId,
      issuerId: credential.organizationId,
    },
    proof: {
      leaf: credential.leaf,
      path: credential.proofPath,
      root: credential.merkleRoot,
    },
  };
};

// UC-07: Revoke Credential
export const revokeCredential = (
  state: AppState,
  credentialId: string,
  reason: string,
): AppState => {
  const credential = state.credentials.find((item) => item.id === credentialId);
  const cleanReason = normalizeText(reason);
  if (!credential || credential.status !== "ISSUED" || !cleanReason) return state;

  const revocationTxHash = computeDigestHex(
    `REVOKE:${credential.batchId}:${credential.leaf}:${Date.now()}`,
    64,
  );
  const revokedAt = new Date().toISOString();

  return {
    ...state,
    credentials: state.credentials.map((item) =>
      item.id === credentialId
        ? {
            ...item,
            status: "REVOKED",
            revokedAt,
            revokedReason: cleanReason,
            revocationTxHash,
          }
        : item,
    ),
    events: appendAuditEvent(state, {
      action: "CREDENTIAL_REVOKED",
      actorRole: "ISSUER_APPROVER",
      actorName: "ISSUER_APPROVER",
      organizationId: credential.organizationId,
      aggregateType: "CREDENTIAL",
      aggregateId: credential.id,
      detail: `Đã thu hồi chứng chỉ ${credential.code} (${credential.holder}) · Lý do: ${cleanReason}`,
    }),
  };
};

// UC-08: Reissue Credential
export const reissueCredential = (
  state: AppState,
  input: {
    credentialId: string;
    holderName: string;
    result: string;
    expiresAt: string | null;
    reason: string;
  },
): { state: AppState; newCredential?: Credential; error?: string } => {
  const source = state.credentials.find((item) => item.id === input.credentialId);
  if (!source) return { state, error: "Không tìm thấy chứng chỉ gốc để cấp lại." };
  if (source.status !== "ISSUED" && source.status !== "REVOKED") {
    return {
      state,
      error: "Chỉ chứng chỉ đang ISSUED hoặc đã REVOKED mới có thể cấp lại bản mới.",
    };
  }

  const holderName = normalizeText(input.holderName);
  const result = normalizeText(input.result);
  const reason = normalizeText(input.reason);
  if (!holderName || !result || !reason) {
    return { state, error: "Vui lòng nhập đầy đủ họ tên, kết quả và lý do cấp lại." };
  }

  const seq = state.credentials.length + 1;
  const newCode = `CERT-R${String(seq).padStart(3, "0")}-${source.code.slice(-3)}`;
  const issuedAt = new Date().toISOString().slice(0, 10) + "T00:00:00Z";
  const newEntryId = `entry_reissue_${seq}`;
  const newBatchId = `batch_reissue_${seq}`;
  const pdfFileName = `${newCode}.pdf`;
  const pdfSha256 = computeDigestHex(`PDF:${pdfFileName}:${holderName}:${result}`, 64);

  const entry = createBuiltCredentialEntry({
    entryId: newEntryId,
    batchId: newBatchId,
    issuerId: source.organizationId,
    chainId: source.chainId,
    registryAddress: source.registryAddress,
    learnerId: source.learnerId,
    subjectRef: source.subjectRef,
    holderName,
    courseId: source.courseId,
    courseName: source.course,
    result,
    issuedAt,
    expiresAt: input.expiresAt,
    nonce: `n_reissue_${seq}`,
    pdfFileName,
    pdfSha256,
  });

  const tree = buildMerkleTree([entry.leaf]);
  const txHash = computeDigestHex(`TX_REISSUE:${newBatchId}:${tree.root}`, 64);

  const reissuedCred: Credential = {
    id: `cred_${seq}`,
    code: newCode,
    organizationId: source.organizationId,
    batchId: newBatchId,
    batchEntryId: newEntryId,
    learnerId: source.learnerId,
    subjectRef: source.subjectRef,
    holder: holderName,
    courseId: source.courseId,
    courseCode: source.courseCode,
    course: source.course,
    score: result,
    issuedAt,
    expiresAt: input.expiresAt,
    nonce: entry.nonce,
    pdfFileName,
    pdfSha256,
    payloadDigest: entry.payloadDigest,
    leaf: entry.leaf,
    proofPath: tree.proofs[entry.leaf] ?? [],
    merkleRoot: tree.root,
    chainId: source.chainId,
    registryAddress: source.registryAddress,
    txHash,
    status: "ISSUED",
    reissuedFromId: source.id,
  };

  const reissueBatch: Batch = {
    id: newBatchId,
    code: `BATCH-REISSUE-${String(seq).padStart(2, "0")}`,
    organizationId: source.organizationId,
    courseId: source.courseId,
    title: `Lô cấp lại chứng chỉ cho ${holderName} (từ ${source.code})`,
    status: "CONFIRMED",
    chainId: source.chainId,
    registryAddress: source.registryAddress,
    merkleRoot: tree.root,
    inputDigest: entry.payloadDigest,
    idempotencyKey: `idem_${newBatchId}`,
    txHash,
    createdBy: "ISSUER_APPROVER",
    approvedBy: "ISSUER_APPROVER",
    frozenAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    entries: [{ ...entry, proofPath: tree.proofs[entry.leaf] ?? [] }],
  };

  const updatedCredentials = state.credentials.map((item) =>
    item.id === source.id
      ? {
          ...item,
          status: item.status === "ISSUED" ? ("SUPERSEDED" as const) : item.status,
          reissuedToId: reissuedCred.id,
        }
      : item,
  );

  return {
    newCredential: reissuedCred,
    state: {
      ...state,
      batches: [reissueBatch, ...state.batches],
      credentials: [reissuedCred, ...updatedCredentials],
      events: appendAuditEvent(state, {
        action: "CREDENTIAL_REISSUED",
        actorRole: "ISSUER_APPROVER",
        actorName: "ISSUER_APPROVER",
        organizationId: source.organizationId,
        aggregateType: "CREDENTIAL",
        aggregateId: reissuedCred.id,
        detail: `Cấp lại chứng chỉ mới ${newCode} thay cho ${source.code} (${reason})`,
      }),
    },
  };
};

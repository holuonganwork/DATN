import {
  computeLeafHash,
  computePayloadDigest,
  normalizeAddress,
  normalizeText,
} from "./crypto";
import type {
  AppState,
  AuditEvent,
  BatchEntry,
  CredentialAnchor,
  CredentialPayload,
} from "./types";

export const formatTimestamp = (date = new Date()): string =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);

const makeCorrelationId = (prefix: string, seq: number): string =>
  `${prefix}-${String(seq).padStart(4, "0")}`;

export const createBuiltCredentialEntry = (params: {
  entryId: string;
  batchId: string;
  issuerId: string;
  chainId: number;
  registryAddress: string;
  learnerId: string;
  subjectRef: string;
  holderName: string;
  courseId: string;
  courseName: string;
  result: string;
  issuedAt: string;
  expiresAt: string | null;
  nonce: string;
  pdfFileName: string;
  pdfSha256: string;
}): BatchEntry => {
  const payload: CredentialPayload = {
    credentialId: params.entryId,
    issuerId: params.issuerId,
    holder: normalizeText(params.holderName),
    courseId: params.courseId,
    courseName: normalizeText(params.courseName),
    result: normalizeText(params.result),
    issuedAt: params.issuedAt,
    expiresAt: params.expiresAt,
    nonce: params.nonce,
    pdfSha256: normalizeAddress(params.pdfSha256),
  };
  const payloadDigest = computePayloadDigest(payload);
  const anchor: CredentialAnchor = {
    chainId: params.chainId,
    registryAddress: params.registryAddress,
    batchId: params.batchId,
    issuerId: params.issuerId,
  };
  const leaf = computeLeafHash(anchor, payloadDigest);

  return {
    id: params.entryId,
    batchId: params.batchId,
    learnerId: params.learnerId,
    subjectRef: params.subjectRef,
    holderName: normalizeText(params.holderName),
    result: normalizeText(params.result),
    issuedAt: params.issuedAt,
    expiresAt: params.expiresAt,
    nonce: params.nonce,
    pdfFileName: params.pdfFileName,
    pdfSha256: normalizeAddress(params.pdfSha256),
    validationStatus: "VALID",
    validationErrors: [],
    payloadDigest,
    leaf,
    proofPath: [],
  };
};

export const appendAuditEvent = (
  state: AppState,
  event: Omit<AuditEvent, "id" | "correlationId" | "time">,
): AuditEvent[] => {
  const nextId = state.events.length + 1;
  return [
    ...state.events,
    {
      ...event,
      id: nextId,
      correlationId: makeCorrelationId("corr", nextId),
      time: formatTimestamp(),
    },
  ];
};

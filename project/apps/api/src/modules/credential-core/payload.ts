export interface CredentialPayload {
  credentialId: string;
  issuerId: string;
  holder: string;
  courseId: string;
  courseName: string;
  result: string;
  issuedAt: string;
  expiresAt: string | null;
  nonce: string;
  pdfSha256: string | null;
}

export interface CredentialAnchor {
  chainId: number;
  registryAddress: string;
  batchId: string;
  issuerId: string;
}

export interface CredentialProof {
  leaf: string;
  path: string[];
  root: string;
}

export interface CredentialPackage {
  payload: CredentialPayload;
  anchor: CredentialAnchor;
  proof: CredentialProof;
}

export const normalizeText = (value: string): string => value.trim().normalize("NFC");

export const normalizeAddress = (address: string): string => address.trim().toLowerCase();

export const toRfc3339UtcSeconds = (input: Date | string): string => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp for credential payload: ${String(input)}`);
  }
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
};

export const normalizePayload = (input: CredentialPayload): CredentialPayload => ({
  credentialId: normalizeText(input.credentialId),
  issuerId: normalizeText(input.issuerId),
  holder: normalizeText(input.holder),
  courseId: normalizeText(input.courseId),
  courseName: normalizeText(input.courseName),
  result: normalizeText(input.result),
  issuedAt: toRfc3339UtcSeconds(input.issuedAt),
  expiresAt:
    input.expiresAt === null || input.expiresAt === ""
      ? null
      : toRfc3339UtcSeconds(input.expiresAt),
  nonce: normalizeText(input.nonce),
  pdfSha256:
    input.pdfSha256 === null || input.pdfSha256.trim() === ""
      ? null
      : normalizeAddress(input.pdfSha256),
});

export const normalizeAnchor = (anchor: CredentialAnchor): CredentialAnchor => ({
  chainId: anchor.chainId,
  registryAddress: normalizeAddress(anchor.registryAddress),
  batchId: normalizeText(anchor.batchId),
  issuerId: normalizeText(anchor.issuerId),
});

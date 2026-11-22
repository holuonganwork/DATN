export type OrganizationStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REVOKED";
export type WalletStatus = "AUTHORIZED" | "REVOKED";
export type UserRole = "SYSTEM_ADMIN" | "ISSUER_OPERATOR" | "ISSUER_APPROVER" | "AUDITOR";
export type CourseStatus = "ACTIVE" | "ARCHIVED";

export type BatchStatus =
  | "DRAFT"
  | "VALIDATED"
  | "APPROVED"
  | "FROZEN"
  | "PENDING_CHAIN"
  | "CONFIRMED"
  | "FAILED";

export type EntryValidationStatus = "PENDING" | "VALID" | "INVALID";
export type CredentialStatus = "PREPARED" | "ISSUED" | "REVOKED" | "SUPERSEDED";

export type VerifyResult =
  | "VALID"
  | "INVALID"
  | "REVOKED"
  | "SUPERSEDED"
  | "EXPIRED"
  | "INDETERMINATE"
  | "NOT_FOUND";

export type CheckStatus = "PASS" | "FAIL" | "UNAVAILABLE";

export type SurfaceMode = "public" | "auth-gate" | "console";
export type PublicPage = "home" | "verifier" | "directory" | "standards";
export type ConsolePage = "overview" | "batches" | "credentials" | "catalog" | "admin" | "events";
export type VerifierMode = "lookup" | "inspector";
export type IssuerSubTab = "batches" | "credentials" | "catalog";

export interface NoticeBanner {
  id: number;
  tone: "success" | "warning" | "danger";
  message: string;
}

export interface TrustedChain {
  chainId: number;
  name: string;
  registryAddress: string;
  rpcUrl: string;
  explorerLabel: string;
}

export interface Organization {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
  verificationRef: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IssuerWallet {
  id: string;
  organizationId: string;
  chainId: number;
  address: string;
  status: WalletStatus;
  authorizedAt: string;
  revokedAt: string | null;
}

export interface Course {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  version: string;
  durationHours: number;
  gradingRule: string;
  status: CourseStatus;
  createdAt: string;
}

export interface Learner {
  id: string;
  organizationId: string;
  subjectRef: string;
  displayName: string;
  cohort: string;
  createdAt: string;
}

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
  pdfSha256: string;
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

export interface BatchEntry {
  id: string;
  batchId: string;
  learnerId: string;
  subjectRef: string;
  holderName: string;
  result: string;
  issuedAt: string;
  expiresAt: string | null;
  nonce: string;
  pdfFileName: string;
  pdfSha256: string;
  validationStatus: EntryValidationStatus;
  validationErrors: string[];
  payloadDigest: string;
  leaf: string;
  proofPath: string[];
}

export interface Batch {
  id: string;
  code: string;
  organizationId: string;
  courseId: string;
  title: string;
  status: BatchStatus;
  chainId: number;
  registryAddress: string;
  merkleRoot: string;
  inputDigest: string;
  idempotencyKey: string;
  txHash?: string;
  blockNumber?: number;
  createdBy: string;
  approvedBy?: string;
  frozenAt?: string;
  confirmedAt?: string;
  failureReason?: string;
  createdAt: string;
  entries: BatchEntry[];
}

export interface Credential {
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
  pdfFileName: string;
  pdfSha256: string;
  payloadDigest: string;
  leaf: string;
  proofPath: string[];
  merkleRoot: string;
  chainId: number;
  registryAddress: string;
  txHash?: string;
  status: CredentialStatus;
  revokedAt?: string;
  revokedReason?: string;
  revocationTxHash?: string;
  reissuedFromId?: string;
  reissuedToId?: string;
}

export interface PublishIntent {
  batchId: string;
  chainId: number;
  registryAddress: string;
  issuerId: string;
  walletAddress: string;
  merkleRoot: string;
  entryCount: number;
  calldata: string;
  idempotencyKey: string;
  status: "AWAITING_SIGNATURE";
}

export interface AuditEvent {
  id: number;
  action: string;
  actorRole: UserRole;
  actorName: string;
  organizationId: string | null;
  aggregateType: "ORGANIZATION" | "WALLET" | "COURSE" | "LEARNER" | "BATCH" | "CREDENTIAL" | "SYSTEM";
  aggregateId: string;
  correlationId: string;
  detail: string;
  time: string;
}

export interface VerificationCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface VerificationReport {
  result: VerifyResult;
  credential?: Credential;
  inspectedPackage?: CredentialPackage;
  checks: VerificationCheck[];
  verifiedAt: string;
}

export interface VerifyOptions {
  rpcAvailable?: boolean;
  uploadedPdfSha256?: string;
  referenceDateIso?: string;
}

export interface AppState {
  activeOrganizationId: string;
  activeRole: UserRole;
  selectedChainId: number;
  rpcOnline: boolean;
  organizations: Organization[];
  wallets: IssuerWallet[];
  courses: Course[];
  learners: Learner[];
  batches: Batch[];
  credentials: Credential[];
  events: AuditEvent[];
}

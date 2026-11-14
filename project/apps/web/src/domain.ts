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
  tampered: boolean;
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
  issuer: {
    id: string;
    name: string;
    wallet: string;
    status: OrganizationStatus;
  };
  batch: {
    id: string;
    course: string;
    status: BatchStatus;
    merkleRoot: string;
    txHash?: string;
  };
}

export type DemoState = AppState;

export const TRUSTED_CHAINS: TrustedChain[] = [
  {
    chainId: 31337,
    name: "Anvil Local EVM (31337)",
    registryAddress: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    rpcUrl: "http://127.0.0.1:8545",
    explorerLabel: "Anvil Local Block Explorer",
  },
  {
    chainId: 84532,
    name: "Base Sepolia Testnet (84532)",
    registryAddress: "0x8a91c09b57b16a2a04f4d3f91b74b07e849013d2",
    rpcUrl: "https://sepolia.base.org",
    explorerLabel: "BaseScan Sepolia",
  },
];

export const BATCH_PIPELINE_STEPS: BatchStatus[] = [
  "DRAFT",
  "VALIDATED",
  "APPROVED",
  "FROZEN",
  "PENDING_CHAIN",
  "CONFIRMED",
];

export const normalizeText = (value: string): string => value.trim().normalize("NFC");

export const normalizeAddress = (address: string): string => address.trim().toLowerCase();

export const isValidEvmAddress = (address: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/.test(address.trim());

export const isValidHexDigest = (digest: string): boolean =>
  /^0x[a-fA-F0-9]{12,64}$/.test(digest.trim());

const toCanonicalValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map(toCanonicalValue);
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = toCanonicalValue(record[key]);
    }
    return result;
  }
  return value;
};

export const canonicalizeJson = (value: unknown): string =>
  JSON.stringify(toCanonicalValue(value));

export const computeDigestHex = (seed: string, hexLength = 64): string => {
  const normalized = seed.normalize("NFC");
  const lanes = [
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ];
  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i);
    const laneIndex = i % lanes.length;
    const prev = lanes[(laneIndex + lanes.length - 1) % lanes.length];
    let mixed = Math.imul(lanes[laneIndex] ^ code, 0x01000193) >>> 0;
    mixed = ((mixed << 13) | (mixed >>> 19)) >>> 0;
    lanes[laneIndex] = (mixed ^ Math.imul(prev + i + 1, 0x85ebca6b)) >>> 0;
  }
  for (let round = 0; round < 16; round += 1) {
    const idx = round % lanes.length;
    const next = lanes[(idx + 1) % lanes.length];
    lanes[idx] = Math.imul(lanes[idx] ^ (next >>> 7), 0xc2b2ae35) >>> 0;
  }
  const fullHex = lanes.map((lane) => lane.toString(16).padStart(8, "0")).join("");
  return `0x${fullHex.slice(0, hexLength)}`;
};

export const computePayloadDigest = (payload: CredentialPayload): string =>
  computeDigestHex(`JCS:${canonicalizeJson(payload)}`, 64);

export const computeLeafHash = (anchor: CredentialAnchor, payloadDigest: string): string => {
  const bound = [
    String(anchor.chainId),
    normalizeAddress(anchor.registryAddress),
    normalizeText(anchor.issuerId),
    normalizeText(anchor.batchId),
    normalizeAddress(payloadDigest),
  ].join("|");
  return computeDigestHex(`LEAF:${bound}`, 64);
};

export const hashMerklePair = (left: string, right: string): string => {
  const a = normalizeAddress(left);
  const b = normalizeAddress(right);
  const ordered = a <= b ? `${a}:${b}` : `${b}:${a}`;
  return computeDigestHex(`MERKLE_NODE:${ordered}`, 64);
};

export const buildMerkleTree = (
  leaves: string[],
): { root: string; proofs: Record<string, string[]> } => {
  if (leaves.length === 0) {
    return { root: computeDigestHex("EMPTY_MERKLE_TREE", 64), proofs: {} };
  }
  const uniqueLeaves = [...leaves];
  const proofs: Record<string, string[]> = {};
  for (const leaf of uniqueLeaves) {
    proofs[leaf] = [];
  }

  let currentLayer = uniqueLeaves.map((leaf) => ({
    hash: leaf,
    members: [leaf],
  }));

  while (currentLayer.length > 1) {
    const nextLayer: { hash: string; members: string[] }[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const leftNode = currentLayer[i];
      const rightNode = currentLayer[i + 1];
      if (!rightNode) {
        nextLayer.push(leftNode);
        continue;
      }
      for (const member of leftNode.members) {
        proofs[member] = [...(proofs[member] ?? []), rightNode.hash];
      }
      for (const member of rightNode.members) {
        proofs[member] = [...(proofs[member] ?? []), leftNode.hash];
      }
      nextLayer.push({
        hash: hashMerklePair(leftNode.hash, rightNode.hash),
        members: [...leftNode.members, ...rightNode.members],
      });
    }
    currentLayer = nextLayer;
  }

  return {
    root: currentLayer[0].hash,
    proofs,
  };
};

export const verifyMerkleProof = (
  leaf: string,
  path: string[],
  expectedRoot: string,
): boolean => {
  let computed = normalizeAddress(leaf);
  for (const sibling of path) {
    computed = normalizeAddress(hashMerklePair(computed, sibling));
  }
  return computed === normalizeAddress(expectedRoot);
};

export const formatTimestamp = (date = new Date()): string =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);

const makeCorrelationId = (prefix: string, seq: number): string =>
  `${prefix}-${String(seq).padStart(4, "0")}`;

export const syncLegacyMirrors = (state: AppState): AppState => {
  const activeOrg =
    state.organizations.find((org) => org.id === state.activeOrganizationId) ??
    state.organizations[0];
  const activeWallet = state.wallets.find(
    (wallet) =>
      wallet.organizationId === activeOrg?.id && wallet.status === "AUTHORIZED",
  );
  const primaryBatch =
    state.batches.find((batch) => batch.organizationId === activeOrg?.id) ??
    state.batches[0];
  const primaryCourse = state.courses.find(
    (course) => course.id === primaryBatch?.courseId,
  );

  return {
    ...state,
    issuer: {
      id: activeOrg?.id ?? "org_001",
      name: activeOrg?.displayName ?? "Đơn vị phát hành",
      wallet: activeWallet?.address ?? "Chưa ủy quyền ví",
      status: activeOrg?.status ?? "PENDING",
    },
    batch: {
      id: primaryBatch?.id ?? "batch_001",
      course: primaryCourse?.name ?? primaryBatch?.title ?? "Khóa đào tạo",
      status: primaryBatch?.status ?? "DRAFT",
      merkleRoot: primaryBatch?.merkleRoot ?? "0x0",
      txHash: primaryBatch?.txHash,
    },
  };
};

const createBuiltCredentialEntry = (params: {
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

export const buildCredentialPackage = (
  state: AppState,
  credentialIdOrCode: string,
): CredentialPackage | null => {
  const target = credentialIdOrCode.trim();
  const credential = state.credentials.find(
    (item) => item.id === target || item.code === target,
  );
  if (!credential) return null;

  const tamperedHolder = credential.tampered
    ? `${credential.holder} (Đã chỉnh sửa trái phép)`
    : credential.holder;

  return {
    payload: {
      credentialId: credential.batchEntryId,
      issuerId: credential.organizationId,
      holder: tamperedHolder,
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

export const createInitialState = (): AppState => {
  const defaultChain = TRUSTED_CHAINS[0];
  const org1Id = "org_bkhn_01";
  const org2Id = "org_fpt_02";
  const org3Id = "org_cmc_03";

  const organizations: Organization[] = [
    {
      id: org1Id,
      code: "BKHN-ACADEMY",
      legalName: "Trung tâm Đào tạo Công nghệ Số — ĐH Bách Khoa",
      displayName: "Viện Công nghệ Số Bách Khoa",
      verificationRef: "QD-BGD-2026-0192",
      status: "ACTIVE",
      createdAt: "2026-10-01T08:00:00Z",
      updatedAt: "2026-10-02T09:30:00Z",
    },
    {
      id: org2Id,
      code: "FPT-JETKING",
      legalName: "Viện Đào tạo Quốc tế FPT Software Academy",
      displayName: "FPT Software Academy",
      verificationRef: "QD-LDTBXH-2026-0841",
      status: "ACTIVE",
      createdAt: "2026-10-05T08:00:00Z",
      updatedAt: "2026-10-06T10:15:00Z",
    },
    {
      id: org3Id,
      code: "VNSEC-LAB",
      legalName: "Trung tâm Huấn luyện An toàn Thông tin Việt Nam",
      displayName: "VNSec Training Center",
      verificationRef: "HS-DANGKY-2026-1104",
      status: "PENDING",
      createdAt: "2026-11-10T14:00:00Z",
      updatedAt: "2026-11-10T14:00:00Z",
    },
  ];

  const wallets: IssuerWallet[] = [
    {
      id: "wal_001",
      organizationId: org1Id,
      chainId: defaultChain.chainId,
      address: "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
      status: "AUTHORIZED",
      authorizedAt: "2026-10-02T09:35:00Z",
      revokedAt: null,
    },
    {
      id: "wal_002",
      organizationId: org2Id,
      chainId: defaultChain.chainId,
      address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      status: "AUTHORIZED",
      authorizedAt: "2026-10-06T10:20:00Z",
      revokedAt: null,
    },
  ];

  const courses: Course[] = [
    {
      id: "crs_evm_101",
      organizationId: org1Id,
      code: "EVM-SEC-2026",
      name: "Kỹ thuật Smart Contract & Bảo mật EVM",
      version: "v2.1",
      durationHours: 120,
      gradingRule: "Điểm tổng kết >= 70/100 và hoàn thành đồ án",
      status: "ACTIVE",
      createdAt: "2026-10-10T08:00:00Z",
    },
    {
      id: "crs_dist_202",
      organizationId: org1Id,
      code: "DIST-SYS-2026",
      name: "Kiến trúc Hệ thống Phân tán & Mật mã học ứng dụng",
      version: "v1.4",
      durationHours: 90,
      gradingRule: "Đạt kỳ thi sát hạch thực hành >= 75/100",
      status: "ACTIVE",
      createdAt: "2026-10-12T08:00:00Z",
    },
    {
      id: "crs_cloud_301",
      organizationId: org2Id,
      code: "CLOUD-DEVOPS-01",
      name: "Kỹ sư Vận hành Hạ tầng Cloud & DevSecOps",
      version: "v3.0",
      durationHours: 150,
      gradingRule: "Điểm lab >= 80/100",
      status: "ACTIVE",
      createdAt: "2026-10-15T08:00:00Z",
    },
  ];

  const learners: Learner[] = [
    {
      id: "lrn_001",
      organizationId: org1Id,
      subjectRef: "SV-2026-0101",
      displayName: "Nguyễn Minh An",
      cohort: "K68-CNTT",
      createdAt: "2026-10-15T09:00:00Z",
    },
    {
      id: "lrn_002",
      organizationId: org1Id,
      subjectRef: "SV-2026-0102",
      displayName: "Trần Gia Linh",
      cohort: "K68-CNTT",
      createdAt: "2026-10-15T09:05:00Z",
    },
    {
      id: "lrn_003",
      organizationId: org1Id,
      subjectRef: "SV-2026-0103",
      displayName: "Lê Hoàng Nam",
      cohort: "K68-ATTT",
      createdAt: "2026-10-15T09:10:00Z",
    },
    {
      id: "lrn_004",
      organizationId: org1Id,
      subjectRef: "SV-2026-0104",
      displayName: "Phạm Thu Hà",
      cohort: "K68-ATTT",
      createdAt: "2026-10-15T09:15:00Z",
    },
    {
      id: "lrn_005",
      organizationId: org1Id,
      subjectRef: "SV-2026-0105",
      displayName: "Vũ Đức Thịnh",
      cohort: "K68-KHMT",
      createdAt: "2026-10-15T09:20:00Z",
    },
  ];

  // Batch 1: CONFIRMED on-chain (3 credentials already issued so Public Verifier has immediate real packages to inspect)
  const batch1Id = "batch_2026_q4_01";
  const course1 = courses[0];
  const rawEntriesBatch1 = [
    {
      entryId: "entry_101",
      learner: learners[0],
      result: "94/100 (Xuất sắc)",
      issuedAt: "2026-11-01T00:00:00Z",
      expiresAt: "2029-11-01T00:00:00Z",
      nonce: "n_20261101_001",
      pdfFileName: "CERT-BKHN-2026-001.pdf",
    },
    {
      entryId: "entry_102",
      learner: learners[1],
      result: "89/100 (Giỏi)",
      issuedAt: "2026-11-01T00:00:00Z",
      expiresAt: "2029-11-01T00:00:00Z",
      nonce: "n_20261101_002",
      pdfFileName: "CERT-BKHN-2026-002.pdf",
    },
    {
      entryId: "entry_103",
      learner: learners[2],
      result: "82/100 (Giỏi)",
      issuedAt: "2026-11-01T00:00:00Z",
      expiresAt: "2028-11-01T00:00:00Z",
      nonce: "n_20261101_003",
      pdfFileName: "CERT-BKHN-2026-003.pdf",
    },
  ];

  const builtEntries1 = rawEntriesBatch1.map((item) =>
    createBuiltCredentialEntry({
      entryId: item.entryId,
      batchId: batch1Id,
      issuerId: org1Id,
      chainId: defaultChain.chainId,
      registryAddress: defaultChain.registryAddress,
      learnerId: item.learner.id,
      subjectRef: item.learner.subjectRef,
      holderName: item.learner.displayName,
      courseId: course1.id,
      courseName: course1.name,
      result: item.result,
      issuedAt: item.issuedAt,
      expiresAt: item.expiresAt,
      nonce: item.nonce,
      pdfFileName: item.pdfFileName,
      pdfSha256: computeDigestHex(`PDF:${item.pdfFileName}:${item.learner.subjectRef}`, 64),
    }),
  );

  const tree1 = buildMerkleTree(builtEntries1.map((entry) => entry.leaf));
  const finalizedEntries1 = builtEntries1.map((entry) => ({
    ...entry,
    proofPath: tree1.proofs[entry.leaf] ?? [],
  }));
  const batch1TxHash = computeDigestHex(`TX:${batch1Id}:${tree1.root}`, 64);

  // Batch 2: DRAFT batch in progress so Issuer Operator can test validate -> approve -> freeze -> sign -> confirm
  const batch2Id = "batch_2026_q4_02";
  const course2 = courses[1];
  const builtEntries2 = [learners[3], learners[4]].map((learner, idx) =>
    createBuiltCredentialEntry({
      entryId: `entry_20${idx + 1}`,
      batchId: batch2Id,
      issuerId: org1Id,
      chainId: defaultChain.chainId,
      registryAddress: defaultChain.registryAddress,
      learnerId: learner.id,
      subjectRef: learner.subjectRef,
      holderName: learner.displayName,
      courseId: course2.id,
      courseName: course2.name,
      result: idx === 0 ? "91/100 (Xuất sắc)" : "85/100 (Giỏi)",
      issuedAt: "2026-11-14T00:00:00Z",
      expiresAt: "2029-11-14T00:00:00Z",
      nonce: `n_20261114_20${idx + 1}`,
      pdfFileName: `CERT-BKHN-2026-10${idx + 1}.pdf`,
      pdfSha256: computeDigestHex(`PDF:CERT-BKHN-2026-10${idx + 1}.pdf:${learner.subjectRef}`, 64),
    }),
  );
  const tree2 = buildMerkleTree(builtEntries2.map((entry) => entry.leaf));

  const batches: Batch[] = [
    {
      id: batch1Id,
      code: "BATCH-2026-Q4-01",
      organizationId: org1Id,
      courseId: course1.id,
      title: "Lô tốt nghiệp Khóa EVM Security K68 — Đợt 1",
      status: "CONFIRMED",
      chainId: defaultChain.chainId,
      registryAddress: defaultChain.registryAddress,
      merkleRoot: tree1.root,
      inputDigest: computeDigestHex(finalizedEntries1.map((e) => e.payloadDigest).join("|"), 64),
      idempotencyKey: "idem_publish_batch_2026_q4_01",
      txHash: batch1TxHash,
      blockNumber: 14820,
      createdBy: "Nguyễn Văn Hùng (Operator)",
      approvedBy: "PGS.TS Trần Minh Quân (Approver)",
      frozenAt: "2026-11-01T09:30:00Z",
      confirmedAt: "2026-11-01T09:32:15Z",
      createdAt: "2026-10-28T08:00:00Z",
      entries: finalizedEntries1,
    },
    {
      id: batch2Id,
      code: "BATCH-2026-Q4-02",
      organizationId: org1Id,
      courseId: course2.id,
      title: "Lô cấp chứng chỉ Hệ thống Phân tán K68 — Đợt 2",
      status: "DRAFT",
      chainId: defaultChain.chainId,
      registryAddress: defaultChain.registryAddress,
      merkleRoot: tree2.root,
      inputDigest: computeDigestHex(builtEntries2.map((e) => e.payloadDigest).join("|"), 64),
      idempotencyKey: "idem_publish_batch_2026_q4_02",
      createdBy: "Nguyễn Văn Hùng (Operator)",
      createdAt: "2026-11-12T10:00:00Z",
      entries: builtEntries2.map((entry) => ({
        ...entry,
        validationStatus: "PENDING",
      })),
    },
  ];

  const credentials: Credential[] = finalizedEntries1.map((entry, idx) => ({
    id: `cred_${idx + 1}`,
    code: `CERT-7K4P-00${idx + 1}`,
    organizationId: org1Id,
    batchId: batch1Id,
    batchEntryId: entry.id,
    learnerId: entry.learnerId,
    subjectRef: entry.subjectRef,
    holder: entry.holderName,
    courseId: course1.id,
    courseCode: course1.code,
    course: course1.name,
    score: entry.result,
    issuedAt: entry.issuedAt,
    expiresAt: entry.expiresAt,
    nonce: entry.nonce,
    pdfFileName: entry.pdfFileName,
    pdfSha256: entry.pdfSha256,
    payloadDigest: entry.payloadDigest,
    leaf: entry.leaf,
    proofPath: entry.proofPath,
    merkleRoot: tree1.root,
    chainId: defaultChain.chainId,
    registryAddress: defaultChain.registryAddress,
    txHash: batch1TxHash,
    status: "ISSUED",
    tampered: false,
  }));

  const events: AuditEvent[] = [
    {
      id: 1,
      action: "ORG_REGISTERED",
      actorRole: "SYSTEM_ADMIN",
      actorName: "Quản trị viên Hệ thống",
      organizationId: org1Id,
      aggregateType: "ORGANIZATION",
      aggregateId: org1Id,
      correlationId: makeCorrelationId("corr", 1),
      detail: "Đã xác minh pháp lý và kích hoạt Viện Công nghệ Số Bách Khoa (ACTIVE)",
      time: "02/10/2026, 09:30:00",
    },
    {
      id: 2,
      action: "WALLET_AUTHORIZED",
      actorRole: "SYSTEM_ADMIN",
      actorName: "Quản trị viên Hệ thống",
      organizationId: org1Id,
      aggregateType: "WALLET",
      aggregateId: "wal_001",
      correlationId: makeCorrelationId("corr", 2),
      detail: "Đã ủy quyền ví 0x71c7656ec7ab88b098defb751b7401b5f6d8976f trên mạng Chain 31337",
      time: "02/10/2026, 09:35:00",
    },
    {
      id: 3,
      action: "BATCH_FROZEN",
      actorRole: "ISSUER_APPROVER",
      actorName: "PGS.TS Trần Minh Quân",
      organizationId: org1Id,
      aggregateType: "BATCH",
      aggregateId: batch1Id,
      correlationId: makeCorrelationId("corr", 3),
      detail: `Đã đóng băng BATCH-2026-Q4-01 (3 chứng chỉ) · Merkle root ${tree1.root.slice(0, 18)}...`,
      time: "01/11/2026, 09:30:00",
    },
    {
      id: 4,
      action: "BATCH_CONFIRMED",
      actorRole: "ISSUER_OPERATOR",
      actorName: "Worker / Indexer",
      organizationId: org1Id,
      aggregateType: "BATCH",
      aggregateId: batch1Id,
      correlationId: makeCorrelationId("corr", 4),
      detail: `Receipt ${batch1TxHash.slice(0, 18)}... và BatchPublished event đã khớp tại block #14820`,
      time: "01/11/2026, 09:32:15",
    },
  ];

  const baseState: AppState = {
    activeOrganizationId: org1Id,
    activeRole: "ISSUER_OPERATOR",
    selectedChainId: defaultChain.chainId,
    rpcOnline: true,
    organizations,
    wallets,
    courses,
    learners,
    batches,
    credentials,
    events,
    issuer: {
      id: org1Id,
      name: organizations[0].displayName,
      wallet: wallets[0].address,
      status: organizations[0].status,
    },
    batch: {
      id: batch1Id,
      course: course1.name,
      status: "CONFIRMED",
      merkleRoot: tree1.root,
      txHash: batch1TxHash,
    },
  };

  return syncLegacyMirrors(baseState);
};

const appendAuditEvent = (
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

// UC-01: System Admin — Register Organization, Update Status, Authorize Wallet
export const registerOrganization = (
  state: AppState,
  input: { code: string; legalName: string; displayName: string; verificationRef: string },
): { state: AppState; error?: string } => {
  const code = normalizeText(input.code).toUpperCase();
  const legalName = normalizeText(input.legalName);
  const displayName = normalizeText(input.displayName);
  const verificationRef = normalizeText(input.verificationRef);

  if (!code || !legalName || !displayName || !verificationRef) {
    return { state, error: "Vui lòng nhập đầy đủ mã tổ chức, tên pháp lý, tên hiển thị và mã hồ sơ xác minh." };
  }
  if (state.organizations.some((org) => org.code.toUpperCase() === code)) {
    return { state, error: `Mã tổ chức ${code} đã tồn tại trong hệ thống.` };
  }

  const nowIso = new Date().toISOString();
  const newOrg: Organization = {
    id: `org_${code.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${state.organizations.length + 1}`,
    code,
    legalName,
    displayName,
    verificationRef,
    status: "PENDING",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const next = syncLegacyMirrors({
    ...state,
    organizations: [...state.organizations, newOrg],
    events: appendAuditEvent(state, {
      action: "ORG_REGISTERED",
      actorRole: "SYSTEM_ADMIN",
      actorName: "Quản trị viên Hệ thống",
      organizationId: newOrg.id,
      aggregateType: "ORGANIZATION",
      aggregateId: newOrg.id,
      detail: `Đăng ký mới tổ chức ${displayName} (${code}) ở trạng thái PENDING`,
    }),
  });
  return { state: next };
};

export const updateOrganizationStatus = (
  state: AppState,
  input: { organizationId: string; nextStatus: OrganizationStatus; reason?: string },
): { state: AppState; error?: string } => {
  const org = state.organizations.find((item) => item.id === input.organizationId);
  if (!org) return { state, error: "Không tìm thấy tổ chức." };

  const nowIso = new Date().toISOString();
  const next = syncLegacyMirrors({
    ...state,
    organizations: state.organizations.map((item) =>
      item.id === org.id
        ? { ...item, status: input.nextStatus, updatedAt: nowIso }
        : item,
    ),
    events: appendAuditEvent(state, {
      action: `ORG_STATUS_${input.nextStatus}`,
      actorRole: "SYSTEM_ADMIN",
      actorName: "Quản trị viên Hệ thống",
      organizationId: org.id,
      aggregateType: "ORGANIZATION",
      aggregateId: org.id,
      detail: `Chuyển trạng thái ${org.displayName}: ${org.status} → ${input.nextStatus}${input.reason ? ` (${normalizeText(input.reason)})` : ""}`,
    }),
  });
  return { state: next };
};

export const authorizeOrganizationWallet = (
  state: AppState,
  input: { organizationId: string; chainId: number; address: string },
): { state: AppState; error?: string } => {
  const org = state.organizations.find((item) => item.id === input.organizationId);
  if (!org) return { state, error: "Không tìm thấy tổ chức phát hành." };
  if (org.status !== "ACTIVE") {
    return { state, error: "Chỉ tổ chức ở trạng thái ACTIVE mới được ủy quyền ví phát hành." };
  }
  if (!TRUSTED_CHAINS.some((chain) => chain.chainId === input.chainId)) {
    return { state, error: `Chain ID ${input.chainId} không nằm trong danh sách mạng tin cậy.` };
  }
  if (!isValidEvmAddress(input.address)) {
    return { state, error: "Địa chỉ ví EVM không hợp lệ (cần định dạng 0x kèm 40 ký tự hex)." };
  }

  const normalized = normalizeAddress(input.address);
  const conflict = state.wallets.find(
    (wallet) =>
      wallet.chainId === input.chainId &&
      normalizeAddress(wallet.address) === normalized &&
      wallet.organizationId !== org.id &&
      wallet.status === "AUTHORIZED",
  );
  if (conflict) {
    return { state, error: "Địa chỉ ví này đang được ủy quyền cho một tổ chức khác trên cùng mạng." };
  }

  const nowIso = new Date().toISOString();
  const updatedWallets = state.wallets.map((wallet) =>
    wallet.organizationId === org.id && wallet.status === "AUTHORIZED"
      ? { ...wallet, status: "REVOKED" as const, revokedAt: nowIso }
      : wallet,
  );

  const newWallet: IssuerWallet = {
    id: `wal_${state.wallets.length + 1}`,
    organizationId: org.id,
    chainId: input.chainId,
    address: normalized,
    status: "AUTHORIZED",
    authorizedAt: nowIso,
    revokedAt: null,
  };

  const next = syncLegacyMirrors({
    ...state,
    wallets: [...updatedWallets, newWallet],
    events: appendAuditEvent(state, {
      action: "WALLET_AUTHORIZED",
      actorRole: "SYSTEM_ADMIN",
      actorName: "Quản trị viên Hệ thống",
      organizationId: org.id,
      aggregateType: "WALLET",
      aggregateId: newWallet.id,
      detail: `Ủy quyền ví ${normalized} cho ${org.displayName} trên Chain ${input.chainId}`,
    }),
  });
  return { state: next };
};

// UC-02: Courses & Learners
export const createCourse = (
  state: AppState,
  input: {
    organizationId: string;
    code: string;
    name: string;
    version: string;
    durationHours: number;
    gradingRule: string;
  },
): { state: AppState; error?: string } => {
  const code = normalizeText(input.code).toUpperCase();
  const name = normalizeText(input.name);
  const version = normalizeText(input.version) || "v1.0";
  const gradingRule = normalizeText(input.gradingRule) || "Hoàn thành khóa học";

  if (!code || !name || input.durationHours <= 0) {
    return { state, error: "Vui lòng nhập mã khóa học, tên khóa học và thời lượng hợp lệ." };
  }
  if (
    state.courses.some(
      (course) =>
        course.organizationId === input.organizationId &&
        course.code.toUpperCase() === code &&
        course.version.toLowerCase() === version.toLowerCase(),
    )
  ) {
    return { state, error: `Khóa học ${code} (${version}) đã tồn tại trong đơn vị.` };
  }

  const newCourse: Course = {
    id: `crs_${state.courses.length + 1}_${Date.now().toString(36).slice(-4)}`,
    organizationId: input.organizationId,
    code,
    name,
    version,
    durationHours: input.durationHours,
    gradingRule,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  return {
    state: syncLegacyMirrors({
      ...state,
      courses: [...state.courses, newCourse],
      events: appendAuditEvent(state, {
        action: "COURSE_CREATED",
        actorRole: state.activeRole,
        actorName: "Vận hành viên Đơn vị",
        organizationId: input.organizationId,
        aggregateType: "COURSE",
        aggregateId: newCourse.id,
        detail: `Tạo khóa học ${code} — ${name} (${version})`,
      }),
    }),
  };
};

export const createLearner = (
  state: AppState,
  input: {
    organizationId: string;
    subjectRef: string;
    displayName: string;
    cohort: string;
  },
): { state: AppState; learner?: Learner; error?: string } => {
  const subjectRef = normalizeText(input.subjectRef).toUpperCase();
  const displayName = normalizeText(input.displayName);
  const cohort = normalizeText(input.cohort) || "2026";

  if (!subjectRef || !displayName) {
    return { state, error: "Mã định danh nội bộ và họ tên học viên là bắt buộc." };
  }
  if (
    state.learners.some(
      (learner) =>
        learner.organizationId === input.organizationId &&
        learner.subjectRef.toUpperCase() === subjectRef,
    )
  ) {
    return { state, error: `Mã học viên ${subjectRef} đã tồn tại trong đơn vị.` };
  }

  const newLearner: Learner = {
    id: `lrn_${state.learners.length + 1}_${Date.now().toString(36).slice(-4)}`,
    organizationId: input.organizationId,
    subjectRef,
    displayName,
    cohort,
    createdAt: new Date().toISOString(),
  };

  return {
    learner: newLearner,
    state: syncLegacyMirrors({
      ...state,
      learners: [...state.learners, newLearner],
      events: appendAuditEvent(state, {
        action: "LEARNER_CREATED",
        actorRole: state.activeRole,
        actorName: "Vận hành viên Đơn vị",
        organizationId: input.organizationId,
        aggregateType: "LEARNER",
        aggregateId: newLearner.id,
        detail: `Thêm hồ sơ học viên ${displayName} (${subjectRef})`,
      }),
    }),
  };
};

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
  const batchId = `batch_2026_${String(seq).padStart(2, "0")}`;
  const batchCode = `BATCH-2026-Q4-${String(seq).padStart(2, "0")}`;
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
    createdBy: "Vận hành viên Đơn vị",
    createdAt: new Date().toISOString(),
    entries: [],
  };

  return {
    batch: newBatch,
    state: syncLegacyMirrors({
      ...state,
      batches: [newBatch, ...state.batches],
      events: appendAuditEvent(state, {
        action: "BATCH_CREATED",
        actorRole: state.activeRole,
        actorName: "Vận hành viên Đơn vị",
        organizationId: input.organizationId,
        aggregateType: "BATCH",
        aggregateId: newBatch.id,
        detail: `Khởi tạo lô ${batchCode} (${title}) ở trạng thái DRAFT`,
      }),
    }),
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
    return { state, error: `Lô đang ở trạng thái ${batch.status}, không được phép chỉnh sửa danh sách.` };
  }

  const learner = state.learners.find(
    (item) => item.id === input.learnerId && item.organizationId === batch.organizationId,
  );
  if (!learner) return { state, error: "Vui lòng chọn học viên hợp lệ thuộc đơn vị." };

  const course = state.courses.find((item) => item.id === batch.courseId);
  const entryIndex = batch.entries.length + 1;
  const entryId = `entry_${batch.id}_${entryIndex}_${Date.now().toString(36).slice(-3)}`;
  const pdfFileName =
    normalizeText(input.pdfFileName ?? "") ||
    `${batch.code}-${learner.subjectRef}.pdf`;
  const pdfSha256 =
    input.pdfSha256 && isValidHexDigest(input.pdfSha256)
      ? normalizeAddress(input.pdfSha256)
      : computeDigestHex(`PDF:${pdfFileName}:${learner.subjectRef}:${input.result}`, 64);

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
    issuedAt: input.issuedAt || new Date().toISOString().slice(0, 10) + "T00:00:00Z",
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
    state: syncLegacyMirrors({
      ...state,
      batches: state.batches.map((item) => (item.id === batch.id ? updatedBatch : item)),
      events: appendAuditEvent(state, {
        action: "BATCH_ENTRY_ADDED",
        actorRole: state.activeRole,
        actorName: "Vận hành viên Đơn vị",
        organizationId: batch.organizationId,
        aggregateType: "BATCH",
        aggregateId: batch.id,
        detail: `Thêm học viên ${learner.displayName} (${learner.subjectRef}) vào lô ${batch.code}`,
      }),
    }),
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
    state: syncLegacyMirrors({
      ...state,
      batches: state.batches.map((item) =>
        item.id === batch.id
          ? { ...batch, status: "DRAFT", merkleRoot: nextTree.root, entries: nextEntries }
          : item,
      ),
    }),
  };
};

export const validateBatch = (
  state: AppState,
  batchId: string,
): { state: AppState; error?: string } => {
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch) return { state, error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "DRAFT" && batch.status !== "VALIDATED") {
    return { state, error: `Lô đang ở trạng thái ${batch.status}, không thể chạy kiểm tra lại.` };
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

  const nextState = syncLegacyMirrors({
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
      actorName: "Vận hành viên Đơn vị",
      organizationId: batch.organizationId,
      aggregateType: "BATCH",
      aggregateId: batch.id,
      detail: hasErrors
        ? `Kiểm tra lô ${batch.code} phát hiện dòng dữ liệu lỗi`
        : `Đã chuẩn hóa JCS và kiểm tra hợp lệ ${validatedEntries.length} hồ sơ trong lô ${batch.code}`,
    }),
  });

  return hasErrors
    ? { state: nextState, error: "Phát hiện lỗi trong danh sách học viên. Vui lòng xử lý các dòng báo đỏ." }
    : { state: nextState };
};

export const approveBatch = (
  state: AppState,
  batchId: string,
  approverName = "Hội đồng Phê duyệt Đào tạo",
): { state: AppState; error?: string } => {
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch) return { state, error: "Không tìm thấy lô chứng chỉ." };
  if (batch.status !== "VALIDATED") {
    return { state, error: "Chỉ lô đã ở trạng thái VALIDATED mới được phê duyệt." };
  }

  return {
    state: syncLegacyMirrors({
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
    }),
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
      code: `CERT-${batch.code.slice(-5).replace(/[^A-Z0-9]/g, "")}-${String(state.credentials.length + idx + 1).padStart(3, "0")}`,
      organizationId: batch.organizationId,
      batchId: batch.id,
      batchEntryId: entry.id,
      learnerId: entry.learnerId,
      subjectRef: entry.subjectRef,
      holder: entry.holderName,
      courseId: course?.id ?? batch.courseId,
      courseCode: course?.code ?? "COURSE",
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
      tampered: false,
    }));

  return {
    state: syncLegacyMirrors({
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
        actorName: batch.approvedBy ?? "Người phê duyệt",
        organizationId: batch.organizationId,
        aggregateType: "BATCH",
        aggregateId: batch.id,
        detail: `Đóng băng lô ${batch.code} · Merkle root ${tree.root.slice(0, 18)}...`,
      }),
    }),
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
    return { error: "Chỉ lô đã đóng băng (FROZEN) hoặc cần gửi lại (FAILED) mới tạo được Publish Intent." };
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
    return { error: `Tổ chức chưa có ví được ủy quyền (AUTHORIZED) trên mạng Chain ${batch.chainId}.` };
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
    state: syncLegacyMirrors({
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
        actorRole: "ISSUER_OPERATOR",
        actorName: `Ví Issuer (${intent.walletAddress.slice(0, 10)}...)`,
        organizationId: intent.issuerId,
        aggregateType: "BATCH",
        aggregateId: batchId,
        detail: `Đã ký publishBatch và gửi txHash ${txHash.slice(0, 18)}... (trạng thái PENDING_CHAIN, chờ Worker đối chiếu receipt)`,
      }),
    }),
  };
};

export const confirmBatchPublish = (
  state: AppState,
  input: { batchId: string; simulateFailureReason?: string },
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
      state: syncLegacyMirrors({
        ...state,
        batches: state.batches.map((item) =>
          item.id === batch.id
            ? { ...batch, status: "FAILED", txHash, failureReason: reason }
            : item,
        ),
        events: appendAuditEvent(state, {
          action: "BATCH_PUBLISH_FAILED",
          actorRole: "ISSUER_OPERATOR",
          actorName: "Worker / Indexer",
          organizationId: batch.organizationId,
          aggregateType: "BATCH",
          aggregateId: batch.id,
          detail: `Đối chiếu receipt thất bại cho lô ${batch.code}: ${reason}`,
        }),
      }),
    };
  }

  const confirmedAt = new Date().toISOString();
  const blockNumber = 14820 + state.events.length;

  return {
    state: syncLegacyMirrors({
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
        actorName: "Worker / Indexer",
        organizationId: batch.organizationId,
        aggregateType: "BATCH",
        aggregateId: batch.id,
        detail: `Đã đối chiếu receipt ${txHash.slice(0, 18)}... + BatchPublished event tại block #${blockNumber}. Đã phát hành ${batch.entries.length} chứng chỉ.`,
      }),
    }),
  };
};

// Legacy helper kept for compatibility with automated test harness
export const nextBatchStatus = (status: BatchStatus): BatchStatus | null => {
  const index = BATCH_PIPELINE_STEPS.indexOf(status);
  if (index === -1 || index + 1 >= BATCH_PIPELINE_STEPS.length) return null;
  return BATCH_PIPELINE_STEPS[index + 1];
};

export const advanceBatch = (state: AppState, targetBatchId?: string): AppState => {
  const batch =
    state.batches.find((item) => item.id === (targetBatchId ?? state.batch.id)) ??
    state.batches[0];
  if (!batch) return state;

  if (batch.status === "DRAFT") return validateBatch(state, batch.id).state;
  if (batch.status === "VALIDATED") return approveBatch(state, batch.id).state;
  if (batch.status === "APPROVED") return freezeBatch(state, batch.id).state;
  if (batch.status === "FROZEN" || batch.status === "FAILED") {
    return submitPublishTransaction(state, batch.id).state;
  }
  if (batch.status === "PENDING_CHAIN") {
    return confirmBatchPublish(state, { batchId: batch.id }).state;
  }
  return state;
};

// UC-08: Revoke Credential
export const revokeCredential = (
  state: AppState,
  credentialId: string,
  reason = "Thu hồi theo quyết định kiểm tra học vụ của đơn vị phát hành",
): AppState => {
  const credential = state.credentials.find((item) => item.id === credentialId);
  if (!credential || credential.status !== "ISSUED") return state;

  const cleanReason = normalizeText(reason) || "Thu hồi theo quyết định của đơn vị phát hành";
  const revocationTxHash = computeDigestHex(
    `REVOKE:${credential.batchId}:${credential.leaf}:${Date.now()}`,
    64,
  );
  const revokedAt = new Date().toISOString();

  return syncLegacyMirrors({
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
      actorRole: "ISSUER_OPERATOR",
      actorName: "Đơn vị Phát hành",
      organizationId: credential.organizationId,
      aggregateType: "CREDENTIAL",
      aggregateId: credential.id,
      detail: `Đã thu hồi chứng chỉ ${credential.code} (${credential.holder}) · Lý do: ${cleanReason}`,
    }),
  });
};

// UC-09: Reissue Credential
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
    return { state, error: "Chỉ chứng chỉ đang ISSUED hoặc đã REVOKED mới có thể cấp lại bản mới." };
  }

  const holderName = normalizeText(input.holderName);
  const result = normalizeText(input.result);
  const reason = normalizeText(input.reason);
  if (!holderName || !result || !reason) {
    return { state, error: "Vui lòng nhập đầy đủ họ tên, kết quả và lý do cấp lại." };
  }

  const seq = state.credentials.length + 1;
  const newCode = `CERT-R${ String(seq).padStart(3, "0") }-${source.code.slice(-3)}`;
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
    tampered: false,
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
    blockNumber: 14900 + seq,
    createdBy: "Vận hành viên Đơn vị",
    approvedBy: "Hội đồng Phê duyệt Đào tạo",
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
    state: syncLegacyMirrors({
      ...state,
      batches: [reissueBatch, ...state.batches],
      credentials: [reissuedCred, ...updatedCredentials],
      events: appendAuditEvent(state, {
        action: "CREDENTIAL_REISSUED",
        actorRole: "ISSUER_OPERATOR",
        actorName: "Đơn vị Phát hành",
        organizationId: source.organizationId,
        aggregateType: "CREDENTIAL",
        aggregateId: reissuedCred.id,
        detail: `Cấp lại chứng chỉ mới ${newCode} thay cho ${source.code} (${reason})`,
      }),
    }),
  };
};

export const toggleTamper = (state: AppState, credentialId: string): AppState => ({
  ...state,
  credentials: state.credentials.map((credential) =>
    credential.id === credentialId
      ? { ...credential, tampered: !credential.tampered }
      : credential,
  ),
});

// UC-07: Independent Verification of a Credential Package or Code
export const verifyCredentialPackage = (
  state: AppState,
  pkg: CredentialPackage,
  options: VerifyOptions = {},
): VerificationReport => {
  const verifiedAt = formatTimestamp();
  const rpcAvailable = options.rpcAvailable ?? state.rpcOnline;

  const hasRequiredPayload =
    Boolean(pkg?.payload?.credentialId) &&
    Boolean(pkg?.payload?.issuerId) &&
    Boolean(pkg?.payload?.holder) &&
    Boolean(pkg?.payload?.courseId) &&
    Boolean(pkg?.payload?.courseName) &&
    Boolean(pkg?.payload?.result) &&
    Boolean(pkg?.payload?.issuedAt) &&
    Boolean(pkg?.payload?.nonce) &&
    isValidHexDigest(pkg?.payload?.pdfSha256 ?? "");

  const hasRequiredAnchor =
    typeof pkg?.anchor?.chainId === "number" &&
    isValidEvmAddress(pkg?.anchor?.registryAddress ?? "") &&
    Boolean(pkg?.anchor?.batchId) &&
    Boolean(pkg?.anchor?.issuerId);

  const hasRequiredProof =
    isValidHexDigest(pkg?.proof?.leaf ?? "") &&
    Array.isArray(pkg?.proof?.path) &&
    isValidHexDigest(pkg?.proof?.root ?? "");

  const schemaPasses = hasRequiredPayload && hasRequiredAnchor && hasRequiredProof;

  const trustedChain = TRUSTED_CHAINS.find(
    (chain) =>
      chain.chainId === pkg?.anchor?.chainId &&
      normalizeAddress(chain.registryAddress) ===
        normalizeAddress(pkg?.anchor?.registryAddress ?? ""),
  );

  const issuerOrg = state.organizations.find(
    (org) => org.id === pkg?.anchor?.issuerId && org.id === pkg?.payload?.issuerId,
  );
  const issuerWallet = state.wallets.find(
    (wallet) =>
      wallet.organizationId === issuerOrg?.id &&
      wallet.chainId === pkg?.anchor?.chainId,
  );
  const issuerPasses = Boolean(issuerOrg && issuerOrg.status !== "PENDING" && issuerWallet);

  const recomputedDigest = schemaPasses
    ? computePayloadDigest(pkg.payload)
    : "0x0";
  const recomputedLeaf = schemaPasses
    ? computeLeafHash(pkg.anchor, recomputedDigest)
    : "0x0";

  const matchedCredential = state.credentials.find(
    (item) =>
      item.batchEntryId === pkg?.payload?.credentialId ||
      (item.batchId === pkg?.anchor?.batchId &&
        normalizeAddress(item.leaf) === normalizeAddress(pkg?.proof?.leaf ?? "")),
  );

  const digestMatchesLeaf =
    schemaPasses &&
    normalizeAddress(recomputedLeaf) === normalizeAddress(pkg.proof.leaf);

  const merkleProofPasses =
    schemaPasses &&
    digestMatchesLeaf &&
    verifyMerkleProof(recomputedLeaf, pkg.proof.path, pkg.proof.root);

  const matchedBatch = state.batches.find(
    (batch) =>
      batch.id === pkg?.anchor?.batchId &&
      batch.organizationId === pkg?.anchor?.issuerId,
  );

  const batchConfirmedOnChain =
    Boolean(matchedBatch && matchedBatch.status === "CONFIRMED") &&
    normalizeAddress(matchedBatch?.merkleRoot ?? "") ===
      normalizeAddress(pkg?.proof?.root ?? "");

  const referenceTime = options.referenceDateIso
    ? Date.parse(options.referenceDateIso)
    : Date.now();
  const isExpired = Boolean(
    pkg?.payload?.expiresAt && Date.parse(pkg.payload.expiresAt) < referenceTime,
  );

  const isRevoked = matchedCredential?.status === "REVOKED";
  const isSuperseded = matchedCredential?.status === "SUPERSEDED";

  const pdfCheckNeeded = Boolean(options.uploadedPdfSha256);
  const pdfPasses = pdfCheckNeeded
    ? normalizeAddress(options.uploadedPdfSha256 ?? "") ===
      normalizeAddress(pkg?.payload?.pdfSha256 ?? "")
    : true;

  const checks: VerificationCheck[] = [
    {
      key: "schema",
      label: "Cấu trúc gói",
      status: schemaPasses ? "PASS" : "FAIL",
      detail: schemaPasses
        ? "Đầy đủ payload, anchor và proof đúng định dạng"
        : "Thiếu trường bắt buộc hoặc sai định dạng dữ liệu trong gói JSON",
    },
    {
      key: "trusted_chain",
      label: "Mạng & Registry tin cậy",
      status: trustedChain ? "PASS" : "FAIL",
      detail: trustedChain
        ? `${trustedChain.name} · ${trustedChain.registryAddress.slice(0, 14)}...`
        : "Chain ID hoặc địa chỉ Registry không nằm trong cấu hình tin cậy",
    },
    {
      key: "issuer",
      label: "Nguồn phát hành",
      status: issuerPasses ? "PASS" : "FAIL",
      detail: issuerOrg
        ? `${issuerOrg.displayName} (${issuerOrg.code})`
        : "Không tìm thấy đơn vị phát hành hợp lệ trong registry",
    },
    {
      key: "payload_digest",
      label: "Payload digest",
      status: digestMatchesLeaf ? "PASS" : "FAIL",
      detail: digestMatchesLeaf
        ? `JCS + Keccak256 khớp (${recomputedDigest.slice(0, 18)}...)`
        : "Nội dung payload đã bị sửa đổi, digest không còn khớp với leaf đã ký",
    },
    {
      key: "merkle_proof",
      label: "Merkle proof",
      status: merkleProofPasses ? "PASS" : "FAIL",
      detail: merkleProofPasses
        ? `Hợp lệ qua ${pkg.proof.path.length} nhánh → Root ${pkg.proof.root.slice(0, 16)}...`
        : "Leaf và đường dẫn Merkle proof không khớp với Merkle root",
    },
    {
      key: "on_chain",
      label: "Trạng thái on-chain",
      status: !rpcAvailable
        ? "UNAVAILABLE"
        : batchConfirmedOnChain
          ? "PASS"
          : matchedBatch && matchedBatch.status !== "CONFIRMED"
            ? "UNAVAILABLE"
            : "FAIL",
      detail: !rpcAvailable
        ? "Không thể kết nối EVM RPC để đọc trạng thái batch và thu hồi"
        : batchConfirmedOnChain
          ? `Đã xác nhận tại block #${matchedBatch?.blockNumber ?? 14820} · Receipt ${matchedBatch?.txHash?.slice(0, 14) ?? "0x"}...`
          : matchedBatch && matchedBatch.status !== "CONFIRMED"
            ? `Lô đang ở trạng thái ${matchedBatch.status}, chưa được xác nhận on-chain`
            : "Không tìm thấy batch hoặc Merkle root tương ứng trên smart contract",
    },
    {
      key: "revocation",
      label: "Thu hồi",
      status: !rpcAvailable
        ? "UNAVAILABLE"
        : isRevoked || isSuperseded || isExpired
          ? "FAIL"
          : "PASS",
      detail: !rpcAvailable
        ? "Chưa thể kiểm tra trạng thái thu hồi do thiếu kết nối RPC"
        : isRevoked
          ? `Đã thu hồi: ${matchedCredential?.revokedReason ?? "Theo quyết định của đơn vị cấp"}`
          : isSuperseded
            ? "Chứng chỉ này đã được thay thế bởi một bản cấp lại mới hơn"
            : isExpired
              ? `Chứng chỉ đã hết hạn vào ${pkg.payload.expiresAt}`
              : "Chứng chỉ đang có hiệu lực, chưa bị thu hồi",
    },
  ];

  if (pdfCheckNeeded) {
    checks.push({
      key: "pdf_sha256",
      label: "Toàn vẹn file PDF (SHA-256)",
      status: pdfPasses ? "PASS" : "FAIL",
      detail: pdfPasses
        ? `Khớp mã băm PDF gốc (${pkg.payload.pdfSha256.slice(0, 18)}...)`
        : "Mã băm SHA-256 của file PDF tải lên không khớp với bản gốc trong chứng chỉ",
    });
  }

  let result: VerifyResult = "VALID";
  if (!schemaPasses || !trustedChain || !issuerPasses || !digestMatchesLeaf || !merkleProofPasses || !pdfPasses) {
    result = "INVALID";
  } else if (!rpcAvailable || (matchedBatch && matchedBatch.status !== "CONFIRMED")) {
    result = "INDETERMINATE";
  } else if (!batchConfirmedOnChain) {
    result = "INVALID";
  } else if (isRevoked) {
    result = "REVOKED";
  } else if (isSuperseded) {
    result = "SUPERSEDED";
  } else if (isExpired) {
    result = "EXPIRED";
  }

  return {
    result,
    credential: matchedCredential,
    inspectedPackage: pkg,
    checks,
    verifiedAt,
  };
};

export const verifyCredential = (
  state: AppState,
  code: string,
  options: VerifyOptions = {},
): VerificationReport => {
  const cleanCode = code.trim();
  const credential = state.credentials.find(
    (item) =>
      item.code.toLowerCase() === cleanCode.toLowerCase() ||
      item.id.toLowerCase() === cleanCode.toLowerCase(),
  );
  if (!credential) {
    return {
      result: "NOT_FOUND",
      checks: [],
      verifiedAt: formatTimestamp(),
    };
  }
  const pkg = buildCredentialPackage(state, credential.id);
  if (!pkg) {
    return {
      result: "NOT_FOUND",
      checks: [],
      verifiedAt: formatTimestamp(),
    };
  }
  return verifyCredentialPackage(state, pkg, options);
};

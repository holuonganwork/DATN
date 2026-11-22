import { TRUSTED_CHAINS } from "./constants";
import { buildCredentialPackage } from "./credentials";
import {
  computeLeafHash,
  computePayloadDigest,
  isValidEvmAddress,
  isValidHexDigest,
  normalizeAddress,
} from "./crypto";
import { formatTimestamp } from "./helpers";
import { verifyMerkleProof } from "./merkle";
import type {
  AppState,
  CredentialPackage,
  VerificationCheck,
  VerificationReport,
  VerifyOptions,
  VerifyResult,
} from "./types";

// UC-09: Independent Verification of a Credential Package or Code
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

  const recomputedDigest = schemaPasses ? computePayloadDigest(pkg.payload) : "0x0";
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
        ? `JCS + SHA-256 khớp (${recomputedDigest.slice(0, 18)}...)`
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
          ? `${
              matchedBatch?.blockNumber !== undefined
                ? `Đã xác nhận tại block #${matchedBatch.blockNumber}`
                : "Đã xác nhận trên hợp đồng thông minh"
            } · Receipt ${matchedBatch?.txHash?.slice(0, 14) ?? "0x"}...`
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
  if (
    !schemaPasses ||
    !trustedChain ||
    !issuerPasses ||
    !digestMatchesLeaf ||
    !merkleProofPasses ||
    !pdfPasses
  ) {
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
  if (!cleanCode) {
    return {
      result: "NOT_FOUND",
      checks: [],
      verifiedAt: formatTimestamp(),
    };
  }
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

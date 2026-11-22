import type {
  BatchStatus,
  ConsolePage,
  CredentialStatus,
  OrganizationStatus,
  PublicPage,
  TrustedChain,
  UserRole,
  VerifyResult,
} from "./types";

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

export const publicPageLabels: Record<PublicPage, string> = {
  home: "Trang chủ",
  verifier: "Xác thực Chứng chỉ",
  directory: "Danh bạ Đơn vị Đào tạo",
  standards: "Chuẩn Kỹ thuật & Mật mã",
};

export const consolePageLabels: Record<ConsolePage, string> = {
  overview: "Tổng quan Đơn vị",
  batches: "Lô phát hành (Batches)",
  credentials: "Sổ Chứng chỉ (Credentials)",
  catalog: "Khóa học & Học viên",
  admin: "Tổ chức & Ví EVM (Admin)",
  events: "Nhật ký Kiểm toán (Audit Trail)",
};

export const batchStatusLabels: Record<BatchStatus, string> = {
  DRAFT: "Bản nháp",
  VALIDATED: "Đã kiểm tra",
  APPROVED: "Đã duyệt",
  FROZEN: "Đã đóng băng",
  PENDING_CHAIN: "Chờ xác nhận chuỗi",
  CONFIRMED: "Đã neo On-chain",
  FAILED: "Lỗi giao dịch",
};

export const credentialStatusLabels: Record<CredentialStatus, string> = {
  PREPARED: "Đã đóng băng chờ ký",
  ISSUED: "Đang hiệu lực",
  REVOKED: "Đã thu hồi",
  SUPERSEDED: "Đã thay thế (Cấp lại)",
};

export const organizationStatusLabels: Record<OrganizationStatus, string> = {
  PENDING: "Chờ thẩm định",
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm ngưng",
  REVOKED: "Thu hồi quyền",
};

export const roleLabels: Record<UserRole, string> = {
  SYSTEM_ADMIN: "Quản trị Hệ thống",
  ISSUER_OPERATOR: "Chuyên viên Phát hành",
  ISSUER_APPROVER: "Người Duyệt & Ký số",
  AUDITOR: "Kiểm toán viên",
};

export const roleDescriptions: Record<UserRole, string> = {
  ISSUER_OPERATOR:
    "Quản lý danh mục khóa học, hồ sơ học viên, khởi tạo lô chứng chỉ và chạy kiểm tra tính hợp lệ dữ liệu (UC-02, UC-03).",
  ISSUER_APPROVER:
    "Phê duyệt lô phát hành, đóng băng cây Merkle, ký số bằng ví EVM của đơn vị, thu hồi và cấp lại chứng chỉ (UC-04 → UC-08).",
  SYSTEM_ADMIN:
    "Đăng ký tổ chức đào tạo mới, phê duyệt trạng thái hoạt động và cấp phép địa chỉ ví EVM phát hành trên hợp đồng thông minh (UC-01).",
  AUDITOR:
    "Giám sát độc lập toàn bộ lịch sử sự kiện, đối chiếu giao dịch neo lô và trạng thái thu hồi trên chuỗi.",
};

export const verifyMeta: Record<
  VerifyResult,
  { badge: string; title: string; summary: string; tone: "valid" | "danger" | "warn" }
> = {
  VALID: {
    badge: "HỢP LỆ (VALID)",
    title: "Chứng chỉ toàn vẹn, hợp lệ và đang có hiệu lực",
    summary:
      "Dữ liệu chuẩn hóa JCS, bằng chứng nhánh Merkle, chữ ký ví đơn vị đào tạo và trạng thái trên hợp đồng thông minh đều trùng khớp tuyệt đối.",
    tone: "valid",
  },
  INVALID: {
    badge: "SAI BẰNG CHỨNG (INVALID)",
    title: "Dữ liệu chứng chỉ, nhánh Merkle hoặc nguồn phát hành không hợp lệ",
    summary:
      "Nội dung trong gói chứng chỉ hoặc file PDF đã bị chỉnh sửa, hoặc nhánh chứng minh Merkle không dẫn tới gốc lô đã neo trên blockchain.",
    tone: "danger",
  },
  REVOKED: {
    badge: "ĐÃ THU HỒI (REVOKED)",
    title: "Chứng chỉ đã bị đơn vị đào tạo thu hồi trên chuỗi",
    summary:
      "Bằng chứng phát hành gốc tồn tại nhưng chứng chỉ này đã bị thu hồi chính thức trên hợp đồng thông minh và không còn giá trị sử dụng.",
    tone: "danger",
  },
  SUPERSEDED: {
    badge: "ĐÃ THAY THẾ (SUPERSEDED)",
    title: "Chứng chỉ đã được thay thế bởi bản cấp lại mới hơn",
    summary:
      "Chứng chỉ gốc này đã được đơn vị đào tạo cấp lại bằng một mã chứng chỉ mới hơn trên sổ đăng ký.",
    tone: "warn",
  },
  EXPIRED: {
    badge: "ĐÃ HẾT HẠN (EXPIRED)",
    title: "Chứng chỉ đã quá thời hạn hiệu lực ghi nhận",
    summary:
      "Bằng chứng mật mã hợp lệ nhưng chứng chỉ đã vượt quá ngày hết hạn (expiresAt) do đơn vị đào tạo quy định.",
    tone: "warn",
  },
  INDETERMINATE: {
    badge: "CHƯA XÁC ĐỊNH (INDETERMINATE)",
    title: "Giao dịch neo lô đang chờ xác nhận khối hoặc thiếu kết nối RPC",
    summary:
      "Lô chứng chỉ đang ở trạng thái chờ xác nhận (PENDING_CHAIN) hoặc chưa thể truy vấn trạng thái hợp đồng thông minh.",
    tone: "warn",
  },
  NOT_FOUND: {
    badge: "KHÔNG TÌM THẤY (NOT FOUND)",
    title: "Không tìm thấy chứng chỉ hoặc lô phát hành trên sổ đăng ký",
    summary:
      "Mã chứng chỉ hoặc mã lô phát hành chưa được neo lên hợp đồng thông minh hoặc không tồn tại trong hệ thống.",
    tone: "danger",
  },
};

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  addEntryToBatch,
  approveBatch,
  authorizeOrganizationWallet,
  BATCH_PIPELINE_STEPS,
  buildCredentialPackage,
  buildPublishIntent,
  computeDigestHex,
  confirmBatchPublish,
  createBatch,
  createCourse,
  createLearner,
  freezeBatch,
  registerOrganization,
  reissueCredential,
  removeBatchEntry,
  revokeCredential,
  submitPublishTransaction,
  TRUSTED_CHAINS,
  updateOrganizationStatus,
  validateBatch,
  verifyCredential,
  verifyCredentialPackage,
  type AppState,
  type BatchEntry,
  type BatchStatus,
  type Credential,
  type CredentialPackage,
  type CredentialStatus,
  type OrganizationStatus,
  type PublishIntent,
  type UserRole,
  type VerificationReport,
  type VerifyResult,
} from "./domain";
import {
  computeFileSha256Hex,
  downloadCredentialPackageJson,
  loadWorkspaceState,
  resetWorkspaceState,
  saveWorkspaceState,
} from "./storage";

type SurfaceMode = "public" | "auth-gate" | "console";
type PublicPage = "home" | "verifier" | "directory" | "standards";
type ConsolePage = "overview" | "batches" | "credentials" | "catalog" | "admin" | "events";
type VerifierMode = "lookup" | "inspector";
type ThemeMode = "light" | "dark";

interface NoticeBanner {
  tone: "success" | "warning" | "danger";
  message: string;
}

const THEME_STORAGE_KEY = "certchain.ui.theme.v1";

const publicPageLabels: Record<PublicPage, string> = {
  home: "Trang chủ",
  verifier: "Xác thực Chứng chỉ",
  directory: "Danh bạ Đơn vị Đào tạo",
  standards: "Chuẩn Kỹ thuật & Mật mã",
};

const consolePageLabels: Record<ConsolePage, string> = {
  overview: "Tổng quan Đơn vị",
  batches: "Lô phát hành (Batches)",
  credentials: "Sổ Chứng chỉ (Credentials)",
  catalog: "Khóa học & Học viên",
  admin: "Tổ chức & Ví EVM (Admin)",
  events: "Nhật ký Kiểm toán (Audit Trail)",
};

const batchStatusLabels: Record<BatchStatus, string> = {
  DRAFT: "Bản nháp",
  VALIDATED: "Đã kiểm tra",
  APPROVED: "Đã duyệt",
  FROZEN: "Đã đóng băng",
  PENDING_CHAIN: "Chờ xác nhận chuỗi",
  CONFIRMED: "Đã neo On-chain",
  FAILED: "Lỗi giao dịch",
};

const credentialStatusLabels: Record<CredentialStatus, string> = {
  PREPARED: "Đã đóng băng chờ ký",
  ISSUED: "Đang hiệu lực",
  REVOKED: "Đã thu hồi",
  SUPERSEDED: "Đã thay thế (Cấp lại)",
};

const organizationStatusLabels: Record<OrganizationStatus, string> = {
  PENDING: "Chờ thẩm định",
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm ngưng",
  REVOKED: "Thu hồi quyền",
};

const roleLabels: Record<UserRole, string> = {
  SYSTEM_ADMIN: "Quản trị Hệ thống",
  ISSUER_OPERATOR: "Chuyên viên Phát hành",
  ISSUER_APPROVER: "Người Duyệt & Ký số",
  AUDITOR: "Kiểm toán viên",
};

const roleDescriptions: Record<UserRole, string> = {
  ISSUER_OPERATOR:
    "Quản lý danh mục khóa học, hồ sơ học viên, khởi tạo lô chứng chỉ và chạy kiểm tra tính hợp lệ dữ liệu (UC-02, UC-03).",
  ISSUER_APPROVER:
    "Phê duyệt lô phát hành, đóng băng cây Merkle, ký số bằng ví EVM của đơn vị, thu hồi và cấp lại chứng chỉ (UC-04 → UC-08).",
  SYSTEM_ADMIN:
    "Đăng ký tổ chức đào tạo mới, phê duyệt trạng thái hoạt động và cấp phép địa chỉ ví EVM phát hành trên hợp đồng thông minh (UC-01).",
  AUDITOR:
    "Giám sát độc lập toàn bộ lịch sử sự kiện, đối chiếu giao dịch neo lô và trạng thái thu hồi trên chuỗi.",
};

const verifyMeta: Record<
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
    title: "Không tìm thấy chứng chỉ hoặc lô phát hành trên sổ đăng ký On-chain",
    summary:
      "Mã chứng chỉ hoặc mã lô phát hành chưa được neo lên hợp đồng thông minh hoặc không tồn tại trong hệ thống.",
    tone: "danger",
  },
};

function shortHash(value?: string | null, head = 10, tail = 8): string {
  if (!value) return "—";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}

function loadInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    return "light";
  }
  return "light";
}

export function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <span className="brand-logo-frame" style={{ width: size, height: size }}>
      <img
        src="/logo.png"
        alt="CertChain Logo"
        width={size}
        height={size}
        className="brand-logo-img"
      />
    </span>
  );
}

export function App() {
  const [state, setState] = useState<AppState>(() => loadWorkspaceState());
  const [theme, setTheme] = useState<ThemeMode>(() => loadInitialTheme());

  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("public");
  const [publicPage, setPublicPage] = useState<PublicPage>("home");
  const [consolePage, setConsolePage] = useState<ConsolePage>("overview");

  const [role, setRole] = useState<UserRole>("ISSUER_APPROVER");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("org_bkhn_01");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("batch_2026_q4_01");
  const [notice, setNotice] = useState<NoticeBanner | null>(null);
  const [headerQuickCode, setHeaderQuickCode] = useState<string>("");

  // Verifier state
  const [verifierMode, setVerifierMode] = useState<VerifierMode>("lookup");
  const [lookupCode, setLookupCode] = useState<string>("CERT-7K4P-001");
  const [activePackage, setActivePackage] = useState<CredentialPackage | null>(() =>
    buildCredentialPackage(loadWorkspaceState(), "cred_1"),
  );
  const [inspectorJsonText, setInspectorJsonText] = useState<string>("");
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileHash, setUploadedFileHash] = useState<string | undefined>(undefined);

  // Modals state
  const [detailCredentialId, setDetailCredentialId] = useState<string | null>(null);
  const [publishIntentModal, setPublishIntentModal] = useState<PublishIntent | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Credential | null>(null);
  const [revokeReasonText, setRevokeReasonText] = useState<string>(
    "Phát hiện sai sót thông tin hồ sơ gốc sau kiểm tra hậu kiểm học vụ",
  );
  const [reissueTarget, setReissueTarget] = useState<Credential | null>(null);
  const [reissueName, setReissueName] = useState<string>("");
  const [reissueResultText, setReissueResultText] = useState<string>("95/100 (Xuất sắc)");
  const [reissueExpiresAt, setReissueExpiresAt] = useState<string>("2029-11-14");
  const [reissueReason, setReissueReason] = useState<string>(
    "Cấp lại chứng chỉ do điều chỉnh chuẩn hóa thông tin học viên",
  );

  useEffect(() => {
    saveWorkspaceState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      if (error instanceof Error) {
        return;
      }
    }
  }, [theme]);

  const primaryChain = TRUSTED_CHAINS[0];

  const selectedOrg = useMemo(
    () => state.organizations.find((item) => item.id === selectedOrgId) ?? state.organizations[0],
    [state.organizations, selectedOrgId],
  );

  const activeOrgWallet = useMemo(
    () =>
      state.wallets.find(
        (wallet) => wallet.organizationId === selectedOrg?.id && wallet.status === "AUTHORIZED",
      ),
    [state.wallets, selectedOrg],
  );

  const orgCourses = useMemo(
    () => state.courses.filter((item) => item.organizationId === selectedOrg?.id),
    [state.courses, selectedOrg],
  );

  const orgLearners = useMemo(
    () => state.learners.filter((item) => item.organizationId === selectedOrg?.id),
    [state.learners, selectedOrg],
  );

  const orgBatches = useMemo(
    () => state.batches.filter((item) => item.organizationId === selectedOrg?.id),
    [state.batches, selectedOrg],
  );

  const selectedBatch = useMemo(
    () =>
      orgBatches.find((item) => item.id === selectedBatchId) ??
      orgBatches[0] ??
      state.batches[0],
    [orgBatches, selectedBatchId, state.batches],
  );

  const selectedBatchEntries = useMemo(
    () => selectedBatch?.entries ?? [],
    [selectedBatch],
  );

  const orgCredentials = useMemo(
    () => state.credentials.filter((item) => item.organizationId === selectedOrg?.id),
    [state.credentials, selectedOrg],
  );

  const detailCredential = useMemo(
    () => state.credentials.find((item) => item.id === detailCredentialId) ?? null,
    [state.credentials, detailCredentialId],
  );

  const verificationReport: VerificationReport = useMemo(() => {
    if (activePackage) {
      return verifyCredentialPackage(state, activePackage, {
        uploadedPdfSha256: uploadedFileHash,
      });
    }
    return verifyCredential(state, lookupCode, { uploadedPdfSha256: uploadedFileHash });
  }, [state, activePackage, lookupCode, uploadedFileHash]);

  function showNotice(tone: NoticeBanner["tone"], message: string) {
    setNotice({ tone, message });
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  function getOrganizationName(orgId: string): string {
    return (
      state.organizations.find((o) => o.id === orgId)?.displayName ??
      state.organizations[0]?.displayName ??
      orgId
    );
  }

  function selectCredentialForVerify(credential: Credential) {
    const pkg = buildCredentialPackage(state, credential.id);
    setLookupCode(credential.code);
    setActivePackage(pkg);
    setInspectorJsonText(pkg ? JSON.stringify(pkg, null, 2) : "");
    setJsonParseError(null);
    setUploadedFileName(null);
    setUploadedFileHash(undefined);
    setSurfaceMode("public");
    setPublicPage("verifier");
  }

  function handleCodeSearch(codeInput: string) {
    const normalized = codeInput.trim().toUpperCase();
    setLookupCode(normalized);
    const found = state.credentials.find(
      (item) => item.code.toUpperCase() === normalized || item.id.toUpperCase() === normalized,
    );
    if (found) {
      const pkg = buildCredentialPackage(state, found.id);
      setActivePackage(pkg);
      setInspectorJsonText(pkg ? JSON.stringify(pkg, null, 2) : "");
    } else {
      setActivePackage(null);
      setInspectorJsonText("");
    }
    setJsonParseError(null);
    setUploadedFileName(null);
    setUploadedFileHash(undefined);
  }

  function handleHeaderQuickSubmit(event: FormEvent) {
    event.preventDefault();
    if (!headerQuickCode.trim()) return;
    handleCodeSearch(headerQuickCode);
    setSurfaceMode("public");
    setPublicPage("verifier");
    setHeaderQuickCode("");
  }

  function handleResetWorkspace() {
    const fresh = resetWorkspaceState();
    setState(fresh);
    const defaultPkg = buildCredentialPackage(fresh, "cred_1");
    setLookupCode("CERT-7K4P-001");
    setActivePackage(defaultPkg);
    setInspectorJsonText(defaultPkg ? JSON.stringify(defaultPkg, null, 2) : "");
    setUploadedFileName(null);
    setUploadedFileHash(undefined);
    showNotice("success", "Đã khôi phục dữ liệu mẫu ban đầu của hệ thống.");
  }

  function handleEnterConsoleWithRole(nextRole: UserRole, nextOrgId?: string) {
    setRole(nextRole);
    if (nextOrgId) {
      setSelectedOrgId(nextOrgId);
    }
    setConsolePage(nextRole === "SYSTEM_ADMIN" ? "admin" : "overview");
    setSurfaceMode("console");
    showNotice("success", `Đã đăng nhập Cổng Quản lý với vai trò: ${roleLabels[nextRole]}.`);
  }

  function handleOpenPublishModal(batchId: string) {
    const res = buildPublishIntent(state, batchId);
    if (!res.intent) {
      showNotice("danger", res.error ?? "Không thể khởi tạo yêu cầu ký giao dịch.");
      return;
    }
    setPublishIntentModal(res.intent);
  }

  function handleSignAndSubmitIntent() {
    if (!publishIntentModal) return;
    const res = submitPublishTransaction(state, publishIntentModal.batchId);
    if (res.error) {
      showNotice("danger", res.error);
      return;
    }
    setState(res.state);
    setPublishIntentModal(null);

    const confirmRes = confirmBatchPublish(res.state, {
      batchId: publishIntentModal.batchId,
    });
    if (!confirmRes.error) {
      setState(confirmRes.state);
      showNotice(
        "success",
        "Đã ký giao dịch ví EVM, neo Merkle Root lên hợp đồng thông minh và phát hành chứng chỉ thành công.",
      );
    } else {
      showNotice("warning", "Đã gửi giao dịch lên mạng EVM (đang chờ xác nhận khối).");
    }
  }

  function handleConfirmRevoke(event: FormEvent) {
    event.preventDefault();
    if (!revokeTarget) return;
    const nextState = revokeCredential(state, revokeTarget.id, revokeReasonText);
    setState(nextState);
    const updatedPkg = buildCredentialPackage(nextState, revokeTarget.id);
    if (activePackage?.payload.credentialId === revokeTarget.batchEntryId) {
      setActivePackage(updatedPkg);
      setInspectorJsonText(updatedPkg ? JSON.stringify(updatedPkg, null, 2) : "");
    }
    setRevokeTarget(null);
    showNotice("warning", `Đã thu hồi chứng chỉ ${revokeTarget.code} trên sổ đăng ký On-chain.`);
  }

  function openReissueModal(credential: Credential) {
    setReissueTarget(credential);
    setReissueName(credential.holder);
    setReissueResultText(credential.score);
    setReissueExpiresAt(credential.expiresAt ? credential.expiresAt.slice(0, 10) : "2029-11-14");
    setReissueReason("Điều chỉnh thông tin chuẩn hóa học viên và cấp lại chứng chỉ mới");
  }

  function handleConfirmReissue(event: FormEvent) {
    event.preventDefault();
    if (!reissueTarget) return;
    const res = reissueCredential(state, {
      credentialId: reissueTarget.id,
      holderName: reissueName,
      result: reissueResultText,
      expiresAt: reissueExpiresAt ? `${reissueExpiresAt}T00:00:00Z` : null,
      reason: reissueReason,
    });
    if (res.error || !res.newCredential) {
      showNotice("danger", res.error ?? "Cấp lại chứng chỉ thất bại.");
      return;
    }
    setState(res.state);
    const newPkg = buildCredentialPackage(res.state, res.newCredential.id);
    setLookupCode(res.newCredential.code);
    setActivePackage(newPkg);
    setInspectorJsonText(newPkg ? JSON.stringify(newPkg, null, 2) : "");
    setReissueTarget(null);
    showNotice(
      "success",
      `Đã cấp lại chứng chỉ mới ${res.newCredential.code} (thay thế cho ${reissueTarget.code}).`,
    );
  }

  return (
    <div className="site-root">
      {/* =====================================================================
          MODE 1: PUBLIC WEBSITE (STANDARD HEADER + 4 NAVBAR LINKS + FOOTER)
         ===================================================================== */}
      {surfaceMode === "public" && (
        <>
          <div className="system-bar">
            <div className="site-container system-bar-inner">
              <div className="system-bar-left">
                <span className="live-indicator">
                  <span className="live-dot" />
                  EVM RPC CONNECTED
                </span>
                <span className="system-divider" />
                <span className="mono-meta">{primaryChain.name}</span>
                <span className="system-divider" />
                <span className="mono-meta">
                  Registry: <code>{shortHash(primaryChain.registryAddress, 10, 6)}</code>
                </span>
              </div>

              <div className="system-bar-right">
                <span className="mono-meta">Chuẩn giao thức: JCS RFC 8785 · SHA-256 Merkle</span>
                <button
                  type="button"
                  className="system-reset-btn"
                  onClick={handleResetWorkspace}
                  title="Khôi phục dữ liệu mẫu"
                >
                  Khôi phục dữ liệu mẫu
                </button>
              </div>
            </div>
          </div>

          <header className="site-header">
            <div className="site-container site-header-inner">
              <div className="header-brand-group">
                <button
                  type="button"
                  className="brand-home-link"
                  onClick={() => setPublicPage("home")}
                >
                  <BrandLogo size={38} />
                  <div className="brand-title-box">
                    <div className="brand-title-row">
                      <span className="brand-name">CertChain</span>
                    </div>
                  </div>
                </button>
              </div>

              <nav className="site-nav" aria-label="Điều hướng Website Công khai">
                <button
                  type="button"
                  className={publicPage === "home" ? "nav-item active" : "nav-item"}
                  onClick={() => setPublicPage("home")}
                >
                  Trang chủ
                </button>
                <button
                  type="button"
                  className={publicPage === "verifier" ? "nav-item active" : "nav-item"}
                  onClick={() => setPublicPage("verifier")}
                >
                  Xác thực Chứng chỉ
                </button>
                <button
                  type="button"
                  className={publicPage === "directory" ? "nav-item active" : "nav-item"}
                  onClick={() => setPublicPage("directory")}
                >
                  Danh bạ Đơn vị Đào tạo
                  <span className="nav-counter">
                    {state.organizations.filter((o) => o.status === "ACTIVE").length}
                  </span>
                </button>
                <button
                  type="button"
                  className={publicPage === "standards" ? "nav-item active" : "nav-item"}
                  onClick={() => setPublicPage("standards")}
                >
                  Chuẩn Kỹ thuật & Mật mã
                </button>
              </nav>

              <div className="header-actions">
                <form className="header-search-form" onSubmit={handleHeaderQuickSubmit}>
                  <input
                    type="text"
                    className="header-search-input"
                    value={headerQuickCode}
                    onChange={(event) => setHeaderQuickCode(event.target.value)}
                    placeholder="Tra nhanh mã CERT-..."
                    aria-label="Tra nhanh mã chứng chỉ"
                  />
                  <button type="submit" className="header-search-btn">
                    Tra cứu
                  </button>
                </form>

                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  title={
                    theme === "light"
                      ? "Chuyển sang giao diện Tối"
                      : "Chuyển sang giao diện Sáng"
                  }
                >
                  {theme === "light" ? "◐ Tối" : "☀ Sáng"}
                </button>

                <button
                  type="button"
                  className="btn-primary header-portal-cta"
                  onClick={() => setSurfaceMode("auth-gate")}
                >
                  Cổng Quản lý / Đăng nhập →
                </button>
              </div>
            </div>
          </header>

          <div className="breadcrumb-bar">
            <div className="site-container breadcrumb-inner">
              <div className="breadcrumb-trail">
                <button
                  type="button"
                  className="breadcrumb-link"
                  onClick={() => setPublicPage("home")}
                >
                  Website Công khai
                </button>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{publicPageLabels[publicPage]}</span>
              </div>

              <div className="breadcrumb-meta">
                <span>
                  Trạng thái mạng:{" "}
                  <strong>
                    {state.credentials.filter((c) => c.status === "ISSUED").length} chứng chỉ hiệu
                    lực
                  </strong>
                </span>
                <span className="system-divider" />
                <span>
                  Lô đã neo:{" "}
                  <strong>
                    {state.batches.filter((b) => b.status === "CONFIRMED").length} lô Merkle
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {notice && (
            <div className="site-container notice-container">
              <div className={`notice-banner tone-${notice.tone}`}>
                <div className="notice-content">
                  <span className="notice-badge">
                    {notice.tone === "success"
                      ? "THÀNH CÔNG"
                      : notice.tone === "warning"
                        ? "CHÚ Ý"
                        : "LỖI NGHIỆP VỤ"}
                  </span>
                  <span>{notice.message}</span>
                </div>
                <button
                  type="button"
                  className="notice-dismiss"
                  onClick={() => setNotice(null)}
                >
                  Đóng ✕
                </button>
              </div>
            </div>
          )}

          <main className="site-main">
            <div className="site-container">
              {publicPage === "home" && (
                <PublicHomeView
                  state={state}
                  lookupCode={lookupCode}
                  onLookupCodeChange={setLookupCode}
                  onQuickVerify={(code) => {
                    handleCodeSearch(code);
                    setPublicPage("verifier");
                  }}
                  onSelectCredential={selectCredentialForVerify}
                  onOpenDetail={(credId) => setDetailCredentialId(credId)}
                  onNavigatePublic={setPublicPage}
                  onOpenAuthGate={() => setSurfaceMode("auth-gate")}
                />
              )}

              {publicPage === "verifier" && (
                <PublicVerifierView
                  state={state}
                  verifierMode={verifierMode}
                  onVerifierModeChange={setVerifierMode}
                  lookupCode={lookupCode}
                  onLookupCodeChange={setLookupCode}
                  onRunCodeSearch={handleCodeSearch}
                  activePackage={activePackage}
                  inspectorJsonText={inspectorJsonText}
                  jsonParseError={jsonParseError}
                  uploadedFileName={uploadedFileName}
                  uploadedFileHash={uploadedFileHash}
                  verificationReport={verificationReport}
                  onSelectCredential={selectCredentialForVerify}
                  onOpenDetail={(credId) => setDetailCredentialId(credId)}
                  onInspectorTextChange={(text) => {
                    setInspectorJsonText(text);
                    try {
                      const parsed = JSON.parse(text) as CredentialPackage;
                      if (!parsed || typeof parsed !== "object" || !parsed.payload || !parsed.anchor) {
                        setJsonParseError(
                          "Cấu trúc JSON thiếu trường bắt buộc (payload, anchor, proof).",
                        );
                        return;
                      }
                      setJsonParseError(null);
                      setActivePackage(parsed);
                    } catch {
                      setJsonParseError("Cú pháp JSON không hợp lệ.");
                    }
                  }}
                  onJsonFileUpload={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const content = await file.text();
                    setInspectorJsonText(content);
                    setVerifierMode("inspector");
                    try {
                      const parsed = JSON.parse(content) as CredentialPackage;
                      if (!parsed.payload || !parsed.anchor || !parsed.proof) {
                        setJsonParseError(
                          "File JSON không đúng định dạng gói chứng chỉ (payload, anchor, proof).",
                        );
                        return;
                      }
                      setJsonParseError(null);
                      setActivePackage(parsed);
                      setLookupCode(parsed.payload.credentialId);
                      showNotice("success", `Đã nạp gói chứng chỉ từ file "${file.name}".`);
                    } catch {
                      setJsonParseError("Không thể phân tích cú pháp JSON từ file đã chọn.");
                    }
                  }}
                  onAttachmentFileUpload={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const digest = await computeFileSha256Hex(file);
                    setUploadedFileName(file.name);
                    setUploadedFileHash(digest);
                    showNotice(
                      "success",
                      `Đã tính SHA-256 cho file "${file.name}": ${shortHash(digest, 14, 10)}`,
                    );
                  }}
                  onClearAttachment={() => {
                    setUploadedFileName(null);
                    setUploadedFileHash(undefined);
                  }}
                  onApplySampleMatchFile={() => {
                    if (!activePackage) return;
                    setUploadedFileName(`${activePackage.payload.credentialId}.pdf`);
                    setUploadedFileHash(activePackage.payload.pdfSha256);
                  }}
                  onApplySampleMismatchFile={() => {
                    if (!activePackage) return;
                    setUploadedFileName(`${activePackage.payload.credentialId}-tampered.pdf`);
                    setUploadedFileHash(computeDigestHex("tampered-pdf-binary-content"));
                  }}
                />
              )}

              {publicPage === "directory" && (
                <PublicDirectoryView
                  state={state}
                  onSelectCredential={selectCredentialForVerify}
                  onOpenAuthGateForOrg={(orgId) => {
                    setSelectedOrgId(orgId);
                    setSurfaceMode("auth-gate");
                  }}
                />
              )}

              {publicPage === "standards" && (
                <PublicStandardsView
                  state={state}
                  onLoadSampleToVerifier={(cred) => {
                    selectCredentialForVerify(cred);
                  }}
                />
              )}
            </div>
          </main>

          <footer className="site-footer">
            <div className="site-container">
              <div className="footer-grid">
                <div className="footer-brand-col">
                  <div className="footer-brand-head">
                    <BrandLogo size={34} />
                    <div>
                      <strong className="footer-brand-title">CertChain Registry</strong>
                      <span className="footer-brand-sub">ARCHITECTURAL TRUST INFRASTRUCTURE</span>
                    </div>
                  </div>
                  <p className="footer-desc">
                    Hệ thống phát hành và xác thực chứng chỉ đào tạo tích hợp Blockchain. Dữ liệu
                    cá nhân được bảo vệ ngoài chuỗi (off-chain), chỉ neo mã băm Merkle Root và
                    trạng thái xác thực bất biến lên hợp đồng thông minh EVM.
                  </p>
                  <div className="footer-badges">
                    <span className="footer-pill">RFC 8785 JCS</span>
                    <span className="footer-pill">SHA-256 MERKLE</span>
                    <span className="footer-pill">EIP-155 EVM</span>
                  </div>
                </div>

                <div className="footer-col">
                  <h4 className="footer-heading">Website Công khai</h4>
                  <ul className="footer-links">
                    <li>
                      <button type="button" onClick={() => setPublicPage("home")}>
                        Trang chủ & Tra cứu nhanh
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setPublicPage("verifier")}>
                        Cổng Xác thực Chứng chỉ (UC-09)
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setPublicPage("directory")}>
                        Danh bạ Đơn vị Đào tạo được cấp phép
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setPublicPage("standards")}>
                        Chuẩn Kỹ thuật & Mật mã học
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4 className="footer-heading">Cổng Quản lý Nội bộ</h4>
                  <ul className="footer-links">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setRole("ISSUER_OPERATOR");
                          setSurfaceMode("auth-gate");
                        }}
                      >
                        Dành cho Chuyên viên Phát hành
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setRole("ISSUER_APPROVER");
                          setSurfaceMode("auth-gate");
                        }}
                      >
                        Dành cho Người Duyệt & Ký số EVM
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setRole("SYSTEM_ADMIN");
                          setSurfaceMode("auth-gate");
                        }}
                      >
                        Dành cho Quản trị viên Hệ thống
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4 className="footer-heading">Thông số Mạng & Hợp đồng</h4>
                  <div className="footer-contract-box">
                    <div className="footer-kv">
                      <span>Mạng EVM</span>
                      <strong>{primaryChain.name}</strong>
                    </div>
                    <div className="footer-kv">
                      <span>Chain ID</span>
                      <code>{primaryChain.chainId}</code>
                    </div>
                    <div className="footer-kv">
                      <span>Hợp đồng Registry</span>
                      <code>{shortHash(primaryChain.registryAddress, 10, 8)}</code>
                    </div>
                    <div className="footer-kv">
                      <span>Giao diện</span>
                      <button
                        type="button"
                        className="footer-inline-btn"
                        onClick={toggleTheme}
                      >
                        {theme === "light" ? "Chế độ Sáng" : "Chế độ Tối"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="footer-bottom">
                <span>
                  © 2026 CertChain Registry — Đồ án Tốt nghiệp: Hệ thống phát hành và xác thực
                  chứng chỉ đào tạo tích hợp Blockchain.
                </span>
                <span>Thiết kế theo chuẩn DESIGN.md (Vercel / Geist Architectural)</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* =====================================================================
          MODE 2: ROLE SWITCHER / PORTAL LOGIN GATE
         ===================================================================== */}
      {surfaceMode === "auth-gate" && (
        <RoleSwitcherGateView
          state={state}
          selectedRole={role}
          selectedOrgId={selectedOrgId}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectRole={setRole}
          onSelectOrgId={setSelectedOrgId}
          onContinue={(chosenRole, chosenOrgId) =>
            handleEnterConsoleWithRole(chosenRole, chosenOrgId)
          }
          onBackToPublic={() => setSurfaceMode("public")}
        />
      )}

      {/* =====================================================================
          MODE 3: INTERNAL MANAGEMENT CONSOLE (SIDEBAR APP SHELL)
         ===================================================================== */}
      {surfaceMode === "console" && (
        <div className="console-shell">
          <aside className="app-sidebar" aria-label="Điều hướng Bảng điều khiển Nội bộ">
            <div className="sidebar-brand">
              <button
                type="button"
                className="brand-home-link"
                onClick={() => setConsolePage("overview")}
              >
                <BrandLogo size={36} />
                <div className="brand-title-box">
                  <div className="brand-title-row">
                    <span className="brand-name">CertChain</span>
                    <span className="brand-version-pill">CONSOLE</span>
                  </div>
                  <span className="brand-subtitle">CỔNG QUẢN LÝ & PHÁT HÀNH</span>
                </div>
              </button>
            </div>

            <div className="sidebar-session-card">
              <div className="session-role-row">
                <span className="eyebrow">PHIÊN ĐĂNG NHẬP HIỆN TẠI</span>
                <button
                  type="button"
                  className="session-switch-btn"
                  onClick={() => setSurfaceMode("auth-gate")}
                >
                  Đổi vai trò ⇄
                </button>
              </div>
              <strong className="session-role-name">{roleLabels[role]}</strong>

              <label className="sidebar-org-field">
                <span>Đơn vị Đào tạo làm việc</span>
                <select
                  value={selectedOrg?.id ?? ""}
                  onChange={(event) => {
                    const nextOrgId = event.target.value;
                    setSelectedOrgId(nextOrgId);
                    const firstBatch = state.batches.find((b) => b.organizationId === nextOrgId);
                    if (firstBatch) setSelectedBatchId(firstBatch.id);
                  }}
                >
                  {state.organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.code} — {org.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <div className="session-wallet-strip">
                <span>Ví EVM đơn vị:</span>
                <code>
                  {activeOrgWallet
                    ? shortHash(activeOrgWallet.address, 8, 6)
                    : "Chưa cấp ví active"}
                </code>
              </div>
            </div>

            <nav className="sidebar-nav">
              <div className="sidebar-nav-group">
                <span className="sidebar-group-label">VẬN HÀNH ĐƠN VỊ (ISSUER)</span>
                <button
                  type="button"
                  className={
                    consolePage === "overview" ? "sidebar-link active" : "sidebar-link"
                  }
                  onClick={() => setConsolePage("overview")}
                >
                  <span>Tổng quan Đơn vị</span>
                </button>
                <button
                  type="button"
                  className={
                    consolePage === "batches" ? "sidebar-link active" : "sidebar-link"
                  }
                  onClick={() => setConsolePage("batches")}
                >
                  <span>Lô phát hành (Batches)</span>
                  <span className="nav-counter">{orgBatches.length}</span>
                </button>
                <button
                  type="button"
                  className={
                    consolePage === "credentials" ? "sidebar-link active" : "sidebar-link"
                  }
                  onClick={() => setConsolePage("credentials")}
                >
                  <span>Sổ Chứng chỉ (Credentials)</span>
                  <span className="nav-counter">{orgCredentials.length}</span>
                </button>
                <button
                  type="button"
                  className={
                    consolePage === "catalog" ? "sidebar-link active" : "sidebar-link"
                  }
                  onClick={() => setConsolePage("catalog")}
                >
                  <span>Khóa học & Học viên</span>
                  <span className="nav-counter">
                    {orgCourses.length + orgLearners.length}
                  </span>
                </button>
              </div>

              <div className="sidebar-nav-group">
                <span className="sidebar-group-label">QUẢN TRỊ & KIỂM TOÁN</span>
                <button
                  type="button"
                  className={consolePage === "admin" ? "sidebar-link active" : "sidebar-link"}
                  onClick={() => setConsolePage("admin")}
                >
                  <span>Tổ chức & Ví EVM (Admin)</span>
                  <span className="nav-counter">{state.organizations.length}</span>
                </button>
                <button
                  type="button"
                  className={consolePage === "events" ? "sidebar-link active" : "sidebar-link"}
                  onClick={() => setConsolePage("events")}
                >
                  <span>Nhật ký Kiểm toán (Audit Trail)</span>
                  <span className="nav-counter">{state.events.length}</span>
                </button>
              </div>
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-network-box">
                <span className="live-indicator">
                  <span className="live-dot" />
                  Chain ID 31337 · Localnet
                </span>
                <code>Registry: {shortHash(primaryChain.registryAddress, 8, 6)}</code>
              </div>

              <button
                type="button"
                className="btn-secondary full-width"
                onClick={() => setSurfaceMode("public")}
              >
                ← Về Website Công khai
              </button>
            </div>
          </aside>

          <div className="app-workspace">
            <header className="workspace-topbar">
              <div className="workspace-topbar-left">
                <div className="breadcrumb-trail">
                  <button
                    type="button"
                    className="breadcrumb-link"
                    onClick={() => setConsolePage("overview")}
                  >
                    Cổng Quản lý
                  </button>
                  <span className="breadcrumb-sep">/</span>
                  <span className="breadcrumb-current">{consolePageLabels[consolePage]}</span>
                </div>
                <span className="status-pill tone-info">{selectedOrg?.code}</span>
                <span
                  className={`status-pill ${
                    selectedOrg?.status === "ACTIVE" ? "tone-valid" : "tone-warn"
                  }`}
                >
                  {selectedOrg ? organizationStatusLabels[selectedOrg.status] : "—"}
                </span>
              </div>

              <div className="workspace-topbar-right">
                <form className="header-search-form" onSubmit={handleHeaderQuickSubmit}>
                  <input
                    type="text"
                    className="header-search-input"
                    value={headerQuickCode}
                    onChange={(event) => setHeaderQuickCode(event.target.value)}
                    placeholder="Kiểm tra nhanh mã CERT-..."
                  />
                  <button type="submit" className="header-search-btn">
                    Xác thực ↗
                  </button>
                </form>

                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={handleResetWorkspace}
                >
                  Khôi phục mẫu
                </button>

                <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
                  {theme === "light" ? "◐ Tối" : "☀ Sáng"}
                </button>
              </div>
            </header>

            {notice && (
              <div className="workspace-notice-wrap">
                <div className={`notice-banner tone-${notice.tone}`}>
                  <div className="notice-content">
                    <span className="notice-badge">
                      {notice.tone === "success"
                        ? "THÀNH CÔNG"
                        : notice.tone === "warning"
                          ? "CHÚ Ý"
                          : "LỖI NGHIỆP VỤ"}
                    </span>
                    <span>{notice.message}</span>
                  </div>
                  <button
                    type="button"
                    className="notice-dismiss"
                    onClick={() => setNotice(null)}
                  >
                    Đóng ✕
                  </button>
                </div>
              </div>
            )}

            <main className="workspace-main">
              {consolePage === "overview" && selectedOrg && (
                <ConsoleOverviewView
                  state={state}
                  role={role}
                  selectedOrg={selectedOrg}
                  activeOrgWallet={activeOrgWallet}
                  orgCourses={orgCourses}
                  orgLearners={orgLearners}
                  orgBatches={orgBatches}
                  orgCredentials={orgCredentials}
                  onNavigateConsole={setConsolePage}
                  onSelectBatch={(batchId) => {
                    setSelectedBatchId(batchId);
                    setConsolePage("batches");
                  }}
                  onSelectCredential={selectCredentialForVerify}
                  onOpenDetail={(credId) => setDetailCredentialId(credId)}
                />
              )}

              {(consolePage === "batches" ||
                consolePage === "credentials" ||
                consolePage === "catalog") &&
                selectedOrg && (
                  <IssuerPortal
                    state={state}
                    role={role}
                    subTab={consolePage}
                    onSubTabChange={(next) => setConsolePage(next)}
                    selectedOrg={selectedOrg}
                    orgCourses={orgCourses}
                    orgLearners={orgLearners}
                    orgBatches={orgBatches}
                    selectedBatch={selectedBatch}
                    selectedBatchEntries={selectedBatchEntries}
                    orgCredentials={orgCredentials}
                    onSelectBatch={setSelectedBatchId}
                    onStateChange={setState}
                    onNotify={showNotice}
                    onOpenPublishModal={handleOpenPublishModal}
                    onSelectCredentialForVerify={selectCredentialForVerify}
                    onOpenCredentialDetail={(credId) => setDetailCredentialId(credId)}
                    onOpenRevokeModal={(cred) => setRevokeTarget(cred)}
                    onOpenReissueModal={openReissueModal}
                  />
                )}

              {consolePage === "admin" && (
                <SystemAdminPortal
                  state={state}
                  role={role}
                  onSwitchRole={() => setRole("SYSTEM_ADMIN")}
                  onStateChange={setState}
                  onNotify={showNotice}
                />
              )}

              {consolePage === "events" && <AuditTrailPortal state={state} />}
            </main>
          </div>
        </div>
      )}

      {/* =====================================================================
          SHARED MODALS (CERTIFICATE SHEET, EVM WALLET SIGN, REVOKE, REISSUE)
         ===================================================================== */}
      {detailCredential && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet modal-lg">
            <div className="modal-header">
              <div>
                <span className="eyebrow">PHÔI CHỨNG CHỈ SỐ & MÃ QR XÁC THỰC</span>
                <h3>
                  {detailCredential.code} — {detailCredential.holder}
                </h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setDetailCredentialId(null)}
              >
                Đóng ✕
              </button>
            </div>

            <div className="certificate-sheet">
              <div className="certificate-sheet-head">
                <div className="cert-brand-cluster">
                  <BrandLogo size={46} />
                  <div>
                    <span className="cert-org-label">
                      {getOrganizationName(detailCredential.organizationId)}
                    </span>
                    <h4>CHỨNG CHỈ HOÀN THÀNH KHÓA ĐÀO TẠO</h4>
                  </div>
                </div>
                <span
                  className={`status-pill ${
                    detailCredential.status === "ISSUED"
                      ? "tone-valid"
                      : detailCredential.status === "REVOKED"
                        ? "tone-danger"
                        : "tone-warn"
                  }`}
                >
                  {credentialStatusLabels[detailCredential.status]}
                </span>
              </div>

              <div className="certificate-sheet-body">
                <div className="cert-main-info">
                  <p className="cert-intro">Chứng nhận học viên:</p>
                  <h2 className="cert-learner-name">{detailCredential.holder}</h2>
                  <p className="cert-learner-code">
                    Mã học viên: <strong>{detailCredential.subjectRef}</strong>
                  </p>
                  <p className="cert-course-line">Đã hoàn thành chương trình đào tạo:</p>
                  <h3 className="cert-course-title">{detailCredential.course}</h3>

                  <div className="cert-metrics-row">
                    <div>
                      <span>Mã học phần</span>
                      <strong>{detailCredential.courseCode}</strong>
                    </div>
                    <div>
                      <span>Kết quả đạt được</span>
                      <strong>{detailCredential.score}</strong>
                    </div>
                    <div>
                      <span>Ngày cấp</span>
                      <strong>{formatDateTime(detailCredential.issuedAt)}</strong>
                    </div>
                    <div>
                      <span>Hiệu lực đến</span>
                      <strong>
                        {detailCredential.expiresAt
                          ? formatDateTime(detailCredential.expiresAt)
                          : "Vĩnh viễn"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="cert-qr-box">
                  <div className="qr-matrix" aria-label="Mã QR tra cứu chứng chỉ">
                    {Array.from({ length: 49 }).map((_, idx) => {
                      const charCode =
                        detailCredential.payloadDigest.charCodeAt((idx % 30) + 2) || 48;
                      const filled = (charCode + idx) % 2 === 0 || idx < 8 || idx > 41;
                      return (
                        <span
                          key={idx}
                          className={filled ? "qr-cell filled" : "qr-cell"}
                        />
                      );
                    })}
                  </div>
                  <code>{detailCredential.code}</code>
                  <small>Quét hoặc nhập mã tại Cổng Xác thực</small>
                </div>
              </div>

              <div className="certificate-sheet-foot">
                <div>
                  <span>Payload Digest (JCS SHA-256)</span>
                  <code>{detailCredential.payloadDigest}</code>
                </div>
                <div>
                  <span>Merkle Root On-chain</span>
                  <code>{detailCredential.merkleRoot}</code>
                </div>
                <div>
                  <span>Giao dịch EVM (TxHash)</span>
                  <code>{shortHash(detailCredential.txHash, 14, 10)}</code>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const pkg = buildCredentialPackage(state, detailCredential.id);
                  if (pkg) downloadCredentialPackageJson(detailCredential.code, pkg);
                }}
              >
                Tải gói Chứng chỉ (.json)
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const target = detailCredential;
                  setDetailCredentialId(null);
                  selectCredentialForVerify(target);
                }}
              >
                Đưa sang Cổng Xác thực Công khai →
              </button>
            </div>
          </div>
        </div>
      )}

      {publishIntentModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <div className="modal-header">
              <div>
                <span className="eyebrow">CHỮ KÝ SỐ VÍ ĐƠN VỊ ĐÀO TẠO (UC-05)</span>
                <h3>Xác nhận ký giao dịch neo Merkle Root lên Blockchain</h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setPublishIntentModal(null)}
              >
                Đóng ✕
              </button>
            </div>

            <p className="modal-lead">
              Hệ thống không giữ khóa bí mật (private key) trên máy chủ. Giao dịch dưới đây được
              đóng gói theo chuẩn ABI để người có thẩm quyền ký trực tiếp bằng ví EVM đã ủy quyền.
            </p>

            <div className="kv-list">
              <div className="kv-row">
                <span>Mạng đích (Chain ID)</span>
                <strong>Chain ID {publishIntentModal.chainId}</strong>
              </div>
              <div className="kv-row">
                <span>Hợp đồng thông minh</span>
                <code>{publishIntentModal.registryAddress}</code>
              </div>
              <div className="kv-row">
                <span>Mã lô (batchId)</span>
                <code>{publishIntentModal.batchId}</code>
              </div>
              <div className="kv-row">
                <span>Merkle Root (bytes32)</span>
                <code>{publishIntentModal.merkleRoot}</code>
              </div>
              <div className="kv-row">
                <span>Số lượng chứng chỉ</span>
                <strong>{publishIntentModal.entryCount} chứng chỉ</strong>
              </div>
              <div className="kv-row">
                <span>Ví ký đang kết nối</span>
                <code>{publishIntentModal.walletAddress}</code>
              </div>
              <div className="kv-row">
                <span>Calldata ABI Digest</span>
                <code>{shortHash(publishIntentModal.calldata, 14, 10)}</code>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPublishIntentModal(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSignAndSubmitIntent}
              >
                Ký bằng Ví Đơn vị & Neo On-chain
              </button>
            </div>
          </div>
        </div>
      )}

      {revokeTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-sheet" onSubmit={handleConfirmRevoke}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">THU HỒI CHỨNG CHỈ ON-CHAIN (UC-07)</span>
                <h3>Thu hồi chứng chỉ {revokeTarget.code}</h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setRevokeTarget(null)}
              >
                Đóng ✕
              </button>
            </div>

            <p className="modal-lead">
              Hành động thu hồi sẽ ghi nhận trạng thái <code>REVOKED</code> lên hợp đồng thông minh
              cho học viên <strong>{revokeTarget.holder}</strong>. Mọi lần tra cứu sau thời điểm
              này sẽ trả về cảnh báo đã thu hồi.
            </p>

            <label className="form-field">
              <span>Lý do thu hồi chính thức (bắt buộc)</span>
              <textarea
                rows={3}
                value={revokeReasonText}
                onChange={(event) => setRevokeReasonText(event.target.value)}
                required
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRevokeTarget(null)}
              >
                Giữ nguyên hiệu lực
              </button>
              <button type="submit" className="btn-danger">
                Xác nhận Thu hồi On-chain
              </button>
            </div>
          </form>
        </div>
      )}

      {reissueTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-sheet" onSubmit={handleConfirmReissue}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">CẤP LẠI CHỨNG CHỈ & LIÊN KẾT LỊCH SỬ (UC-08)</span>
                <h3>Cấp lại từ chứng chỉ gốc {reissueTarget.code}</h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setReissueTarget(null)}
              >
                Đóng ✕
              </button>
            </div>

            <p className="modal-lead">
              Dữ liệu đã neo trên blockchain không thể sửa đè. Hệ thống sẽ chuyển chứng chỉ cũ sang
              trạng thái <code>SUPERSEDED</code> và phát hành chứng chỉ mới có trường{" "}
              <code>reissuedFromId</code> trỏ về bản gốc để giữ nguyên chuỗi truy vết.
            </p>

            <div className="form-grid-2">
              <label className="form-field">
                <span>Họ và tên học viên chuẩn hóa</span>
                <input
                  value={reissueName}
                  onChange={(event) => setReissueName(event.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Kết quả / Điểm & Xếp loại</span>
                <input
                  value={reissueResultText}
                  onChange={(event) => setReissueResultText(event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-grid-2">
              <label className="form-field">
                <span>Ngày hết hạn mới</span>
                <input
                  type="date"
                  value={reissueExpiresAt}
                  onChange={(event) => setReissueExpiresAt(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Lý do cấp lại</span>
                <input
                  value={reissueReason}
                  onChange={(event) => setReissueReason(event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setReissueTarget(null)}
              >
                Hủy bỏ
              </button>
              <button type="submit" className="btn-primary">
                Phát hành Chứng chỉ Cấp lại
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   PUBLIC WEBSITE VIEW 1: HOME / LANDING PAGE
   ========================================================================= */

interface PublicHomeViewProps {
  state: AppState;
  lookupCode: string;
  onLookupCodeChange: (code: string) => void;
  onQuickVerify: (code: string) => void;
  onSelectCredential: (cred: Credential) => void;
  onOpenDetail: (credId: string) => void;
  onNavigatePublic: (page: PublicPage) => void;
  onOpenAuthGate: () => void;
}

function PublicHomeView({
  state,
  lookupCode,
  onLookupCodeChange,
  onQuickVerify,
  onSelectCredential,
  onOpenDetail,
  onNavigatePublic,
  onOpenAuthGate,
}: PublicHomeViewProps) {
  const activeOrgsCount = state.organizations.filter((o) => o.status === "ACTIVE").length;
  const confirmedBatchesCount = state.batches.filter((b) => b.status === "CONFIRMED").length;
  const issuedCredsCount = state.credentials.filter((c) => c.status === "ISSUED").length;
  const revokedCredsCount = state.credentials.filter((c) => c.status === "REVOKED").length;

  function handleHeroSubmit(event: FormEvent) {
    event.preventDefault();
    onQuickVerify(lookupCode);
  }

  return (
    <div className="home-view">
      <section className="hero-banner">
        <div className="hero-main-col">
          <div className="hero-badge-row">
            <span className="hero-protocol-pill">VERCEL / GEIST ARCHITECTURAL DESIGN</span>
            <span className="hero-chain-pill">EVM REGISTRY · RFC 8785 JCS</span>
          </div>

          <h1 className="hero-title">
            Xác thực Chứng chỉ Đào tạo tức thì bằng Bằng chứng Mật mã & Blockchain.
          </h1>

          <p className="hero-description">
            Cổng tra cứu công khai cho nhà tuyển dụng và học viên. Toàn bộ hồ sơ được chuẩn hóa{" "}
            <strong>JSON Canonicalization (RFC 8785)</strong>, gom lô bằng cây{" "}
            <strong>Merkle SHA-256</strong> và neo bất biến lên hợp đồng thông minh mà không tiết lộ
            dữ liệu nhạy cảm lên chuỗi công khai.
          </p>

          <form className="hero-verify-bar" onSubmit={handleHeroSubmit}>
            <div className="hero-input-wrap">
              <span className="hero-input-prefix">MÃ CHỨNG CHỈ</span>
              <input
                type="text"
                value={lookupCode}
                onChange={(event) => onLookupCodeChange(event.target.value)}
                placeholder="Nhập mã (VD: CERT-7K4P-001)..."
                aria-label="Mã chứng chỉ cần xác thực"
              />
            </div>
            <button type="submit" className="btn-primary hero-submit-btn">
              Xác thực Ngay →
            </button>
          </form>

          <div className="hero-sample-strip">
            <span>Thử nghiệm nhanh:</span>
            {state.credentials.slice(0, 4).map((cred) => (
              <button
                key={cred.id}
                type="button"
                className="sample-code-chip"
                onClick={() => onQuickVerify(cred.code)}
              >
                <code>{cred.code}</code>
                <span
                  className={`chip-dot ${
                    cred.status === "ISSUED"
                      ? "valid"
                      : cred.status === "REVOKED"
                        ? "danger"
                        : "warn"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="hero-arch-col">
          <div className="arch-monolith-card">
            <div className="arch-card-head">
              <div className="arch-logo-showcase">
                <BrandLogo size={54} />
                <div>
                  <span className="eyebrow">KIẾN TRÚC BẢO CHỨNG 3 LỚP</span>
                  <h3>Cryptographic Anchor</h3>
                </div>
              </div>
              <span className="status-pill tone-valid">VERIFIED ON-CHAIN</span>
            </div>

            <div className="arch-layer-stack">
              <div className="arch-layer-item">
                <span className="layer-index">L1</span>
                <div>
                  <strong>Off-Chain Canonical Payload (JCS RFC 8785)</strong>
                  <p>Bảo vệ thông tin cá nhân ngoài chuỗi, tạo mã băm SHA-256 định danh duy nhất.</p>
                </div>
              </div>
              <div className="arch-layer-item">
                <span className="layer-index">L2</span>
                <div>
                  <strong>Domain-Separated Merkle Tree</strong>
                  <p>
                    Gom hàng nghìn chứng chỉ vào một <code>merkleRoot</code> duy nhất, tiết kiệm
                    99% chi phí gas.
                  </p>
                </div>
              </div>
              <div className="arch-layer-item">
                <span className="layer-index">L3</span>
                <div>
                  <strong>EVM Smart Contract Registry</strong>
                  <p>
                    Kiểm soát ủy quyền ví đơn vị đào tạo, neo gốc Merkle và tra cứu thu hồi thời
                    gian thực.
                  </p>
                </div>
              </div>
            </div>

            <div className="arch-card-foot">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => onNavigatePublic("standards")}
              >
                Xem Đặc tả Kỹ thuật
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={onOpenAuthGate}
              >
                Vào Cổng Quản lý Đơn vị →
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="kpi-grid-4">
        <article className="kpi-card">
          <span className="kpi-label">ĐƠN VỊ ĐÀO TẠO ĐƯỢP CẤP PHÉP</span>
          <strong className="kpi-value">{activeOrgsCount}</strong>
          <span className="kpi-foot">
            Trên tổng số {state.organizations.length} tổ chức đã đăng ký
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">LÔ MERKLE ĐÃ NEO ON-CHAIN</span>
          <strong className="kpi-value">{confirmedBatchesCount}</strong>
          <span className="kpi-foot">Đã xác nhận khối trên hợp đồng thông minh</span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">CHỨNG CHỈ ĐANG HIỆU LỰC</span>
          <strong className="kpi-value">{issuedCredsCount}</strong>
          <span className="kpi-foot">Kèm {revokedCredsCount} chứng chỉ đã thu hồi</span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">SỰ KIỆN KIỂM TOÁN BẤT BIẾN</span>
          <strong className="kpi-value">{state.events.length}</strong>
          <span className="kpi-foot">Ghi nhận xuyên suốt từ UC-01 đến UC-09</span>
        </article>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">QUY TRÌNH XÁC THỰC ĐỘC LẬP</span>
            <h2>Cách Nhà tuyển dụng & Bên thứ ba kiểm tra chứng chỉ trong 3 bước</h2>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => onNavigatePublic("verifier")}
          >
            Mở Cổng Xác thực Đầy đủ →
          </button>
        </div>

        <div className="feature-grid-3">
          <article className="feature-card">
            <div className="feature-card-top">
              <span className="feature-step">BƯỚC 01</span>
              <span className="status-pill tone-info">TRA CỨU MÃ HOẶC FILE JSON</span>
            </div>
            <h3>Nhập mã chứng chỉ hoặc tải gói .json</h3>
            <p>
              Người kiểm tra chỉ cần nhập mã chứng chỉ (ví dụ <code>CERT-7K4P-001</code>) hoặc tải
              lên tệp <code>.json</code> kèm bản <code>.pdf</code> do ứng viên cung cấp.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-step-row">
              <span className="feature-step">BƯỚC 02</span>
              <span className="status-pill tone-info">ĐỐI CHIẾU MẬT MÃ TRÌNH DUYỆT</span>
            </div>
            <h3>Tự động băm JCS & kiểm tra nhánh Merkle</h3>
            <p>
              Trình duyệt tự động chuẩn hóa payload theo RFC 8785, tính lại <code>leaf</code> và
              nhân ngược các nút anh em trong <code>MerkleProof</code> để đối chiếu với{" "}
              <code>merkleRoot</code>.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-card-top">
              <span className="feature-step">BƯỚC 03</span>
              <span className="status-pill tone-valid">XÁC NHẬN ON-CHAIN TỨC THÌ</span>
            </div>
            <h3>Kiểm tra chữ ký ví & trạng thái thu hồi</h3>
            <p>
              Đối chiếu gốc Merkle, địa chỉ ví ký của đơn vị đào tạo tại thời điểm phát hành và
              kiểm tra cờ thu hồi (<code>REVOKED</code> / <code>SUPERSEDED</code>) trực tiếp trên
              EVM Registry.
            </p>
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">SỔ ĐĂNG KÝ CÔNG KHAI GẦN ĐÂY</span>
            <h2>Chứng chỉ Đào tạo mới phát hành trên mạng lưới</h2>
          </div>
          <div className="button-row">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => onNavigatePublic("directory")}
            >
              Xem Danh bạ Đơn vị
            </button>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => onNavigatePublic("verifier")}
            >
              Tra cứu & Kiểm định File
            </button>
          </div>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã chứng chỉ</th>
                <th>Học viên</th>
                <th>Khóa đào tạo</th>
                <th>Đơn vị cấp</th>
                <th>Merkle Root (On-chain)</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {state.credentials.slice(0, 6).map((cred) => {
                const org = state.organizations.find((o) => o.id === cred.organizationId);
                return (
                  <tr key={cred.id}>
                    <td>
                      <code className="code-strong">{cred.code}</code>
                    </td>
                    <td>
                      <strong>{cred.holder}</strong>
                      <div className="cell-sub">{cred.subjectRef}</div>
                    </td>
                    <td>
                      <span>{cred.course}</span>
                      <div className="cell-sub">Kết quả: {cred.score}</div>
                    </td>
                    <td>
                      <span>{org?.code ?? cred.organizationId}</span>
                      <div className="cell-sub">{org?.displayName}</div>
                    </td>
                    <td>
                      <code>{shortHash(cred.merkleRoot, 10, 8)}</code>
                      <div className="cell-sub">Chain ID {cred.chainId}</div>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          cred.status === "ISSUED"
                            ? "tone-valid"
                            : cred.status === "REVOKED"
                              ? "tone-danger"
                              : "tone-warn"
                        }`}
                      >
                        {credentialStatusLabels[cred.status]}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-secondary btn-xs"
                          onClick={() => onSelectCredential(cred)}
                        >
                          Xác thực
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-xs"
                          onClick={() => onOpenDetail(cred.id)}
                        >
                          Xem Phôi & QR
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-xs"
                          onClick={() => {
                            const pkg = buildCredentialPackage(state, cred.id);
                            if (pkg) downloadCredentialPackageJson(cred.code, pkg);
                          }}
                        >
                          Tải .json
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* =========================================================================
   PUBLIC WEBSITE VIEW 2: PUBLIC VERIFIER PORTAL (UC-09)
   ========================================================================= */

interface PublicVerifierViewProps {
  state: AppState;
  verifierMode: VerifierMode;
  onVerifierModeChange: (mode: VerifierMode) => void;
  lookupCode: string;
  onLookupCodeChange: (code: string) => void;
  onRunCodeSearch: (code: string) => void;
  activePackage: CredentialPackage | null;
  inspectorJsonText: string;
  jsonParseError: string | null;
  uploadedFileName: string | null;
  uploadedFileHash: string | undefined;
  verificationReport: VerificationReport;
  onSelectCredential: (credential: Credential) => void;
  onOpenDetail: (credentialId: string) => void;
  onInspectorTextChange: (text: string) => void;
  onJsonFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAttachmentFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearAttachment: () => void;
  onApplySampleMatchFile: () => void;
  onApplySampleMismatchFile: () => void;
}

function PublicVerifierView({
  state,
  verifierMode,
  onVerifierModeChange,
  lookupCode,
  onLookupCodeChange,
  onRunCodeSearch,
  activePackage,
  inspectorJsonText,
  jsonParseError,
  uploadedFileName,
  uploadedFileHash,
  verificationReport,
  onSelectCredential,
  onOpenDetail,
  onInspectorTextChange,
  onJsonFileUpload,
  onAttachmentFileUpload,
  onClearAttachment,
  onApplySampleMatchFile,
  onApplySampleMismatchFile,
}: PublicVerifierViewProps) {
  const verdict = verifyMeta[verificationReport.result];
  const matchedCred = verificationReport.credential;
  const issuerOrg = state.organizations.find((o) => o.id === activePackage?.payload.issuerId);

  function handleSearchForm(event: FormEvent) {
    event.preventDefault();
    onRunCodeSearch(lookupCode);
  }

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">CỔNG XÁC THỰC ĐỘC LẬP (UC-09)</span>
          <h1>Kiểm định Mật mã & Trạng thái Chứng chỉ On-chain</h1>
        </div>
        <div className="segmented-tabs">
          <button
            type="button"
            className={verifierMode === "lookup" ? "seg-btn active" : "seg-btn"}
            onClick={() => onVerifierModeChange("lookup")}
          >
            1. Tra cứu Mã / Tải File
          </button>
          <button
            type="button"
            className={verifierMode === "inspector" ? "seg-btn active" : "seg-btn"}
            onClick={() => {
              if (!inspectorJsonText && activePackage) {
                onInspectorTextChange(JSON.stringify(activePackage, null, 2));
              }
              onVerifierModeChange("inspector");
            }}
          >
            2. Payload & File Inspector
          </button>
        </div>
      </div>

      <div className="verifier-layout">
        <div className="panel-card">
          {verifierMode === "lookup" ? (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">PHƯƠNG THỨC 1: TRA CỨU THEO MÃ ĐỊNH DANH</span>
                  <h2>Nhập mã chứng chỉ trên phôi hoặc mã QR</h2>
                </div>
              </div>

              <form className="search-bar" onSubmit={handleSearchForm}>
                <input
                  value={lookupCode}
                  onChange={(event) => onLookupCodeChange(event.target.value)}
                  placeholder="Nhập mã chứng chỉ (VD: CERT-7K4P-001)..."
                  aria-label="Mã chứng chỉ"
                />
                <button type="submit" className="btn-primary">
                  Xác thực ngay
                </button>
              </form>

              <div className="quick-pick-block">
                <span className="field-caption">Chọn nhanh chứng chỉ mẫu trong sổ đăng ký:</span>
                <div className="credential-pill-list">
                  {state.credentials.map((cred) => (
                    <button
                      key={cred.id}
                      type="button"
                      className={
                        lookupCode.toUpperCase() === cred.code.toUpperCase()
                          ? "cred-chip active"
                          : "cred-chip"
                      }
                      onClick={() => onSelectCredential(cred)}
                    >
                      <div className="cred-chip-top">
                        <code>{cred.code}</code>
                        <span
                          className={`status-dot ${
                            cred.status === "ISSUED"
                              ? "valid"
                              : cred.status === "REVOKED"
                                ? "danger"
                                : "warn"
                          }`}
                        />
                      </div>
                      <strong>{cred.holder}</strong>
                      <small>{credentialStatusLabels[cred.status]}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="divider-line" />

              <div className="upload-grid-2">
                <div className="upload-box">
                  <span className="eyebrow">PHƯƠNG THỨC 2: GÓI CHỨNG CHỈ (.JSON)</span>
                  <h3>Tải file Credential Package</h3>
                  <p>
                    Đối chiếu trực tiếp từ file <code>.json</code> chứa{" "}
                    <code>payload + anchor + proof</code> mà không cần phụ thuộc cơ sở dữ liệu nội
                    bộ.
                  </p>
                  <label className="file-upload-btn">
                    <input type="file" accept=".json,application/json" onChange={onJsonFileUpload} />
                    <span>Chọn file .json từ máy tính</span>
                  </label>
                </div>

                <div className="upload-box">
                  <span className="eyebrow">PHƯƠNG THỨC 3: KIỂM ĐỊNH FILE PDF ĐÍNH KÈM</span>
                  <h3>Đối chiếu mã băm SHA-256 của file PDF</h3>
                  <p>
                    Tính hàm băm SHA-256 trực tiếp trên trình duyệt và so khớp với trường{" "}
                    <code>payload.pdfSha256</code> trong gói chứng chỉ.
                  </p>
                  <div className="button-row">
                    <label className="file-upload-btn">
                      <input type="file" onChange={onAttachmentFileUpload} />
                      <span>Chọn file PDF / Bản in</span>
                    </label>
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={onApplySampleMatchFile}
                    >
                      Mẫu PDF gốc
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={onApplySampleMismatchFile}
                    >
                      Mẫu PDF bị sửa
                    </button>
                  </div>
                  {uploadedFileName && (
                    <div className="uploaded-file-pill">
                      <div>
                        <strong>{uploadedFileName}</strong>
                        <code>SHA-256: {shortHash(uploadedFileHash ?? "", 14, 10)}</code>
                      </div>
                      <button type="button" className="btn-ghost" onClick={onClearAttachment}>
                        Gỡ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">TRÌNH KIỂM TRA DỮ LIỆU & MÔ PHỎNG KIỂM ĐỊNH</span>
                  <h2>Payload & File Inspector (JSON Canonicalization)</h2>
                </div>
                {matchedCred && (
                  <button
                    type="button"
                    className="btn-secondary btn-xs"
                    onClick={() => onSelectCredential(matchedCred)}
                  >
                    Khôi phục gói chuẩn gốc
                  </button>
                )}
              </div>

              <p className="panel-desc">
                Dành cho kiểm toán viên kỹ thuật: Bạn có thể kiểm tra cấu trúc gói{" "}
                <code>CredentialPackage</code> hoặc thử thay đổi bất kỳ ký tự nào trong{" "}
                <code>payload</code> bên dưới để kiểm chứng cơ chế phát hiện giả mạo{" "}
                <code>INVALID</code> của cây Merkle.
              </p>

              <div className="inspector-presets">
                <span>Kịch bản kiểm định nhanh:</span>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={() => {
                    if (!activePackage) return;
                    const clone: CredentialPackage = JSON.parse(JSON.stringify(activePackage));
                    clone.payload.result = "100/100 (Đã chỉnh sửa trái phép)";
                    onInspectorTextChange(JSON.stringify(clone, null, 2));
                  }}
                >
                  Thử sửa điểm số trong JSON
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={() => {
                    if (!activePackage) return;
                    const clone: CredentialPackage = JSON.parse(JSON.stringify(activePackage));
                    clone.anchor.chainId = 99999;
                    onInspectorTextChange(JSON.stringify(clone, null, 2));
                  }}
                >
                  Thử đổi sang Chain ID lạ
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={onApplySampleMismatchFile}
                >
                  Thử đính kèm file PDF sai mã băm
                </button>
              </div>

              <textarea
                className="json-editor"
                rows={16}
                value={inspectorJsonText}
                onChange={(event) => onInspectorTextChange(event.target.value)}
                spellCheck={false}
              />

              {jsonParseError && <div className="inline-error">{jsonParseError}</div>}
            </>
          )}
        </div>

        <div className="panel-card">
          <div className={`verdict-banner tone-${verdict.tone}`}>
            <div className="verdict-top">
              <span className="verdict-badge">{verdict.badge}</span>
              <span className="verdict-code">
                {matchedCred?.code ?? activePackage?.payload.credentialId ?? lookupCode}
              </span>
            </div>
            <h2>{verdict.title}</h2>
            <p>{verdict.summary}</p>

            {matchedCred?.status === "REVOKED" && (
              <div className="lineage-alert danger">
                <strong>Lý do thu hồi ({formatDateTime(matchedCred.revokedAt)}):</strong>{" "}
                {matchedCred.revokedReason}
              </div>
            )}

            {matchedCred?.status === "SUPERSEDED" && matchedCred.reissuedToId && (
              <div className="lineage-alert warn">
                <span>
                  Chứng chỉ này đã được thay thế bởi bản cấp lại mới hơn trên sổ đăng ký.
                </span>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={() => {
                    const replacement = state.credentials.find(
                      (item) => item.id === matchedCred.reissuedToId,
                    );
                    if (replacement) onSelectCredential(replacement);
                  }}
                >
                  Xem bản thay thế mới →
                </button>
              </div>
            )}

            {matchedCred?.reissuedFromId && (
              <div className="lineage-alert info">
                <span>
                  Đây là chứng chỉ cấp lại chính thức (kế thừa lịch sử từ bản gốc{" "}
                  <code>
                    {state.credentials.find((c) => c.id === matchedCred.reissuedFromId)?.code ??
                      matchedCred.reissuedFromId}
                  </code>
                  ).
                </span>
              </div>
            )}
          </div>

          {activePackage && (
            <div className="verified-summary-card">
              <div className="summary-header">
                <div>
                  <span className="eyebrow">THÔNG TIN CHỨNG CHỈ ĐANG KIỂM ĐỊNH</span>
                  <h3>{activePackage.payload.holder}</h3>
                </div>
                <div className="button-row">
                  {matchedCred && (
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={() => onOpenDetail(matchedCred.id)}
                    >
                      Xem Phôi & Mã QR
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary btn-xs"
                    onClick={() =>
                      downloadCredentialPackageJson(
                        matchedCred?.code ?? activePackage.payload.credentialId,
                        activePackage,
                      )
                    }
                  >
                    Tải gói .json
                  </button>
                </div>
              </div>

              <div className="summary-grid-3">
                <div>
                  <span>Khóa đào tạo</span>
                  <strong>{activePackage.payload.courseName}</strong>
                </div>
                <div>
                  <span>Đơn vị cấp</span>
                  <strong>{issuerOrg?.displayName ?? activePackage.payload.issuerId}</strong>
                </div>
                <div>
                  <span>Kết quả & Ngày cấp</span>
                  <strong>
                    {activePackage.payload.result} · {formatDateTime(activePackage.payload.issuedAt)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="steps-section">
            <div className="steps-head">
              <span className="eyebrow">
                BÁO CÁO ĐỐI CHIẾU MẬT MÃ ({verificationReport.checks.length} BƯỚC)
              </span>
              <span>
                Leaf: <code>{shortHash(activePackage?.proof.leaf, 10, 8)}</code>
              </span>
            </div>

            <div className="verify-step-list">
              {verificationReport.checks.map((step, index) => {
                const passed = step.status === "PASS";
                return (
                  <div key={step.key} className={`verify-step-item ${passed ? "pass" : "fail"}`}>
                    <div className="step-num">{index + 1}</div>
                    <div className="step-body">
                      <div className="step-title-row">
                        <strong>{step.label}</strong>
                        <span className={passed ? "step-tag pass" : "step-tag fail"}>
                          {step.status}
                        </span>
                      </div>
                      <p>{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PUBLIC WEBSITE VIEW 3: TRUSTED ISSUERS DIRECTORY
   ========================================================================= */

interface PublicDirectoryViewProps {
  state: AppState;
  onSelectCredential: (cred: Credential) => void;
  onOpenAuthGateForOrg: (orgId: string) => void;
}

function PublicDirectoryView({
  state,
  onSelectCredential,
  onOpenAuthGateForOrg,
}: PublicDirectoryViewProps) {
  const [searchOrg, setSearchOrg] = useState<string>("");

  const filteredOrgs = useMemo(() => {
    return state.organizations.filter((org) => {
      if (!searchOrg.trim()) return true;
      const q = searchOrg.trim().toLowerCase();
      return (
        org.displayName.toLowerCase().includes(q) ||
        org.legalName.toLowerCase().includes(q) ||
        org.code.toLowerCase().includes(q) ||
        org.verificationRef.toLowerCase().includes(q)
      );
    });
  }, [state.organizations, searchOrg]);

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">DANH BẠ ĐƠN VỊ ĐÀO TẠO CÔNG KHAI</span>
          <h1>Các Tổ chức Đào tạo & Địa chỉ Ví EVM trong mạng lưới</h1>
        </div>
        <div className="filter-bar">
          <input
            type="text"
            value={searchOrg}
            onChange={(event) => setSearchOrg(event.target.value)}
            placeholder="Tìm tên trường, mã đơn vị hoặc mã hồ sơ..."
          />
        </div>
      </div>

      <div className="directory-grid">
        {filteredOrgs.map((org) => {
          const activeWallet = state.wallets.find(
            (w) => w.organizationId === org.id && w.status === "AUTHORIZED",
          );
          const orgBatches = state.batches.filter(
            (b) => b.organizationId === org.id && b.status === "CONFIRMED",
          );
          const orgCreds = state.credentials.filter((c) => c.organizationId === org.id);
          const latestCred = orgCreds[0];

          return (
            <article key={org.id} className="panel-card directory-card">
              <div className="directory-card-head">
                <div className="directory-title-group">
                  <span className="code-badge">{org.code}</span>
                  <div>
                    <h2>{org.displayName}</h2>
                    <span className="cell-sub">
                      Pháp nhân: <strong>{org.legalName}</strong> · Hồ sơ: {org.verificationRef}
                    </span>
                  </div>
                </div>
                <span
                  className={`status-pill ${
                    org.status === "ACTIVE"
                      ? "tone-valid"
                      : org.status === "PENDING"
                        ? "tone-warn"
                        : "tone-danger"
                  }`}
                >
                  {organizationStatusLabels[org.status]}
                </span>
              </div>

              <div className="kv-list">
                <div className="kv-row">
                  <span>Địa chỉ Ví EVM đang ủy quyền</span>
                  <code>{activeWallet ? activeWallet.address : "Chưa cấp phép ví AUTHORIZED"}</code>
                </div>
                <div className="kv-row">
                  <span>Mạng Blockchain</span>
                  <strong>Chain ID {activeWallet?.chainId ?? 31337}</strong>
                </div>
                <div className="kv-row">
                  <span>Số lô Merkle đã neo On-chain</span>
                  <strong>{orgBatches.length} lô phát hành</strong>
                </div>
                <div className="kv-row">
                  <span>Tổng số chứng chỉ đã cấp</span>
                  <strong>
                    {orgCreds.filter((c) => c.status === "ISSUED").length} hiệu lực /{" "}
                    {orgCreds.length} tổng số
                  </strong>
                </div>
              </div>

              <div className="directory-card-foot">
                {latestCred ? (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => onSelectCredential(latestCred)}
                  >
                    Kiểm định chứng chỉ mẫu ({latestCred.code})
                  </button>
                ) : (
                  <span className="cell-sub">Đơn vị chưa có chứng chỉ phát hành công khai</span>
                )}
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => onOpenAuthGateForOrg(org.id)}
                >
                  Vào Cổng Quản lý Đơn vị →
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   PUBLIC WEBSITE VIEW 4: CRYPTOGRAPHIC & PROTOCOL STANDARDS
   ========================================================================= */

interface PublicStandardsViewProps {
  state: AppState;
  onLoadSampleToVerifier: (cred: Credential) => void;
}

function PublicStandardsView({ state, onLoadSampleToVerifier }: PublicStandardsViewProps) {
  const sampleCred = state.credentials[0];
  const samplePackage = useMemo(
    () => (sampleCred ? buildCredentialPackage(state, sampleCred.id) : null),
    [state, sampleCred],
  );

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">ĐẶC TẢ GIAO THỨC & MẬT MÃ HỌC</span>
          <h1>Chuẩn Kỹ thuật Xác thực Chứng chỉ Đào tạo trên Blockchain</h1>
        </div>
        {sampleCred && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => onLoadSampleToVerifier(sampleCred)}
          >
            Chạy Kiểm định Gói Mẫu ({sampleCred.code}) →
          </button>
        )}
      </div>

      <div className="feature-grid-3">
        <article className="panel-card">
          <span className="eyebrow">LỚP 1 — CHUẨN HÓA DỮ LIỆU OFF-CHAIN</span>
          <h2>RFC 8785 JSON Canonicalization (JCS)</h2>
          <p className="panel-desc">
            Mọi trường dữ liệu chứng chỉ được chuẩn hóa Unicode NFC, sắp xếp khóa từ điển đệ quy và
            loại bỏ khoảng trắng thừa trước khi băm SHA-256. Đảm bảo cùng một nội dung chứng chỉ
            luôn tạo ra duy nhất một <code>payloadDigest</code> trên mọi nền tảng.
          </p>
          <div className="formula-box">
            <code>payloadDigest = SHA256(JCS_Canonicalize(payload))</code>
          </div>
        </article>

        <article className="panel-card">
          <span className="eyebrow">LỚP 2 — CÂY MERKLE PHÂN TÁCH MIỀN</span>
          <h2>Domain-Separated Merkle Tree</h2>
          <p className="panel-desc">
            Mỗi lá của cây Merkle ràng buộc chặt chẽ với <code>chainId</code>, địa chỉ hợp đồng{" "}
            <code>registryAddress</code>, mã đơn vị <code>issuerId</code> và mã lô{" "}
            <code>batchId</code> nhằm chống tấn công phát lại (replay attack) giữa các mạng.
          </p>
          <div className="formula-box">
            <code>
              leaf = SHA256(&quot;LEAF:&quot; + chainId + &quot;|&quot; + registry + &quot;|&quot; +
              issuerId + &quot;|&quot; + batchId + &quot;|&quot; + payloadDigest)
            </code>
          </div>
        </article>

        <article className="panel-card">
          <span className="eyebrow">LỚP 3 — HỢP ĐỒNG THÔNG MINH EVM</span>
          <h2>On-Chain Registry & Revocation</h2>
          <p className="panel-desc">
            Hợp đồng thông minh <code>CertificateRegistry</code> chỉ lưu trữ{" "}
            <code>merkleRoot</code> của từng lô, địa chỉ ví ký của đơn vị đào tạo tại thời điểm
            phát hành và trạng thái thu hồi/thay thế của từng chứng chỉ.
          </p>
          <div className="formula-box">
            <code>publishBatch(string issuerId, string batchId, bytes32 merkleRoot)</code>
          </div>
        </article>
      </div>

      {samplePackage && sampleCred && (
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CẤU TRÚC GÓI CHỨNG CHỈ ĐỘC LẬP (CREDENTIAL PACKAGE)</span>
              <h2>Mẫu tệp JSON tự chứa (Payload + On-chain Anchor + Merkle Proof)</h2>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => downloadCredentialPackageJson(sampleCred.code, samplePackage)}
            >
              Tải tệp mẫu .json
            </button>
          </div>
          <pre className="code-pre-block">{JSON.stringify(samplePackage, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   MODE 2 VIEW: ROLE SWITCHER / PORTAL LOGIN GATE
   ========================================================================= */

interface RoleSwitcherGateViewProps {
  state: AppState;
  selectedRole: UserRole;
  selectedOrgId: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectRole: (role: UserRole) => void;
  onSelectOrgId: (orgId: string) => void;
  onContinue: (role: UserRole, orgId: string) => void;
  onBackToPublic: () => void;
}

function RoleSwitcherGateView({
  state,
  selectedRole,
  selectedOrgId,
  theme,
  onToggleTheme,
  onSelectRole,
  onSelectOrgId,
  onContinue,
  onBackToPublic,
}: RoleSwitcherGateViewProps) {
  const roles: UserRole[] = ["ISSUER_APPROVER", "ISSUER_OPERATOR", "SYSTEM_ADMIN"];

  const currentOrg =
    state.organizations.find((o) => o.id === selectedOrgId) ?? state.organizations[0];
  const currentWallet = state.wallets.find(
    (w) => w.organizationId === currentOrg?.id && w.status === "AUTHORIZED",
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onContinue(selectedRole, currentOrg.id);
  }

  return (
    <div className="auth-gate-screen">
      <header className="auth-gate-topbar">
        <div className="site-container auth-gate-topbar-inner">
          <button type="button" className="brand-home-link" onClick={onBackToPublic}>
            <BrandLogo size={36} />
            <div className="brand-title-box">
              <div className="brand-title-row">
                <span className="brand-name">CertChain</span>
                <span className="brand-version-pill">ACCESS GATE</span>
              </div>
              <span className="brand-subtitle">CỔNG ĐĂNG NHẬP & CHỌN VAI TRÒ VẬN HÀNH</span>
            </div>
          </button>

          <div className="button-row">
            <button type="button" className="theme-toggle-btn" onClick={onToggleTheme}>
              {theme === "light" ? "◐ Tối" : "☀ Sáng"}
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={onBackToPublic}>
              ← Quay lại Website Công khai
            </button>
          </div>
        </div>
      </header>

      <main className="auth-gate-main">
        <form className="auth-gate-card" onSubmit={handleSubmit}>
          <div className="auth-gate-head">
            <BrandLogo size={48} />
            <div>
              <span className="eyebrow">XÁC THỰC PHIÊN LÀM VIỆC NỘI BỘ</span>
              <h1>Chọn Tài khoản & Vai trò truy cập Bảng điều khiển</h1>
              <p>
                Chọn vai trò nghiệp vụ và đơn vị đào tạo để mở không gian làm việc có Sidebar điều
                hướng tương ứng.
              </p>
            </div>
          </div>

          <div className="auth-section">
            <span className="auth-step-label">1. Chọn Vai trò vận hành (Role)</span>
            <div className="role-cards-grid">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={selectedRole === r ? "role-select-card active" : "role-select-card"}
                  onClick={() => onSelectRole(r)}
                >
                  <div className="role-card-top">
                    <strong>{roleLabels[r]}</strong>
                    <span className="role-code-tag">{r}</span>
                  </div>
                  <p>{roleDescriptions[r]}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-section">
            <span className="auth-step-label">2. Chọn Đơn vị Đào tạo làm việc (Organization)</span>
            <div className="form-grid-2">
              <label className="form-field">
                <span>Đơn vị Đào tạo</span>
                <select
                  value={currentOrg?.id ?? ""}
                  onChange={(event) => onSelectOrgId(event.target.value)}
                >
                  {state.organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.code} — {org.displayName} ({organizationStatusLabels[org.status]})
                    </option>
                  ))}
                </select>
              </label>

              <div className="auth-wallet-preview">
                <span>Ví EVM đang ủy quyền của đơn vị</span>
                <code>
                  {currentWallet ? currentWallet.address : "Đơn vị chưa có ví EVM AUTHORIZED"}
                </code>
                <small>
                  {currentWallet
                    ? `Chain ID ${currentWallet.chainId} · Ký giao dịch trực tiếp qua EIP-1193`
                    : "Cần Quản trị Hệ thống cấp phép ví trước khi ký lô"}
                </small>
              </div>
            </div>
          </div>

          <div className="auth-gate-actions">
            <button type="button" className="btn-secondary" onClick={onBackToPublic}>
              ← Hủy & Về Website Công khai
            </button>
            <button type="submit" className="btn-primary">
              Tiếp tục vào Bảng điều khiển ({roleLabels[selectedRole]}) →
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

/* =========================================================================
   MODE 3 VIEW 1: CONSOLE OVERVIEW DASHBOARD
   ========================================================================= */

interface ConsoleOverviewViewProps {
  state: AppState;
  role: UserRole;
  selectedOrg: AppState["organizations"][number];
  activeOrgWallet: AppState["wallets"][number] | undefined;
  orgCourses: AppState["courses"];
  orgLearners: AppState["learners"];
  orgBatches: AppState["batches"];
  orgCredentials: AppState["credentials"];
  onNavigateConsole: (page: ConsolePage) => void;
  onSelectBatch: (batchId: string) => void;
  onSelectCredential: (cred: Credential) => void;
  onOpenDetail: (credId: string) => void;
}

function ConsoleOverviewView({
  role,
  selectedOrg,
  activeOrgWallet,
  orgCourses,
  orgLearners,
  orgBatches,
  orgCredentials,
  onNavigateConsole,
  onSelectBatch,
  onSelectCredential,
  onOpenDetail,
}: ConsoleOverviewViewProps) {
  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">TỔNG QUAN KHÔNG GIAN LÀM VIỆC ĐƠN VỊ</span>
          <h1>
            {selectedOrg.displayName} ({selectedOrg.code})
          </h1>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigateConsole("catalog")}
          >
            + Khóa học & Học viên
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigateConsole("batches")}
          >
            Quản lý Lô phát hành →
          </button>
        </div>
      </div>

      <section className="kpi-grid-4">
        <article className="kpi-card">
          <span className="kpi-label">LÔ PHÁT HÀNH CỦA ĐƠN VỊ</span>
          <strong className="kpi-value">{orgBatches.length}</strong>
          <span className="kpi-foot">
            {orgBatches.filter((b) => b.status === "CONFIRMED").length} lô đã neo On-chain
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">CHỨNG CHỈ ĐÃ CẤP</span>
          <strong className="kpi-value">{orgCredentials.length}</strong>
          <span className="kpi-foot">
            {orgCredentials.filter((c) => c.status === "ISSUED").length} chứng chỉ đang hiệu lực
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">KHÓA HỌC & HỌC VIÊN</span>
          <strong className="kpi-value">
            {orgCourses.length} / {orgLearners.length}
          </strong>
          <span className="kpi-foot">
            {orgCourses.length} chương trình · {orgLearners.length} hồ sơ học viên
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">VÍ EVM ỦY QUYỀN</span>
          <strong className="kpi-value">
            {activeOrgWallet ? shortHash(activeOrgWallet.address, 6, 4) : "Chưa cấp"}
          </strong>
          <span className="kpi-foot">Vai trò hiện tại: {roleLabels[role]}</span>
        </article>
      </section>

      <div className="admin-grid">
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DANH SÁCH LÔ PHÁT HÀNH GẦN ĐÂY</span>
              <h2>Trạng thái Đường ống Lô Chứng chỉ (Batches)</h2>
            </div>
            <button
              type="button"
              className="btn-secondary btn-xs"
              onClick={() => onNavigateConsole("batches")}
            >
              Mở tất cả lô →
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Tên đợt phát hành</th>
                <th>Số lượng</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orgBatches.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <code>{batch.code}</code>
                  </td>
                  <td>
                    <strong>{batch.title}</strong>
                    <div className="cell-sub">
                      Merkle Root: {batch.merkleRoot ? shortHash(batch.merkleRoot, 10, 6) : "—"}
                    </div>
                  </td>
                  <td>{batch.entries.length} hồ sơ</td>
                  <td>
                    <span
                      className={`status-pill ${
                        batch.status === "CONFIRMED"
                          ? "tone-valid"
                          : batch.status === "DRAFT"
                            ? "tone-info"
                            : "tone-warn"
                      }`}
                    >
                      {batchStatusLabels[batch.status]}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={() => onSelectBatch(batch.id)}
                    >
                      Mở lô →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CHỨNG CHỈ MỚI PHÁT HÀNH CỦA ĐƠN VỊ</span>
              <h2>Sổ Chứng chỉ ({selectedOrg.code})</h2>
            </div>
            <button
              type="button"
              className="btn-secondary btn-xs"
              onClick={() => onNavigateConsole("credentials")}
            >
              Mở Sổ Chứng chỉ →
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Mã chứng chỉ</th>
                <th>Học viên</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orgCredentials.slice(0, 5).map((cred) => (
                <tr key={cred.id}>
                  <td>
                    <code className="code-strong">{cred.code}</code>
                  </td>
                  <td>
                    <strong>{cred.holder}</strong>
                    <div className="cell-sub">{cred.course}</div>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        cred.status === "ISSUED"
                          ? "tone-valid"
                          : cred.status === "REVOKED"
                            ? "tone-danger"
                            : "tone-warn"
                      }`}
                    >
                      {credentialStatusLabels[cred.status]}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        onClick={() => onOpenDetail(cred.id)}
                      >
                        Phôi & QR
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        onClick={() => onSelectCredential(cred)}
                      >
                        Kiểm định ↗
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   MODE 3 VIEW 2: ISSUER PORTAL (UC-02 -> UC-08)
   ========================================================================= */

interface IssuerPortalProps {
  state: AppState;
  role: UserRole;
  subTab: "batches" | "credentials" | "catalog";
  onSubTabChange: (tab: "batches" | "credentials" | "catalog") => void;
  selectedOrg: AppState["organizations"][number];
  orgCourses: AppState["courses"];
  orgLearners: AppState["learners"];
  orgBatches: AppState["batches"];
  selectedBatch: AppState["batches"][number] | undefined;
  selectedBatchEntries: BatchEntry[];
  orgCredentials: AppState["credentials"];
  onSelectBatch: (batchId: string) => void;
  onStateChange: (next: AppState) => void;
  onNotify: (tone: NoticeBanner["tone"], message: string) => void;
  onOpenPublishModal: (batchId: string) => void;
  onSelectCredentialForVerify: (credential: Credential) => void;
  onOpenCredentialDetail: (credentialId: string) => void;
  onOpenRevokeModal: (credential: Credential) => void;
  onOpenReissueModal: (credential: Credential) => void;
}

function IssuerPortal({
  state,
  role,
  subTab,
  onSubTabChange,
  selectedOrg,
  orgCourses,
  orgLearners,
  orgBatches,
  selectedBatch,
  selectedBatchEntries,
  orgCredentials,
  onSelectBatch,
  onStateChange,
  onNotify,
  onOpenPublishModal,
  onSelectCredentialForVerify,
  onOpenCredentialDetail,
  onOpenRevokeModal,
  onOpenReissueModal,
}: IssuerPortalProps) {
  const [newBatchTitle, setNewBatchTitle] = useState<string>("");
  const [newBatchCourseId, setNewBatchCourseId] = useState<string>(orgCourses[0]?.id ?? "");

  const [entryLearnerId, setEntryLearnerId] = useState<string>(orgLearners[0]?.id ?? "");
  const [entryResult, setEntryResult] = useState<string>("92/100 (Xuất sắc)");
  const [entryIssuedDate, setEntryIssuedDate] = useState<string>("2026-11-14");

  const [courseCode, setCourseCode] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseHours, setCourseHours] = useState<string>("90");

  const [learnerCode, setLearnerCode] = useState<string>("");
  const [learnerName, setLearnerName] = useState<string>("");
  const [learnerCohort, setLearnerCohort] = useState<string>("K68-CNTT");

  const [credSearch, setCredSearch] = useState<string>("");
  const [credFilterStatus, setCredFilterStatus] = useState<string>("ALL");

  const filteredCredentials = useMemo(() => {
    return orgCredentials.filter((cred) => {
      if (credFilterStatus !== "ALL" && cred.status !== credFilterStatus) return false;
      if (!credSearch.trim()) return true;
      const q = credSearch.trim().toLowerCase();
      return (
        cred.code.toLowerCase().includes(q) ||
        cred.holder.toLowerCase().includes(q) ||
        cred.subjectRef.toLowerCase().includes(q) ||
        cred.course.toLowerCase().includes(q)
      );
    });
  }, [orgCredentials, credFilterStatus, credSearch]);

  function handleCreateBatch(event: FormEvent) {
    event.preventDefault();
    const res = createBatch(state, {
      organizationId: selectedOrg.id,
      courseId: newBatchCourseId || orgCourses[0]?.id || "",
      title: newBatchTitle,
      chainId: 31337,
    });
    if (res.error || !res.batch) {
      onNotify("danger", res.error ?? "Không thể tạo lô phát hành mới.");
      return;
    }
    onStateChange(res.state);
    onSelectBatch(res.batch.id);
    setNewBatchTitle("");
    onNotify("success", `Đã khởi tạo lô nháp ${res.batch.code}.`);
  }

  function handleAddEntry(event: FormEvent) {
    event.preventDefault();
    if (!selectedBatch) return;
    const res = addEntryToBatch(state, {
      batchId: selectedBatch.id,
      learnerId: entryLearnerId || orgLearners[0]?.id || "",
      result: entryResult,
      issuedAt: `${entryIssuedDate}T00:00:00Z`,
      expiresAt: "2029-11-14T00:00:00Z",
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    onNotify("success", "Đã thêm hồ sơ học viên vào lô nháp.");
  }

  function handleCreateCourse(event: FormEvent) {
    event.preventDefault();
    const res = createCourse(state, {
      organizationId: selectedOrg.id,
      code: courseCode,
      name: courseTitle,
      version: "v1.0",
      durationHours: Number(courseHours),
      gradingRule: "Điểm tổng kết >= 70/100",
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    setCourseCode("");
    setCourseTitle("");
    onNotify("success", "Đã thêm chương trình đào tạo mới.");
  }

  function handleCreateLearner(event: FormEvent) {
    event.preventDefault();
    const res = createLearner(state, {
      organizationId: selectedOrg.id,
      subjectRef: learnerCode,
      displayName: learnerName,
      cohort: learnerCohort,
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    setLearnerCode("");
    setLearnerName("");
    onNotify("success", `Đã thêm học viên ${res.learner?.displayName}.`);
  }

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">KHÔNG GIAN VẬN HÀNH ĐƠN VỊ ĐÀO TẠO (UC-02 → UC-08)</span>
          <h1>
            {subTab === "batches"
              ? "Đường ống Phát hành Lô Chứng chỉ (Batches)"
              : subTab === "credentials"
                ? "Sổ đăng ký Chứng chỉ của Đơn vị"
                : "Quản lý Danh mục Khóa học & Học viên"}
          </h1>
        </div>

        <div className="segmented-tabs">
          <button
            type="button"
            className={subTab === "batches" ? "seg-btn active" : "seg-btn"}
            onClick={() => onSubTabChange("batches")}
          >
            Lô phát hành ({orgBatches.length})
          </button>
          <button
            type="button"
            className={subTab === "credentials" ? "seg-btn active" : "seg-btn"}
            onClick={() => onSubTabChange("credentials")}
          >
            Sổ Chứng chỉ ({orgCredentials.length})
          </button>
          <button
            type="button"
            className={subTab === "catalog" ? "seg-btn active" : "seg-btn"}
            onClick={() => onSubTabChange("catalog")}
          >
            Khóa học & Học viên ({orgCourses.length + orgLearners.length})
          </button>
        </div>
      </div>

      {subTab === "batches" && (
        <div className="issuer-batch-layout">
          <aside className="panel-card batch-sidebar">
            <div className="panel-head">
              <div>
                <span className="eyebrow">DANH SÁCH LÔ CHỨNG CHỈ</span>
                <h2>Lô của {selectedOrg.code}</h2>
              </div>
            </div>

            <div className="batch-list">
              {orgBatches.map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  className={selectedBatch?.id === batch.id ? "batch-item active" : "batch-item"}
                  onClick={() => onSelectBatch(batch.id)}
                >
                  <div className="batch-item-top">
                    <code>{batch.code}</code>
                    <span
                      className={`status-pill ${
                        batch.status === "CONFIRMED"
                          ? "tone-valid"
                          : batch.status === "DRAFT"
                            ? "tone-info"
                            : "tone-warn"
                      }`}
                    >
                      {batchStatusLabels[batch.status]}
                    </span>
                  </div>
                  <strong>{batch.title}</strong>
                  <small>{batch.entries.length} hồ sơ trong lô</small>
                </button>
              ))}
            </div>

            <form className="compact-form" onSubmit={handleCreateBatch}>
              <span className="eyebrow">KHỞI TẠO LÔ MỚI (UC-03)</span>
              <label className="form-field">
                <span>Chương trình đào tạo</span>
                <select
                  value={newBatchCourseId || orgCourses[0]?.id || ""}
                  onChange={(event) => setNewBatchCourseId(event.target.value)}
                >
                  {orgCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Tên đợt phát hành</span>
                <input
                  value={newBatchTitle}
                  onChange={(event) => setNewBatchTitle(event.target.value)}
                  placeholder="VD: Đợt tốt nghiệp Tháng 11/2026"
                  required
                />
              </label>
              <button type="submit" className="btn-secondary full-width">
                + Tạo Lô Nháp (DRAFT)
              </button>
            </form>
          </aside>

          <div className="panel-card batch-workspace">
            {selectedBatch ? (
              <>
                <div className="batch-workspace-head">
                  <div>
                    <div className="batch-code-row">
                      <code>{selectedBatch.code}</code>
                      <span
                        className={`status-pill ${
                          selectedBatch.status === "CONFIRMED"
                            ? "tone-valid"
                            : selectedBatch.status === "DRAFT"
                              ? "tone-info"
                              : "tone-warn"
                        }`}
                      >
                        {batchStatusLabels[selectedBatch.status]}
                      </span>
                    </div>
                    <h2>{selectedBatch.title}</h2>
                  </div>

                  <div className="pipeline-action-bar">
                    {selectedBatch.status === "DRAFT" && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          const res = validateBatch(state, selectedBatch.id);
                          onStateChange(res.state);
                          if (res.error) {
                            onNotify("danger", res.error);
                            return;
                          }
                          onNotify(
                            "success",
                            `Lô ${selectedBatch.code} đã vượt qua kiểm tra hợp lệ (VALIDATED).`,
                          );
                        }}
                      >
                        Bước 2: Kiểm tra tính hợp lệ (Validate) →
                      </button>
                    )}

                    {selectedBatch.status === "VALIDATED" && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          if (role !== "ISSUER_APPROVER" && role !== "SYSTEM_ADMIN") {
                            onNotify(
                              "warning",
                              "Vui lòng chuyển sang vai trò 'Người Duyệt & Ký số' để phê duyệt lô.",
                            );
                            return;
                          }
                          const res = approveBatch(
                            state,
                            selectedBatch.id,
                            `${selectedOrg.code} (${roleLabels[role]})`,
                          );
                          if (res.error) {
                            onNotify("danger", res.error);
                            return;
                          }
                          onStateChange(res.state);
                          onNotify("success", `Đã phê duyệt lô ${selectedBatch.code} (APPROVED).`);
                        }}
                      >
                        Bước 3: Phê duyệt Lô (Approve) →
                      </button>
                    )}

                    {selectedBatch.status === "APPROVED" && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          const res = freezeBatch(state, selectedBatch.id);
                          if (res.error) {
                            onNotify("danger", res.error);
                            return;
                          }
                          onStateChange(res.state);
                          onNotify(
                            "success",
                            "Đã chuẩn hóa JCS, tạo lá và đóng băng Merkle Root thành công (FROZEN).",
                          );
                        }}
                      >
                        Bước 4: Đóng băng & Dựng Merkle Root →
                      </button>
                    )}

                    {selectedBatch.status === "FROZEN" && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onOpenPublishModal(selectedBatch.id)}
                      >
                        Bước 5: Ký Ví EVM & Neo On-chain →
                      </button>
                    )}

                    {selectedBatch.status === "PENDING_CHAIN" && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          const res = confirmBatchPublish(state, {
                            batchId: selectedBatch.id,
                          });
                          if (res.error) {
                            onNotify("danger", res.error);
                            return;
                          }
                          onStateChange(res.state);
                          onNotify(
                            "success",
                            "Giao dịch đã xác nhận khối (CONFIRMED) và phát hành gói chứng chỉ.",
                          );
                        }}
                      >
                        Bước 6: Đồng bộ Receipt & Xác nhận Khối →
                      </button>
                    )}
                  </div>
                </div>

                <div className="pipeline-stepper">
                  {BATCH_PIPELINE_STEPS.map((stepStatus, index) => {
                    const currentIdx = BATCH_PIPELINE_STEPS.indexOf(selectedBatch.status);
                    const stateClass =
                      index < currentIdx ? "done" : index === currentIdx ? "current" : "upcoming";
                    return (
                      <div key={stepStatus} className={`pipeline-step ${stateClass}`}>
                        <span className="step-index">{index + 1}</span>
                        <div>
                          <strong>{batchStatusLabels[stepStatus]}</strong>
                          <small>{stepStatus}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedBatch.merkleRoot && (
                  <div className="merkle-anchor-banner">
                    <div>
                      <span>MERKLE ROOT (SHA-256)</span>
                      <code>{selectedBatch.merkleRoot}</code>
                    </div>
                    {selectedBatch.txHash && (
                      <div>
                        <span>ON-CHAIN TX HASH</span>
                        <code>
                          {shortHash(selectedBatch.txHash, 14, 10)} (Block #
                          {selectedBatch.blockNumber ?? "Pending"})
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {selectedBatch.status === "DRAFT" && (
                  <form className="add-entry-bar" onSubmit={handleAddEntry}>
                    <label className="form-field">
                      <span>Học viên</span>
                      <select
                        value={entryLearnerId || orgLearners[0]?.id || ""}
                        onChange={(event) => setEntryLearnerId(event.target.value)}
                      >
                        {orgLearners.map((learner) => (
                          <option key={learner.id} value={learner.id}>
                            {learner.subjectRef} — {learner.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Kết quả / Điểm & Xếp loại</span>
                      <input
                        value={entryResult}
                        onChange={(event) => setEntryResult(event.target.value)}
                        required
                      />
                    </label>
                    <label className="form-field">
                      <span>Ngày cấp</span>
                      <input
                        type="date"
                        value={entryIssuedDate}
                        onChange={(event) => setEntryIssuedDate(event.target.value)}
                        required
                      />
                    </label>
                    <button type="submit" className="btn-secondary">
                      + Thêm vào Lô
                    </button>
                  </form>
                )}

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Mã mục / Học viên</th>
                        <th>Kết quả đạt được</th>
                        <th>File PDF đính kèm</th>
                        <th>Payload Digest / Leaf Hash</th>
                        <th className="text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatchEntries.map((entry, idx) => {
                        const issuedCred = state.credentials.find(
                          (c) => c.batchEntryId === entry.id,
                        );
                        return (
                          <tr key={entry.id}>
                            <td>
                              <code>#{idx + 1}</code>
                            </td>
                            <td>
                              <strong>{entry.holderName}</strong>
                              <div className="cell-sub">{entry.subjectRef}</div>
                            </td>
                            <td>
                              <strong>{entry.result}</strong>
                              <div className="cell-sub">
                                Ngày cấp: {formatDateTime(entry.issuedAt)}
                              </div>
                            </td>
                            <td>
                              <code>{entry.pdfFileName}</code>
                              <div className="cell-sub">
                                SHA-256: {shortHash(entry.pdfSha256, 8, 6)}
                              </div>
                            </td>
                            <td>
                              <code>Leaf: {shortHash(entry.leaf, 10, 8)}</code>
                              <div className="cell-sub">
                                Digest: {shortHash(entry.payloadDigest, 10, 8)}
                              </div>
                            </td>
                            <td className="text-right">
                              {selectedBatch.status === "DRAFT" && (
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  onClick={() => {
                                    const res = removeBatchEntry(state, {
                                      batchId: selectedBatch.id,
                                      entryId: entry.id,
                                    });
                                    if (res.error) {
                                      onNotify("danger", res.error);
                                      return;
                                    }
                                    onStateChange(res.state);
                                  }}
                                >
                                  Xóa
                                </button>
                              )}
                              {issuedCred && (
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="btn-secondary btn-xs"
                                    onClick={() => onOpenCredentialDetail(issuedCred.id)}
                                  >
                                    Xem Phôi & QR
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary btn-xs"
                                    onClick={() => onSelectCredentialForVerify(issuedCred)}
                                  >
                                    Kiểm định
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p>Chưa có lô phát hành nào cho đơn vị này.</p>
            )}
          </div>
        </div>
      )}

      {subTab === "credentials" && (
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">QUẢN LÝ VÒNG ĐỜI CHỨNG CHỈ (UC-06, UC-07, UC-08)</span>
              <h2>Sổ đăng ký Chứng chỉ của {selectedOrg.displayName}</h2>
            </div>

            <div className="filter-bar">
              <input
                value={credSearch}
                onChange={(event) => setCredSearch(event.target.value)}
                placeholder="Tìm theo mã chứng chỉ, tên hoặc mã học viên..."
              />
              <select
                value={credFilterStatus}
                onChange={(event) => setCredFilterStatus(event.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ISSUED">Đang hiệu lực (ISSUED)</option>
                <option value="REVOKED">Đã thu hồi (REVOKED)</option>
                <option value="SUPERSEDED">Đã thay thế (SUPERSEDED)</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã chứng chỉ</th>
                  <th>Học viên</th>
                  <th>Khóa đào tạo</th>
                  <th>Kết quả / Ngày cấp</th>
                  <th>Lô & Merkle Root</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác nghiệp vụ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredentials.map((cred) => (
                  <tr key={cred.id}>
                    <td>
                      <code className="code-strong">{cred.code}</code>
                      {cred.reissuedFromId && (
                        <div className="cell-sub">Cấp lại từ bản cũ</div>
                      )}
                    </td>
                    <td>
                      <strong>{cred.holder}</strong>
                      <div className="cell-sub">{cred.subjectRef}</div>
                    </td>
                    <td>
                      <span>{cred.course}</span>
                      <div className="cell-sub">{cred.courseCode}</div>
                    </td>
                    <td>
                      <strong>{cred.score}</strong>
                      <div className="cell-sub">{formatDateTime(cred.issuedAt)}</div>
                    </td>
                    <td>
                      <code>{shortHash(cred.merkleRoot, 8, 6)}</code>
                      <div className="cell-sub">Batch: {cred.batchId}</div>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          cred.status === "ISSUED"
                            ? "tone-valid"
                            : cred.status === "REVOKED"
                              ? "tone-danger"
                              : "tone-warn"
                        }`}
                      >
                        {credentialStatusLabels[cred.status]}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-secondary btn-xs"
                          onClick={() => onOpenCredentialDetail(cred.id)}
                        >
                          Phôi & QR
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-xs"
                          onClick={() => onSelectCredentialForVerify(cred)}
                        >
                          Kiểm định
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-xs"
                          onClick={() => {
                            const pkg = buildCredentialPackage(state, cred.id);
                            if (pkg) downloadCredentialPackageJson(cred.code, pkg);
                          }}
                        >
                          Tải .json
                        </button>
                        {cred.status === "ISSUED" && (
                          <>
                            <button
                              type="button"
                              className="btn-secondary btn-xs"
                              onClick={() => onOpenReissueModal(cred)}
                            >
                              Cấp lại
                            </button>
                            <button
                              type="button"
                              className="btn-danger-outline btn-xs"
                              onClick={() => onOpenRevokeModal(cred)}
                            >
                              Thu hồi
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "catalog" && (
        <div className="catalog-grid-2">
          <div className="panel-card">
            <div className="panel-head">
              <div>
                <span className="eyebrow">CHƯƠNG TRÌNH ĐÀO TẠO (UC-02)</span>
                <h2>Danh mục Khóa học ({orgCourses.length})</h2>
              </div>
            </div>

            <form className="inline-create-form" onSubmit={handleCreateCourse}>
              <input
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
                placeholder="Mã khóa (VD: AI-401)"
                required
              />
              <input
                value={courseTitle}
                onChange={(event) => setCourseTitle(event.target.value)}
                placeholder="Tên chương trình đào tạo"
                required
              />
              <input
                type="number"
                min={1}
                value={courseHours}
                onChange={(event) => setCourseHours(event.target.value)}
                placeholder="Số giờ"
                required
              />
              <button type="submit" className="btn-primary">
                + Thêm Khóa học
              </button>
            </form>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã khóa</th>
                  <th>Tên chương trình đào tạo</th>
                  <th>Thời lượng</th>
                </tr>
              </thead>
              <tbody>
                {orgCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <code>{course.code}</code>
                    </td>
                    <td>
                      <strong>{course.name}</strong>
                      <div className="cell-sub">{course.gradingRule}</div>
                    </td>
                    <td>{course.durationHours} giờ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel-card">
            <div className="panel-head">
              <div>
                <span className="eyebrow">HỒ SƠ NGƯỜI HỌC (UC-02)</span>
                <h2>Danh sách Học viên ({orgLearners.length})</h2>
              </div>
            </div>

            <form className="inline-create-form" onSubmit={handleCreateLearner}>
              <input
                value={learnerCode}
                onChange={(event) => setLearnerCode(event.target.value)}
                placeholder="Mã HV (VD: SV-2026-109)"
                required
              />
              <input
                value={learnerName}
                onChange={(event) => setLearnerName(event.target.value)}
                placeholder="Họ và tên học viên"
                required
              />
              <input
                value={learnerCohort}
                onChange={(event) => setLearnerCohort(event.target.value)}
                placeholder="Khóa/Lớp"
                required
              />
              <button type="submit" className="btn-primary">
                + Thêm Học viên
              </button>
            </form>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã học viên</th>
                  <th>Họ và tên</th>
                  <th>Khóa / Lớp</th>
                </tr>
              </thead>
              <tbody>
                {orgLearners.map((learner) => (
                  <tr key={learner.id}>
                    <td>
                      <code>{learner.subjectRef}</code>
                    </td>
                    <td>
                      <strong>{learner.displayName}</strong>
                    </td>
                    <td>{learner.cohort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   MODE 3 VIEW 3: SYSTEM ADMIN PORTAL (UC-01)
   ========================================================================= */

interface SystemAdminPortalProps {
  state: AppState;
  role: UserRole;
  onSwitchRole: () => void;
  onStateChange: (next: AppState) => void;
  onNotify: (tone: NoticeBanner["tone"], message: string) => void;
}

function SystemAdminPortal({
  state,
  role,
  onSwitchRole,
  onStateChange,
  onNotify,
}: SystemAdminPortalProps) {
  const [orgCode, setOrgCode] = useState<string>("");
  const [orgLegalName, setOrgLegalName] = useState<string>("");
  const [orgDisplayName, setOrgDisplayName] = useState<string>("");
  const [orgVerificationRef, setOrgVerificationRef] = useState<string>("");

  const [walletOrgId, setWalletOrgId] = useState<string>(state.organizations[0]?.id ?? "");
  const [walletAddress, setWalletAddress] = useState<string>("");

  function handleRegisterOrg(event: FormEvent) {
    event.preventDefault();
    const res = registerOrganization(state, {
      code: orgCode,
      legalName: orgLegalName,
      displayName: orgDisplayName,
      verificationRef: orgVerificationRef,
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    setOrgCode("");
    setOrgLegalName("");
    setOrgDisplayName("");
    setOrgVerificationRef("");
    onNotify(
      "success",
      `Đã tiếp nhận hồ sơ tổ chức ${orgDisplayName} (${orgCode}) ở trạng thái chờ thẩm định.`,
    );
  }

  function handleAuthorizeWallet(event: FormEvent) {
    event.preventDefault();
    const res = authorizeOrganizationWallet(state, {
      organizationId: walletOrgId,
      chainId: 31337,
      address: walletAddress,
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    setWalletAddress("");
    onNotify(
      "success",
      "Đã cấp phép địa chỉ ví EVM phát hành (các ví cũ của tổ chức đã tự động chuyển sang REVOKED).",
    );
  }

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">QUẢN TRỊ HỆ THỐNG & ỦY QUYỀN VÍ EVM (UC-01)</span>
          <h1>Quản lý Đơn vị Đào tạo & Địa chỉ Ví Phát hành On-chain</h1>
        </div>
        {role !== "SYSTEM_ADMIN" && (
          <button type="button" className="btn-secondary" onClick={onSwitchRole}>
            Chuyển sang vai trò Quản trị Hệ thống
          </button>
        )}
      </div>

      <div className="admin-grid">
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DANH BẠ TỔ CHỨC ĐÀO TẠO</span>
              <h2>Trạng thái Pháp nhân & Ví đang ủy quyền</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên tổ chức & Hồ sơ pháp lý</th>
                  <th>Ví EVM đang hoạt động (1 ví duy nhất)</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác quản trị</th>
                </tr>
              </thead>
              <tbody>
                {state.organizations.map((org) => {
                  const activeWallet = state.wallets.find(
                    (w) => w.organizationId === org.id && w.status === "AUTHORIZED",
                  );
                  return (
                    <tr key={org.id}>
                      <td>
                        <code className="code-strong">{org.code}</code>
                      </td>
                      <td>
                        <strong>{org.displayName}</strong>
                        <div className="cell-sub">
                          {org.legalName} · Hồ sơ: {org.verificationRef}
                        </div>
                      </td>
                      <td>
                        {activeWallet ? (
                          <>
                            <code>{shortHash(activeWallet.address, 10, 8)}</code>
                            <div className="cell-sub">Chain ID {activeWallet.chainId}</div>
                          </>
                        ) : (
                          <span className="cell-sub">Chưa cấp phép ví AUTHORIZED</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            org.status === "ACTIVE"
                              ? "tone-valid"
                              : org.status === "PENDING"
                                ? "tone-warn"
                                : "tone-danger"
                          }`}
                        >
                          {organizationStatusLabels[org.status]}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="table-actions">
                          {org.status !== "ACTIVE" && (
                            <button
                              type="button"
                              className="btn-secondary btn-xs"
                              onClick={() => {
                                const res = updateOrganizationStatus(state, {
                                  organizationId: org.id,
                                  nextStatus: "ACTIVE",
                                });
                                if (!res.error) {
                                  onStateChange(res.state);
                                  onNotify("success", `Đã kích hoạt tổ chức ${org.code}.`);
                                }
                              }}
                            >
                              Kích hoạt (ACTIVE)
                            </button>
                          )}
                          {org.status === "ACTIVE" && (
                            <button
                              type="button"
                              className="btn-danger-outline btn-xs"
                              onClick={() => {
                                const res = updateOrganizationStatus(state, {
                                  organizationId: org.id,
                                  nextStatus: "SUSPENDED",
                                });
                                if (!res.error) {
                                  onStateChange(res.state);
                                  onNotify(
                                    "warning",
                                    `Đã tạm ngưng quyền phát hành của ${org.code}.`,
                                  );
                                }
                              }}
                            >
                              Tạm ngưng
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-forms-col">
          <form className="panel-card" onSubmit={handleRegisterOrg}>
            <span className="eyebrow">ĐĂNG KÝ TỔ CHỨC MỚI</span>
            <h3>Tiếp nhận Đơn vị Đào tạo</h3>

            <div className="form-grid-2">
              <label className="form-field">
                <span>Mã định danh (Code)</span>
                <input
                  value={orgCode}
                  onChange={(event) => setOrgCode(event.target.value)}
                  placeholder="VD: FPTPOLY"
                  required
                />
              </label>
              <label className="form-field">
                <span>Mã hồ sơ / Quyết định</span>
                <input
                  value={orgVerificationRef}
                  onChange={(event) => setOrgVerificationRef(event.target.value)}
                  placeholder="QD-BGD-2026-0999"
                  required
                />
              </label>
            </div>

            <label className="form-field">
              <span>Tên hiển thị ngắn gọn</span>
              <input
                value={orgDisplayName}
                onChange={(event) => setOrgDisplayName(event.target.value)}
                placeholder="VD: Viện Đào tạo Công nghệ FPT"
                required
              />
            </label>

            <label className="form-field">
              <span>Tên pháp nhân đầy đủ</span>
              <input
                value={orgLegalName}
                onChange={(event) => setOrgLegalName(event.target.value)}
                placeholder="VD: Trường Cao đẳng Thực hành FPT Polytechnic"
                required
              />
            </label>

            <button type="submit" className="btn-primary full-width">
              Đăng ký Tổ chức Đào tạo
            </button>
          </form>

          <form className="panel-card" onSubmit={handleAuthorizeWallet}>
            <span className="eyebrow">ỦY QUYỀN ĐỊA CHỈ VÍ KÝ SỐ (1 VÍ ACTIVE / TỔ CHỨC)</span>
            <h3>Cấp phép Ví EVM trên Smart Contract</h3>

            <label className="form-field">
              <span>Chọn tổ chức đào tạo</span>
              <select
                value={walletOrgId}
                onChange={(event) => setWalletOrgId(event.target.value)}
              >
                {state.organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.code} — {org.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Địa chỉ ví EVM (0x + 40 ký tự hex)</span>
              <input
                value={walletAddress}
                onChange={(event) => setWalletAddress(event.target.value)}
                placeholder="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                required
              />
            </label>

            <button type="submit" className="btn-primary full-width">
              Ủy quyền Địa chỉ Ví EVM
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   MODE 3 VIEW 4: AUDIT TRAIL PORTAL
   ========================================================================= */

function AuditTrailPortal({ state }: { state: AppState }) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const filteredEvents = useMemo(() => {
    if (categoryFilter === "ALL") return state.events;
    return state.events.filter((e) => e.aggregateType === categoryFilter);
  }, [state.events, categoryFilter]);

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">NHẬT KÝ SỰ KIỆN & ĐỒNG BỘ INDEXER</span>
          <h1>Nhật ký Kiểm toán Hệ thống & Giao dịch On-chain</h1>
        </div>

        <div className="filter-bar">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="ALL">Tất cả phân mục ({state.events.length})</option>
            <option value="BATCH">Lô phát hành (BATCH)</option>
            <option value="CREDENTIAL">Chứng chỉ (CREDENTIAL)</option>
            <option value="ORGANIZATION">Tổ chức đào tạo (ORGANIZATION)</option>
            <option value="WALLET">Ví EVM (WALLET)</option>
            <option value="COURSE">Khóa đào tạo (COURSE)</option>
            <option value="LEARNER">Học viên (LEARNER)</option>
          </select>
        </div>
      </div>

      <div className="panel-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Phân mục</th>
                <th>Hành động</th>
                <th>Tác nhân thực hiện</th>
                <th>Chi tiết kỹ thuật & Mã tương quan</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <code>{ev.time}</code>
                  </td>
                  <td>
                    <span className="status-pill tone-info">{ev.aggregateType}</span>
                  </td>
                  <td>
                    <strong>{ev.action}</strong>
                  </td>
                  <td>
                    <span>{ev.actorName}</span>
                    <div className="cell-sub">{roleLabels[ev.actorRole]}</div>
                  </td>
                  <td>
                    <span>{ev.detail}</span>
                    <div className="cell-sub">
                      Correlation ID: <code>{ev.correlationId}</code>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ConsoleSidebar } from "./components/layout/ConsoleSidebar";
import { ConsoleTopbar } from "./components/layout/ConsoleTopbar";
import { PublicFooter } from "./components/layout/PublicFooter";
import { PublicHeader } from "./components/layout/PublicHeader";
import { CredentialDetailModal } from "./components/modals/CredentialDetailModal";
import { PublishBatchModal } from "./components/modals/PublishBatchModal";
import { ReissueCredentialModal } from "./components/modals/ReissueCredentialModal";
import { RevokeCredentialModal } from "./components/modals/RevokeCredentialModal";
import { ToastViewport } from "./components/ui/ToastViewport";
import {
  buildCredentialPackage,
  buildPublishIntent,
  confirmBatchPublish,
  reissueCredential,
  revokeCredential,
  roleLabels,
  submitPublishTransaction,
  TRUSTED_CHAINS,
  verifyCredential,
  verifyCredentialPackage,
  type AppState,
  type ConsolePage,
  type Credential,
  type CredentialPackage,
  type NoticeBanner,
  type PublicPage,
  type PublishIntent,
  type SurfaceMode,
  type UserRole,
  type VerificationReport,
  type VerifierMode,
} from "./domain";
import { SystemAdminPortal } from "./features/admin/SystemAdminPortal";
import { AuditTrailPortal } from "./features/audit/AuditTrailPortal";
import { IssuerPortal } from "./features/issuer/IssuerPortal";
import { RoleSwitcherGateView } from "./pages/auth/RoleSwitcherGatePage";
import { ConsoleOverviewView } from "./pages/console/ConsoleOverviewPage";
import { PublicDirectoryView } from "./pages/public/PublicDirectoryPage";
import { PublicHomeView } from "./pages/public/PublicHomePage";
import { PublicStandardsView } from "./pages/public/PublicStandardsPage";
import { PublicVerifierView } from "./pages/public/PublicVerifierPage";
import {
  computeFileSha256Hex,
  loadWorkspaceState,
  saveWorkspaceState,
  shortHash,
} from "./services";

export function App() {
  const [state, setState] = useState<AppState>(() => loadWorkspaceState());

  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("public");
  const [publicPage, setPublicPage] = useState<PublicPage>("home");
  const [consolePage, setConsolePage] = useState<ConsolePage>("overview");

  const [role, setRole] = useState<UserRole>("ISSUER_APPROVER");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [notice, setNotice] = useState<NoticeBanner | null>(null);
  const [noticeHovered, setNoticeHovered] = useState<boolean>(false);
  const noticeTimerMetaRef = useRef<{ id: number; remainingMs: number }>({
    id: 0,
    remainingMs: 4000,
  });
  const [headerQuickCode, setHeaderQuickCode] = useState<string>("");

  // Verifier state (starts completely empty until user searches or uploads a file)
  const [verifierMode, setVerifierMode] = useState<VerifierMode>("lookup");
  const [lookupCode, setLookupCode] = useState<string>("");
  const [submittedCode, setSubmittedCode] = useState<string>("");
  const [activePackage, setActivePackage] = useState<CredentialPackage | null>(null);
  const [inspectorJsonText, setInspectorJsonText] = useState<string>("");
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileHash, setUploadedFileHash] = useState<string | undefined>(undefined);

  // Modals state (no pre-filled mock values)
  const [detailCredentialId, setDetailCredentialId] = useState<string | null>(null);
  const [publishIntentModal, setPublishIntentModal] = useState<PublishIntent | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Credential | null>(null);
  const [revokeReasonText, setRevokeReasonText] = useState<string>("");
  const [reissueTarget, setReissueTarget] = useState<Credential | null>(null);
  const [reissueName, setReissueName] = useState<string>("");
  const [reissueResultText, setReissueResultText] = useState<string>("");
  const [reissueExpiresAt, setReissueExpiresAt] = useState<string>("");
  const [reissueReason, setReissueReason] = useState<string>("");

  useEffect(() => {
    saveWorkspaceState(state);
  }, [state]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    if (noticeTimerMetaRef.current.id !== notice.id) {
      noticeTimerMetaRef.current = { id: notice.id, remainingMs: 4000 };
    }
    if (noticeHovered) {
      return;
    }

    const activeId = notice.id;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => {
      setNotice((current) => (current?.id === activeId ? null : current));
      setNoticeHovered(false);
    }, noticeTimerMetaRef.current.remainingMs);

    return () => {
      window.clearTimeout(timer);
      if (noticeTimerMetaRef.current.id === activeId) {
        noticeTimerMetaRef.current.remainingMs = Math.max(
          0,
          noticeTimerMetaRef.current.remainingMs - (Date.now() - startedAt),
        );
      }
    };
  }, [notice, noticeHovered]);

  const primaryChain = TRUSTED_CHAINS[0];

  const selectedOrg = useMemo(
    () =>
      state.organizations.find((item) => item.id === selectedOrgId) ??
      state.organizations[0] ??
      null,
    [state.organizations, selectedOrgId],
  );

  const activeOrgWallet = useMemo(
    () =>
      selectedOrg
        ? state.wallets.find(
            (wallet) => wallet.organizationId === selectedOrg.id && wallet.status === "AUTHORIZED",
          )
        : undefined,
    [state.wallets, selectedOrg],
  );

  const orgCourses = useMemo(
    () =>
      selectedOrg ? state.courses.filter((item) => item.organizationId === selectedOrg.id) : [],
    [state.courses, selectedOrg],
  );

  const orgLearners = useMemo(
    () =>
      selectedOrg ? state.learners.filter((item) => item.organizationId === selectedOrg.id) : [],
    [state.learners, selectedOrg],
  );

  const orgBatches = useMemo(
    () =>
      selectedOrg ? state.batches.filter((item) => item.organizationId === selectedOrg.id) : [],
    [state.batches, selectedOrg],
  );

  const selectedBatch = useMemo(
    () => orgBatches.find((item) => item.id === selectedBatchId) ?? orgBatches[0] ?? undefined,
    [orgBatches, selectedBatchId],
  );

  const selectedBatchEntries = useMemo(
    () => selectedBatch?.entries ?? [],
    [selectedBatch],
  );

  const orgCredentials = useMemo(
    () =>
      selectedOrg
        ? state.credentials.filter((item) => item.organizationId === selectedOrg.id)
        : [],
    [state.credentials, selectedOrg],
  );

  const detailCredential = useMemo(
    () => state.credentials.find((item) => item.id === detailCredentialId) ?? null,
    [state.credentials, detailCredentialId],
  );

  const verificationReport: VerificationReport | null = useMemo(() => {
    if (activePackage) {
      return verifyCredentialPackage(state, activePackage, {
        uploadedPdfSha256: uploadedFileHash,
      });
    }
    if (submittedCode.trim()) {
      return verifyCredential(state, submittedCode, { uploadedPdfSha256: uploadedFileHash });
    }
    return null;
  }, [state, activePackage, submittedCode, uploadedFileHash]);

  function showNotice(tone: NoticeBanner["tone"], message: string) {
    setNoticeHovered(false);
    setNotice((prev) => ({
      id: Math.max(Date.now(), (prev?.id ?? 0) + 1),
      tone,
      message,
    }));
  }

  function getOrganizationName(orgId: string): string {
    return state.organizations.find((o) => o.id === orgId)?.displayName ?? orgId;
  }

  function selectCredentialForVerify(credential: Credential) {
    const pkg = buildCredentialPackage(state, credential.id);
    setLookupCode(credential.code);
    setSubmittedCode(credential.code);
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
    setSubmittedCode(normalized);
    if (!normalized) {
      setActivePackage(null);
      setInspectorJsonText("");
      return;
    }
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

  function handleInspectorTextChange(text: string) {
    setInspectorJsonText(text);
    if (!text.trim()) {
      setJsonParseError(null);
      setActivePackage(null);
      return;
    }
    try {
      const parsed = JSON.parse(text) as CredentialPackage;
      if (!parsed || typeof parsed !== "object" || !parsed.payload || !parsed.anchor) {
        setJsonParseError("Cấu trúc JSON thiếu trường bắt buộc (payload, anchor, proof).");
        return;
      }
      setJsonParseError(null);
      setActivePackage(parsed);
    } catch {
      setJsonParseError("Cú pháp JSON không hợp lệ.");
    }
  }

  async function handleJsonFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setInspectorJsonText(content);
    setVerifierMode("inspector");
    try {
      const parsed = JSON.parse(content) as CredentialPackage;
      if (!parsed.payload || !parsed.anchor || !parsed.proof) {
        setJsonParseError("File JSON không đúng định dạng gói chứng chỉ (payload, anchor, proof).");
        return;
      }
      setJsonParseError(null);
      setActivePackage(parsed);
      setLookupCode(parsed.payload.credentialId);
      setSubmittedCode(parsed.payload.credentialId);
      showNotice("success", `Đã nạp gói chứng chỉ từ file "${file.name}".`);
    } catch {
      setJsonParseError("Không thể phân tích cú pháp JSON từ file đã chọn.");
    }
  }

  async function handleAttachmentFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const digest = await computeFileSha256Hex(file);
      setUploadedFileName(file.name);
      setUploadedFileHash(digest);
      showNotice(
        "success",
        `Đã tính SHA-256 cho file "${file.name}": ${shortHash(digest, 14, 10)}`,
      );
    } catch (err) {
      showNotice(
        "danger",
        err instanceof Error
          ? err.message
          : "Không thể tính SHA-256 cho tệp tin đã chọn.",
      );
    }
  }

  function handleEnterConsoleWithRole(nextRole: UserRole, nextOrgId?: string) {
    setRole(nextRole);
    if (nextOrgId) {
      setSelectedOrgId(nextOrgId);
    }
    const hasOrgs = state.organizations.length > 0;
    setConsolePage(nextRole === "SYSTEM_ADMIN" || !hasOrgs ? "admin" : "overview");
    setSurfaceMode("console");
    showNotice("success", `Đã mở Cổng Quản lý với vai trò: ${roleLabels[nextRole]}.`);
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

  function openRevokeModal(credential: Credential) {
    setRevokeTarget(credential);
    setRevokeReasonText("");
  }

  function handleConfirmRevoke(event: FormEvent) {
    event.preventDefault();
    if (!revokeTarget || !revokeReasonText.trim()) return;
    const nextState = revokeCredential(state, revokeTarget.id, revokeReasonText);
    setState(nextState);
    const updatedPkg = buildCredentialPackage(nextState, revokeTarget.id);
    if (activePackage?.payload.credentialId === revokeTarget.batchEntryId) {
      setActivePackage(updatedPkg);
      setInspectorJsonText(updatedPkg ? JSON.stringify(updatedPkg, null, 2) : "");
    }
    setRevokeTarget(null);
    setRevokeReasonText("");
    showNotice("warning", `Đã thu hồi chứng chỉ ${revokeTarget.code} trên sổ đăng ký On-chain.`);
  }

  function openReissueModal(credential: Credential) {
    setReissueTarget(credential);
    setReissueName(credential.holder);
    setReissueResultText(credential.score);
    setReissueExpiresAt(credential.expiresAt ? credential.expiresAt.slice(0, 10) : "");
    setReissueReason("");
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
    setSubmittedCode(res.newCredential.code);
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
      {surfaceMode === "public" && (
        <>
          <PublicHeader
            publicPage={publicPage}
            activeOrgsCount={state.organizations.filter((o) => o.status === "ACTIVE").length}
            issuedCredsCount={state.credentials.filter((c) => c.status === "ISSUED").length}
            confirmedBatchesCount={state.batches.filter((b) => b.status === "CONFIRMED").length}
            headerQuickCode={headerQuickCode}
            onHeaderQuickCodeChange={setHeaderQuickCode}
            onHeaderQuickSubmit={handleHeaderQuickSubmit}
            onNavigatePublic={setPublicPage}
            onOpenAuthGate={() => setSurfaceMode("auth-gate")}
          />

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
                  onInspectorTextChange={handleInspectorTextChange}
                  onJsonFileUpload={handleJsonFileUpload}
                  onAttachmentFileUpload={handleAttachmentFileUpload}
                  onClearAttachment={() => {
                    setUploadedFileName(null);
                    setUploadedFileHash(undefined);
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

              {publicPage === "standards" && <PublicStandardsView />}
            </div>
          </main>

          <PublicFooter
            primaryChain={primaryChain}
            onNavigatePublic={setPublicPage}
            onOpenRoleGate={(chosenRole) => {
              setRole(chosenRole);
              setSurfaceMode("auth-gate");
            }}
          />
        </>
      )}

      {surfaceMode === "auth-gate" && (
        <RoleSwitcherGateView
          state={state}
          selectedRole={role}
          selectedOrgId={selectedOrgId}
          onSelectRole={setRole}
          onSelectOrgId={setSelectedOrgId}
          onContinue={(chosenRole, chosenOrgId) =>
            handleEnterConsoleWithRole(chosenRole, chosenOrgId)
          }
          onBackToPublic={() => setSurfaceMode("public")}
        />
      )}

      {surfaceMode === "console" && (
        <div className="console-shell">
          <ConsoleSidebar
            consolePage={consolePage}
            role={role}
            organizations={state.organizations}
            selectedOrg={selectedOrg}
            activeOrgWallet={activeOrgWallet}
            orgBatchesCount={orgBatches.length}
            orgCredentialsCount={orgCredentials.length}
            catalogCount={orgCourses.length + orgLearners.length}
            eventsCount={state.events.length}
            primaryChain={primaryChain}
            onSelectConsolePage={setConsolePage}
            onSelectOrganization={(nextOrgId) => {
              setSelectedOrgId(nextOrgId);
              const firstBatch = state.batches.find((b) => b.organizationId === nextOrgId);
              setSelectedBatchId(firstBatch?.id ?? "");
            }}
            onSwitchRole={() => setSurfaceMode("auth-gate")}
            onBackToPublic={() => setSurfaceMode("public")}
          />

          <div className="app-workspace">
            <ConsoleTopbar
              consolePage={consolePage}
              selectedOrg={selectedOrg}
              headerQuickCode={headerQuickCode}
              onHeaderQuickCodeChange={setHeaderQuickCode}
              onHeaderQuickSubmit={handleHeaderQuickSubmit}
              onNavigateOverview={() => setConsolePage("overview")}
            />

            <main className="workspace-main">
              {(consolePage === "overview" ||
                consolePage === "batches" ||
                consolePage === "credentials" ||
                consolePage === "catalog") &&
                !selectedOrg && (
                  <div className="panel-card">
                    <span className="eyebrow">CHƯA CÓ ĐƠN VỊ ĐÀO TẠO TRONG HỆ THỐNG</span>
                    <h2>Vui lòng đăng ký Tổ chức Đào tạo trước khi vận hành phát hành</h2>
                    <p className="panel-desc">
                      Hệ thống hiện đang ở trạng thái khởi tạo sạch (0 tổ chức, 0 khóa học, 0 lô
                      chứng chỉ). Hãy chuyển sang mục <strong>Tổ chức &amp; Ví EVM (Admin)</strong>{" "}
                      để đăng ký đơn vị đào tạo đầu tiên, kích hoạt trạng thái{" "}
                      <code>ACTIVE</code> và cấp phép địa chỉ ví EVM phát hành.
                    </p>
                    <div className="button-row">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setRole("SYSTEM_ADMIN");
                          setConsolePage("admin");
                        }}
                      >
                        Mở Quản trị Tổ chức & Ví EVM (UC-01) →
                      </button>
                    </div>
                  </div>
                )}

              {consolePage === "overview" && selectedOrg && (
                <ConsoleOverviewView
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
                    onOpenRevokeModal={openRevokeModal}
                    onOpenReissueModal={openReissueModal}
                  />
                )}

              {consolePage === "admin" && (
                <SystemAdminPortal
                  state={state}
                  role={role}
                  onSwitchRole={() => setRole("SYSTEM_ADMIN")}
                  onStateChange={(nextState, createdOrgId) => {
                    setState(nextState);
                    if (createdOrgId && !selectedOrgId) {
                      setSelectedOrgId(createdOrgId);
                    }
                  }}
                  onNotify={showNotice}
                />
              )}

              {consolePage === "events" && <AuditTrailPortal state={state} />}
            </main>
          </div>
        </div>
      )}

      {detailCredential && (
        <CredentialDetailModal
          credential={detailCredential}
          state={state}
          organizationName={getOrganizationName(detailCredential.organizationId)}
          onClose={() => setDetailCredentialId(null)}
          onSendToVerify={selectCredentialForVerify}
        />
      )}

      {publishIntentModal && (
        <PublishBatchModal
          intent={publishIntentModal}
          onClose={() => setPublishIntentModal(null)}
          onSignAndSubmit={handleSignAndSubmitIntent}
        />
      )}

      {revokeTarget && (
        <RevokeCredentialModal
          target={revokeTarget}
          reasonText={revokeReasonText}
          onReasonChange={setRevokeReasonText}
          onClose={() => setRevokeTarget(null)}
          onSubmit={handleConfirmRevoke}
        />
      )}

      {reissueTarget && (
        <ReissueCredentialModal
          target={reissueTarget}
          holderName={reissueName}
          resultText={reissueResultText}
          expiresAt={reissueExpiresAt}
          reason={reissueReason}
          onHolderNameChange={setReissueName}
          onResultTextChange={setReissueResultText}
          onExpiresAtChange={setReissueExpiresAt}
          onReasonChange={setReissueReason}
          onClose={() => setReissueTarget(null)}
          onSubmit={handleConfirmReissue}
        />
      )}

      <ToastViewport
        notice={notice}
        noticeHovered={noticeHovered}
        onHoverChange={setNoticeHovered}
        onDismiss={() => {
          setNotice(null);
          setNoticeHovered(false);
        }}
      />
    </div>
  );
}

export default App;

import type {
  AppState,
  BatchEntry,
  Credential,
  IssuerSubTab,
  NoticeBanner,
  UserRole,
} from "../../domain";
import { IssuerBatchesTab } from "./IssuerBatchesTab";
import { IssuerCatalogTab } from "./IssuerCatalogTab";
import { IssuerCredentialsTab } from "./IssuerCredentialsTab";

interface IssuerPortalProps {
  state: AppState;
  role: UserRole;
  subTab: IssuerSubTab;
  onSubTabChange: (tab: IssuerSubTab) => void;
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

export function IssuerPortal({
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
        <IssuerBatchesTab
          state={state}
          role={role}
          selectedOrg={selectedOrg}
          orgCourses={orgCourses}
          orgLearners={orgLearners}
          orgBatches={orgBatches}
          selectedBatch={selectedBatch}
          selectedBatchEntries={selectedBatchEntries}
          onSelectBatch={onSelectBatch}
          onSubTabChange={onSubTabChange}
          onStateChange={onStateChange}
          onNotify={onNotify}
          onOpenPublishModal={onOpenPublishModal}
          onSelectCredentialForVerify={onSelectCredentialForVerify}
          onOpenCredentialDetail={onOpenCredentialDetail}
        />
      )}

      {subTab === "credentials" && (
        <IssuerCredentialsTab
          state={state}
          selectedOrg={selectedOrg}
          orgCredentials={orgCredentials}
          onSelectCredentialForVerify={onSelectCredentialForVerify}
          onOpenCredentialDetail={onOpenCredentialDetail}
          onOpenRevokeModal={onOpenRevokeModal}
          onOpenReissueModal={onOpenReissueModal}
        />
      )}

      {subTab === "catalog" && (
        <IssuerCatalogTab
          state={state}
          selectedOrg={selectedOrg}
          orgCourses={orgCourses}
          orgLearners={orgLearners}
          onStateChange={onStateChange}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}

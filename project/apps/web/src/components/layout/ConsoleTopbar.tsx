import type { FormEvent } from "react";
import {
  consolePageLabels,
  organizationStatusLabels,
  type ConsolePage,
  type Organization,
} from "../../domain";

interface ConsoleTopbarProps {
  consolePage: ConsolePage;
  selectedOrg: Organization | null;
  headerQuickCode: string;
  onHeaderQuickCodeChange: (value: string) => void;
  onHeaderQuickSubmit: (event: FormEvent) => void;
  onNavigateOverview: () => void;
}

export function ConsoleTopbar({
  consolePage,
  selectedOrg,
  headerQuickCode,
  onHeaderQuickCodeChange,
  onHeaderQuickSubmit,
  onNavigateOverview,
}: ConsoleTopbarProps) {
  return (
    <header className="workspace-topbar">
      <div className="workspace-topbar-left">
        <div className="breadcrumb-trail">
          <button type="button" className="breadcrumb-link" onClick={onNavigateOverview}>
            Cổng Quản lý
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{consolePageLabels[consolePage]}</span>
        </div>
        {selectedOrg && (
          <>
            <span className="status-pill tone-info">{selectedOrg.code}</span>
            <span
              className={`status-pill ${
                selectedOrg.status === "ACTIVE" ? "tone-valid" : "tone-warn"
              }`}
            >
              {organizationStatusLabels[selectedOrg.status]}
            </span>
          </>
        )}
      </div>

      <div className="workspace-topbar-right">
        <form className="header-search-form" onSubmit={onHeaderQuickSubmit}>
          <input
            type="text"
            className="header-search-input"
            value={headerQuickCode}
            onChange={(event) => onHeaderQuickCodeChange(event.target.value)}
            placeholder="Kiểm tra nhanh mã chứng chỉ..."
          />
          <button type="submit" className="header-search-btn">
            Xác thực ↗
          </button>
        </form>
      </div>
    </header>
  );
}

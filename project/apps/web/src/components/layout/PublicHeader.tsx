import type { FormEvent } from "react";
import { publicPageLabels, type PublicPage } from "../../domain";
import { BrandLogo } from "../ui/BrandLogo";

interface PublicHeaderProps {
  publicPage: PublicPage;
  activeOrgsCount: number;
  issuedCredsCount: number;
  confirmedBatchesCount: number;
  headerQuickCode: string;
  onHeaderQuickCodeChange: (value: string) => void;
  onHeaderQuickSubmit: (event: FormEvent) => void;
  onNavigatePublic: (page: PublicPage) => void;
  onOpenAuthGate: () => void;
}

export function PublicHeader({
  publicPage,
  activeOrgsCount,
  issuedCredsCount,
  confirmedBatchesCount,
  headerQuickCode,
  onHeaderQuickCodeChange,
  onHeaderQuickSubmit,
  onNavigatePublic,
  onOpenAuthGate,
}: PublicHeaderProps) {
  return (
    <>
      <header className="site-header">
        <div className="site-container site-header-inner">
          <div className="header-brand-group">
            <button
              type="button"
              className="brand-home-link"
              onClick={() => onNavigatePublic("home")}
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
              onClick={() => onNavigatePublic("home")}
            >
              Trang chủ
            </button>
            <button
              type="button"
              className={publicPage === "verifier" ? "nav-item active" : "nav-item"}
              onClick={() => onNavigatePublic("verifier")}
            >
              Xác thực Chứng chỉ
            </button>
            <button
              type="button"
              className={publicPage === "directory" ? "nav-item active" : "nav-item"}
              onClick={() => onNavigatePublic("directory")}
            >
              Danh bạ Đơn vị Đào tạo
              <span className="nav-counter">{activeOrgsCount}</span>
            </button>
            <button
              type="button"
              className={publicPage === "standards" ? "nav-item active" : "nav-item"}
              onClick={() => onNavigatePublic("standards")}
            >
              Chuẩn Kỹ thuật & Mật mã
            </button>
          </nav>

          <div className="header-actions">
            <form className="header-search-form" onSubmit={onHeaderQuickSubmit}>
              <input
                type="text"
                className="header-search-input"
                value={headerQuickCode}
                onChange={(event) => onHeaderQuickCodeChange(event.target.value)}
                placeholder="Tra nhanh mã chứng chỉ..."
                aria-label="Tra nhanh mã chứng chỉ"
              />
              <button type="submit" className="header-search-btn">
                Tra cứu
              </button>
            </form>

            <button
              type="button"
              className="btn-primary header-portal-cta"
              onClick={onOpenAuthGate}
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
              onClick={() => onNavigatePublic("home")}
            >
              Website Công khai
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{publicPageLabels[publicPage]}</span>
          </div>

          <div className="breadcrumb-meta">
            <span>
              Trạng thái sổ: <strong>{issuedCredsCount} chứng chỉ hiệu lực</strong>
            </span>
            <span className="system-divider" />
            <span>
              Lô đã neo: <strong>{confirmedBatchesCount} lô Merkle</strong>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

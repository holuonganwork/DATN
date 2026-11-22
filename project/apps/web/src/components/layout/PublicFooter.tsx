import type { PublicPage, TrustedChain, UserRole } from "../../domain";
import { shortHash } from "../../services";
import { BrandLogo } from "../ui/BrandLogo";

interface PublicFooterProps {
  primaryChain: TrustedChain;
  onNavigatePublic: (page: PublicPage) => void;
  onOpenRoleGate: (role: UserRole) => void;
}

export function PublicFooter({
  primaryChain,
  onNavigatePublic,
  onOpenRoleGate,
}: PublicFooterProps) {
  return (
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
              Hệ thống phát hành và xác thực chứng chỉ đào tạo tích hợp Blockchain. Dữ liệu cá nhân
              được bảo vệ ngoài chuỗi (off-chain), chỉ neo mã băm Merkle Root và trạng thái xác
              thực bất biến lên hợp đồng thông minh EVM.
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
                <button type="button" onClick={() => onNavigatePublic("home")}>
                  Trang chủ & Tra cứu nhanh
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePublic("verifier")}>
                  Cổng Xác thực Chứng chỉ (UC-09)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePublic("directory")}>
                  Danh bạ Đơn vị Đào tạo được cấp phép
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigatePublic("standards")}>
                  Chuẩn Kỹ thuật & Mật mã học
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Cổng Quản lý Nội bộ</h4>
            <ul className="footer-links">
              <li>
                <button type="button" onClick={() => onOpenRoleGate("ISSUER_OPERATOR")}>
                  Dành cho Chuyên viên Phát hành
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onOpenRoleGate("ISSUER_APPROVER")}>
                  Dành cho Người Duyệt & Ký số EVM
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onOpenRoleGate("SYSTEM_ADMIN")}>
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
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 CertChain Registry — Đồ án Tốt nghiệp: Hệ thống phát hành và xác thực chứng chỉ
            đào tạo tích hợp Blockchain.
          </span>
          <span>Thiết kế theo chuẩn DESIGN.md (Academic Azure · Bright Marine)</span>
        </div>
      </div>
    </footer>
  );
}

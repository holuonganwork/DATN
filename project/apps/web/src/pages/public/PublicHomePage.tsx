import type { FormEvent } from "react";
import { BrandLogo } from "../../components/ui/BrandLogo";
import {
  buildCredentialPackage,
  credentialStatusLabels,
  type AppState,
  type Credential,
  type PublicPage,
} from "../../domain";
import { downloadCredentialPackageJson, shortHash } from "../../services";

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

export function PublicHomeView({
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
    if (!lookupCode.trim()) {
      onNavigatePublic("verifier");
      return;
    }
    onQuickVerify(lookupCode);
  }

  return (
    <div className="home-view">
      <section className="hero-banner">
        <div className="hero-main-col">
          <div className="hero-badge-row">
            <span className="hero-protocol-pill">ACADEMIC AZURE DESIGN · CERTCHAIN</span>
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
                placeholder="Nhập mã định danh chứng chỉ để tra cứu..."
                aria-label="Mã chứng chỉ cần xác thực"
              />
            </div>
            <button type="submit" className="btn-primary hero-submit-btn">
              Xác thực Ngay →
            </button>
          </form>
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
                    chi phí giao dịch trên chuỗi.
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
              <button type="button" className="btn-primary btn-sm" onClick={onOpenAuthGate}>
                Vào Cổng Quản lý Đơn vị →
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="kpi-grid-4">
        <article className="kpi-card">
          <span className="kpi-label">ĐƠN VỊ ĐÀO TẠO ĐƯỢC CẤP PHÉP</span>
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
              Người kiểm tra nhập mã định danh chứng chỉ hoặc tải lên tệp <code>.json</code> kèm
              bản <code>.pdf</code> do người sở hữu chứng chỉ cung cấp.
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
              {state.credentials.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state-cell">
                      <strong>Chưa có chứng chỉ nào được phát hành trên sổ đăng ký.</strong>
                      <span>
                        Dữ liệu sẽ hiển thị tại đây sau khi đơn vị đào tạo đóng băng lô và xác nhận
                        giao dịch phát hành.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                state.credentials.slice(0, 6).map((cred) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

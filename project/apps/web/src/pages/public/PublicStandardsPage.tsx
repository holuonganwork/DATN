export function PublicStandardsView() {
  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">ĐẶC TẢ GIAO THỨC & MẬT MÃ HỌC</span>
          <h1>Chuẩn Kỹ thuật Xác thực Chứng chỉ Đào tạo trên Blockchain</h1>
        </div>
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

      <div className="panel-card">
        <div className="panel-head">
          <div>
            <span className="eyebrow">LƯỢC ĐỒ GÓI CHỨNG CHỈ ĐỘC LẬP (CREDENTIAL PACKAGE SCHEMA)</span>
            <h2>Cấu trúc chuẩn của tệp JSON tự chứa (Payload + Anchor + Proof)</h2>
          </div>
        </div>
        <pre className="code-pre-block">
          {JSON.stringify(
            {
              payload: {
                credentialId: "<string>",
                issuerId: "<string>",
                holder: "<string (NFC normalized)>",
                courseId: "<string>",
                courseName: "<string>",
                result: "<string>",
                issuedAt: "<ISO-8601 UTC>",
                expiresAt: "<ISO-8601 UTC | null>",
                nonce: "<string>",
                pdfSha256: "<0x + 64 hex chars>",
              },
              anchor: {
                chainId: 31337,
                registryAddress: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
                batchId: "<string>",
                issuerId: "<string>",
              },
              proof: {
                leaf: "<0x + 64 hex chars>",
                path: ["<0x + 64 hex chars>"],
                root: "<0x + 64 hex chars>",
              },
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

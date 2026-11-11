# API contract ban đầu

API dùng JSON, version trong path `/v1`, lỗi có mã ổn định và `correlationId`. Các endpoint cần quyền đều kiểm tra role và organization scope.

## Quy ước phản hồi

```json
{
  "data": {},
  "meta": { "correlationId": "..." }
}
```

```json
{
  "error": {
    "code": "BATCH_NOT_MUTABLE",
    "message": "Batch đã đóng băng",
    "details": {}
  },
  "meta": { "correlationId": "..." }
}
```

Mã lỗi tối thiểu: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `IDEMPOTENCY_CONFLICT`, `BATCH_NOT_MUTABLE`, `WALLET_NOT_AUTHORIZED`, `CHAIN_MISMATCH`, `RECEIPT_NOT_CONFIRMED`, `VERIFICATION_INDETERMINATE`.

## Endpoint MVP

| Method | Path | Mục đích | Quyền |
| --- | --- | --- | --- |
| POST | `/v1/issuers` | Tạo tổ chức chờ xác minh | SYSTEM_ADMIN |
| POST | `/v1/issuers/{id}/wallets` | Ủy quyền ví | SYSTEM_ADMIN |
| PATCH | `/v1/issuers/{id}/status` | Kích hoạt/khóa tổ chức | SYSTEM_ADMIN |
| POST | `/v1/courses` | Tạo khóa học | ISSUER_OPERATOR |
| POST | `/v1/learners/import` | Nhập học viên | ISSUER_OPERATOR |
| POST | `/v1/batches` | Tạo batch `DRAFT` | ISSUER_OPERATOR |
| POST | `/v1/batches/{id}/entries` | Thêm/sửa dòng khi chưa freeze | ISSUER_OPERATOR |
| POST | `/v1/batches/{id}/validate` | Chuẩn hóa và kiểm tra | ISSUER_OPERATOR |
| POST | `/v1/batches/{id}/approve` | Duyệt batch | ISSUER_APPROVER |
| POST | `/v1/batches/{id}/freeze` | Đóng băng root | ISSUER_APPROVER |
| POST | `/v1/batches/{id}/publish-intent` | Tạo calldata và context tin cậy | ISSUER_OPERATOR |
| POST | `/v1/chain-submissions` | Ghi nhận tx hash đã gửi | ISSUER_OPERATOR |
| GET | `/v1/batches/{id}` | Xem trạng thái và lỗi | issuer scope |
| GET | `/v1/credentials/{code}/package` | Lấy gói đã xác nhận | holder/share policy |
| POST | `/v1/verifications` | Xác minh qua API tùy chọn | public |
| POST | `/v1/credentials/{id}/revoke-intent` | Tạo lệnh thu hồi | ISSUER_OPERATOR |
| POST | `/v1/credentials/{id}/reissue` | Tạo credential mới | ISSUER_OPERATOR |
| GET | `/v1/audit` | Tra cứu lịch sử | AUDITOR/SYSTEM_ADMIN |

## Publish intent và submission

`POST /v1/batches/{id}/publish-intent` trả `202`:

```json
{
  "data": {
    "batchId": "batch_01...",
    "chainId": 31337,
    "registryAddress": "0x...",
    "issuerId": "issuer_01...",
    "merkleRoot": "0x...",
    "calldata": "0x...",
    "idempotencyKey": "...",
    "status": "AWAITING_SIGNATURE"
  }
}
```

Frontend hiển thị context, để ví issuer ký/gửi rồi gọi `POST /v1/chain-submissions`:

```json
{
  "batchId": "batch_01...",
  "txHash": "0x...",
  "chainId": 31337,
  "registryAddress": "0x..."
}
```

Backend chỉ ghi nhận submission và chuyển sang `SUBMITTED`; worker phải kiểm tra receipt/event trước khi `CONFIRMED`.

## Verification response

```json
{
  "data": {
    "result": "VALID",
    "checks": [
      { "name": "schema", "status": "PASS" },
      { "name": "trusted_chain", "status": "PASS" },
      { "name": "payload_digest", "status": "PASS" },
      { "name": "merkle_proof", "status": "PASS" },
      { "name": "on_chain_anchor", "status": "PASS" },
      { "name": "revocation", "status": "PASS" },
      { "name": "pdf_sha256", "status": "PASS" }
    ],
    "credentialId": "cred_01...",
    "issuerId": "issuer_01...",
    "batchId": "batch_01..."
  }
}
```

Nếu RPC timeout hoặc thiếu trạng thái bắt buộc, `result` là `INDETERMINATE` và check tương ứng là `UNAVAILABLE`; API không trả `VALID`.

## API không được làm

- Không nhận hoặc lưu private key issuer.
- Không nhận PDF/PII trong calldata publish/revoke.
- Không chuyển `SUBMITTED` thành `CONFIRMED` dựa trên txHash.
- Không cho sửa batch sau `FROZEN`.
- Không cho verifier public đọc learner record ngoài payload đã phát hành.

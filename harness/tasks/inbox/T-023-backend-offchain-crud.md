# T-023: Backend nghiệp vụ off-chain (NestJS + Prisma + PostgreSQL)

## Mục tiêu
Xây dựng ứng dụng Backend `project/apps/api` sử dụng NestJS, Prisma và PostgreSQL (qua Docker Compose) cho toàn bộ nghiệp vụ CRUD off-chain của hệ thống phát hành và xác thực chứng chỉ đào tạo, chưa tích hợp blockchain:
1. Xác thực & phân quyền JWT (4 vai trò: `SYSTEM_ADMIN`, `ISSUER_OPERATOR`, `ISSUER_APPROVER`, `AUDITOR`), kiểm tra phạm vi tổ chức (`organizationId`) và trạng thái tổ chức `ACTIVE`.
2. Quản lý tổ chức phát hành (`/v1/issuers` và danh bạ công khai `/v1/public/issuers`), tài khoản người dùng (`/v1/users`), khóa học (`/v1/courses`) và học viên (`/v1/learners`).
3. Quy trình Batch theo state machine (`DRAFT → VALIDATED → APPROVED → FROZEN → PENDING_CHAIN → CONFIRMED / FAILED`), chỉnh sửa từng dòng (JSON), kiểm tra hợp lệ từng dòng, đóng băng Merkle root.
4. Module `credential-core` thuần TypeScript tính chuẩn hóa NFC + JCS (RFC 8785), `payloadDigest = keccak256`, leaf/Merkle root/proof bằng `@openzeppelin/merkle-tree` và sinh mã `CERT-XXXX-XXXX`.
5. `IssuancePort` với `OffChainIssuanceAdapter` xử lý phát hành/thu hồi off-chain (có thể thay thế bằng adapter blockchain ở task sau mà không đổi controller hoặc contract API).
6. Thu hồi chứng chỉ (`ISSUED → REVOKED` kèm lý do), cấp lại chứng chỉ (tạo batch 1 dòng `CONFIRMED`, bản cũ `ISSUED → SUPERSEDED`), tra cứu gói JSON và xác thực công khai (`GET /v1/public/credentials/:code`, `POST /v1/verifications`).
7. Audit log cho mọi thao tác ghi (đã redact dữ liệu nhạy cảm), `X-Correlation-Id` trên mọi request/response và `Idempotency-Key` cho `publish`, `revoke`, `reissue`.

## Phạm vi cho phép
- `project/apps/api/`
- `project/infra/`
- `project/docs/decisions/`
- `project/docs/api-contract.md`
- `harness/context/current-state.md`

## Ngoài phạm vi
- Smart contract, EVM RPC, ví issuer (`issuer_wallets`), event indexer (`chain_events`).
- Xử lý/upload PDF (`pdfSha256 = null`), import CSV hàng loạt, nối Frontend `project/apps/web`.

## Tiêu chí hoàn thành
- `AC-1`: Schema Prisma + migration SQL ban đầu + seed chạy thành công trên PostgreSQL Docker (`5433`).
- `AC-2`: Toàn bộ endpoint nghiệp vụ, auth/RBAC/org-scope, state machine batch, `credential-core` (JCS + keccak256 + Merkle), phát hành/thu hồi/cấp lại qua `IssuancePort`, xác thực công khai, audit log và idempotency hoạt động đúng đặc tả.
- `AC-3`: Unit test (`credential-core`, `batch.policy`, `verification`), E2E Supertest trên `certchain_test`, `format:check`, `lint`, `typecheck`, `build` và `git diff --check` đều PASS.

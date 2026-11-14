# CertChain API — Backend Nghiệp vụ Off-Chain (`T-023`)

Backend API cho hệ thống phát hành, quản lý, thu hồi, cấp lại và xác thực chứng chỉ đào tạo tích hợp blockchain (phiên bản nghiệp vụ off-chain sử dụng NestJS, Prisma và PostgreSQL 16).

> [!NOTE]
> Module blockchain (EVM RPC, smart contract, ký ví, indexer) được tách sau lớp trừu tượng `IssuancePort` (`OffChainIssuanceAdapter` hiện tại) để tích hợp ở task tiếp theo mà không làm thay đổi mô hình nghiệp vụ lõi.

## Kiến trúc & Module chính

- `src/modules/credential-core/`: thư viện TypeScript thuần (không phụ thuộc Nest/Prisma) xử lý chuẩn hóa Unicode NFC + JCS (RFC 8785), tính `keccak256` payload digest, tạo/kiểm tra `StandardMerkleTree` (`@openzeppelin/merkle-tree`), và sinh mã chứng chỉ Crockford Base32 (`CERT-XXXX-XXXX`).
- `src/modules/issuance/`: định nghĩa cổng `IssuancePort` (`ISSUANCE_PORT`) và `OffChainIssuanceAdapter`.
- `src/modules/auth/` & `src/modules/users/`: xác thực JWT Bearer, RBAC 4 vai trò (`SYSTEM_ADMIN`, `ISSUER_OPERATOR`, `ISSUER_APPROVER`, `AUDITOR`), khóa phạm vi tổ chức (`organizationId`).
- `src/modules/organizations/`, `courses/`, `learners/`: quản lý đơn vị phát hành (`/v1/issuers`, `/v1/public/issuers`), khóa học và hồ sơ học viên.
- `src/modules/batches/`: quy trình lô chứng chỉ `DRAFT -> VALIDATED -> APPROVED -> FROZEN -> PENDING_CHAIN -> CONFIRMED / FAILED`.
- `src/modules/credentials/`: tra cứu chứng chỉ, xuất gói JSON (`/package`), thu hồi (`REVOKED`), cấp lại (`SUPERSEDED -> ISSUED` trong batch mới 1 bản ghi).
- `src/modules/verification/`: xác thực công khai qua mã (`GET /v1/public/credentials/:code`) và gói JSON (`POST /v1/verifications`).
- `src/modules/audit/`: nhật ký thao tác bất biến đã ẩn dữ liệu nhạy cảm (`AuditLog`), gắn `X-Correlation-Id`.

## Biến môi trường

Không commit hoặc tạo tệp `.env` trong repository. Cấu hình qua biến môi trường hệ điều hành (có giá trị mặc định an toàn cho phát triển cục bộ):

| Biến | Mặc định (Dev) | Mô tả |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `3000` | Cổng HTTP của API server |
| `DATABASE_URL` | `postgresql://certuser:certdb@localhost:5433/certchain_dev?schema=public` | Chuỗi kết nối PostgreSQL 16 |
| `JWT_SIGNING_KEY` | Khóa dev cục bộ (`dev-jwt-signing-key-local-32b`) | Chuỗi ký JWT (>= 16 ký tự) |
| `JWT_EXPIRES_IN` | `8h` | Thời hạn JWT access token |
| `ANCHOR_CHAIN_ID` | `31337` | Chain ID neo giữ chỗ cho cấu trúc anchor |
| `ANCHOR_REGISTRY_ADDRESS` | `0x0000000000000000000000000000000000000000` | Địa chỉ registry giữ chỗ off-chain |
| `WEB_ORIGIN` | `http://localhost:5173` | Origin được phép CORS (hỗ trợ nhiều giá trị cách nhau dấu phẩy) |
| `ISSUANCE_MODE` | `offchain` | Chế độ phát hành (`offchain`) |

## Khởi chạy cục bộ

### 1. Khởi động PostgreSQL 16 (Docker Compose)

Postgres lắng nghe trên host port `5433` và tự động tạo cả hai cơ sở dữ liệu `certchain_dev` và `certchain_test` từ `project/infra/postgres/init.sql`:

```powershell
cd project/infra
docker compose up -d --wait
```

### 2. Cài đặt dependencies & migrate database

```powershell
cd project/apps/api
npm install
npx prisma migrate dev
```

### 3. Seed dữ liệu khởi tạo

Seed chỉ tạo tài khoản `SYSTEM_ADMIN` (`admin@certchain.local`), hoặc thêm dữ liệu mẫu demo với cờ `--demo`:

```powershell
npm run db:seed
# Hoặc kèm tổ chức & người dùng mẫu:
npm run db:seed -- --demo
```

> Có thể truyền mật khẩu khởi tạo qua biến môi trường `SEED_ADMIN_PASS` và `SEED_DEMO_PASS` trước khi chạy seed.

### 4. Chạy API server & Swagger

```powershell
npm run start:dev
```

- Health check: `GET http://localhost:3000/v1/health`
- Swagger UI: `http://localhost:3000/docs`

## Kiểm thử & Quality Gates

```powershell
cd project/apps/api
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Lệnh `npm run test:e2e` tự động trỏ `DATABASE_URL` vào database riêng `certchain_test`, chạy `prisma migrate deploy` và thực thi toàn bộ kịch bản Supertest trên dữ liệu thật.

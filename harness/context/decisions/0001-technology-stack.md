# Quyết định 0001 — Ngăn xếp công nghệ

**Trạng thái:** Đề xuất, cần chốt trước khi triển khai

## Quyết định

- Frontend: Next.js, React, TypeScript, Tailwind CSS và kết nối ví.
- Backend: NestJS, TypeScript, PostgreSQL và Prisma.
- Blockchain: Solidity, OpenZeppelin Contracts, Foundry, Anvil và viem; Base Sepolia dùng cho bản demo nếu được chọn.
- Lõi chứng chỉ: JCS, Keccak-256, SHA-256 và Merkle tree/proof tương thích giữa TypeScript và Solidity.
- Tác vụ nền: Redis và BullMQ cho worker/indexer.
- Kiểm thử và quan sát: Foundry, Vitest, Playwright, k6, Pino, Prometheus, Grafana và Docker Compose khi cần.

## Lý do

Ngăn xếp này phù hợp với kiến trúc modular monolith, có thư viện hỗ trợ EVM và đủ khả năng kiểm thử end-to-end trong thời hạn đồ án 10 tuần.

## Ràng buộc

Quy tắc chuẩn hóa payload, hash và leaf phải được định nghĩa trong package dùng chung trước khi tích hợp contract.

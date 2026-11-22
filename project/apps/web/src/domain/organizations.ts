import { TRUSTED_CHAINS } from "./constants";
import { isValidEvmAddress, normalizeAddress, normalizeText } from "./crypto";
import { appendAuditEvent } from "./helpers";
import type { AppState, IssuerWallet, Organization, OrganizationStatus } from "./types";

// UC-01: System Admin — Register Organization, Update Status, Authorize Wallet
export const registerOrganization = (
  state: AppState,
  input: { code: string; legalName: string; displayName: string; verificationRef: string },
): { state: AppState; organization?: Organization; error?: string } => {
  const code = normalizeText(input.code).toUpperCase();
  const legalName = normalizeText(input.legalName);
  const displayName = normalizeText(input.displayName);
  const verificationRef = normalizeText(input.verificationRef);

  if (!code || !legalName || !displayName || !verificationRef) {
    return {
      state,
      error: "Vui lòng nhập đầy đủ mã tổ chức, tên pháp lý, tên hiển thị và mã hồ sơ xác minh.",
    };
  }
  if (state.organizations.some((org) => org.code.toUpperCase() === code)) {
    return { state, error: `Mã tổ chức ${code} đã tồn tại trong hệ thống.` };
  }

  const nowIso = new Date().toISOString();
  const newOrg: Organization = {
    id: `org_${code.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${state.organizations.length + 1}`,
    code,
    legalName,
    displayName,
    verificationRef,
    status: "PENDING",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return {
    organization: newOrg,
    state: {
      ...state,
      activeOrganizationId: state.activeOrganizationId || newOrg.id,
      organizations: [...state.organizations, newOrg],
      events: appendAuditEvent(state, {
        action: "ORG_REGISTERED",
        actorRole: "SYSTEM_ADMIN",
        actorName: "SYSTEM_ADMIN",
        organizationId: newOrg.id,
        aggregateType: "ORGANIZATION",
        aggregateId: newOrg.id,
        detail: `Đăng ký tổ chức ${displayName} (${code}) ở trạng thái PENDING`,
      }),
    },
  };
};

export const updateOrganizationStatus = (
  state: AppState,
  input: { organizationId: string; nextStatus: OrganizationStatus; reason?: string },
): { state: AppState; error?: string } => {
  const org = state.organizations.find((item) => item.id === input.organizationId);
  if (!org) return { state, error: "Không tìm thấy tổ chức." };

  const nowIso = new Date().toISOString();
  return {
    state: {
      ...state,
      organizations: state.organizations.map((item) =>
        item.id === org.id
          ? { ...item, status: input.nextStatus, updatedAt: nowIso }
          : item,
      ),
      events: appendAuditEvent(state, {
        action: `ORG_STATUS_${input.nextStatus}`,
        actorRole: "SYSTEM_ADMIN",
        actorName: "SYSTEM_ADMIN",
        organizationId: org.id,
        aggregateType: "ORGANIZATION",
        aggregateId: org.id,
        detail: `Chuyển trạng thái ${org.displayName}: ${org.status} → ${input.nextStatus}${input.reason ? ` (${normalizeText(input.reason)})` : ""}`,
      }),
    },
  };
};

export const authorizeOrganizationWallet = (
  state: AppState,
  input: { organizationId: string; chainId: number; address: string },
): { state: AppState; error?: string } => {
  const org = state.organizations.find((item) => item.id === input.organizationId);
  if (!org) return { state, error: "Không tìm thấy tổ chức phát hành." };
  if (org.status !== "ACTIVE") {
    return { state, error: "Chỉ tổ chức ở trạng thái ACTIVE mới được ủy quyền ví phát hành." };
  }
  if (!TRUSTED_CHAINS.some((chain) => chain.chainId === input.chainId)) {
    return { state, error: `Chain ID ${input.chainId} không nằm trong danh sách mạng tin cậy.` };
  }
  if (!isValidEvmAddress(input.address)) {
    return { state, error: "Địa chỉ ví EVM không hợp lệ (cần định dạng 0x kèm 40 ký tự hex)." };
  }

  const normalized = normalizeAddress(input.address);
  const conflict = state.wallets.find(
    (wallet) =>
      wallet.chainId === input.chainId &&
      normalizeAddress(wallet.address) === normalized &&
      wallet.organizationId !== org.id &&
      wallet.status === "AUTHORIZED",
  );
  if (conflict) {
    return {
      state,
      error: "Địa chỉ ví này đang được ủy quyền cho một tổ chức khác trên cùng mạng.",
    };
  }

  const nowIso = new Date().toISOString();
  const updatedWallets = state.wallets.map((wallet) =>
    wallet.organizationId === org.id && wallet.status === "AUTHORIZED"
      ? { ...wallet, status: "REVOKED" as const, revokedAt: nowIso }
      : wallet,
  );

  const newWallet: IssuerWallet = {
    id: `wal_${state.wallets.length + 1}`,
    organizationId: org.id,
    chainId: input.chainId,
    address: normalized,
    status: "AUTHORIZED",
    authorizedAt: nowIso,
    revokedAt: null,
  };

  return {
    state: {
      ...state,
      wallets: [...updatedWallets, newWallet],
      events: appendAuditEvent(state, {
        action: "WALLET_AUTHORIZED",
        actorRole: "SYSTEM_ADMIN",
        actorName: "SYSTEM_ADMIN",
        organizationId: org.id,
        aggregateType: "WALLET",
        aggregateId: newWallet.id,
        detail: `Ủy quyền ví ${normalized} cho ${org.displayName} trên Chain ${input.chainId}`,
      }),
    },
  };
};

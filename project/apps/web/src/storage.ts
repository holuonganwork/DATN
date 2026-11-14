import {
  createInitialState,
  type AppState,
  type CredentialPackage,
} from "./domain";

export const STORAGE_KEY = "certchain.product.state.v2";
const LEGACY_STORAGE_KEYS = ["certchain.product.state.v1"];

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const loadWorkspaceState = (): AppState => {
  if (!isBrowser()) {
    return createInitialState();
  }
  try {
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const empty = createInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
      return empty;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (
      !parsed ||
      !Array.isArray(parsed.organizations) ||
      !Array.isArray(parsed.wallets) ||
      !Array.isArray(parsed.courses) ||
      !Array.isArray(parsed.learners) ||
      !Array.isArray(parsed.batches) ||
      !Array.isArray(parsed.credentials) ||
      !Array.isArray(parsed.events)
    ) {
      const empty = createInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
      return empty;
    }
    return {
      ...createInitialState(),
      ...parsed,
    } as AppState;
  } catch (error) {
    const empty = createInitialState();
    if (error instanceof Error) {
      return empty;
    }
    return empty;
  }
};

export const saveWorkspaceState = (state: AppState): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (error instanceof Error) {
      return;
    }
  }
};

export const downloadCredentialPackageJson = (
  code: string,
  pkg: CredentialPackage,
): void => {
  if (typeof document === "undefined") return;
  const content = JSON.stringify(pkg, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${code.toLowerCase()}-package.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const computeFileSha256Hex = async (file: File): Promise<string> => {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Trình duyệt không hỗ trợ Web Crypto API để tính SHA-256 cho tệp tin.");
  }
  const buffer = await file.arrayBuffer();
  const digest = await window.crypto.subtle.digest("SHA-256", buffer);
  const bytes = Array.from(new Uint8Array(digest));
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex}`;
};

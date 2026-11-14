import {
  computeDigestHex,
  createInitialState,
  syncLegacyMirrors,
  type AppState,
  type CredentialPackage,
} from "./domain";

export const STORAGE_KEY = "certchain.product.state.v1";

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const loadWorkspaceState = (): AppState => {
  if (!isBrowser()) {
    return createInitialState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (
      !parsed ||
      !Array.isArray(parsed.organizations) ||
      !Array.isArray(parsed.batches) ||
      !Array.isArray(parsed.credentials)
    ) {
      const seed = createInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return syncLegacyMirrors(parsed as AppState);
  } catch (error) {
    const fallback = createInitialState();
    if (error instanceof Error) {
      return fallback;
    }
    return fallback;
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

export const resetWorkspaceState = (): AppState => {
  const seed = createInitialState();
  saveWorkspaceState(seed);
  return seed;
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
  try {
    if (typeof window !== "undefined" && window.crypto?.subtle) {
      const buffer = await file.arrayBuffer();
      const digest = await window.crypto.subtle.digest("SHA-256", buffer);
      const bytes = Array.from(new Uint8Array(digest));
      const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
      return `0x${hex}`;
    }
  } catch (error) {
    if (error instanceof Error) {
      return computeDigestHex(`FILE:${file.name}:${file.size}`, 64);
    }
  }
  return computeDigestHex(`FILE:${file.name}:${file.size}`, 64);
};

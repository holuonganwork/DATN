import { createInitialState, type AppState } from "../domain";

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

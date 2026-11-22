import { TRUSTED_CHAINS } from "./constants";
import type { AppState } from "./types";

export const createInitialState = (): AppState => {
  const defaultChain = TRUSTED_CHAINS[0];
  return {
    activeOrganizationId: "",
    activeRole: "ISSUER_OPERATOR",
    selectedChainId: defaultChain.chainId,
    rpcOnline: true,
    organizations: [],
    wallets: [],
    courses: [],
    learners: [],
    batches: [],
    credentials: [],
    events: [],
  };
};

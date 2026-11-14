export const ISSUANCE_PORT = Symbol("ISSUANCE_PORT");

export interface PublishBatchInput {
  organizationId: string;
  batchId: string;
  merkleRoot: string;
  entryCount: number;
  anchorChainId: number;
  anchorRegistryAddress: string;
}

export interface RevokeCredentialInput {
  organizationId: string;
  batchId: string;
  credentialId: string;
  leaf: string;
  reason: string;
}

export interface IssuanceReceipt {
  status: "CONFIRMED" | "FAILED";
  reference: string;
  confirmedAt: Date;
  mode: "OFF_CHAIN";
  failureCode?: string;
}

export interface IssuancePort {
  publishBatch(input: PublishBatchInput): Promise<IssuanceReceipt>;
  revokeCredential(input: RevokeCredentialInput): Promise<IssuanceReceipt>;
}

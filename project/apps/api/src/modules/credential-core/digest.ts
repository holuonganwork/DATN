import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import { canonicalizeJson } from "./canonical";
import { CredentialPayload, normalizePayload } from "./payload";

export const keccak256Utf8 = (text: string): string => {
  const bytes = utf8ToBytes(text);
  return `0x${bytesToHex(keccak_256(bytes))}`;
};

export const computePayloadDigest = (payload: CredentialPayload): string => {
  const canonical = canonicalizeJson(normalizePayload(payload));
  return keccak256Utf8(canonical);
};

export const computeInputDigest = (digests: string[]): string => {
  const sorted = [...digests].map((d) => d.toLowerCase()).sort();
  return keccak256Utf8(canonicalizeJson(sorted));
};

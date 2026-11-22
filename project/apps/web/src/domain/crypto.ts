import type { CredentialAnchor, CredentialPayload } from "./types";

export const normalizeText = (value: string): string => value.trim().normalize("NFC");

export const normalizeAddress = (address: string): string => address.trim().toLowerCase();

export const isValidEvmAddress = (address: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/.test(address.trim());

export const isValidHexDigest = (digest: string): boolean =>
  /^0x[a-fA-F0-9]{12,64}$/.test(digest.trim());

const toCanonicalValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map(toCanonicalValue);
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = toCanonicalValue(record[key]);
    }
    return result;
  }
  return value;
};

export const canonicalizeJson = (value: unknown): string =>
  JSON.stringify(toCanonicalValue(value));

export const computeDigestHex = (seed: string, hexLength = 64): string => {
  const normalized = seed.normalize("NFC");
  const lanes = [
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ];
  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i);
    const laneIndex = i % lanes.length;
    const prev = lanes[(laneIndex + lanes.length - 1) % lanes.length];
    let mixed = Math.imul(lanes[laneIndex] ^ code, 0x01000193) >>> 0;
    mixed = ((mixed << 13) | (mixed >>> 19)) >>> 0;
    lanes[laneIndex] = (mixed ^ Math.imul(prev + i + 1, 0x85ebca6b)) >>> 0;
  }
  for (let round = 0; round < 16; round += 1) {
    const idx = round % lanes.length;
    const next = lanes[(idx + 1) % lanes.length];
    lanes[idx] = Math.imul(lanes[idx] ^ (next >>> 7), 0xc2b2ae35) >>> 0;
  }
  const fullHex = lanes.map((lane) => lane.toString(16).padStart(8, "0")).join("");
  return `0x${fullHex.slice(0, hexLength)}`;
};

export const computePayloadDigest = (payload: CredentialPayload): string =>
  computeDigestHex(`JCS:${canonicalizeJson(payload)}`, 64);

export const computeLeafHash = (anchor: CredentialAnchor, payloadDigest: string): string => {
  const bound = [
    String(anchor.chainId),
    normalizeAddress(anchor.registryAddress),
    normalizeText(anchor.issuerId),
    normalizeText(anchor.batchId),
    normalizeAddress(payloadDigest),
  ].join("|");
  return computeDigestHex(`LEAF:${bound}`, 64);
};

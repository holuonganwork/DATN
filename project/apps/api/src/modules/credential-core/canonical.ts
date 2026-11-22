import canonicalize from "canonicalize";

export const normalizeNfcValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map(normalizeNfcValue);
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      normalized[key] = normalizeNfcValue(record[key]);
    }
    return normalized;
  }
  return value;
};

export const canonicalizeJson = (value: unknown): string => {
  const result = canonicalize(normalizeNfcValue(value));
  if (result === undefined) {
    throw new Error("Không thể chuẩn hóa JSON (giá trị undefined)");
  }
  return result;
};

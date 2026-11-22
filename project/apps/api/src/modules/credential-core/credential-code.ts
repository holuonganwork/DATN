import { randomBytes } from "node:crypto";

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const generateCredentialCode = (): string => {
  const bytes = randomBytes(8);
  let chars = "";
  for (let i = 0; i < 8; i += 1) {
    chars += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }
  return `CERT-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
};

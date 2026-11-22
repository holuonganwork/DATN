import {
  buildMerkleTree,
  canonicalizeJson,
  computeInputDigest,
  computeLeafHash,
  computePayloadDigest,
  CredentialAnchor,
  CredentialPayload,
  generateCredentialCode,
  verifyMerkleProof,
} from "./index";

describe("credential-core", () => {
  const baseAnchor: CredentialAnchor = {
    chainId: 31337,
    registryAddress: "0xAbCdEf0123456789AbCdEf0123456789aBcDeF01",
    batchId: "bat_001",
    issuerId: "org_bkhn_001",
  };

  const makePayload = (overrides: Partial<CredentialPayload> = {}): CredentialPayload => ({
    credentialId: "crd_001",
    issuerId: "org_bkhn_001",
    holder: "Nguyễn Văn An",
    courseId: "crs_001",
    courseName: "Phát triển Hệ thống Blockchain",
    result: "Xuất sắc (9.4/10)",
    issuedAt: "2026-11-14T08:00:00Z",
    expiresAt: null,
    nonce: "nonce-001",
    pdfSha256: null,
    ...overrides,
  });

  describe("canonicalizeJson & NFC normalization", () => {
    it("produces identical canonical JSON regardless of object key order", () => {
      const objA = { z: 1, nested: { b: "two", a: "one" }, a: true };
      const objB = { a: true, nested: { a: "one", b: "two" }, z: 1 };

      expect(canonicalizeJson(objA)).toBe(canonicalizeJson(objB));
    });

    it("normalizes decomposed NFD Vietnamese strings to identical NFC canonical output", () => {
      const composed = "Nguyễn Văn An";
      const decomposed = composed.normalize("NFD");
      expect(decomposed).not.toBe(composed);

      expect(canonicalizeJson({ holder: composed })).toBe(canonicalizeJson({ holder: decomposed }));
      expect(computePayloadDigest(makePayload({ holder: composed }))).toBe(
        computePayloadDigest(makePayload({ holder: decomposed })),
      );
    });
  });

  describe("computePayloadDigest & computeLeafHash", () => {
    it("is deterministic and changes when any payload or anchor field is tampered", () => {
      const basePayload = makePayload();
      const digest = computePayloadDigest(basePayload);
      const leaf = computeLeafHash(baseAnchor, digest);

      expect(digest).toMatch(/^0x[a-f0-9]{64}$/);
      expect(leaf).toMatch(/^0x[a-f0-9]{64}$/);

      expect(computePayloadDigest(makePayload({ holder: "Trần Thị Bình" }))).not.toBe(digest);
      expect(computePayloadDigest(makePayload({ result: "Giỏi (8.5/10)" }))).not.toBe(digest);

      expect(computeLeafHash({ ...baseAnchor, chainId: 11155111 }, digest)).not.toBe(leaf);
      expect(
        computeLeafHash(
          { ...baseAnchor, registryAddress: "0x1111111111111111111111111111111111111111" },
          digest,
        ),
      ).not.toBe(leaf);
      expect(computeLeafHash({ ...baseAnchor, issuerId: "org_other" }, digest)).not.toBe(leaf);
      expect(computeLeafHash({ ...baseAnchor, batchId: "bat_other" }, digest)).not.toBe(leaf);

      // Registry address case normalization preserves the exact same leaf hash
      expect(
        computeLeafHash(
          { ...baseAnchor, registryAddress: baseAnchor.registryAddress.toLowerCase() },
          digest,
        ),
      ).toBe(leaf);
    });

    it("computes deterministic order-independent input digest", () => {
      const d1 = computePayloadDigest(makePayload({ credentialId: "crd_1" }));
      const d2 = computePayloadDigest(makePayload({ credentialId: "crd_2" }));

      expect(computeInputDigest([d1, d2])).toBe(computeInputDigest([d2.toUpperCase(), d1]));
    });
  });

  describe("buildMerkleTree & verifyMerkleProof", () => {
    it.each([1, 10, 100])("builds and verifies proofs for %i leaves", (count) => {
      const payloads = Array.from({ length: count }, (_, idx) =>
        makePayload({
          credentialId: `crd_${idx + 1}`,
          holder: `Học viên số ${idx + 1}`,
          nonce: `nonce-${idx + 1}`,
        }),
      );

      const items = payloads.map((payload) => ({
        key: payload.credentialId,
        anchor: baseAnchor,
        payloadDigest: computePayloadDigest(payload),
      }));

      const built = buildMerkleTree(items);
      expect(built.root).toMatch(/^0x[a-f0-9]{64}$/);

      for (const item of items) {
        const leaf = built.leaves[item.key];
        const proof = built.proofs[item.key];
        expect(leaf).toMatch(/^0x[a-f0-9]{64}$/);
        expect(verifyMerkleProof(baseAnchor, item.payloadDigest, proof, built.root, leaf)).toBe(
          true,
        );
      }

      // Tampering payload fails verification
      const firstItem = items[0];
      const tamperedDigest = computePayloadDigest(
        makePayload({ credentialId: firstItem.key, result: "Tampered" }),
      );
      expect(
        verifyMerkleProof(
          baseAnchor,
          tamperedDigest,
          built.proofs[firstItem.key],
          built.root,
          built.leaves[firstItem.key],
        ),
      ).toBe(false);

      // Tampering anchor (cross-batch replay) fails verification
      expect(
        verifyMerkleProof(
          { ...baseAnchor, batchId: "bat_foreign" },
          firstItem.payloadDigest,
          built.proofs[firstItem.key],
          built.root,
          built.leaves[firstItem.key],
        ),
      ).toBe(false);

      // Tampering proof path fails verification (when path has nodes; for 1 leaf, wrong node injected)
      const badPath =
        built.proofs[firstItem.key].length > 0
          ? built.proofs[firstItem.key].map((node, i) => (i === 0 ? `0x${"ab".repeat(32)}` : node))
          : [`0x${"cd".repeat(32)}`];

      expect(
        verifyMerkleProof(
          baseAnchor,
          firstItem.payloadDigest,
          badPath,
          built.root,
          built.leaves[firstItem.key],
        ),
      ).toBe(false);
    });
  });

  describe("generateCredentialCode", () => {
    it("matches Crockford Base32 pattern CERT-XXXX-XXXX", () => {
      const pattern = /^CERT-[0-9A-HJ-NP-TV-Z]{4}-[0-9A-HJ-NP-TV-Z]{4}$/;
      const generated = new Set<string>();
      for (let i = 0; i < 50; i += 1) {
        const code = generateCredentialCode();
        expect(code).toMatch(pattern);
        generated.add(code);
      }
      expect(generated.size).toBe(50);
    });
  });
});

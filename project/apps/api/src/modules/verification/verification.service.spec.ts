import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Clock } from "../../common/clock";
import { AppEnv } from "../../config/env.schema";
import { PrismaService } from "../../prisma/prisma.service";
import {
  buildMerkleTree,
  computePayloadDigest,
  CredentialAnchor,
  CredentialPackage,
} from "../credential-core";
import { VerificationService } from "./verification.service";

describe("VerificationService (unit)", () => {
  const fixedNow = new Date("2026-11-14T10:00:00Z");
  const clock: Clock = { now: () => fixedNow };

  const chainId = 31337;
  const registryAddress = "0x0000000000000000000000000000000000000000";

  const mockConfig = {
    get: jest.fn((key: keyof AppEnv) => {
      if (key === "ANCHOR_CHAIN_ID") return chainId;
      if (key === "ANCHOR_REGISTRY_ADDRESS") return registryAddress;
      return undefined;
    }),
  } as unknown as ConfigService<AppEnv, true>;

  const anchor: CredentialAnchor = {
    chainId,
    registryAddress,
    batchId: "bat_unit_001",
    issuerId: "org_unit_001",
  };

  const payload = {
    credentialId: "crd_unit_001",
    issuerId: "org_unit_001",
    holder: "Nguyễn Văn An",
    courseId: "crs_unit_001",
    courseName: "Blockchain Fundamentals",
    result: "Đạt (9.0/10)",
    issuedAt: "2026-11-01T00:00:00Z",
    expiresAt: null,
    nonce: "nonce-unit-1",
    pdfSha256: null,
  };

  const makeValidPackage = (): CredentialPackage => {
    const payloadDigest = computePayloadDigest(payload);
    const tree = buildMerkleTree([{ key: payload.credentialId, anchor, payloadDigest }]);
    return {
      payload,
      anchor,
      proof: {
        leaf: tree.leaves[payload.credentialId],
        path: tree.proofs[payload.credentialId],
        root: tree.root,
      },
    };
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns INDETERMINATE with UNAVAILABLE checks when DB lookup throws, and SKIPPED for off-chain/pdf checks", async () => {
    const failingPrisma = {
      batch: {
        findUnique: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      },
    } as unknown as PrismaService;

    const service = new VerificationService(failingPrisma, mockConfig, clock);
    const report = await service.verifyPackage(makeValidPackage());

    expect(report.result).toBe("INDETERMINATE");
    expect(report.verifiedAt).toBe(fixedNow.toISOString());

    const byKey = Object.fromEntries(report.checks.map((check) => [check.key, check.status]));
    expect(byKey.schema).toBe("PASS");
    expect(byKey.trusted_anchor).toBe("PASS");
    expect(byKey.payload_digest).toBe("PASS");
    expect(byKey.merkle_proof).toBe("PASS");
    expect(byKey.issuer_record).toBe("UNAVAILABLE");
    expect(byKey.revocation).toBe("UNAVAILABLE");
    expect(byKey.expiry).toBe("PASS");
    expect(byKey.on_chain_anchor).toBe("SKIPPED");
    expect(byKey.pdf_sha256).toBe("SKIPPED");
  });
});

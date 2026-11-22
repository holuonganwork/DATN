import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { OrganizationStatus, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://certuser:certdb@localhost:5433/certchain_test?schema=public";
}

const makePass = (tag: string): string => ["E2e", tag, "2026"].join("@");

interface Envelope<T> {
  data: T;
  meta: {
    correlationId: string;
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
  meta: {
    correlationId: string;
  };
}

interface LoginData {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    organizationId: string | null;
  };
}

interface BatchData {
  id: string;
  code: string;
  status: string;
  merkleRoot: string | null;
  issuanceRef: string | null;
  entryCount: number;
  entries?: Array<{
    id: string;
    credentialId: string;
    validationStatus: string;
  }>;
}

interface CredentialData {
  id: string;
  code: string;
  batchId: string;
  status: string;
  reissuedFromId: string | null;
  reissuedToId: string | null;
}

interface PackageData {
  payload: {
    credentialId: string;
    issuerId: string;
    holder: string;
    courseId: string;
    courseName: string;
    result: string;
    issuedAt: string;
    expiresAt: string | null;
    nonce: string;
    pdfSha256: string | null;
  };
  anchor: {
    chainId: number;
    registryAddress: string;
    batchId: string;
    issuerId: string;
  };
  proof: {
    leaf: string;
    path: string[];
    root: string;
  };
}

interface VerificationCheck {
  key: string;
  status: string;
}

interface VerificationReport {
  result: string;
  checks: VerificationCheck[];
  credentialId: string | null;
  credentialCode: string | null;
}

describe("Off-Chain Business Backend API (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const adminEmail = "sysadmin@e2e.local";
  let adminAuth = "";
  let orgAId = "";
  let orgBId = "";
  let orgAOpAuth = "";
  let orgAApprAuth = "";
  let orgAAuditorAuth = "";
  let orgBCourseId = "";
  let courseAId = "";
  let learner1Id = "";
  let learner2Id = "";
  let batchId = "";
  let cred1Id = "";
  let cred1Code = "";
  let cred2Id = "";
  let cred1Pkg: PackageData;
  let cred2Pkg: PackageData;

  const truncateAllTables = async (): Promise<void> => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "audit_logs", "idempotency_records", "credentials", "batch_entries", "batches", "learners", "courses", "users", "organizations" CASCADE',
    );
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app, "http://localhost:5173");
    await app.init();

    prisma = app.get(PrismaService);
    await truncateAllTables();

    const adminHash = await bcrypt.hash(makePass("SysAdmin"), 8);
    await prisma.user.create({
      data: {
        id: "usr_e2e_sysadmin",
        email: adminEmail,
        passwordHash: adminHash,
        displayName: "E2E System Admin",
        role: Role.SYSTEM_ADMIN,
        status: UserStatus.ACTIVE,
        organizationId: null,
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await truncateAllTables();
    }
    if (app) {
      await app.close();
    }
  });

  it("1. GET /v1/health returns status ok, database up, and correlation headers", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/health")
      .set("X-Correlation-Id", "corr_e2e_health_01")
      .expect(200);

    const body = res.body as Envelope<{ status: string; database: string; mode: string }>;
    expect(res.headers["x-correlation-id"]).toBe("corr_e2e_health_01");
    expect(body.meta.correlationId).toBe("corr_e2e_health_01");
    expect(body.data).toEqual({
      status: "ok",
      database: "up",
      mode: "OFF_CHAIN",
    });
  });

  it("2. POST /v1/auth/login rejects invalid credentials (401) and accepts valid login + /v1/auth/me", async () => {
    await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: adminEmail, password: makePass("Wrong") })
      .expect(401);

    const loginRes = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: adminEmail, password: makePass("SysAdmin") })
      .expect(200);

    const loginBody = loginRes.body as Envelope<LoginData>;
    adminAuth = loginBody.data.accessToken;
    expect(typeof adminAuth).toBe("string");
    expect(loginBody.data.user.role).toBe(Role.SYSTEM_ADMIN);

    const meRes = await request(app.getHttpServer())
      .get("/v1/auth/me")
      .set("Authorization", `Bearer ${adminAuth}`)
      .expect(200);

    const meBody = meRes.body as Envelope<{ email: string; role: Role }>;
    expect(meBody.data.email).toBe(adminEmail);
    expect(meBody.data.role).toBe(Role.SYSTEM_ADMIN);
  });

  it("3. Provision issuers + users and enforce RBAC & cross-organization 403 scoping", async () => {
    const orgARes = await request(app.getHttpServer())
      .post("/v1/issuers")
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({
        code: "E2E-ORGA",
        legalName: "Trung tâm Đào tạo E2E Alpha",
        displayName: "E2E Alpha Academy",
        verificationRef: "REF-ORGA-01",
      })
      .expect(201);
    orgAId = (orgARes.body as Envelope<{ id: string }>).data.id;

    await request(app.getHttpServer())
      .patch(`/v1/issuers/${orgAId}/status`)
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({ status: OrganizationStatus.ACTIVE })
      .expect(200);

    const orgBRes = await request(app.getHttpServer())
      .post("/v1/issuers")
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({
        code: "E2E-ORGB",
        legalName: "Trung tâm Đào tạo E2E Beta",
        displayName: "E2E Beta Academy",
      })
      .expect(201);
    orgBId = (orgBRes.body as Envelope<{ id: string }>).data.id;

    await request(app.getHttpServer())
      .patch(`/v1/issuers/${orgBId}/status`)
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({ status: OrganizationStatus.ACTIVE })
      .expect(200);

    await request(app.getHttpServer())
      .post("/v1/users")
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({
        email: "op.a@e2e.local",
        password: makePass("OpA"),
        displayName: "Operator Alpha",
        role: Role.ISSUER_OPERATOR,
        organizationId: orgAId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/v1/users")
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({
        email: "appr.a@e2e.local",
        password: makePass("ApprA"),
        displayName: "Approver Alpha",
        role: Role.ISSUER_APPROVER,
        organizationId: orgAId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/v1/users")
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({
        email: "auditor.a@e2e.local",
        password: makePass("AudA"),
        displayName: "Auditor Alpha",
        role: Role.AUDITOR,
        organizationId: orgAId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/v1/users")
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({
        email: "op.b@e2e.local",
        password: makePass("OpB"),
        displayName: "Operator Beta",
        role: Role.ISSUER_OPERATOR,
        organizationId: orgBId,
      })
      .expect(201);

    const loginOpA = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "op.a@e2e.local", password: makePass("OpA") })
      .expect(200);
    orgAOpAuth = (loginOpA.body as Envelope<LoginData>).data.accessToken;

    const loginApprA = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "appr.a@e2e.local", password: makePass("ApprA") })
      .expect(200);
    orgAApprAuth = (loginApprA.body as Envelope<LoginData>).data.accessToken;

    const loginAudA = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "auditor.a@e2e.local", password: makePass("AudA") })
      .expect(200);
    orgAAuditorAuth = (loginAudA.body as Envelope<LoginData>).data.accessToken;

    const loginOpB = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "op.b@e2e.local", password: makePass("OpB") })
      .expect(200);
    const orgBOpAuth = (loginOpB.body as Envelope<LoginData>).data.accessToken;

    const courseBRes = await request(app.getHttpServer())
      .post("/v1/courses")
      .set("Authorization", `Bearer ${orgBOpAuth}`)
      .send({
        code: "ORGB-101",
        name: "Beta Secret Course",
        version: "1.0",
        durationHours: 24,
        gradingRule: "Pass >= 7",
      })
      .expect(201);
    orgBCourseId = (courseBRes.body as Envelope<{ id: string }>).data.id;

    // Org A operator cannot read Org B course or write with AUDITOR token
    const crossOrgRes = await request(app.getHttpServer())
      .get(`/v1/courses/${orgBCourseId}`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(403);
    expect((crossOrgRes.body as ErrorEnvelope).error.code).toBe("FORBIDDEN");

    const auditorWriteRes = await request(app.getHttpServer())
      .post("/v1/courses")
      .set("Authorization", `Bearer ${orgAAuditorAuth}`)
      .send({
        code: "FAIL-101",
        name: "Unauthorized Course",
        version: "1.0",
        durationHours: 10,
        gradingRule: "Pass",
      })
      .expect(403);
    expect((auditorWriteRes.body as ErrorEnvelope).error.code).toBe("FORBIDDEN");
  });

  it("4 & 5 & 6. Runs full batch lifecycle DRAFT -> VALIDATED -> APPROVED -> FROZEN -> CONFIRMED, enforces immutability & idempotency", async () => {
    const courseRes = await request(app.getHttpServer())
      .post("/v1/courses")
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .send({
        code: "BC-E2E-101",
        name: "Kiến trúc Blockchain Doanh nghiệp",
        version: "2026.1",
        durationHours: 48,
        gradingRule: "Đạt >= 7.0/10",
      })
      .expect(201);
    courseAId = (courseRes.body as Envelope<{ id: string }>).data.id;

    const l1Res = await request(app.getHttpServer())
      .post("/v1/learners")
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .send({
        subjectRef: "HV-E2E-001",
        displayName: "Nguyễn Văn An",
        cohort: "K15",
        contactRef: "contact-secret-001",
      })
      .expect(201);
    learner1Id = (l1Res.body as Envelope<{ id: string }>).data.id;

    const l2Res = await request(app.getHttpServer())
      .post("/v1/learners")
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .send({
        subjectRef: "HV-E2E-002",
        displayName: "Trần Thị Bình",
        cohort: "K15",
      })
      .expect(201);
    learner2Id = (l2Res.body as Envelope<{ id: string }>).data.id;

    const batchRes = await request(app.getHttpServer())
      .post("/v1/batches")
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .send({
        courseId: courseAId,
        title: "Đợt tốt nghiệp E2E tháng 11/2026",
      })
      .expect(201);
    batchId = (batchRes.body as Envelope<BatchData>).data.id;
    expect((batchRes.body as Envelope<BatchData>).data.status).toBe("DRAFT");

    await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/entries`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .send({
        learnerId: learner1Id,
        result: "9.2 / 10 (Xuất sắc)",
        issuedAt: "2026-11-10T00:00:00Z",
        expiresAt: null,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/entries`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .send({
        learnerId: learner2Id,
        result: "8.6 / 10 (Giỏi)",
        issuedAt: "2026-11-10T00:00:00Z",
        expiresAt: "2029-11-10T00:00:00Z",
      })
      .expect(201);

    const validatedRes = await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/validate`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(200);
    expect((validatedRes.body as Envelope<BatchData>).data.status).toBe("VALIDATED");

    // Operator cannot approve or freeze (403 FORBIDDEN)
    await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/approve`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(403);

    const approvedRes = await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/approve`)
      .set("Authorization", `Bearer ${orgAApprAuth}`)
      .expect(200);
    expect((approvedRes.body as Envelope<BatchData>).data.status).toBe("APPROVED");

    await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/freeze`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(403);

    const frozenRes = await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/freeze`)
      .set("Authorization", `Bearer ${orgAApprAuth}`)
      .expect(200);
    const frozenBatch = (frozenRes.body as Envelope<BatchData>).data;
    expect(frozenBatch.status).toBe("FROZEN");
    expect(frozenBatch.merkleRoot).toMatch(/^0x[a-f0-9]{64}$/);
    expect(frozenBatch.entryCount).toBe(2);

    // Post-freeze immutability check -> 409 BATCH_NOT_MUTABLE
    const mutateFrozenRes = await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/entries`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .send({
        learnerId: learner1Id,
        result: "9.9",
        issuedAt: "2026-11-10T00:00:00Z",
      })
      .expect(409);
    expect((mutateFrozenRes.body as ErrorEnvelope).error.code).toBe("BATCH_NOT_MUTABLE");

    // Missing Idempotency-Key -> 400 VALIDATION_ERROR
    const missingKeyRes = await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/publish`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(400);
    expect((missingKeyRes.body as ErrorEnvelope).error.code).toBe("VALIDATION_ERROR");

    // Publish with Idempotency-Key -> CONFIRMED
    const publishKey = "idem_e2e_publish_batch_01";
    const pubRes1 = await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/publish`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .set("Idempotency-Key", publishKey)
      .expect(200);
    const published1 = (pubRes1.body as Envelope<BatchData>).data;
    expect(published1.status).toBe("CONFIRMED");
    expect(published1.issuanceRef).toMatch(/^offchain_/);

    // Replay same Idempotency-Key returns identical cached result
    const pubRes2 = await request(app.getHttpServer())
      .post(`/v1/batches/${batchId}/publish`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .set("Idempotency-Key", publishKey)
      .expect(200);
    expect((pubRes2.body as Envelope<BatchData>).data.issuanceRef).toBe(published1.issuanceRef);

    // Verify 2 ISSUED credentials exist in batch
    const listCredsRes = await request(app.getHttpServer())
      .get(`/v1/credentials?batchId=${batchId}`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(200);
    const creds = (listCredsRes.body as Envelope<CredentialData[]>).data;
    expect(creds).toHaveLength(2);
    expect(creds.every((c) => c.status === "ISSUED")).toBe(true);
    cred1Id = creds[0].id;
    cred1Code = creds[0].code;
    cred2Id = creds[1].id;
  });

  it("7. Public verification passes for valid package & code, skips on_chain_anchor/pdf_sha256, rejects tampered payload", async () => {
    const pubCodeRes = await request(app.getHttpServer())
      .get(`/v1/public/credentials/${cred1Code}`)
      .expect(200);
    const pubCodeBody = pubCodeRes.body as Envelope<{
      credential: { code: string; status: string };
      package: PackageData;
      verification: VerificationReport;
    }>;
    expect(pubCodeBody.data.credential.code).toBe(cred1Code);
    expect(pubCodeBody.data.verification.result).toBe("VALID");

    const pkg1Res = await request(app.getHttpServer())
      .get(`/v1/credentials/${cred1Id}/package`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(200);
    cred1Pkg = (pkg1Res.body as Envelope<PackageData>).data;

    const pkg2Res = await request(app.getHttpServer())
      .get(`/v1/credentials/${cred2Id}/package`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(200);
    cred2Pkg = (pkg2Res.body as Envelope<PackageData>).data;

    const verifyValidRes = await request(app.getHttpServer())
      .post("/v1/verifications")
      .send({ package: cred1Pkg })
      .expect(200);
    const validReport = (verifyValidRes.body as Envelope<VerificationReport>).data;
    expect(validReport.result).toBe("VALID");
    const checkMap = Object.fromEntries(validReport.checks.map((c) => [c.key, c.status]));
    expect(checkMap.on_chain_anchor).toBe("SKIPPED");
    expect(checkMap.pdf_sha256).toBe("SKIPPED");
    expect(checkMap.payload_digest).toBe("PASS");
    expect(checkMap.merkle_proof).toBe("PASS");

    const tamperedPkg: PackageData = {
      ...cred1Pkg,
      payload: {
        ...cred1Pkg.payload,
        holder: "Kẻ giả mạo",
      },
    };
    const verifyTamperedRes = await request(app.getHttpServer())
      .post("/v1/verifications")
      .send({ package: tamperedPkg })
      .expect(200);
    const tamperedReport = (verifyTamperedRes.body as Envelope<VerificationReport>).data;
    expect(tamperedReport.result).toBe("INVALID");
    const tamperedChecks = Object.fromEntries(tamperedReport.checks.map((c) => [c.key, c.status]));
    expect(tamperedChecks.payload_digest).toBe("FAIL");
  });

  it("8. Revoke credential transitions ISSUED -> REVOKED, enforces Idempotency-Key conflict, and verifies as REVOKED", async () => {
    const revokeKey = "idem_e2e_revoke_cred1";
    const revokeRes = await request(app.getHttpServer())
      .post(`/v1/credentials/${cred1Id}/revoke`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .set("Idempotency-Key", revokeKey)
      .send({ reason: "Phát hiện sai thông tin kết quả đánh giá" })
      .expect(200);
    expect((revokeRes.body as Envelope<CredentialData>).data.status).toBe("REVOKED");

    // Reusing same Idempotency-Key with a different body triggers 409 IDEMPOTENCY_CONFLICT
    const conflictRes = await request(app.getHttpServer())
      .post(`/v1/credentials/${cred1Id}/revoke`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .set("Idempotency-Key", revokeKey)
      .send({ reason: "Lý do khác hoàn toàn" })
      .expect(409);
    expect((conflictRes.body as ErrorEnvelope).error.code).toBe("IDEMPOTENCY_CONFLICT");

    const verifyRevokedRes = await request(app.getHttpServer())
      .post("/v1/verifications")
      .send({ package: cred1Pkg })
      .expect(200);
    expect((verifyRevokedRes.body as Envelope<VerificationReport>).data.result).toBe("REVOKED");
  });

  it("9. Reissue credential supersedes old ISSUED credential and issues valid replacement in 1-entry CONFIRMED batch", async () => {
    const reissueRes = await request(app.getHttpServer())
      .post(`/v1/credentials/${cred2Id}/reissue`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .set("Idempotency-Key", "idem_e2e_reissue_cred2")
      .send({
        result: "9.5 / 10 (Xuất sắc)",
        reason: "Cập nhật kết quả sau phúc khảo",
      })
      .expect(201);
    const reissued = (reissueRes.body as Envelope<CredentialData>).data;
    expect(reissued.status).toBe("ISSUED");
    expect(reissued.reissuedFromId).toBe(cred2Id);
    expect(reissued.batchId).not.toBe(batchId);

    const verifyOldRes = await request(app.getHttpServer())
      .post("/v1/verifications")
      .send({ package: cred2Pkg })
      .expect(200);
    expect((verifyOldRes.body as Envelope<VerificationReport>).data.result).toBe("SUPERSEDED");

    const newPkgRes = await request(app.getHttpServer())
      .get(`/v1/credentials/${reissued.id}/package`)
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .expect(200);
    const verifyNewRes = await request(app.getHttpServer())
      .post("/v1/verifications")
      .send({ package: (newPkgRes.body as Envelope<PackageData>).data })
      .expect(200);
    expect((verifyNewRes.body as Envelope<VerificationReport>).data.result).toBe("VALID");
  });

  it("10. Audit log records workflow actions for AUDITOR and omits sensitive values", async () => {
    const auditRes = await request(app.getHttpServer())
      .get("/v1/audit?pageSize=50")
      .set("Authorization", `Bearer ${orgAAuditorAuth}`)
      .expect(200);

    const auditBody = auditRes.body as Envelope<Array<{ action: string; organizationId: string }>>;
    expect(auditBody.data.length).toBeGreaterThanOrEqual(5);
    expect(auditBody.data.every((item) => item.organizationId === orgAId)).toBe(true);

    const actions = auditBody.data.map((item) => item.action);
    expect(actions).toEqual(
      expect.arrayContaining(["BATCH_CONFIRMED", "CREDENTIAL_REVOKED", "CREDENTIAL_REISSUED"]),
    );

    const serialized = JSON.stringify(auditBody.data);
    expect(serialized).not.toContain("$2a$");
    expect(serialized).not.toContain("$2b$");
    expect(serialized).not.toContain("contact-secret-001");
  });

  it("11. Suspending organization blocks mutations and login with 403 ORGANIZATION_NOT_ACTIVE, while SYSTEM_ADMIN can inspect audit", async () => {
    await request(app.getHttpServer())
      .patch(`/v1/issuers/${orgAId}/status`)
      .set("Authorization", `Bearer ${adminAuth}`)
      .send({ status: OrganizationStatus.SUSPENDED })
      .expect(200);

    const mutRes = await request(app.getHttpServer())
      .post("/v1/courses")
      .set("Authorization", `Bearer ${orgAOpAuth}`)
      .send({
        code: "BLOCKED-101",
        name: "Should Fail",
        version: "1.0",
        durationHours: 12,
        gradingRule: "Pass",
      })
      .expect(403);
    expect((mutRes.body as ErrorEnvelope).error.code).toBe("ORGANIZATION_NOT_ACTIVE");

    const loginSuspendedRes = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "op.a@e2e.local", password: makePass("OpA") })
      .expect(403);
    expect((loginSuspendedRes.body as ErrorEnvelope).error.code).toBe("ORGANIZATION_NOT_ACTIVE");

    const adminAuditRes = await request(app.getHttpServer())
      .get(`/v1/audit?organizationId=${orgAId}&pageSize=50`)
      .set("Authorization", `Bearer ${adminAuth}`)
      .expect(200);
    const adminActions = (adminAuditRes.body as Envelope<Array<{ action: string }>>).data.map(
      (item) => item.action,
    );
    expect(adminActions).toContain("ORGANIZATION_STATUS_UPDATED");
  });
});

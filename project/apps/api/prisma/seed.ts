import { CourseStatus, OrganizationStatus, PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const DEFAULT_DB_URL = "postgresql://certuser:certdb@localhost:5433/certchain_dev?schema=public";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DB_URL;
}

const prisma = new PrismaClient();

const resolveSeedPass = (envVar: string | undefined, roleTag: string): string =>
  envVar && envVar.trim().length >= 6 ? envVar.trim() : ["Cert", roleTag, "2026"].join("@");

async function main(): Promise<void> {
  const withDemo = process.argv.includes("--demo");
  const adminPass = resolveSeedPass(process.env.SEED_ADMIN_PASS, "Admin");
  const adminHash = await bcrypt.hash(adminPass, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@certchain.local" },
    update: {
      displayName: "Quản trị viên Hệ thống",
      role: Role.SYSTEM_ADMIN,
      status: UserStatus.ACTIVE,
      organizationId: null,
    },
    create: {
      id: "usr_seed_sysadmin_001",
      email: "admin@certchain.local",
      passwordHash: adminHash,
      displayName: "Quản trị viên Hệ thống",
      role: Role.SYSTEM_ADMIN,
      status: UserStatus.ACTIVE,
      organizationId: null,
    },
  });

  process.stdout.write(`Seeded SYSTEM_ADMIN: ${admin.email}\n`);

  if (!withDemo) {
    return;
  }

  const org = await prisma.organization.upsert({
    where: { code: "BKHN-ACADEMY" },
    update: {
      status: OrganizationStatus.ACTIVE,
      displayName: "BKHN Tech Academy (Demo)",
    },
    create: {
      id: "org_seed_bkhn_001",
      code: "BKHN-ACADEMY",
      legalName: "Trung tâm Đào tạo Công nghệ Bách Khoa (Dữ liệu giả lập)",
      displayName: "BKHN Tech Academy (Demo)",
      verificationRef: "DEMO-REF-2026",
      status: OrganizationStatus.ACTIVE,
    },
  });

  const demoUserSpecs = [
    {
      id: "usr_seed_operator_001",
      email: "operator@bkhn.edu.vn",
      displayName: "Nhân sự Vận hành (Demo)",
      role: Role.ISSUER_OPERATOR,
      pass: resolveSeedPass(process.env.SEED_DEMO_PASS, "Oper"),
    },
    {
      id: "usr_seed_approver_001",
      email: "approver@bkhn.edu.vn",
      displayName: "Trưởng đơn vị Phê duyệt (Demo)",
      role: Role.ISSUER_APPROVER,
      pass: resolveSeedPass(process.env.SEED_DEMO_PASS, "Appr"),
    },
    {
      id: "usr_seed_auditor_001",
      email: "auditor@bkhn.edu.vn",
      displayName: "Kiểm toán Nội bộ (Demo)",
      role: Role.AUDITOR,
      pass: resolveSeedPass(process.env.SEED_DEMO_PASS, "Audi"),
    },
  ];

  for (const spec of demoUserSpecs) {
    const hash = await bcrypt.hash(spec.pass, 10);
    await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        organizationId: org.id,
        role: spec.role,
        status: UserStatus.ACTIVE,
      },
      create: {
        id: spec.id,
        organizationId: org.id,
        email: spec.email,
        passwordHash: hash,
        displayName: spec.displayName,
        role: spec.role,
        status: UserStatus.ACTIVE,
      },
    });
  }

  await prisma.course.upsert({
    where: {
      organizationId_code_version: {
        organizationId: org.id,
        code: "BC-SEC-101",
        version: "2026.1",
      },
    },
    update: { status: CourseStatus.ACTIVE },
    create: {
      id: "crs_seed_bcsec_001",
      organizationId: org.id,
      code: "BC-SEC-101",
      name: "An toàn Smart Contract & EVM (Demo)",
      version: "2026.1",
      durationHours: 48,
      gradingRule: "Đạt >= 7.0 / 10",
      description: "Khóa học giả lập phục vụ kiểm thử quy trình phát hành chứng chỉ",
      status: CourseStatus.ACTIVE,
    },
  });

  const demoLearners = [
    {
      id: "lrn_seed_001",
      subjectRef: "HV-DEMO-001",
      displayName: "Nguyễn Văn An",
      cohort: "K15-Demo",
    },
    {
      id: "lrn_seed_002",
      subjectRef: "HV-DEMO-002",
      displayName: "Trần Thị Bình",
      cohort: "K15-Demo",
    },
    {
      id: "lrn_seed_003",
      subjectRef: "HV-DEMO-003",
      displayName: "Lê Minh Châu",
      cohort: "K15-Demo",
    },
  ];

  for (const learner of demoLearners) {
    await prisma.learner.upsert({
      where: {
        organizationId_subjectRef: {
          organizationId: org.id,
          subjectRef: learner.subjectRef,
        },
      },
      update: { displayName: learner.displayName, cohort: learner.cohort },
      create: {
        id: learner.id,
        organizationId: org.id,
        subjectRef: learner.subjectRef,
        displayName: learner.displayName,
        cohort: learner.cohort,
        contactRef: null,
      },
    });
  }

  process.stdout.write(
    `Seeded demo organization ${org.code}, 3 staff users, 1 course, 3 learners.\n`,
  );
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Seed failed: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { spawnSync } from "node:child_process";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://certuser:certdb@localhost:5433/certchain_test?schema=public";

const result = spawnSync("npx prisma migrate reset --force --skip-seed", {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
});

process.exit(result.status ?? 1);

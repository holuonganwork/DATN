import { spawnSync } from "node:child_process";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://certuser:certdb@localhost:5433/certchain_test?schema=public";

const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: testDatabaseUrl,
};

const run = (command) => {
  const result = spawnSync(command, {
    stdio: "inherit",
    shell: true,
    env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("npx prisma migrate deploy");
run("npx jest --config test/jest-e2e.config.cjs --runInBand");

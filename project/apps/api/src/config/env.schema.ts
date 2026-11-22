import { z } from "zod";

const DEFAULT_DEV_DB = "postgresql://certuser:certdb@localhost:5433/certchain_dev?schema=public";
const DEFAULT_DEV_SIGNING_KEY = ["dev", "jwt", "signing", "key", "local", "32b"].join("-");

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default(DEFAULT_DEV_DB),
  JWT_SIGNING_KEY: z.string().min(16).default(DEFAULT_DEV_SIGNING_KEY),
  JWT_EXPIRES_IN: z.string().min(1).default("8h"),
  ANCHOR_CHAIN_ID: z.coerce.number().int().positive().default(31337),
  ANCHOR_REGISTRY_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .default("0x0000000000000000000000000000000000000000"),
  WEB_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  ISSUANCE_MODE: z.enum(["offchain"]).default("offchain"),
});

export type AppEnv = z.infer<typeof envSchema>;

export const validateEnv = (raw: Record<string, unknown>): AppEnv => {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
};

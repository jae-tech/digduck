import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().url("Invalid database URL"),
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("debug"),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),
  BCRYPT_SALT_ROUNDS: z.coerce.number().positive().default(12),
  NAVER_LOGIN_ID: z.string().min(2).max(100).default(""),
  NAVER_LOGIN_PASSWORD: z.string().min(6).max(100).default(""),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error(
    "❌ Invalid environment variables:",
    parseResult.error.format()
  );
  process.exit(1);
}

export const env = parseResult.data;
export type Env = typeof env;

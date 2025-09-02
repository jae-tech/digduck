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
  LICENSE_SALT: z
    .string()
    .min(16, "License salt must be at least 16 characters")
    .default("default-license-salt-key"),

  // Mail Service Configuration
  MAIL_FROM: z.string().email().optional(),
  PRODUCT_NAME: z.string().default("DigDuck"),
  CLIENT_URL: z.string().url().optional(),
  COMPANY_NAME: z.string().default("DigDuck"),
  MAIL_PROVIDER: z.enum(["smtp", "gmail", "outlook", "zoho"]).optional(),
  MAIL_USER: z.string().email().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_SECURE: z.string().optional().default("opvt pqki jwwz hmot"),
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

// NODE_ENV=development
// PORT=8080
// HOST=0.0.0.0
// DATABASE_URL=postgresql://cinnamon:matcha@localhost:5432/latte
// JWT_SECRET=8YEamSE5yO1QgnKLtsNUhVnZPyA5FjXp
// JWT_EXPIRES_IN=7d
// LOG_LEVEL=debug
// CORS_ORIGIN=*
// RATE_LIMIT_MAX=100
// BCRYPT_SALT_ROUNDS=12
// NAVER_LOGIN_ID=bshLwMF4Ckm8I0lO1_OA
// NAVER_LOGIN_PASSWORD=6z2LQ9nydl
// LICENSE_SALT=your-license-salt-key-should-be-at-least-16-chars

// MAIL_FROM=hello@digduck.app
// PRODUCT_NAME=DigDuck
// CLIENT_URL=https://digduck.app
// COMPANY_NAME=DigDuck
// MAIL_PROVIDER=zoho
// MAIL_USER=hello@digduck.app
// MAIL_PASS=RHrnak1!
// MAIL_HOST=smtp.zoho.com
// MAIL_PORT=587
// MAIL_SECURE=false

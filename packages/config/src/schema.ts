import { z } from "zod";

const DEVELOPMENT_SMTP_ENCRYPTION_KEY =
  "development-only-smtp-encryption-key-change-me";

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().int().positive().default(3000),

    CORS_ORIGIN: z.string().default("http://localhost:3001"),

    POSTGRES_HOST: z.string().min(1),
    POSTGRES_PORT: z.coerce.number().int().positive(),
    POSTGRES_DB: z.string().min(1),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),

    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must contain at least 32 characters"),

    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),

    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must contain at least 32 characters"),

    JWT_REFRESH_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(2592000),

    LICENSE_PATH: z.string().min(1).default("license.json"),
    LICENSE_PUBLIC_KEY_PATH: z.string().min(1).default("license-public.pem"),

    EMAIL_DELIVERY_MODE: z.enum(["disabled", "log", "smtp"]).default("smtp"),

    SMTP_CREDENTIAL_ENCRYPTION_KEY: z
      .string()
      .min(32)
      .default(DEVELOPMENT_SMTP_ENCRYPTION_KEY),
  })
  .superRefine((value, context) => {
    if (
      value.NODE_ENV === "production" &&
      value.SMTP_CREDENTIAL_ENCRYPTION_KEY === DEVELOPMENT_SMTP_ENCRYPTION_KEY
    ) {
      context.addIssue({
        code: "custom",
        path: ["SMTP_CREDENTIAL_ENCRYPTION_KEY"],
        message: "A unique SMTP encryption key is required in production",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

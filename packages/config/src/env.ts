import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadDotenv } from "dotenv";

import { envSchema } from "./schema";

const candidatePaths = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];

const envPath = candidatePaths.find((path) => existsSync(path));

if (envPath) {
  loadDotenv({ path: envPath });
}

export const env = envSchema.parse(process.env);

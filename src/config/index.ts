import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  CLIENT_ID: z.string().min(1),
  GUILD_ID: z.string().optional().default(""),
  COMMAND_SYNC_MODE: z.enum(["guild", "global"]).default("guild"),
  CLEAR_OLD_COMMAND_SCOPE: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  DATABASE_URL: z.string().min(1),
  OWNER_IDS: z.string().optional().default(""),
  DEFAULT_LANGUAGE: z.string().default("fr"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DASHBOARD_ENABLED: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  DASHBOARD_URL: z.string().url().default("http://localhost:3000"),
  DISCORD_CLIENT_SECRET: z.string().optional().default(""),
  DISCORD_REDIRECT_URI: z.string().optional().default(""),
  SESSION_SECRET: z.string().optional().default("")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Configuration .env invalide: ${details}`);
}

export const config = {
  ...parsedEnv.data,
  OWNER_IDS: parsedEnv.data.OWNER_IDS.split(",")
    .map((id) => id.trim())
    .filter(Boolean)
};

export type AppConfig = typeof config;

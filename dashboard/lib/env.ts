import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  CLIENT_ID: z.string().min(1),
  DISCORD_CLIENT_SECRET: z.string().min(1),
  DASHBOARD_URL: z.string().url(),
  DISCORD_REDIRECT_URI: z.string().url(),
  SESSION_SECRET: z.string().min(24),
  GUILD_ID: z.string().optional().default("")
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL ?? "mongodb://127.0.0.1:27017/astro-bot",
  CLIENT_ID: process.env.CLIENT_ID ?? "missing-client-id",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ?? "missing-client-secret",
  DASHBOARD_URL: process.env.DASHBOARD_URL ?? "http://localhost:3000",
  DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI ?? "http://localhost:3000/callback",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "local-build-only-session-secret",
  GUILD_ID: process.env.GUILD_ID
});

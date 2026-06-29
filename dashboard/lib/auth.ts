import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

export interface SessionUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

export interface DashboardSession {
  user: SessionUser;
  accessToken: string;
  expiresAt: number;
}

const cookieName = "astro_dashboard_session";

function sign(value: string): string {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(value).digest("base64url");
}

export function encodeSession(session: DashboardSession): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(raw?: string): DashboardSession | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DashboardSession;
  if (session.expiresAt < Date.now()) return null;
  return session;
}

export async function getSession(): Promise<DashboardSession | null> {
  return decodeSession((await cookies()).get(cookieName)?.value);
}

export async function requireSession(): Promise<DashboardSession> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function setSession(session: DashboardSession): Promise<void> {
  (await cookies()).set(cookieName, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.DASHBOARD_URL.startsWith("https://"),
    path: "/",
    maxAge: Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000))
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.DASHBOARD_URL.startsWith("https://"),
    path: "/",
    maxAge: 0
  });
}

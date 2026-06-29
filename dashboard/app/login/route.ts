import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "../../lib/env";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  (await cookies()).set("astro_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.DASHBOARD_URL.startsWith("https://"),
    path: "/",
    maxAge: 300
  });

  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "none"
  });

  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}

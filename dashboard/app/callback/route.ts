import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { setSession } from "../../lib/auth";
import { exchangeCode, getCurrentUser } from "../../lib/discord";
import { env } from "../../lib/env";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("astro_oauth_state")?.value;

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL("/?error=oauth", env.DASHBOARD_URL));
  }

  const token = await exchangeCode(code);
  const user = await getCurrentUser(token.access_token);

  await setSession({
    user,
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000
  });

  cookieStore.set("astro_oauth_state", "", { path: "/", maxAge: 0 });
  return NextResponse.redirect(new URL("/", env.DASHBOARD_URL));
}

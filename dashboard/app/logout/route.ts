import { NextResponse } from "next/server";
import { clearSession } from "../../lib/auth";
import { env } from "../../lib/env";

export async function GET() {
  await clearSession();
  return NextResponse.redirect(new URL("/", env.DASHBOARD_URL));
}

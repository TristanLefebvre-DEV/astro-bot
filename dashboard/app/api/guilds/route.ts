import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { getManageableGuilds } from "../../../lib/discord";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getManageableGuilds(session.accessToken));
}

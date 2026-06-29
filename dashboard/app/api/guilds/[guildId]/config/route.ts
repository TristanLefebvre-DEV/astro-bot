import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../../lib/auth";
import { assertGuildAccess } from "../../../../../lib/discord";
import { getOrCreateGuildConfig, models } from "../../../../../lib/db";
import { guildConfigPatchSchema } from "../../../../../lib/validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ guildId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guildId } = await context.params;
  await assertGuildAccess(session.accessToken, guildId);

  const body = await request.json();
  const parsed = guildConfigPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join(", ") }, { status: 400 });
  }

  const { GuildConfig } = await models();
  await GuildConfig.findOneAndUpdate({ guildId }, { $set: parsed.data }, { upsert: true });
  return NextResponse.json(await getOrCreateGuildConfig(guildId));
}

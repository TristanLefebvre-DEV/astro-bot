import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../../lib/auth";
import { assertGuildAccess } from "../../../../../lib/discord";
import { getOrCreateGuildConfig, models } from "../../../../../lib/db";

export async function GET(_request: NextRequest, context: { params: Promise<{ guildId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guildId } = await context.params;
  await assertGuildAccess(session.accessToken, guildId);

  const { Panel, Ticket, ModerationCase } = await models();
  const [config, panels, tickets, cases] = await Promise.all([
    getOrCreateGuildConfig(guildId),
    Panel.find({ guildId }).sort({ updatedAt: -1 }).limit(100).lean(),
    Ticket.find({ guildId }).sort({ createdAt: -1 }).limit(100).lean(),
    ModerationCase.find({ guildId }).sort({ createdAt: -1 }).limit(100).lean()
  ]);

  return NextResponse.json({ config, panels, tickets, cases });
}

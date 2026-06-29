import { PermissionFlagsBits, type GuildMember } from "discord.js";
import { embeds } from "../../utils/embeds.js";
import { getOrCreateGuildConfig, updateGuildConfig } from "../config/guildConfigService.js";
import { sendGuildLog } from "../logs/logService.js";

const joinBuckets = new Map<string, number[]>();

export async function setAntiRaid(guildId: string, enabled: boolean): Promise<void> {
  await updateGuildConfig(guildId, { $set: { "antiraid.enabled": enabled } });
}

export async function setPanic(guildId: string, enabled: boolean): Promise<void> {
  await updateGuildConfig(guildId, { $set: { "antiraid.panicMode": enabled } });
}

export async function addAntiRaidWhitelist(guildId: string, userId: string): Promise<void> {
  await updateGuildConfig(guildId, { $addToSet: { "antiraid.whitelistedUsers": userId } });
}

export async function removeAntiRaidWhitelist(guildId: string, userId: string): Promise<void> {
  await updateGuildConfig(guildId, { $pull: { "antiraid.whitelistedUsers": userId } });
}

export async function handleAntiRaidJoin(member: GuildMember): Promise<void> {
  const config = await getOrCreateGuildConfig(member.guild.id);
  const antiRaid = config?.antiraid;
  if (!antiRaid?.enabled && !antiRaid?.panicMode) return;
  if ((antiRaid.whitelistedUsers ?? []).includes(member.id)) return;

  const now = Date.now();
  const duration = Number(antiRaid.joinWindowMs ?? 60_000);
  const maxJoins = Number(antiRaid.maxJoins ?? 8);
  const bucket = (joinBuckets.get(member.guild.id) ?? []).filter((time) => now - time <= duration);
  bucket.push(now);
  joinBuckets.set(member.guild.id, bucket);

  const shouldAct = antiRaid.panicMode || bucket.length >= maxJoins;
  if (!shouldAct) return;

  const bot = member.guild.members.me;
  if (bot?.permissions.has(PermissionFlagsBits.KickMembers)) {
    await member.kick("Anti-raid Astro: raid/panic mode").catch(() => undefined);
  }

  await sendGuildLog(
    member.guild,
    "security",
    embeds.security({
      title: "Anti-raid",
      description: [
        `Membre: ${member.user.tag} (${member.id})`,
        `Joins fenêtre: **${bucket.length}/${maxJoins}**`,
        `Panic: **${antiRaid.panicMode ? "oui" : "non"}**`,
        bot?.permissions.has(PermissionFlagsBits.KickMembers) ? "Action: kick tenté" : "Action: aucune, permission KickMembers manquante"
      ].join("\n"),
      guild: member.guild,
      user: member.user
    })
  );
}

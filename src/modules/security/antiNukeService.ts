import { AuditLogEvent, PermissionFlagsBits, type Guild, type User } from "discord.js";
import type { Model } from "mongoose";
import { AntiNukeConfig } from "../../database/models/index.js";
import { embeds } from "../../utils/embeds.js";
import { sendGuildLog } from "../logs/logService.js";

const actionBuckets = new Map<string, number[]>();

async function getConfig(guildId: string): Promise<any> {
  return (AntiNukeConfig as Model<any>).findOneAndUpdate(
    { guildId },
    { $setOnInsert: { guildId, enabled: false } },
    { upsert: true, new: true }
  );
}

export async function setAntiNuke(guildId: string, enabled: boolean): Promise<void> {
  await (AntiNukeConfig as Model<any>).findOneAndUpdate({ guildId }, { $set: { enabled } }, { upsert: true });
}

export async function addAntiNukeWhitelist(guildId: string, userId: string): Promise<void> {
  await (AntiNukeConfig as Model<any>).findOneAndUpdate({ guildId }, { $addToSet: { whitelistedUsers: userId } }, { upsert: true });
}

export async function removeAntiNukeWhitelist(guildId: string, userId: string): Promise<void> {
  await (AntiNukeConfig as Model<any>).findOneAndUpdate({ guildId }, { $pull: { whitelistedUsers: userId } }, { upsert: true });
}

async function latestExecutor(guild: Guild, event: AuditLogEvent): Promise<User | null> {
  const logs = await guild.fetchAuditLogs({ type: event, limit: 1 }).catch(() => null);
  const executor = logs?.entries.first()?.executor;
  if (!executor || executor.partial) return null;
  return executor as User;
}

export async function handleAntiNukeAction(guild: Guild, event: AuditLogEvent, label: string): Promise<void> {
  const config = await getConfig(guild.id);
  if (!config.enabled) return;

  const executor = await latestExecutor(guild, event);
  if (!executor || executor.bot || (config.whitelistedUsers ?? []).includes(executor.id)) return;

  const now = Date.now();
  const windowMs = 60_000;
  const max = Number(config.maxChannels ?? config.maxRoles ?? config.maxBans ?? 3);
  const key = `${guild.id}:${executor.id}:${event}`;
  const bucket = (actionBuckets.get(key) ?? []).filter((time) => now - time <= windowMs);
  bucket.push(now);
  actionBuckets.set(key, bucket);

  if (bucket.length < max) return;

  const member = await guild.members.fetch(executor.id).catch(() => null);
  const bot = guild.members.me;
  let action = "alerte uniquement";
  if (member && bot?.permissions.has(PermissionFlagsBits.ModerateMembers) && bot.roles.highest.comparePositionTo(member.roles.highest) > 0) {
    await member.timeout(3_600_000, "Anti-nuke Astro").catch(() => undefined);
    action = "timeout 1h tenté";
  }

  await sendGuildLog(
    guild,
    "security",
    embeds.security({
      title: "Anti-nuke",
      description: [`Executor: ${executor.tag} (${executor.id})`, `Action: **${label}**`, `Compteur: **${bucket.length}/${max}**`, `Réponse: **${action}**`].join("\n"),
      guild,
      user: executor
    })
  );
}

import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type TextChannel,
  type User
} from "discord.js";
import type { Model } from "mongoose";
import { GuildConfig, ModerationCase, Warn } from "../../database/models/index.js";
import { defaultGuildConfig } from "../../config/defaultConfig.js";
import { embeds } from "../../utils/embeds.js";

export type ModerationCaseType = "ban" | "tempban" | "unban" | "softban" | "kick" | "timeout" | "untimeout" | "warn";

export interface CreateCaseInput {
  guildId: string;
  type: ModerationCaseType;
  userId: string;
  moderatorId: string;
  reason: string;
  duration?: number | null;
  expiresAt?: Date | null;
  active?: boolean;
  status?: "open" | "closed";
}

async function nextCaseId(guildId: string): Promise<number> {
  const latest = (await (ModerationCase as Model<any>)
    .findOne({ guildId })
    .sort({ caseId: -1 })
    .lean()) as { caseId?: number } | null;
  return (latest?.caseId ?? 0) + 1;
}

async function nextWarnId(guildId: string): Promise<number> {
  const latest = (await (Warn as Model<any>).findOne({ guildId }).sort({ warnId: -1 }).lean()) as
    | { warnId?: number }
    | null;
  return (latest?.warnId ?? 0) + 1;
}

export async function createModerationCase(input: CreateCaseInput): Promise<any> {
  const caseId = await nextCaseId(input.guildId);
  return (ModerationCase as Model<any>).create({
    guildId: input.guildId,
    caseId,
    type: input.type,
    userId: input.userId,
    moderatorId: input.moderatorId,
    reason: input.reason || "Aucune raison fournie",
    duration: input.duration ?? null,
    expiresAt: input.expiresAt ?? null,
    active: input.active ?? true,
    status: input.status ?? "open"
  });
}

export async function createWarn(input: {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
}): Promise<{ warn: any; modCase: any }> {
  const warnId = await nextWarnId(input.guildId);
  const warn = await (Warn as Model<any>).create({
    guildId: input.guildId,
    warnId,
    userId: input.userId,
    moderatorId: input.moderatorId,
    reason: input.reason
  });
  const modCase = await createModerationCase({ ...input, type: "warn" });
  return { warn, modCase };
}

export async function getUserHistory(guildId: string, userId: string): Promise<any[]> {
  return (ModerationCase as Model<any>).find({ guildId, userId }).sort({ createdAt: -1 }).limit(20).lean();
}

export async function getUserWarnings(guildId: string, userId: string): Promise<any[]> {
  return (Warn as Model<any>).find({ guildId, userId, deleted: false }).sort({ createdAt: -1 }).limit(20).lean();
}

export function canModerateMember(moderator: GuildMember, target: GuildMember): boolean {
  if (target.id === moderator.id) return false;
  if (target.guild.ownerId === target.id) return false;
  if (moderator.guild.ownerId === moderator.id) return true;
  return moderator.roles.highest.comparePositionTo(target.roles.highest) > 0;
}

export function canBotModerateMember(bot: GuildMember, target: GuildMember): boolean {
  if (target.guild.ownerId === target.id) return false;
  return bot.roles.highest.comparePositionTo(target.roles.highest) > 0;
}

export function moderationResultEmbed(input: {
  guild: Guild;
  title: string;
  user: User;
  moderator: User;
  reason: string;
  caseId: number;
}): EmbedBuilder {
  return embeds.moderation({
    title: input.title,
    description: [
      `Membre: ${input.user} (${input.user.id})`,
      `Moderateur: ${input.moderator} (${input.moderator.id})`,
      `Raison: ${input.reason}`,
      `Case: #${input.caseId}`
    ].join("\n"),
    guild: input.guild
  });
}

export async function sendModerationLog(guild: Guild, embed: EmbedBuilder): Promise<void> {
  const config = (await (GuildConfig as Model<any>).findOneAndUpdate(
    { guildId: guild.id },
    { $setOnInsert: { guildId: guild.id, ...defaultGuildConfig } },
    { upsert: true, new: true }
  ).lean()) as any;

  const channelId = config?.logs?.moderationChannelId;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) return;
  await (channel as TextChannel).send({ embeds: [embed] }).catch(() => undefined);
}

export function parseDurationToMs(input: string): number | null {
  const match = /^(\d+)(s|m|h|d|w)$/i.exec(input.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000
  };
  return amount * (multipliers[unit ?? "s"] ?? 1_000);
}

export const moderationBotPermissions = [
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ModerateMembers
];

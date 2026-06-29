import crypto from "node:crypto";
import { ChannelType, PermissionFlagsBits, type Guild } from "discord.js";
import type { Model } from "mongoose";
import { Backup } from "../../database/models/index.js";
import { formatZodError, serverTemplateSchema, type ValidatedServerTemplate } from "../validation/schemas.js";

interface ServerTemplateRole {
  name: string;
  color?: string;
  permissions?: string[];
}

interface ServerTemplateChannel {
  name: string;
  type: "text" | "voice";
}

interface ServerTemplateCategory {
  name: string;
  channels?: ServerTemplateChannel[];
}

export interface ServerTemplate extends ValidatedServerTemplate {
  name?: string;
  roles?: ServerTemplateRole[];
  categories?: ServerTemplateCategory[];
}

export function exportGuildTemplate(guild: Guild): ServerTemplate {
  const roles = guild.roles.cache
    .filter((role) => !role.managed && role.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map((role) => ({
      name: role.name,
      color: role.hexColor,
      permissions: role.permissions.toArray()
    }));

  const categories = guild.channels.cache
    .filter((channel) => channel.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position)
    .map((category) => ({
      name: category.name,
      channels: guild.channels.cache
        .filter((channel) => "parentId" in channel && channel.parentId === category.id && "position" in channel)
        .sort((a, b) => (a as { position: number }).position - (b as { position: number }).position)
        .map((channel) => ({
          name: channel.name,
          type: channel.type === ChannelType.GuildVoice ? ("voice" as const) : ("text" as const)
        }))
    }));

  return { name: guild.name, roles, categories };
}

export async function createBackup(guild: Guild, name: string, createdBy: string): Promise<any> {
  const backupId = crypto.randomBytes(6).toString("hex");
  return (Backup as Model<any>).create({
    guildId: guild.id,
    backupId,
    name,
    data: exportGuildTemplate(guild),
    createdBy
  });
}

export async function listBackups(guildId: string): Promise<any[]> {
  return (Backup as Model<any>).find({ guildId }).sort({ createdAt: -1 }).limit(20).lean();
}

export async function getBackup(guildId: string, backupId: string): Promise<any | null> {
  return (Backup as Model<any>).findOne({ guildId, backupId }).lean();
}

export async function deleteBackup(guildId: string, backupId: string): Promise<boolean> {
  const result = await (Backup as Model<any>).deleteOne({ guildId, backupId });
  return result.deletedCount === 1;
}

export function parseTemplate(rawJson: string): ServerTemplate {
  const parsed = JSON.parse(rawJson) as unknown;
  const result = serverTemplateSchema.safeParse(parsed);
  if (!result.success) throw new Error(formatZodError(result.error));
  return result.data;
}

export async function applyServerTemplate(guild: Guild, template: ServerTemplate): Promise<{ roles: number; channels: number }> {
  let roles = 0;
  let channels = 0;

  for (const role of template.roles?.slice(0, 50) ?? []) {
    if (!role.name || guild.roles.cache.some((existing) => existing.name === role.name)) continue;
    await guild.roles.create({
      name: role.name,
      color: role.color as `#${string}` | undefined,
      permissions: role.permissions?.filter((permission) => permission in PermissionFlagsBits) as any,
      reason: "ServerBuilder Astro"
    });
    roles += 1;
  }

  for (const category of template.categories?.slice(0, 20) ?? []) {
    if (!category.name) continue;
    const createdCategory = await guild.channels.create({
      name: category.name,
      type: ChannelType.GuildCategory,
      reason: "ServerBuilder Astro"
    });
    channels += 1;

    for (const channel of category.channels?.slice(0, 20) ?? []) {
      await guild.channels.create({
        name: channel.name,
        type: channel.type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
        parent: createdCategory.id,
        reason: "ServerBuilder Astro"
      });
      channels += 1;
    }
  }

  return { roles, channels };
}

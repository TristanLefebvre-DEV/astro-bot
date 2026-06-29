import type { ChatInputCommandInteraction, PermissionResolvable } from "discord.js";
import { PermissionsBitField } from "discord.js";
import { config } from "../config/index.js";

export function isOwner(userId: string): boolean {
  return config.OWNER_IDS.includes(userId);
}

export function missingMemberPermissions(
  interaction: ChatInputCommandInteraction,
  permissions: PermissionResolvable[] = []
): string[] {
  if (!interaction.inCachedGuild()) return permissions.map(String);
  const memberPermissions = interaction.member.permissions;
  return permissions
    .filter((permission) => !memberPermissions.has(permission))
    .map((permission) => new PermissionsBitField(permission).toArray().join(", ") || String(permission));
}

export function missingBotPermissions(
  interaction: ChatInputCommandInteraction,
  permissions: PermissionResolvable[] = []
): string[] {
  if (!interaction.inCachedGuild() || !interaction.guild.members.me) return permissions.map(String);
  const botPermissions = interaction.guild.members.me.permissions;
  return permissions
    .filter((permission) => !botPermissions.has(permission))
    .map((permission) => new PermissionsBitField(permission).toArray().join(", ") || String(permission));
}

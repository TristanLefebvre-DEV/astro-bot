import { AuditLogEvent, type Role } from "discord.js";
import type { Model } from "mongoose";
import { RoleProtectionConfig } from "../../database/models/index.js";
import { embeds } from "../../utils/embeds.js";
import { sendGuildLog } from "../logs/logService.js";

export async function setRoleProtect(guildId: string, enabled: boolean): Promise<void> {
  await (RoleProtectionConfig as Model<any>).findOneAndUpdate({ guildId }, { $set: { enabled } }, { upsert: true });
}

export async function addProtectedRole(guildId: string, roleId: string): Promise<void> {
  await (RoleProtectionConfig as Model<any>).findOneAndUpdate({ guildId }, { $addToSet: { protectedRoles: roleId } }, { upsert: true });
}

export async function removeProtectedRole(guildId: string, roleId: string): Promise<void> {
  await (RoleProtectionConfig as Model<any>).findOneAndUpdate({ guildId }, { $pull: { protectedRoles: roleId } }, { upsert: true });
}

export async function handleProtectedRoleUpdate(oldRole: Role, newRole: Role): Promise<void> {
  const cfg = await (RoleProtectionConfig as Model<any>).findOneAndUpdate(
    { guildId: newRole.guild.id },
    { $setOnInsert: { guildId: newRole.guild.id, enabled: false, protectedRoles: [] } },
    { upsert: true, new: true }
  );
  if (!cfg.enabled || !(cfg.protectedRoles ?? []).includes(newRole.id)) return;

  const logs = await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 }).catch(() => null);
  const executor = logs?.entries.first()?.executor;
  if (executor && (cfg.whitelistedUsers ?? []).includes(executor.id)) return;

  const rollback: Record<string, unknown> = {};
  if (oldRole.name !== newRole.name) rollback.name = oldRole.name;
  if (oldRole.color !== newRole.color) rollback.color = oldRole.color;
  if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) rollback.permissions = oldRole.permissions;

  if (Object.keys(rollback).length > 0 && cfg.autoRollback !== false) {
    await newRole.edit({ ...rollback, reason: "RoleProtect Astro rollback" }).catch(() => undefined);
  }

  await sendGuildLog(
    newRole.guild,
    "security",
    embeds.security({
      title: "RoleProtect",
      description: [`Rôle: ${newRole} (${newRole.id})`, `Executor: ${executor ? `${executor.tag} (${executor.id})` : "inconnu"}`, `Rollback: **${Object.keys(rollback).length > 0 ? "tenté" : "aucun changement critique"}**`].join("\n"),
      guild: newRole.guild,
      user: executor && !executor.partial ? executor : undefined
    })
  );
}

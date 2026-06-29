import type { GuildMember } from "discord.js";
import { embeds } from "../../utils/embeds.js";
import { getOrCreateGuildConfig } from "../config/guildConfigService.js";

export async function verifyMember(member: GuildMember): Promise<{ ok: boolean; message: string }> {
  const config = await getOrCreateGuildConfig(member.guild.id);
  const roleId = config?.verification?.roleId;
  if (!config?.verification?.enabled || !roleId) {
    return { ok: false, message: "La vérification n'est pas configurée sur ce serveur." };
  }

  if (member.roles.cache.has(roleId)) {
    return { ok: true, message: "Tu es déjà vérifié." };
  }

  await member.roles.add(roleId, "Vérification Astro");
  return { ok: true, message: "Vérification réussie, rôle attribué." };
}

export function verificationEmbed(ok: boolean, message: string) {
  return ok ? embeds.success({ title: "Vérification", description: message }) : embeds.error({ title: "Vérification", description: message });
}

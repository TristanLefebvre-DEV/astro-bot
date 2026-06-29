import { type GuildMember, type PartialGuildMember } from "discord.js";
import { embeds } from "../../utils/embeds.js";
import { getOrCreateGuildConfig } from "../config/guildConfigService.js";
import { sendGuildLog } from "../logs/logService.js";

function renderTemplate(template: string, member: GuildMember | PartialGuildMember): string {
  return template
    .replaceAll("{user}", `${member.user}`)
    .replaceAll("{tag}", member.user.tag)
    .replaceAll("{id}", member.id)
    .replaceAll("{server}", member.guild.name)
    .replaceAll("{count}", `${member.guild.memberCount}`);
}

export async function handleWelcome(member: GuildMember): Promise<void> {
  const config = await getOrCreateGuildConfig(member.guild.id);
  const autoroleId = config?.welcome?.autoroleId ?? config?.moderation?.autoroleId;
  if (autoroleId) await member.roles.add(autoroleId, "Autorole Astro").catch(() => undefined);

  if (!config?.welcome?.enabled || !config?.welcome?.channelId) return;
  const channel = member.guild.channels.cache.get(config.welcome.channelId);
  if (!channel?.isTextBased()) return;

  const message = renderTemplate(config.welcome.message ?? "Bienvenue {user} sur {server} !", member);
  await channel.send({
    embeds: [embeds.info({ title: "Bienvenue", description: message, guild: member.guild, user: member.user })]
  });
}

export async function handleLeave(member: GuildMember | PartialGuildMember): Promise<void> {
  const config = await getOrCreateGuildConfig(member.guild.id);
  if (!config?.leave?.enabled || !config?.leave?.channelId) {
    await sendGuildLog(
      member.guild,
      "member",
      embeds.logs({
        title: "Membre parti",
        description: `${member.user.tag} (${member.id}) a quitté le serveur.`,
        guild: member.guild,
        user: member.user
      })
    );
    return;
  }

  const channel = member.guild.channels.cache.get(config.leave.channelId);
  if (!channel?.isTextBased()) return;
  const message = renderTemplate(config.leave.message ?? "{tag} a quitté {server}.", member);
  await channel.send({
    embeds: [embeds.logs({ title: "Départ", description: message, guild: member.guild, user: member.user })]
  });
}

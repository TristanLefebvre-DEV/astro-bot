import { PermissionFlagsBits, type Message } from "discord.js";
import { embeds } from "../../utils/embeds.js";
import { redactSensitiveContent } from "../../utils/redaction.js";
import { getOrCreateGuildConfig } from "../config/guildConfigService.js";
import { sendGuildLog } from "../logs/logService.js";

const invitePattern = /(discord\.gg|discord\.com\/invite)\/[a-z0-9-]+/i;
const linkPattern = /https?:\/\/\S+/i;

export async function handleAutomodMessage(message: Message): Promise<void> {
  if (!message.guild || message.author.bot || !message.member) return;
  if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const config = await getOrCreateGuildConfig(message.guild.id);
  const automod = config?.automod;
  if (!automod?.enabled) return;
  if ((automod.ignoredChannels ?? []).includes(message.channel.id)) return;
  if (message.member.roles.cache.some((role) => (automod.ignoredRoles ?? []).includes(role.id))) return;
  if ((automod.bypassUsers ?? []).includes(message.author.id)) return;

  const content = message.content;
  const blockedWords: string[] = automod.blockedWords ?? [];
  const blockedWord = blockedWords.find((word) => word && content.toLowerCase().includes(word.toLowerCase()));
  const hasInvite = Boolean(automod.antiInvites?.enabled) && invitePattern.test(content);
  const hasLink = Boolean(automod.antiLinks?.enabled) && linkPattern.test(content);
  const tooManyMentions = automod.antiMention?.enabled && message.mentions.users.size > (automod.mentionLimit ?? 6);

  const reason = blockedWord
    ? `Mot bloqué: ${blockedWord}`
    : hasInvite
      ? "Invitation Discord détectée"
      : hasLink
        ? "Lien détecté"
        : tooManyMentions
          ? "Trop de mentions"
          : null;

  if (!reason) return;

  await message.delete().catch(() => undefined);
  if (message.channel.isSendable()) {
    await message.channel
      .send({
        embeds: [
          embeds.warning({
            title: "Message bloqué",
            description: `${message.author}, ton message a été retiré.\nRaison: **${reason}**`,
            guild: message.guild,
            user: message.author
          })
        ]
      })
      .then((sent) => setTimeout(() => void sent.delete().catch(() => undefined), 7000))
      .catch(() => undefined);
  }

  await sendGuildLog(
    message.guild,
    "security",
    embeds.security({
      title: "Automod",
      description: [`Auteur: ${message.author} (${message.author.id})`, `Salon: ${message.channel}`, `Raison: ${reason}`, `Contenu: ${redactSensitiveContent(content).slice(0, 800)}`].join("\n"),
      guild: message.guild,
      user: message.author
    })
  );
}

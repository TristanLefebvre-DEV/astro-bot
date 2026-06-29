import { ChannelType, type EmbedBuilder, type Guild, type TextChannel } from "discord.js";
import { getOrCreateGuildConfig } from "../config/guildConfigService.js";

export type LogType = "moderation" | "security" | "message" | "member" | "voice";

const logChannelKey: Record<LogType, string> = {
  moderation: "moderationChannelId",
  security: "securityChannelId",
  message: "messageChannelId",
  member: "memberChannelId",
  voice: "voiceChannelId"
};

export async function sendGuildLog(guild: Guild, type: LogType, embed: EmbedBuilder): Promise<void> {
  const config = await getOrCreateGuildConfig(guild.id);
  if (!config?.logs?.enabled) return;

  const channelId = config.logs[logChannelKey[type]];
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) return;
  await (channel as TextChannel).send({ embeds: [embed] }).catch(() => undefined);
}

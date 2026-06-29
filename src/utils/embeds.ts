import { Colors, EmbedBuilder, type Guild, type User } from "discord.js";

interface EmbedOptions {
  title: string;
  description?: string;
  guild?: Guild | null;
  user?: User | null;
}

function baseEmbed(color: number, options: EmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(options.title)
    .setDescription(options.description ?? null)
    .setTimestamp();

  if (options.guild) {
    embed.setFooter({
      text: options.guild.name,
      iconURL: options.guild.iconURL() ?? undefined
    });
  }

  if (options.user) {
    embed.setAuthor({
      name: options.user.tag,
      iconURL: options.user.displayAvatarURL()
    });
  }

  return embed;
}

export const embeds = {
  success: (options: EmbedOptions) => baseEmbed(Colors.Green, options),
  error: (options: EmbedOptions) => baseEmbed(Colors.Red, options),
  warning: (options: EmbedOptions) => baseEmbed(Colors.Orange, options),
  info: (options: EmbedOptions) => baseEmbed(Colors.Blurple, options),
  moderation: (options: EmbedOptions) => baseEmbed(Colors.DarkRed, options),
  ticket: (options: EmbedOptions) => baseEmbed(Colors.Aqua, options),
  security: (options: EmbedOptions) => baseEmbed(Colors.Gold, options),
  logs: (options: EmbedOptions) => baseEmbed(Colors.Grey, options),
  confirmation: (options: EmbedOptions) => baseEmbed(Colors.Yellow, options),
  dashboard: (options: EmbedOptions) => baseEmbed(Colors.Purple, options),
  maintenance: (options: EmbedOptions) => baseEmbed(Colors.DarkButNotBlack, options)
};

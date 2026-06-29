import { EmbedBuilder, type APIEmbedField, type Guild, type User } from "discord.js";

export const embedTheme = {
  colors: {
    success: 0x2ecc71,
    error: 0xed4245,
    warning: 0xf59e0b,
    info: 0x5865f2,
    moderation: 0xe74c3c,
    ticket: 0x00b2ff,
    security: 0xf1c40f,
    logs: 0x95a5a6,
    confirmation: 0xffcc4d,
    dashboard: 0x9b59b6,
    maintenance: 0x2b2d31
  },
  icons: {
    success: "[OK]",
    error: "[!]",
    warning: "[!]",
    info: "[i]",
    moderation: "[MOD]",
    ticket: "[TICKET]",
    security: "[SEC]",
    logs: "[LOG]",
    confirmation: "[?]",
    dashboard: "[DASH]",
    maintenance: "[MAINT]"
  },
  footer: "Astro Bot - Interface Discord"
} as const;

type EmbedKind = keyof typeof embedTheme.colors;

interface EmbedOptions {
  title: string;
  description?: string;
  guild?: Guild | null;
  user?: User | null;
  thumbnail?: string | null;
  image?: string | null;
  footer?: string | null;
  timestamp?: boolean;
}

function cleanText(text?: string): string | null {
  if (!text) return null;
  const cleaned = text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return cleaned.length > 3900 ? `${cleaned.slice(0, 3890)}...` : cleaned;
}

function normalizeField(field: APIEmbedField): APIEmbedField {
  return {
    name: field.name,
    value: cleanText(field.value) ?? "\u200B",
    inline: false
  };
}

function makeSpacious(embed: EmbedBuilder): EmbedBuilder {
  const originalAddFields = embed.addFields.bind(embed);

  embed.addFields = ((...fields: any[]) => {
    const normalized = fields
      .flatMap((field) => (Array.isArray(field) ? field : [field]))
      .map((field) => (typeof field === "function" ? field : normalizeField(field)));
    return originalAddFields(...normalized);
  }) as typeof embed.addFields;

  return embed;
}

function baseEmbed(kind: EmbedKind, options: EmbedOptions): EmbedBuilder {
  const icon = embedTheme.icons[kind];
  const embed = makeSpacious(new EmbedBuilder())
    .setColor(embedTheme.colors[kind])
    .setTitle(`${icon} ${options.title}`)
    .setDescription(cleanText(options.description));

  if (options.timestamp !== false) embed.setTimestamp();

  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);

  const footerText = options.footer ?? (options.guild ? `${options.guild.name} - ${embedTheme.footer}` : embedTheme.footer);
  embed.setFooter({
    text: footerText,
    iconURL: options.guild?.iconURL() ?? undefined
  });

  if (options.user) {
    embed.setAuthor({
      name: options.user.tag,
      iconURL: options.user.displayAvatarURL()
    });
  }

  return embed;
}

export const embeds = {
  success: (options: EmbedOptions) => baseEmbed("success", options),
  error: (options: EmbedOptions) => baseEmbed("error", options),
  warning: (options: EmbedOptions) => baseEmbed("warning", options),
  info: (options: EmbedOptions) => baseEmbed("info", options),
  moderation: (options: EmbedOptions) => baseEmbed("moderation", options),
  ticket: (options: EmbedOptions) => baseEmbed("ticket", options),
  security: (options: EmbedOptions) => baseEmbed("security", options),
  logs: (options: EmbedOptions) => baseEmbed("logs", options),
  confirmation: (options: EmbedOptions) => baseEmbed("confirmation", options),
  dashboard: (options: EmbedOptions) => baseEmbed("dashboard", options),
  maintenance: (options: EmbedOptions) => baseEmbed("maintenance", options),
  permission: (options: Omit<EmbedOptions, "title"> & { title?: string }) =>
    baseEmbed("error", { ...options, title: options.title ?? "Permission manquante" }),
  cooldown: (options: Omit<EmbedOptions, "title"> & { title?: string }) =>
    baseEmbed("warning", { ...options, title: options.title ?? "Commande en cooldown" }),
  unknownCommand: (options: Omit<EmbedOptions, "title"> & { title?: string }) =>
    baseEmbed("error", { ...options, title: options.title ?? "Commande inconnue" }),
  userNotFound: (options: Omit<EmbedOptions, "title"> & { title?: string }) =>
    baseEmbed("error", { ...options, title: options.title ?? "Utilisateur introuvable" }),
  configUpdated: (options: Omit<EmbedOptions, "title"> & { title?: string }) =>
    baseEmbed("success", { ...options, title: options.title ?? "Configuration modifiee" })
};

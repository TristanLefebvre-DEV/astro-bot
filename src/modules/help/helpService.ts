import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type Client,
  type Guild,
  type InteractionReplyOptions,
  type InteractionUpdateOptions,
  type StringSelectMenuInteraction
} from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { config } from "../../config/index.js";
import { embedTheme } from "../../utils/embeds.js";

const helpCategoryCustomId = "help:category";
const homeCustomId = "help:home";
const pagePrefix = "help:page:";
const pageSize = 7;

const categoryMeta: Record<string, { label: string; tag: string; description: string }> = {
  help: { label: "Aide", tag: "[AIDE]", description: "Navigation et documentation du bot." },
  config: { label: "Configuration", tag: "[CONFIG]", description: "Reglages serveur, panels, logs et modules." },
  moderation: { label: "Moderation", tag: "[MOD]", description: "Sanctions, roles, messages et gestion serveur." },
  tickets: { label: "Tickets", tag: "[TICKET]", description: "Support, reclamations et suivi staff." },
  security: { label: "Securite", tag: "[SEC]", description: "Anti-raid, anti-nuke, automod et protections." },
  utility: { label: "Utilitaires", tag: "[TOOLS]", description: "Infos, outils et commandes pratiques." },
  owner: { label: "Owner", tag: "[OWNER]", description: "Commandes reservees au proprietaire du bot." }
};

interface CommandOptionView {
  type?: number;
  name?: string;
}

function asUpdateOptions(payload: InteractionReplyOptions): InteractionUpdateOptions {
  return {
    embeds: payload.embeds,
    components: payload.components
  };
}

function getCommands(client: Client<true>): SlashCommand[] {
  return [...client.commands.values()].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.data.name.localeCompare(b.data.name);
  });
}

function getCategories(commands: SlashCommand[]): string[] {
  return [...new Set(commands.map((command) => command.category))];
}

function getSubcommands(command: SlashCommand): string[] {
  const json = command.data.toJSON();
  return ((json.options ?? []) as CommandOptionView[])
    .filter((option) => option.type === 1)
    .map((option) => option.name)
    .filter((name): name is string => Boolean(name));
}

function compactCommandLine(command: SlashCommand): string {
  const subs = getSubcommands(command);
  const suffix = subs.length > 0 ? ` ${subs.slice(0, 3).join(" ")}${subs.length > 3 ? " ..." : ""}` : "";
  return [`\`/${command.data.name}${suffix}\``, command.data.description].join("\n");
}

function footer(guild?: Guild | null): { text: string; iconURL?: string } {
  return {
    text: guild ? `${guild.name} - Astro Bot - Help` : "Astro Bot - Help",
    iconURL: guild?.iconURL() ?? undefined
  };
}

function componentsFor(category?: string, page = 0, totalPages = 1): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
  const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(helpCategoryCustomId)
      .setPlaceholder("Choisir une categorie")
      .addOptions(
        Object.entries(categoryMeta).map(([value, meta]) => ({
          label: meta.label,
          value,
          description: meta.description.slice(0, 95),
          default: category === value
        }))
      )
  );

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(homeCustomId).setLabel("Accueil").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${pagePrefix}${category ?? "home"}:${Math.max(page - 1, 0)}`)
      .setLabel("Precedent")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!category || page <= 0),
    new ButtonBuilder()
      .setCustomId(`${pagePrefix}${category ?? "home"}:${Math.min(page + 1, totalPages - 1)}`)
      .setLabel("Suivant")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!category || page >= totalPages - 1)
  );

  return [select, buttons];
}

export function renderHelpHome(client: Client<true>, guild?: Guild | null): InteractionReplyOptions {
  const commands = getCommands(client);
  const categories = getCategories(commands);
  const embed = new EmbedBuilder()
    .setColor(embedTheme.colors.info)
    .setTitle("[AIDE] Centre d'aide Astro")
    .setDescription(
      [
        "Selectionne une categorie avec le menu ci-dessous.",
        "Les commandes sont paginees pour garder un affichage lisible.",
        "",
        `Commandes chargees: **${commands.length}**`,
        `Categories: **${categories.length}**`,
        `Dashboard: **${config.DASHBOARD_ENABLED ? "active" : "desactive"}**`
      ].join("\n")
    )
    .setFooter(footer(guild))
    .setTimestamp();

  for (const category of categories) {
    const meta = categoryMeta[category] ?? { label: category, tag: "[CAT]", description: "Commandes du bot." };
    const count = commands.filter((command) => command.category === category).length;
    embed.addFields({
      name: `${meta.tag} ${meta.label}`,
      value: `${meta.description}\n\n**${count}** commande(s)`,
      inline: false
    });
  }

  return { embeds: [embed], components: componentsFor(), ephemeral: true };
}

export function renderHelpCategory(
  client: Client<true>,
  category: string,
  page: number,
  guild?: Guild | null
): InteractionReplyOptions {
  const commands = getCommands(client).filter((command) => command.category === category);
  const meta = categoryMeta[category] ?? { label: category, tag: "[CAT]", description: "Commandes du bot." };
  const totalPages = Math.max(Math.ceil(commands.length / pageSize), 1);
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const visible = commands.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const embed = new EmbedBuilder()
    .setColor(category === "security" ? embedTheme.colors.security : category === "tickets" ? embedTheme.colors.ticket : embedTheme.colors.info)
    .setTitle(`${meta.tag} ${meta.label}`)
    .setDescription(`${meta.description}\n\nPage **${safePage + 1}/${totalPages}** - **${commands.length}** commande(s)`)
    .setFooter(footer(guild))
    .setTimestamp();

  embed.addFields({
    name: "Commandes",
    value: visible.map(compactCommandLine).join("\n\n") || "Aucune commande dans cette categorie.",
    inline: false
  });

  return { embeds: [embed], components: componentsFor(category, safePage, totalPages), ephemeral: true };
}

export function renderCommandDetails(client: Client<true>, query: string, guild?: Guild | null): InteractionReplyOptions {
  const normalized = query.replace("/", "").trim().toLowerCase();
  const command = getCommands(client).find((item) => item.data.name.toLowerCase() === normalized);

  if (!command) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(embedTheme.colors.error)
          .setTitle("[!] Commande introuvable")
          .setDescription(`Aucune commande ne correspond a \`${query}\`.`)
          .setFooter(footer(guild))
          .setTimestamp()
      ],
      ephemeral: true
    };
  }

  const subs = getSubcommands(command);
  const meta = categoryMeta[command.category] ?? { label: command.category, tag: "[CAT]", description: "Commandes du bot." };
  const embed = new EmbedBuilder()
    .setColor(embedTheme.colors.info)
    .setTitle(`[CMD] /${command.data.name}`)
    .setDescription(command.data.description)
    .addFields(
      { name: "Categorie", value: `${meta.tag} ${meta.label}`, inline: false },
      { name: "Cooldown", value: `${command.cooldownSeconds ?? 3}s`, inline: false },
      { name: "Serveur uniquement", value: command.guildOnly ? "Oui" : "Non", inline: false },
      { name: "Sous-commandes", value: subs.length > 0 ? subs.map((sub) => `\`/${command.data.name} ${sub}\``).join("\n") : "Aucune", inline: false }
    )
    .setFooter(footer(guild))
    .setTimestamp();

  return { embeds: [embed], ephemeral: true };
}

export async function handleHelpComponent(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  client: Client<true>
): Promise<boolean> {
  if (interaction.isStringSelectMenu() && interaction.customId === helpCategoryCustomId) {
    const category = interaction.values[0];
    if (!category) return true;
    await interaction.update(asUpdateOptions(renderHelpCategory(client, category, 0, interaction.guild)));
    return true;
  }

  if (interaction.isButton() && interaction.customId === homeCustomId) {
    await interaction.update(asUpdateOptions(renderHelpHome(client, interaction.guild)));
    return true;
  }

  if (interaction.isButton() && interaction.customId.startsWith(pagePrefix)) {
    const [, , category, pageRaw] = interaction.customId.split(":");
    if (!category) return true;
    await interaction.update(asUpdateOptions(renderHelpCategory(client, category, Number(pageRaw) || 0, interaction.guild)));
    return true;
  }

  return false;
}

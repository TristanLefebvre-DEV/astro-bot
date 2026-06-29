import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { config } from "../../config/index.js";

const categoryLabels: Record<string, string> = {
  help: "Aide",
  owner: "Owner",
  config: "Configuration",
  moderation: "Moderation",
  tickets: "Tickets",
  security: "Securite",
  utility: "Utilitaires"
};

interface CommandOptionView {
  type?: number;
  name?: string;
}

function optionNames(options?: CommandOptionView[]): string[] {
  return (options ?? [])
    .filter((option) => option.type === 1)
    .map((option) => option.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 12);
}

function commandLine(command: SlashCommand): string {
  const json = command.data.toJSON();
  const subs = optionNames(json.options as CommandOptionView[] | undefined);
  const suffix = subs.length > 0 ? ` ${subs.join(" ")}` : "";
  return `\`/${json.name}${suffix}\` - ${json.description}`;
}

function splitFieldValue(lines: string[]): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > 980) {
      chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

const command: SlashCommand = {
  category: "help",
  cooldownSeconds: 5,
  data: new SlashCommandBuilder().setName("help").setDescription("Affiche toutes les commandes du bot."),
  async execute(interaction, { client }) {
    const commands = [...client.commands.values()].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.data.name.localeCompare(b.data.name);
    });
    const categories = [...new Set(commands.map((item) => item.category))];

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Centre d'aide Astro")
      .setDescription(
        [
          `Commandes chargees: **${commands.length}**`,
          `Categories: **${categories.length}**`,
          `Dashboard: **${config.DASHBOARD_ENABLED ? "active" : "desactive"}**`,
          "Tout est regroupe ici pour eviter de chercher dans plusieurs pages."
        ].join("\n")
      )
      .setTimestamp();

    for (const category of categories) {
      const lines = commands.filter((item) => item.category === category).map(commandLine);
      const chunks = splitFieldValue(lines);

      chunks.forEach((chunk, index) => {
        embed.addFields({
          name: `${categoryLabels[category] ?? category}${chunks.length > 1 ? ` (${index + 1})` : ""}`,
          value: chunk || "Aucune commande"
        });
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

export default command;

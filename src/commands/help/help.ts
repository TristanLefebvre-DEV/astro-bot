import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { config } from "../../config/index.js";
import { paginateEmbeds } from "../../utils/pagination.js";

const command: SlashCommand = {
  category: "help",
  cooldownSeconds: 5,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche le centre d'aide interactif.")
    .addStringOption((option) =>
      option.setName("category").setDescription("Catégorie à afficher directement.").setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("command").setDescription("Commande à rechercher.").setRequired(false)
    ),
  async execute(interaction, { client }) {
    const categoryFilter = interaction.options.getString("category");
    const commandFilter = interaction.options.getString("command");
    const commands = [...client.commands.values()];
    const categories = [...new Set(commands.map((item) => item.category))].sort();

    if (commandFilter) {
      const found = commands.find((item) => item.data.name === commandFilter.replace("/", ""));
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(found ? `/${found.data.name}` : "Commande introuvable")
        .setDescription(found?.data.description ?? "Aucune commande ne correspond à cette recherche.")
        .addFields(
          { name: "Catégorie", value: found?.category ?? "n/a", inline: true },
          { name: "Cooldown", value: `${found?.cooldownSeconds ?? 3}s`, inline: true },
          { name: "Owner only", value: found?.ownerOnly ? "Oui" : "Non", inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const pages = categories
      .filter((category) => !categoryFilter || category.includes(categoryFilter.toLowerCase()))
      .map((category, index, filteredCategories) => {
        const categoryCommands = commands.filter((item) => item.category === category);
        return new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(index === 0 && !categoryFilter ? "Centre d'aide Astro" : `Catégorie ${category}`)
          .setDescription(
            index === 0 && !categoryFilter
              ? [
                  `Commandes chargées: **${commands.length}**`,
                  `Catégories: **${categories.length}**`,
                  `Serveur: **${interaction.guild?.name ?? "DM"}**`,
                  `Dashboard: **${config.DASHBOARD_ENABLED ? "activé" : "désactivé"}**`,
                  "Le bot reste entièrement utilisable depuis Discord."
                ].join("\n")
              : `Commandes de la catégorie **${category}**.`
          )
          .addFields({
            name: "Commandes",
            value: categoryCommands.map((item) => `\`/${item.data.name}\` - ${item.data.description}`).join("\n") || "Aucune"
          })
          .setFooter({ text: `Page ${index + 1}/${filteredCategories.length}` })
          .setTimestamp();
      });

    if (pages.length === 0) {
      await interaction.reply({ content: "Aucune catégorie trouvée.", ephemeral: true });
      return;
    }

    await paginateEmbeds(interaction, pages, true);
  }
};

export default command;

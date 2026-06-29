import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { renderCommandDetails, renderHelpHome } from "../../modules/help/helpService.js";

const command: SlashCommand = {
  category: "help",
  cooldownSeconds: 5,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Ouvre le centre d'aide interactif.")
    .addStringOption((option) =>
      option
        .setName("recherche")
        .setDescription("Nom d'une commande a afficher directement.")
        .setRequired(false)
        .setAutocomplete(false)
    ),
  async execute(interaction, { client }) {
    const search = interaction.options.getString("recherche");
    await interaction.reply(search ? renderCommandDetails(client, search, interaction.guild) : renderHelpHome(client, interaction.guild));
  }
};

export default command;

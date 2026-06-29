import { SlashCommandBuilder } from "discord.js";
import mongoose from "mongoose";
import type { SlashCommand } from "../../types/command.js";
import { config } from "../../config/index.js";
import { isDatabaseReady } from "../../database/connection.js";
import { embeds } from "../../utils/embeds.js";

const command: SlashCommand = {
  category: "owner",
  ownerOnly: true,
  cooldownSeconds: 5,
  data: new SlashCommandBuilder()
    .setName("bot")
    .setDescription("Commandes owner et diagnostic du bot.")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Affiche l'état global du bot."))
    .addSubcommand((subcommand) => subcommand.setName("pingdb").setDescription("Teste la connexion MongoDB."))
    .addSubcommand((subcommand) => subcommand.setName("guilds").setDescription("Liste les serveurs du bot."))
    .addSubcommand((subcommand) => subcommand.setName("stats").setDescription("Stats globales du bot.")),
  async execute(interaction, { client }) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "pingdb") {
      const startedAt = Date.now();
      await mongoose.connection.db?.admin().ping();
      const latency = Date.now() - startedAt;
      await interaction.reply({
        embeds: [
          embeds.success({
            title: "MongoDB opérationnel",
            description: `Ping base de données: **${latency}ms**`,
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "guilds") {
      await interaction.reply({
        embeds: [
          embeds.info({
            title: "Serveurs",
            description:
              client.guilds.cache
                .map((guild) => `${guild.name} - \`${guild.id}\` - ${guild.memberCount} membres`)
                .slice(0, 30)
                .join("\n") || "Aucun serveur.",
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "stats") {
      const guilds = client.guilds.cache.size;
      const users = client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);
      await interaction.reply({
        embeds: [
          embeds.info({
            title: "Stats globales",
            description: [
              `Serveurs: **${guilds}**`,
              `Membres visibles: **${users}**`,
              `Commandes: **${client.commands.size}**`,
              `Uptime: **${Math.floor(process.uptime())}s**`
            ].join("\n"),
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [
        embeds.info({
          title: "Statut du bot",
          description: [
            `Connecté: **${client.user.tag}**`,
            `Serveurs: **${client.guilds.cache.size}**`,
            `Commandes chargées: **${client.commands.size}**`,
            `MongoDB: **${isDatabaseReady() ? "connecté" : "déconnecté"}**`,
            `Sync commands: **${config.COMMAND_SYNC_MODE}**`,
            `Dashboard: **${config.DASHBOARD_ENABLED ? "activé" : "désactivé"}**`
          ].join("\n"),
          guild: interaction.guild
        })
      ],
      ephemeral: true
    });
  }
};

export default command;

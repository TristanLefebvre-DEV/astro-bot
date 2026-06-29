import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { Model } from "mongoose";
import type { SlashCommand } from "../../types/command.js";
import { GuildConfig } from "../../database/models/index.js";
import { defaultGuildConfig } from "../../config/defaultConfig.js";
import { embeds } from "../../utils/embeds.js";

interface GuildConfigView {
  language: string;
  timezone: string;
  moderation?: { enabled?: boolean };
  tickets?: { enabled?: boolean };
  antiraid?: { enabled?: boolean };
  antinuke?: { enabled?: boolean };
}

const command: SlashCommand = {
  category: "config",
  guildOnly: true,
  cooldownSeconds: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configuration serveur du bot.")
    .addSubcommand((subcommand) => subcommand.setName("view").setDescription("Voir la configuration du serveur."))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("language")
        .setDescription("Changer la langue du bot.")
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription("Langue.")
            .setRequired(true)
            .addChoices({ name: "Français", value: "fr" }, { name: "English", value: "en" })
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("timezone")
        .setDescription("Changer le fuseau horaire serveur.")
        .addStringOption((option) => option.setName("value").setDescription("Ex: Europe/Paris.").setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("logs")
        .setDescription("Configurer le salon de logs moderation.")
        .addChannelOption((option) =>
          option
            .setName("moderation")
            .setDescription("Salon logs moderation.")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("tickets")
        .setDescription("Configurer les tickets.")
        .addRoleOption((option) => option.setName("support_role").setDescription("Role support à ajouter.").setRequired(false))
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("Categorie tickets.")
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildCategory)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reset")
        .setDescription("Réinitialiser la configuration serveur.")
        .addStringOption((option) =>
          option.setName("confirm").setDescription("Tape CONFIRM pour confirmer.").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcome")
        .setDescription("Configurer le welcome.")
        .addChannelOption((option) =>
          option.setName("channel").setDescription("Salon bienvenue.").setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) => option.setName("message").setDescription("Variables: {user}, {server}, {count}.").setRequired(false))
        .addRoleOption((option) => option.setName("autorole").setDescription("Rôle automatique.").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leave")
        .setDescription("Configurer le message de départ.")
        .addChannelOption((option) =>
          option.setName("channel").setDescription("Salon départ.").setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) => option.setName("message").setDescription("Variables: {tag}, {server}, {count}.").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("verification")
        .setDescription("Configurer la vérification.")
        .addRoleOption((option) => option.setName("role").setDescription("Rôle vérifié.").setRequired(true))
        .addChannelOption((option) =>
          option.setName("channel").setDescription("Salon vérification.").setRequired(false).addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("automod")
        .setDescription("Configurer automod simple.")
        .addStringOption((option) =>
          option
            .setName("mode")
            .setDescription("Mode.")
            .setRequired(true)
            .addChoices(
              { name: "on", value: "on" },
              { name: "off", value: "off" },
              { name: "anti-links-on", value: "links_on" },
              { name: "anti-links-off", value: "links_off" },
              { name: "anti-invites-on", value: "invites_on" },
              { name: "anti-invites-off", value: "invites_off" },
              { name: "add-blocked-word", value: "word_add" }
            )
        )
        .addStringOption((option) => option.setName("value").setDescription("Valeur selon le mode.").setRequired(false))
    ),
  async execute(interaction) {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "language") {
      const value = interaction.options.getString("value", true);
      await (GuildConfig as Model<any>).findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: { language: value }, $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig } },
        { upsert: true }
      );
      await interaction.reply({ embeds: [embeds.success({ title: "Langue mise à jour", description: `Langue: **${value}**` })], ephemeral: true });
      return;
    }

    if (subcommand === "timezone") {
      const value = interaction.options.getString("value", true);
      await (GuildConfig as Model<any>).findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: { timezone: value }, $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig } },
        { upsert: true }
      );
      await interaction.reply({ embeds: [embeds.success({ title: "Timezone mise à jour", description: `Timezone: **${value}**` })], ephemeral: true });
      return;
    }

    if (subcommand === "logs") {
      const channel = interaction.options.getChannel("moderation", true);
      await (GuildConfig as Model<any>).findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          $set: { "logs.enabled": true, "logs.moderationChannelId": channel.id },
          $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig }
        },
        { upsert: true }
      );
      await interaction.reply({ embeds: [embeds.success({ title: "Logs configurés", description: `Logs moderation: ${channel}` })], ephemeral: true });
      return;
    }

    if (subcommand === "tickets") {
      const role = interaction.options.getRole("support_role");
      const category = interaction.options.getChannel("category");
      const update: Record<string, unknown> = { "tickets.enabled": true };
      if (category) update["tickets.categoryId"] = category.id;
      const operation: Record<string, unknown> = {
        $set: update,
        $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig }
      };
      if (role) operation.$addToSet = { "tickets.supportRoleIds": role.id };
      await (GuildConfig as Model<any>).findOneAndUpdate({ guildId: interaction.guild.id }, operation, { upsert: true });
      await interaction.reply({
        embeds: [
          embeds.success({
            title: "Tickets configurés",
            description: [`Role support: ${role ?? "inchangé"}`, `Catégorie: ${category ?? "inchangée"}`].join("\n")
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "reset") {
      if (interaction.options.getString("confirm", true) !== "CONFIRM") {
        await interaction.reply({ embeds: [embeds.error({ title: "Confirmation requise", description: "Tape exactement CONFIRM." })], ephemeral: true });
        return;
      }
      await (GuildConfig as Model<any>).deleteOne({ guildId: interaction.guild.id });
      await interaction.reply({ embeds: [embeds.success({ title: "Configuration réinitialisée", description: "La configuration sera recréée avec les valeurs par défaut." })], ephemeral: true });
      return;
    }

    if (subcommand === "welcome") {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message") ?? "Bienvenue {user} sur {server} !";
      const autorole = interaction.options.getRole("autorole");
      const set: Record<string, unknown> = {
        "welcome.enabled": true,
        "welcome.channelId": channel.id,
        "welcome.message": message
      };
      if (autorole) set["welcome.autoroleId"] = autorole.id;
      await (GuildConfig as Model<any>).findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: set, $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig } },
        { upsert: true }
      );
      await interaction.reply({
        embeds: [embeds.success({ title: "Welcome configuré", description: `Salon: ${channel}\nAutorole: ${autorole ?? "inchangé"}` })],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "leave") {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message") ?? "{tag} a quitté {server}.";
      await (GuildConfig as Model<any>).findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          $set: { "leave.enabled": true, "leave.channelId": channel.id, "leave.message": message },
          $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig }
        },
        { upsert: true }
      );
      await interaction.reply({
        embeds: [embeds.success({ title: "Leave configuré", description: `Salon: ${channel}` })],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "verification") {
      const role = interaction.options.getRole("role", true);
      const channel = interaction.options.getChannel("channel");
      await (GuildConfig as Model<any>).findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          $set: {
            "verification.enabled": true,
            "verification.roleId": role.id,
            ...(channel ? { "verification.channelId": channel.id } : {})
          },
          $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig }
        },
        { upsert: true }
      );
      await interaction.reply({
        embeds: [embeds.success({ title: "Vérification configurée", description: `Rôle: ${role}\nSalon: ${channel ?? "inchangé"}` })],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "automod") {
      const mode = interaction.options.getString("mode", true);
      const value = interaction.options.getString("value");
      const set: Record<string, unknown> = {};
      const addToSet: Record<string, unknown> = {};

      if (mode === "on") set["automod.enabled"] = true;
      if (mode === "off") set["automod.enabled"] = false;
      if (mode === "links_on") set["automod.antiLinks.enabled"] = true;
      if (mode === "links_off") set["automod.antiLinks.enabled"] = false;
      if (mode === "invites_on") set["automod.antiInvites.enabled"] = true;
      if (mode === "invites_off") set["automod.antiInvites.enabled"] = false;
      if (mode === "word_add" && value) addToSet["automod.blockedWords"] = value.toLowerCase();

      await (GuildConfig as Model<any>).findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          ...(Object.keys(set).length ? { $set: set } : {}),
          ...(Object.keys(addToSet).length ? { $addToSet: addToSet } : {}),
          $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig }
        },
        { upsert: true }
      );
      await interaction.reply({
        embeds: [embeds.success({ title: "Automod configuré", description: `Mode: **${mode}**${value ? `\nValeur: ${value}` : ""}` })],
        ephemeral: true
      });
      return;
    }

    const guildConfig = (await (GuildConfig as Model<any>).findOneAndUpdate(
      { guildId: interaction.guild.id },
      { $setOnInsert: { guildId: interaction.guild.id, ...defaultGuildConfig } },
      { upsert: true, new: true }
    ).lean()) as unknown as GuildConfigView;

    await interaction.reply({
      embeds: [
        embeds.dashboard({
          title: "Configuration serveur",
          description: [
            `Langue: **${guildConfig.language}**`,
            `Timezone: **${guildConfig.timezone}**`,
            `Modération: **${guildConfig.moderation?.enabled ? "activée" : "désactivée"}**`,
            `Tickets: **${guildConfig.tickets?.enabled ? "activés" : "désactivés"}**`,
            `Anti-raid: **${guildConfig.antiraid?.enabled ? "activé" : "désactivé"}**`,
            `Anti-nuke: **${guildConfig.antinuke?.enabled ? "activé" : "désactivé"}**`
          ].join("\n"),
          guild: interaction.guild
        })
      ],
      ephemeral: true
    });
  }
};

export default command;

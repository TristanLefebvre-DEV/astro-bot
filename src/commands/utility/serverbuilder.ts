import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { applyServerTemplate, exportGuildTemplate, parseTemplate } from "../../modules/backup/backupService.js";
import { embeds } from "../../utils/embeds.js";

const command: SlashCommand = {
  category: "utility",
  guildOnly: true,
  cooldownSeconds: 10,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName("serverbuilder")
    .setDescription("Constructeur serveur JSON.")
    .addSubcommand((sub) => sub.setName("validate").setDescription("Valider JSON.").addStringOption((option) => option.setName("json").setDescription("Template JSON.").setRequired(true).setMaxLength(4000)))
    .addSubcommand((sub) => sub.setName("preview").setDescription("Prévisualiser JSON.").addStringOption((option) => option.setName("json").setDescription("Template JSON.").setRequired(true).setMaxLength(4000)))
    .addSubcommand((sub) => sub.setName("load").setDescription("Créer rôles/salons depuis JSON.").addStringOption((option) => option.setName("json").setDescription("Template JSON.").setRequired(true).setMaxLength(4000)).addStringOption((option) => option.setName("confirm").setDescription("Tape CONFIRM.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("export").setDescription("Exporter le serveur actuel."))
    .addSubcommand((sub) => sub.setName("template").setDescription("Afficher un template exemple.")),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "export" || subcommand === "template") {
      const template = subcommand === "export" ? exportGuildTemplate(interaction.guild) : { name: "Serveur", roles: [{ name: "Membre", color: "#22c55e", permissions: [] }], categories: [{ name: "Accueil", channels: [{ name: "annonces", type: "text" }, { name: "général", type: "text" }] }] };
      await interaction.reply({ embeds: [embeds.info({ title: "Template JSON", description: `\`\`\`json\n${JSON.stringify(template, null, 2).slice(0, 3900)}\n\`\`\`` })], ephemeral: true });
      return;
    }

    let template;
    try {
      template = parseTemplate(interaction.options.getString("json", true));
    } catch (error) {
      await interaction.reply({ embeds: [embeds.error({ title: "JSON invalide", description: (error as Error).message })], ephemeral: true });
      return;
    }

    if (subcommand === "validate" || subcommand === "preview") {
      await interaction.reply({ embeds: [embeds.success({ title: "Template valide", description: `Rôles: **${template.roles?.length ?? 0}**\nCatégories: **${template.categories?.length ?? 0}**` })], ephemeral: true });
      return;
    }

    if (interaction.options.getString("confirm", true) !== "CONFIRM") {
      await interaction.reply({ embeds: [embeds.confirmation({ title: "Confirmation requise", description: "Tape CONFIRM pour créer les rôles/salons." })], ephemeral: true });
      return;
    }

    const result = await applyServerTemplate(interaction.guild, template);
    await interaction.reply({ embeds: [embeds.success({ title: "Serveur construit", description: `Rôles créés: **${result.roles}**\nSalons/catégories créés: **${result.channels}**` })], ephemeral: true });
  }
};

export default command;

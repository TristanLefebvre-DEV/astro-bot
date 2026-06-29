import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { embeds } from "../../utils/embeds.js";
import { createBackup, deleteBackup, getBackup, listBackups } from "../../modules/backup/backupService.js";

const command: SlashCommand = {
  category: "utility",
  guildOnly: true,
  cooldownSeconds: 10,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Backups serveur.")
    .addSubcommand((sub) => sub.setName("create").setDescription("Créer un backup.").addStringOption((option) => option.setName("name").setDescription("Nom.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("list").setDescription("Lister backups."))
    .addSubcommand((sub) => sub.setName("info").setDescription("Infos backup.").addStringOption((option) => option.setName("backup_id").setDescription("ID.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("delete").setDescription("Supprimer backup.").addStringOption((option) => option.setName("backup_id").setDescription("ID.").setRequired(true)).addStringOption((option) => option.setName("confirm").setDescription("Tape CONFIRM.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("export").setDescription("Exporter backup JSON.").addStringOption((option) => option.setName("backup_id").setDescription("ID.").setRequired(true))),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      const backup = await createBackup(interaction.guild, interaction.options.getString("name", true), interaction.user.id);
      await interaction.reply({ embeds: [embeds.success({ title: "Backup créé", description: `ID: \`${backup.backupId}\`\nNom: **${backup.name}**` })], ephemeral: true });
      return;
    }

    if (subcommand === "list") {
      const backups = await listBackups(interaction.guild.id);
      await interaction.reply({ embeds: [embeds.info({ title: "Backups", description: backups.map((b) => `\`${b.backupId}\` - ${b.name} - <t:${Math.floor(new Date(b.createdAt).getTime() / 1000)}:R>`).join("\n") || "Aucun backup." })], ephemeral: true });
      return;
    }

    if (subcommand === "info" || subcommand === "export") {
      const backup = await getBackup(interaction.guild.id, interaction.options.getString("backup_id", true));
      if (!backup) {
        await interaction.reply({ embeds: [embeds.error({ title: "Backup introuvable" })], ephemeral: true });
        return;
      }
      const json = JSON.stringify(backup.data, null, 2);
      await interaction.reply({
        embeds: [
          embeds.info({
            title: subcommand === "export" ? "Export backup" : `Backup ${backup.name}`,
            description: subcommand === "export" ? `\`\`\`json\n${json.slice(0, 3900)}\n\`\`\`` : `Rôles: **${backup.data?.roles?.length ?? 0}**\nCatégories: **${backup.data?.categories?.length ?? 0}**`
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (interaction.options.getString("confirm", true) !== "CONFIRM") {
      await interaction.reply({ embeds: [embeds.confirmation({ title: "Confirmation requise", description: "Tape CONFIRM." })], ephemeral: true });
      return;
    }
    const ok = await deleteBackup(interaction.guild.id, interaction.options.getString("backup_id", true));
    await interaction.reply({ embeds: [ok ? embeds.success({ title: "Backup supprimé" }) : embeds.error({ title: "Backup introuvable" })], ephemeral: true });
  }
};

export default command;

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Model } from "mongoose";
import type { SlashCommand } from "../../types/command.js";
import { RoleProtectionConfig } from "../../database/models/index.js";
import { embeds } from "../../utils/embeds.js";
import { addProtectedRole, removeProtectedRole, setRoleProtect } from "../../modules/security/roleProtectService.js";

const command: SlashCommand = {
  category: "security",
  guildOnly: true,
  cooldownSeconds: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions: [PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName("roleprotect")
    .setDescription("Protection réelle des rôles sensibles.")
    .addSubcommand((s) => s.setName("enable").setDescription("Activer roleprotect."))
    .addSubcommand((s) => s.setName("disable").setDescription("Désactiver roleprotect.").addStringOption((o) => o.setName("confirm").setDescription("Tape CONFIRM.").setRequired(true)))
    .addSubcommand((s) => s.setName("add").setDescription("Protéger un rôle.").addRoleOption((o) => o.setName("role").setDescription("Rôle.").setRequired(true)))
    .addSubcommand((s) => s.setName("remove").setDescription("Retirer protection.").addRoleOption((o) => o.setName("role").setDescription("Rôle.").setRequired(true)))
    .addSubcommand((s) => s.setName("list").setDescription("Lister rôles protégés.")),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand();
    if (sub === "disable" && interaction.options.getString("confirm") !== "CONFIRM") {
      await interaction.reply({ embeds: [embeds.confirmation({ title: "Confirmation requise", description: "Tape CONFIRM." })], ephemeral: true });
      return;
    }
    if (sub === "enable") await setRoleProtect(interaction.guild.id, true);
    if (sub === "disable") await setRoleProtect(interaction.guild.id, false);
    if (sub === "add") await addProtectedRole(interaction.guild.id, interaction.options.getRole("role", true).id);
    if (sub === "remove") await removeProtectedRole(interaction.guild.id, interaction.options.getRole("role", true).id);

    const cfg = (await (RoleProtectionConfig as Model<any>).findOne({ guildId: interaction.guild.id }).lean()) as any;
    await interaction.reply({
      embeds: [embeds.security({ title: "RoleProtect", description: `Activé: **${cfg?.enabled ? "oui" : "non"}**\nRôles protégés:\n${(cfg?.protectedRoles ?? []).map((id: string) => `<@&${id}>`).join("\n") || "Aucun"}`, guild: interaction.guild })],
      ephemeral: true
    });
  }
};

export default command;

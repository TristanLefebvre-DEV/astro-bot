import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { embeds } from "../../utils/embeds.js";
import { addAntiNukeWhitelist, removeAntiNukeWhitelist, setAntiNuke } from "../../modules/security/antiNukeService.js";
import { AntiNukeConfig } from "../../database/models/index.js";
import type { Model } from "mongoose";

const command: SlashCommand = {
  category: "security",
  guildOnly: true,
  cooldownSeconds: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Protection anti-nuke réelle.")
    .addSubcommand((s) => s.setName("on").setDescription("Activer anti-nuke."))
    .addSubcommand((s) => s.setName("off").setDescription("Désactiver anti-nuke.").addStringOption((o) => o.setName("confirm").setDescription("Tape CONFIRM.").setRequired(true)))
    .addSubcommand((s) => s.setName("status").setDescription("Statut anti-nuke."))
    .addSubcommand((s) => s.setName("maxchannels").setDescription("Limite salons/minute.").addIntegerOption((o) => o.setName("amount").setDescription("Nombre.").setRequired(true).setMinValue(1).setMaxValue(20)))
    .addSubcommand((s) => s.setName("maxroles").setDescription("Limite rôles/minute.").addIntegerOption((o) => o.setName("amount").setDescription("Nombre.").setRequired(true).setMinValue(1).setMaxValue(20)))
    .addSubcommand((s) => s.setName("whitelistadd").setDescription("Ajouter whitelist.").addUserOption((o) => o.setName("user").setDescription("User.").setRequired(true)))
    .addSubcommand((s) => s.setName("whitelistremove").setDescription("Retirer whitelist.").addUserOption((o) => o.setName("user").setDescription("User.").setRequired(true))),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand();
    if (sub === "off" && interaction.options.getString("confirm") !== "CONFIRM") {
      await interaction.reply({ embeds: [embeds.confirmation({ title: "Confirmation requise", description: "Tape CONFIRM." })], ephemeral: true });
      return;
    }

    if (sub === "on") await setAntiNuke(interaction.guild.id, true);
    if (sub === "off") await setAntiNuke(interaction.guild.id, false);
    if (sub === "maxchannels") await (AntiNukeConfig as Model<any>).findOneAndUpdate({ guildId: interaction.guild.id }, { $set: { maxChannels: interaction.options.getInteger("amount", true) } }, { upsert: true });
    if (sub === "maxroles") await (AntiNukeConfig as Model<any>).findOneAndUpdate({ guildId: interaction.guild.id }, { $set: { maxRoles: interaction.options.getInteger("amount", true) } }, { upsert: true });
    if (sub === "whitelistadd") await addAntiNukeWhitelist(interaction.guild.id, interaction.options.getUser("user", true).id);
    if (sub === "whitelistremove") await removeAntiNukeWhitelist(interaction.guild.id, interaction.options.getUser("user", true).id);

    const cfg = (await (AntiNukeConfig as Model<any>).findOne({ guildId: interaction.guild.id }).lean()) as any;
    await interaction.reply({
      embeds: [embeds.security({ title: "Anti-nuke", description: `Activé: **${cfg?.enabled ? "oui" : "non"}**\nMax salons: **${cfg?.maxChannels ?? 3}**\nMax rôles: **${cfg?.maxRoles ?? 3}**\nWhitelist: **${cfg?.whitelistedUsers?.length ?? 0}**`, guild: interaction.guild })],
      ephemeral: true
    });
  }
};

export default command;

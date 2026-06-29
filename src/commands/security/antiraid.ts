import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { embeds } from "../../utils/embeds.js";
import { addAntiRaidWhitelist, removeAntiRaidWhitelist, setAntiRaid, setPanic } from "../../modules/security/antiRaidService.js";
import { getOrCreateGuildConfig } from "../../modules/config/guildConfigService.js";

const command: SlashCommand = {
  category: "security",
  guildOnly: true,
  cooldownSeconds: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions: [PermissionFlagsBits.KickMembers],
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Protection anti-raid réelle.")
    .addSubcommand((sub) => sub.setName("enable").setDescription("Activer anti-raid."))
    .addSubcommand((sub) => sub.setName("disable").setDescription("Désactiver anti-raid.").addStringOption((o) => o.setName("confirm").setDescription("Tape CONFIRM.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("status").setDescription("Statut anti-raid."))
    .addSubcommand((sub) => sub.setName("panic").setDescription("Activer panic mode.").addStringOption((o) => o.setName("confirm").setDescription("Tape CONFIRM.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("unpanic").setDescription("Désactiver panic mode.").addStringOption((o) => o.setName("confirm").setDescription("Tape CONFIRM.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("whitelistadd").setDescription("Ajouter whitelist.").addUserOption((o) => o.setName("user").setDescription("Utilisateur.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("whitelistremove").setDescription("Retirer whitelist.").addUserOption((o) => o.setName("user").setDescription("Utilisateur.").setRequired(true))),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand();

    if (["disable", "panic", "unpanic"].includes(sub) && interaction.options.getString("confirm") !== "CONFIRM") {
      await interaction.reply({ embeds: [embeds.confirmation({ title: "Confirmation requise", description: "Tape CONFIRM." })], ephemeral: true });
      return;
    }

    if (sub === "enable") await setAntiRaid(interaction.guild.id, true);
    if (sub === "disable") await setAntiRaid(interaction.guild.id, false);
    if (sub === "panic") await setPanic(interaction.guild.id, true);
    if (sub === "unpanic") await setPanic(interaction.guild.id, false);
    if (sub === "whitelistadd") await addAntiRaidWhitelist(interaction.guild.id, interaction.options.getUser("user", true).id);
    if (sub === "whitelistremove") await removeAntiRaidWhitelist(interaction.guild.id, interaction.options.getUser("user", true).id);

    const config = await getOrCreateGuildConfig(interaction.guild.id);
    await interaction.reply({
      embeds: [
        embeds.security({
          title: "Anti-raid",
          description: [
            `Activé: **${config.antiraid?.enabled ? "oui" : "non"}**`,
            `Panic: **${config.antiraid?.panicMode ? "oui" : "non"}**`,
            `Whitelist users: **${config.antiraid?.whitelistedUsers?.length ?? 0}**`
          ].join("\n"),
          guild: interaction.guild
        })
      ],
      ephemeral: true
    });
  }
};

export default command;

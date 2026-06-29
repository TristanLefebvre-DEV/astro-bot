import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { embeds } from "../../utils/embeds.js";
import { cancelGiveaway, endGiveawayNow, isGiveawayChannel, listGiveaways, startGiveaway } from "../../modules/giveaways/giveawayService.js";

const command: SlashCommand = {
  category: "utility",
  guildOnly: true,
  cooldownSeconds: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Giveaways persistants.")
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Démarrer un giveaway.")
        .addChannelOption((option) => option.setName("channel").setDescription("Salon.").setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
        .addStringOption((option) => option.setName("duration").setDescription("Durée ex: 10m, 2h, 7d.").setRequired(true))
        .addIntegerOption((option) => option.setName("winners").setDescription("Nombre de gagnants.").setRequired(true).setMinValue(1).setMaxValue(20))
        .addStringOption((option) => option.setName("prize").setDescription("Prix.").setRequired(true).setMaxLength(200))
    )
    .addSubcommand((sub) => sub.setName("end").setDescription("Terminer un giveaway.").addStringOption((option) => option.setName("message_id").setDescription("ID du message.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("cancel").setDescription("Annuler un giveaway.").addStringOption((option) => option.setName("message_id").setDescription("ID du message.").setRequired(true)))
    .addSubcommand((sub) => sub.setName("list").setDescription("Lister les giveaways.")),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "start") {
      const channel = interaction.options.getChannel("channel", true);
      if (!isGiveawayChannel(channel)) {
        await interaction.reply({ embeds: [embeds.error({ title: "Salon invalide", description: "Choisis un salon textuel." })], ephemeral: true });
        return;
      }

      const giveaway = await startGiveaway({
        channel,
        prize: interaction.options.getString("prize", true),
        duration: interaction.options.getString("duration", true),
        winners: interaction.options.getInteger("winners", true),
        createdBy: interaction.user.id
      });

      await interaction.reply({ embeds: [embeds.success({ title: "Giveaway lancé", description: `Message: \`${giveaway.messageId}\`\nFin: <t:${Math.floor(giveaway.endsAt.getTime() / 1000)}:R>` })], ephemeral: true });
      return;
    }

    if (subcommand === "end") {
      const ok = await endGiveawayNow(interaction.guild.id, interaction.options.getString("message_id", true));
      await interaction.reply({ embeds: [ok ? embeds.success({ title: "Giveaway planifié pour fin immédiate" }) : embeds.error({ title: "Giveaway introuvable" })], ephemeral: true });
      return;
    }

    if (subcommand === "cancel") {
      const ok = await cancelGiveaway(interaction.guild.id, interaction.options.getString("message_id", true));
      await interaction.reply({ embeds: [ok ? embeds.success({ title: "Giveaway annulé" }) : embeds.error({ title: "Giveaway introuvable" })], ephemeral: true });
      return;
    }

    const giveaways = await listGiveaways(interaction.guild.id);
    await interaction.reply({
      embeds: [
        embeds.info({
          title: "Giveaways",
          description: giveaways.map((g) => `\`${g.messageId}\` - ${g.prize} - ${g.ended ? "terminé" : `<t:${Math.floor(new Date(g.endsAt).getTime() / 1000)}:R>`}`).join("\n") || "Aucun giveaway.",
          guild: interaction.guild
        })
      ],
      ephemeral: true
    });
  }
};

export default command;

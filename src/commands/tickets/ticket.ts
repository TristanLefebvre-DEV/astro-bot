import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type GuildTextBasedChannel,
  type TextChannel
} from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import {
  closeAndDeleteTicket,
  createTicketChannel,
  listOpenTickets,
  sendTicketPanel
} from "../../modules/tickets/ticketService.js";
import { embeds } from "../../utils/embeds.js";

const command: SlashCommand = {
  category: "tickets",
  guildOnly: true,
  cooldownSeconds: 5,
  botPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Gestion des tickets.")
    .addSubcommand((sub) =>
      sub
        .setName("open")
        .setDescription("Ouvrir un ticket.")
        .addStringOption((option) => option.setName("type").setDescription("Type de ticket.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("Fermer et supprimer le ticket actuel.")
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Envoyer le panel de creation de tickets.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Salon ou envoyer le panel.")
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("Lister les tickets ouverts.")),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "open") {
      const type = interaction.options.getString("type") ?? "general";
      const channel = await createTicketChannel({
        guild: interaction.guild,
        owner: interaction.user,
        member: interaction.member,
        type
      });

      await interaction.reply({
        embeds: [
          embeds.success({
            title: "Ticket ouvert",
            description: `Ton ticket est pret : ${channel}`,
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "close") {
      if (interaction.channel?.type !== ChannelType.GuildText) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Salon invalide", description: "Cette commande doit etre utilisee dans un ticket." })],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [embeds.success({ title: "Suppression du ticket", description: "Le ticket va etre ferme puis supprime." })],
        ephemeral: true
      });

      const deleted = await closeAndDeleteTicket({
        guild: interaction.guild,
        channel: interaction.channel as TextChannel,
        closedBy: interaction.user,
        reason: interaction.options.getString("reason") ?? "Aucune raison fournie"
      });

      if (!deleted) {
        await interaction.followUp({
          embeds: [embeds.error({ title: "Ticket introuvable", description: "Ce salon ne correspond pas a un ticket ouvert." })],
          ephemeral: true
        });
      }
      return;
    }

    if (subcommand === "panel") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Permissions manquantes", description: "Il faut gerer les salons pour envoyer le panel." })],
          ephemeral: true
        });
        return;
      }

      const target = interaction.options.getChannel("channel") ?? interaction.channel;
      if (!target || !("send" in target)) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Salon invalide", description: "Choisis un salon textuel." })],
          ephemeral: true
        });
        return;
      }

      await sendTicketPanel({
        guild: interaction.guild,
        channel: target as GuildTextBasedChannel,
        createdBy: interaction.user
      });

      await interaction.reply({
        embeds: [embeds.success({ title: "Panel envoye", description: `Le panel de ticket a ete envoye dans ${target}.` })],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "list") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Permissions manquantes", description: "Il faut gerer les salons pour voir la liste." })],
          ephemeral: true
        });
        return;
      }

      const tickets = await listOpenTickets(interaction.guild.id);
      await interaction.reply({
        embeds: [
          embeds.ticket({
            title: "Tickets ouverts",
            description:
              tickets
                .map((ticket) => `<#${ticket.channelId}> - <@${ticket.ownerId}> - ${ticket.type}`)
                .join("\n") || "Aucun ticket ouvert.",
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
    }
  }
};

export default command;

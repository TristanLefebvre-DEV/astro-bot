import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type TextChannel } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { createTicketChannel, closeTicket, listOpenTickets } from "../../modules/tickets/ticketService.js";
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
        .setDescription("Fermer le ticket actuel.")
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(false))
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
            description: `Ton ticket est prêt : ${channel}`,
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
          embeds: [embeds.error({ title: "Salon invalide", description: "Cette commande doit être utilisée dans un ticket." })],
          ephemeral: true
        });
        return;
      }

      const { ticket } = await closeTicket({
        guild: interaction.guild,
        channel: interaction.channel as TextChannel,
        closedBy: interaction.user,
        reason: interaction.options.getString("reason") ?? "Aucune raison fournie"
      });

      await interaction.reply({
        embeds: [
          ticket
            ? embeds.success({ title: "Ticket fermé", description: "Le ticket est fermé et le transcript est sauvegardé." })
            : embeds.error({ title: "Ticket introuvable", description: "Ce salon ne correspond pas à un ticket ouvert." })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "list") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Permissions manquantes", description: "Il faut gérer les salons pour voir la liste." })],
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

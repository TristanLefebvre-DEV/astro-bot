import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type Guild,
  type GuildMember,
  type GuildTextBasedChannel,
  type ModalSubmitInteraction,
  type TextChannel,
  type User
} from "discord.js";
import type { Model } from "mongoose";
import { GuildConfig, Ticket } from "../../database/models/index.js";
import { defaultGuildConfig } from "../../config/defaultConfig.js";
import { embeds } from "../../utils/embeds.js";
import { renderMessagesTranscript } from "../../utils/transcripts.js";

const openTicketCustomId = "ticket:open";
const closeTicketCustomId = "ticket:close";
const deleteTicketCustomId = "ticket:delete";
const addMemberCustomId = "ticket:add_member";
const addMemberModalCustomId = "ticket:add_member_modal";

function ticketControls(disabled = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(closeTicketCustomId)
      .setLabel("Fermer le ticket")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(deleteTicketCustomId)
      .setLabel("Supprimer le ticket")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(addMemberCustomId)
      .setLabel("Ajouter un membre")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled)
  );
}

function openTicketRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(openTicketCustomId).setLabel("Créer un ticket").setStyle(ButtonStyle.Primary)
  );
}

export async function getGuildConfig(guildId: string): Promise<any> {
  return (GuildConfig as Model<any>).findOneAndUpdate(
    { guildId },
    { $setOnInsert: { guildId, ...defaultGuildConfig } },
    { upsert: true, new: true }
  );
}

export async function createTicketChannel(input: {
  guild: Guild;
  owner: User;
  member?: GuildMember | null;
  type: string;
}): Promise<TextChannel> {
  const config = await getGuildConfig(input.guild.id);
  const existing = await (Ticket as Model<any>).findOne({
    guildId: input.guild.id,
    ownerId: input.owner.id,
    status: "open"
  });

  if (existing) {
    const channel = input.guild.channels.cache.get(existing.channelId);
    if (channel?.type === ChannelType.GuildText) return channel as TextChannel;
  }

  const supportRoleIds: string[] = config?.tickets?.supportRoleIds ?? [];
  const categoryId: string | null = config?.tickets?.categoryId ?? null;
  const safeName = input.owner.username.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 16) || "user";

  const channel = await input.guild.channels.create({
    name: `ticket-${safeName}`,
    type: ChannelType.GuildText,
    parent: categoryId ?? undefined,
    topic: `Ticket ${input.type} ouvert par ${input.owner.tag} (${input.owner.id})`,
    permissionOverwrites: [
      {
        id: input.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: input.owner.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      },
      ...supportRoleIds.map((roleId) => ({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      }))
    ],
    reason: `Ticket ouvert par ${input.owner.tag}`
  });

  await (Ticket as Model<any>).create({
    guildId: input.guild.id,
    channelId: channel.id,
    ownerId: input.owner.id,
    type: input.type,
    status: "open"
  });

  await channel.send({
    content: `${input.owner}`,
    embeds: [
      embeds.ticket({
        title: "Ticket ouvert",
        description: [
          `Type: **${input.type}**`,
          `Auteur: ${input.owner}`,
          "Explique ton besoin clairement. Le staff te répondra dès que possible."
        ].join("\n"),
        guild: input.guild
      })
    ],
    components: [ticketControls()]
  });

  return channel;
}

export async function sendTicketPanel(input: {
  guild: Guild;
  channel: GuildTextBasedChannel;
  createdBy: User;
}): Promise<void> {
  await input.channel.send({
    embeds: [
      embeds.ticket({
        title: "Support",
        description: [
          "Besoin d'aide ? Clique sur le bouton ci-dessous pour ouvrir un ticket privé.",
          "Un membre du staff te répondra dès que possible."
        ].join("\n"),
        guild: input.guild,
        user: input.createdBy
      })
    ],
    components: [openTicketRow()]
  });
}

export async function closeTicket(input: {
  guild: Guild;
  channel: TextChannel;
  closedBy: User;
  reason: string;
}): Promise<{ ticket: any | null; transcript: string }> {
  const ticket = await (Ticket as Model<any>).findOne({
    guildId: input.guild.id,
    channelId: input.channel.id,
    status: "open"
  });

  if (!ticket) return { ticket: null, transcript: "" };

  const messages = await input.channel.messages.fetch({ limit: 100 });
  const transcript = renderMessagesTranscript([...messages.values()].reverse());

  ticket.status = "closed";
  ticket.closedAt = new Date();
  ticket.transcriptContent = transcript;
  await ticket.save();

  await input.channel.permissionOverwrites.edit(ticket.ownerId, {
    SendMessages: false
  });

  await input.channel.send({
    embeds: [
      embeds.ticket({
        title: "Ticket fermé",
        description: [`Fermé par: ${input.closedBy}`, `Raison: ${input.reason}`].join("\n"),
        guild: input.guild
      })
    ],
    components: [ticketControls(true)]
  });

  return { ticket, transcript };
}

export async function closeAndDeleteTicket(input: {
  guild: Guild;
  channel: TextChannel;
  closedBy: User;
  reason: string;
}): Promise<boolean> {
  const { ticket } = await closeTicket(input);
  if (!ticket) return false;
  await input.channel.delete(`Ticket supprimé par ${input.closedBy.tag}: ${input.reason}`);
  return true;
}

export async function deleteTicketChannel(input: {
  guild: Guild;
  channel: TextChannel;
  deletedBy: User;
  reason: string;
}): Promise<boolean> {
  const ticket = await (Ticket as Model<any>).findOne({
    guildId: input.guild.id,
    channelId: input.channel.id,
    status: { $in: ["open", "closed"] }
  });

  if (!ticket) return false;

  if (ticket.status === "open") {
    const messages = await input.channel.messages.fetch({ limit: 100 });
    ticket.transcriptContent = renderMessagesTranscript([...messages.values()].reverse());
    ticket.closedAt = new Date();
  }

  ticket.status = "deleted";
  await ticket.save();
  await input.channel.delete(`Ticket supprimé par ${input.deletedBy.tag}: ${input.reason}`);
  return true;
}

async function canManageTicket(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<boolean> {
  if (!interaction.inCachedGuild()) return false;
  const ticket = await (Ticket as Model<any>).findOne({
    guildId: interaction.guild.id,
    channelId: interaction.channelId,
    status: { $in: ["open", "closed"] }
  });
  if (!ticket) return false;
  return ticket.ownerId === interaction.user.id || interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);
}

async function findTicketChannel(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<TextChannel | null> {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) return null;
  return interaction.channel as TextChannel;
}

export async function handleTicketComponent(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<boolean> {
  if (interaction.isButton() && interaction.customId === openTicketCustomId) {
    if (!interaction.inCachedGuild()) return true;
    const channel = await createTicketChannel({
      guild: interaction.guild,
      owner: interaction.user,
      member: interaction.member,
      type: "general"
    });
    await interaction.reply({
      embeds: [embeds.success({ title: "Ticket créé", description: `Ton ticket est prêt : ${channel}` })],
      ephemeral: true
    });
    return true;
  }

  if (interaction.isButton() && interaction.customId === closeTicketCustomId) {
    if (!interaction.inCachedGuild()) return true;
    const channel = await findTicketChannel(interaction);
    if (!channel || !(await canManageTicket(interaction))) {
      await interaction.reply({ embeds: [embeds.error({ title: "Action impossible", description: "Ticket introuvable ou permissions insuffisantes." })], ephemeral: true });
      return true;
    }
    await closeTicket({ guild: interaction.guild, channel, closedBy: interaction.user, reason: "Fermeture via bouton" });
    await interaction.reply({ embeds: [embeds.success({ title: "Ticket fermé", description: "Le ticket est fermé. Tu peux maintenant le supprimer." })], ephemeral: true });
    return true;
  }

  if (interaction.isButton() && interaction.customId === deleteTicketCustomId) {
    if (!interaction.inCachedGuild()) return true;
    const channel = await findTicketChannel(interaction);
    if (!channel || !(await canManageTicket(interaction))) {
      await interaction.reply({ embeds: [embeds.error({ title: "Action impossible", description: "Ticket introuvable ou permissions insuffisantes." })], ephemeral: true });
      return true;
    }
    await interaction.reply({ embeds: [embeds.success({ title: "Suppression", description: "Le ticket va être supprimé." })], ephemeral: true });
    await deleteTicketChannel({ guild: interaction.guild, channel, deletedBy: interaction.user, reason: "Suppression via bouton" });
    return true;
  }

  if (interaction.isButton() && interaction.customId === addMemberCustomId) {
    if (!interaction.inCachedGuild()) return true;
    if (!(await canManageTicket(interaction))) {
      await interaction.reply({ embeds: [embeds.error({ title: "Permissions insuffisantes", description: "Tu ne peux pas gérer ce ticket." })], ephemeral: true });
      return true;
    }

    const modal = new ModalBuilder().setCustomId(addMemberModalCustomId).setTitle("Ajouter un membre au ticket");
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel("ID du membre à ajouter")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMinLength(17)
          .setMaxLength(20)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.isModalSubmit() && interaction.customId === addMemberModalCustomId) {
    if (!interaction.inCachedGuild()) return true;
    const channel = await findTicketChannel(interaction);
    if (!channel || !(await canManageTicket(interaction))) {
      await interaction.reply({ embeds: [embeds.error({ title: "Action impossible", description: "Ticket introuvable ou permissions insuffisantes." })], ephemeral: true });
      return true;
    }

    const userId = interaction.fields.getTextInputValue("user_id").trim();
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) {
      await interaction.reply({ embeds: [embeds.error({ title: "Membre introuvable", description: "Vérifie l'ID du membre." })], ephemeral: true });
      return true;
    }

    await channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    await interaction.reply({ embeds: [embeds.success({ title: "Membre ajouté", description: `${member} a accès au ticket.` })], ephemeral: true });
    await channel.send({ embeds: [new EmbedBuilder().setColor(0x4f8cff).setDescription(`${member} a été ajouté au ticket par ${interaction.user}.`)] });
    return true;
  }

  return false;
}

export async function listOpenTickets(guildId: string): Promise<any[]> {
  return (Ticket as Model<any>).find({ guildId, status: "open" }).sort({ createdAt: -1 }).limit(20).lean();
}

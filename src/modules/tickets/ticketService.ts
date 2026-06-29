import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type Guild,
  type GuildMember,
  type GuildTextBasedChannel,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  type TextChannel,
  type User
} from "discord.js";
import type { Model } from "mongoose";
import { defaultGuildConfig } from "../../config/defaultConfig.js";
import { GuildConfig, Ticket } from "../../database/models/index.js";
import { embeds } from "../../utils/embeds.js";
import { renderMessagesTranscript } from "../../utils/transcripts.js";

const openTicketCustomId = "ticket:open";
const ticketCategoryCustomId = "ticket:category";
const closeTicketCustomId = "ticket:close";
const deleteTicketCustomId = "ticket:delete";
const addMemberCustomId = "ticket:add_member";
const addMemberModalCustomId = "ticket:add_member_modal";

const ticketCategories: Record<string, { label: string; tag: string; description: string }> = {
  support: { label: "Support", tag: "[SUPPORT]", description: "Aide generale, question ou probleme simple." },
  report: { label: "Signalement", tag: "[REPORT]", description: "Signaler un membre, un bug ou un abus." },
  billing: { label: "Boutique", tag: "[SHOP]", description: "Achat, paiement, recompense ou premium." },
  appeal: { label: "Contestations", tag: "[APPEL]", description: "Contester une sanction ou demander une verification." },
  other: { label: "Autre demande", tag: "[AUTRE]", description: "Demande qui ne rentre pas dans les autres categories." }
};
const fallbackTicketCategory = ticketCategories.support!;

function ticketControls(disabled = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(closeTicketCustomId).setLabel("Fermer").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(deleteTicketCustomId).setLabel("Supprimer").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(addMemberCustomId).setLabel("Ajouter un membre").setStyle(ButtonStyle.Primary).setDisabled(disabled)
  );
}

function openTicketRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(openTicketCustomId).setLabel("Creer un ticket").setStyle(ButtonStyle.Primary)
  );
}

function ticketCategoryRow(): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(ticketCategoryCustomId)
      .setPlaceholder("Choisir une categorie")
      .addOptions(
        Object.entries(ticketCategories).map(([value, category]) => ({
          label: category.label,
          value,
          description: category.description
        }))
      )
  );
}

function categoryPanelText(): string {
  return Object.values(ticketCategories)
    .map((category) => `**${category.tag} ${category.label}**\n${category.description}`)
    .join("\n\n");
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
  const category = ticketCategories[input.type] ?? fallbackTicketCategory;

  const channel = await input.guild.channels.create({
    name: `ticket-${safeName}`,
    type: ChannelType.GuildText,
    parent: categoryId ?? undefined,
    topic: `${category.label} ouvert par ${input.owner.tag} (${input.owner.id})`,
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
          `Categorie: **${category.tag} ${category.label}**`,
          `Auteur: ${input.owner}`,
          "",
          "Explique ton besoin clairement.",
          "Ajoute les preuves, captures ou IDs utiles si necessaire.",
          "",
          "Le staff prendra le ticket des que possible."
        ].join("\n"),
        guild: input.guild
      }).addFields(
        { name: "Statut", value: "Ouvert" },
        { name: "Priorite", value: input.type === "report" ? "Haute" : "Normale" }
      )
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
        title: "Centre de support",
        description: [
          "Ouvre un ticket seulement si ta demande necessite une reponse du staff.",
          "Choisis la categorie la plus proche de ton probleme pour accelerer la prise en charge.",
          "",
          categoryPanelText()
        ].join("\n"),
        guild: input.guild,
        user: input.createdBy
      })
    ],
    components: [ticketCategoryRow(), openTicketRow()]
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
        title: "Ticket ferme",
        description: [`Ferme par: ${input.closedBy}`, `Raison: ${input.reason}`, "", "Le ticket est verrouille."].join("\n"),
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
  await input.channel.delete(`Ticket supprime par ${input.closedBy.tag}: ${input.reason}`);
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
  await input.channel.delete(`Ticket supprime par ${input.deletedBy.tag}: ${input.reason}`);
  return true;
}

async function canManageTicket(
  interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction
): Promise<boolean> {
  if (!interaction.inCachedGuild()) return false;
  const ticket = await (Ticket as Model<any>).findOne({
    guildId: interaction.guild.id,
    channelId: interaction.channelId,
    status: { $in: ["open", "closed"] }
  });
  if (!ticket) return false;
  return ticket.ownerId === interaction.user.id || interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);
}

async function findTicketChannel(
  interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction
): Promise<TextChannel | null> {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) return null;
  return interaction.channel as TextChannel;
}

export async function handleTicketComponent(
  interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction
): Promise<boolean> {
  if (interaction.isButton() && interaction.customId === openTicketCustomId) {
    if (!interaction.inCachedGuild()) return true;
    const channel = await createTicketChannel({
      guild: interaction.guild,
      owner: interaction.user,
      member: interaction.member,
      type: "support"
    });
    await interaction.reply({
      embeds: [embeds.success({ title: "Ticket cree", description: `Ton ticket est pret : ${channel}` })],
      ephemeral: true
    });
    return true;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === ticketCategoryCustomId) {
    if (!interaction.inCachedGuild()) return true;
    const type = interaction.values[0] ?? "support";
    const channel = await createTicketChannel({
      guild: interaction.guild,
      owner: interaction.user,
      member: interaction.member,
      type
    });
    const category = ticketCategories[type] ?? fallbackTicketCategory;
    await interaction.reply({
      embeds: [
        embeds.success({
          title: "Ticket cree",
          description: [`Categorie: **${category.tag} ${category.label}**`, "", `Salon: ${channel}`].join("\n")
        })
      ],
      ephemeral: true
    });
    return true;
  }

  if (interaction.isButton() && interaction.customId === closeTicketCustomId) {
    if (!interaction.inCachedGuild()) return true;
    const channel = await findTicketChannel(interaction);
    if (!channel || !(await canManageTicket(interaction))) {
      await interaction.reply({
        embeds: [embeds.error({ title: "Action impossible", description: "Ticket introuvable ou permissions insuffisantes." })],
        ephemeral: true
      });
      return true;
    }
    await closeTicket({ guild: interaction.guild, channel, closedBy: interaction.user, reason: "Fermeture via bouton" });
    await interaction.reply({
      embeds: [embeds.success({ title: "Ticket ferme", description: "Le ticket est verrouille.\n\nTu peux maintenant le supprimer." })],
      ephemeral: true
    });
    return true;
  }

  if (interaction.isButton() && interaction.customId === deleteTicketCustomId) {
    if (!interaction.inCachedGuild()) return true;
    const channel = await findTicketChannel(interaction);
    if (!channel || !(await canManageTicket(interaction))) {
      await interaction.reply({
        embeds: [embeds.error({ title: "Action impossible", description: "Ticket introuvable ou permissions insuffisantes." })],
        ephemeral: true
      });
      return true;
    }
    await interaction.reply({ embeds: [embeds.success({ title: "Suppression", description: "Le ticket va etre supprime." })], ephemeral: true });
    await deleteTicketChannel({ guild: interaction.guild, channel, deletedBy: interaction.user, reason: "Suppression via bouton" });
    return true;
  }

  if (interaction.isButton() && interaction.customId === addMemberCustomId) {
    if (!interaction.inCachedGuild()) return true;
    if (!(await canManageTicket(interaction))) {
      await interaction.reply({
        embeds: [embeds.error({ title: "Permissions insuffisantes", description: "Tu ne peux pas gerer ce ticket." })],
        ephemeral: true
      });
      return true;
    }

    const modal = new ModalBuilder().setCustomId(addMemberModalCustomId).setTitle("Ajouter un membre au ticket");
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel("ID du membre a ajouter")
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
      await interaction.reply({
        embeds: [embeds.error({ title: "Action impossible", description: "Ticket introuvable ou permissions insuffisantes." })],
        ephemeral: true
      });
      return true;
    }

    const userId = interaction.fields.getTextInputValue("user_id").trim();
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) {
      await interaction.reply({ embeds: [embeds.error({ title: "Membre introuvable", description: "Verifie l'ID du membre." })], ephemeral: true });
      return true;
    }

    await channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    await interaction.reply({ embeds: [embeds.success({ title: "Membre ajoute", description: `${member} a acces au ticket.` })], ephemeral: true });
    await channel.send({
      embeds: [new EmbedBuilder().setColor(0x4f8cff).setDescription(`${member} a ete ajoute au ticket par ${interaction.user}.`)]
    });
    return true;
  }

  return false;
}

export async function listOpenTickets(guildId: string): Promise<any[]> {
  return (Ticket as Model<any>).find({ guildId, status: "open" }).sort({ createdAt: -1 }).limit(20).lean();
}

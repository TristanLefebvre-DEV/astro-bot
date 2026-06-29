import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type TextChannel,
  type User
} from "discord.js";
import type { Model } from "mongoose";
import { GuildConfig, Ticket } from "../../database/models/index.js";
import { defaultGuildConfig } from "../../config/defaultConfig.js";
import { embeds } from "../../utils/embeds.js";
import { renderMessagesTranscript } from "../../utils/transcripts.js";

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
    ]
  });

  return channel;
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
        description: [`Ferme par: ${input.closedBy}`, `Raison: ${input.reason}`].join("\n"),
        guild: input.guild
      })
    ]
  });

  return { ticket, transcript };
}

export async function listOpenTickets(guildId: string): Promise<any[]> {
  return (Ticket as Model<any>).find({ guildId, status: "open" }).sort({ createdAt: -1 }).limit(20).lean();
}

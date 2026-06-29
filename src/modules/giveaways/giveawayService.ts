import crypto from "node:crypto";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type ButtonInteraction,
  type GuildTextBasedChannel
} from "discord.js";
import type { Model } from "mongoose";
import { Giveaway } from "../../database/models/index.js";
import { embeds } from "../../utils/embeds.js";
import { parseDurationToMs } from "../moderation/moderationService.js";

export function giveawayButton(messageId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway:join:${messageId}`)
      .setLabel("Participer")
      .setEmoji("🎁")
      .setStyle(ButtonStyle.Success)
  );
}

export async function startGiveaway(input: {
  channel: GuildTextBasedChannel;
  prize: string;
  duration: string;
  winners: number;
  createdBy: string;
}): Promise<any> {
  const durationMs = parseDurationToMs(input.duration);
  if (!durationMs) throw new Error("Durée invalide");

  const giveawayId = crypto.randomBytes(6).toString("hex");
  const endsAt = new Date(Date.now() + durationMs);
  const previewId = `pending-${giveawayId}`;

  const message = await input.channel.send({
    embeds: [
      embeds.info({
        title: "Giveaway",
        description: [
          `Prix: **${input.prize}**`,
          `Gagnants: **${input.winners}**`,
          `Fin: <t:${Math.floor(endsAt.getTime() / 1000)}:R>`,
          "Clique sur le bouton pour participer."
        ].join("\n"),
        guild: input.channel.guild
      })
    ],
    components: [giveawayButton(previewId)]
  });

  await message.edit({ components: [giveawayButton(message.id)] });

  return (Giveaway as Model<any>).create({
    guildId: input.channel.guild.id,
    giveawayId,
    messageId: message.id,
    channelId: input.channel.id,
    prize: input.prize,
    winners: input.winners,
    endsAt,
    participants: [],
    ended: false,
    createdBy: input.createdBy
  });
}

export async function handleGiveawayButton(interaction: ButtonInteraction): Promise<boolean> {
  if (!interaction.customId.startsWith("giveaway:join:")) return false;
  if (!interaction.guildId) return true;

  const messageId = interaction.customId.split(":")[2];
  const giveaway = await (Giveaway as Model<any>).findOne({
    guildId: interaction.guildId,
    messageId,
    ended: false
  });

  if (!giveaway) {
    await interaction.reply({ embeds: [embeds.error({ title: "Giveaway terminé", description: "Ce giveaway n'est plus actif." })], ephemeral: true });
    return true;
  }

  const already = (giveaway.participants ?? []).includes(interaction.user.id);
  if (already) {
    giveaway.participants = giveaway.participants.filter((id: string) => id !== interaction.user.id);
    await giveaway.save();
    await interaction.reply({ embeds: [embeds.info({ title: "Participation retirée", description: "Tu ne participes plus à ce giveaway." })], ephemeral: true });
    return true;
  }

  giveaway.participants.push(interaction.user.id);
  await giveaway.save();
  await interaction.reply({ embeds: [embeds.success({ title: "Participation validée", description: "Bonne chance !" })], ephemeral: true });
  return true;
}

export async function endGiveawayNow(guildId: string, messageId: string): Promise<boolean> {
  const giveaway = await (Giveaway as Model<any>).findOne({ guildId, messageId, ended: false });
  if (!giveaway) return false;
  giveaway.endsAt = new Date();
  await giveaway.save();
  return true;
}

export async function cancelGiveaway(guildId: string, messageId: string): Promise<boolean> {
  const result = await (Giveaway as Model<any>).updateOne({ guildId, messageId, ended: false }, { $set: { ended: true, cancelled: true } });
  return result.modifiedCount > 0;
}

export async function listGiveaways(guildId: string): Promise<any[]> {
  return (Giveaway as Model<any>).find({ guildId }).sort({ createdAt: -1 }).limit(20).lean();
}

export function isGiveawayChannel(channel: unknown): channel is GuildTextBasedChannel {
  return Boolean(channel && typeof channel === "object" && "type" in channel && [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes((channel as { type: ChannelType }).type));
}

import crypto from "node:crypto";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type AnySelectMenuInteraction,
  type ButtonInteraction,
  type Guild,
  type GuildTextBasedChannel,
  type InteractionReplyOptions
} from "discord.js";
import type { Model } from "mongoose";
import { Panel } from "../../database/models/index.js";
import { embeds } from "../../utils/embeds.js";
import { isHexColor } from "../../utils/validators.js";
import { createTicketChannel } from "../tickets/ticketService.js";
import { verificationEmbed, verifyMember } from "../verification/verificationService.js";
import { createCustomPanel, panelTemplates } from "./templates.js";
import type { PanelButtonConfig, PanelConfig, PanelSelectMenuConfig, PanelType } from "./types.js";

export function createPanelId(): string {
  return crypto.randomBytes(6).toString("hex");
}

export function createPanelFromTemplate(input: {
  guildId: string;
  type: PanelType;
  name: string;
  createdBy: string;
}): Omit<PanelConfig, "channelId" | "messageId"> {
  const panelId = createPanelId();
  if (input.type === "custom") {
    return createCustomPanel({ ...input, panelId });
  }

  return panelTemplates[input.type]({ ...input, panelId });
}

function parseColor(color: string): number {
  const normalized = color.startsWith("#") ? color.slice(1) : color;
  if (!isHexColor(normalized)) return 0x5865f2;
  return Number.parseInt(normalized, 16);
}

function toButtonStyle(style: PanelButtonConfig["style"]): ButtonStyle {
  return {
    Primary: ButtonStyle.Primary,
    Secondary: ButtonStyle.Secondary,
    Success: ButtonStyle.Success,
    Danger: ButtonStyle.Danger,
    Link: ButtonStyle.Link
  }[style];
}

function panelCustomId(panelId: string, componentId: string): string {
  return `panel:${panelId}:${componentId}`;
}

export function renderPanel(panel: PanelConfig, guild?: Guild | null): {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
} {
  const title = `${panel.emoji ? `${panel.emoji} ` : ""}${panel.title}`;
  const embed = new EmbedBuilder()
    .setColor(parseColor(panel.color))
    .setTitle(title)
    .setDescription(panel.description)
    .setTimestamp();

  if (panel.footer || guild) {
    embed.setFooter({
      text: panel.footer ?? guild?.name ?? "Panel",
      iconURL: guild?.iconURL() ?? undefined
    });
  }

  if (panel.image) embed.setImage(panel.image);
  if (panel.thumbnail) embed.setThumbnail(panel.thumbnail);

  const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

  const buttons = panel.buttons.slice(0, 5).map((button) => {
    const builder = new ButtonBuilder()
      .setLabel(button.label)
      .setStyle(toButtonStyle(button.style))
      .setDisabled(Boolean(button.disabled));

    if (button.emoji) builder.setEmoji(button.emoji);
    if (button.style === "Link" && button.url) {
      builder.setURL(button.url);
    } else {
      builder.setCustomId(panelCustomId(panel.panelId, button.customId));
    }

    return builder;
  });

  if (buttons.length > 0) {
    components.push(new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>().addComponents(buttons));
  }

  for (const menu of panel.selectMenus.slice(0, 4)) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(panelCustomId(panel.panelId, menu.customId))
      .setPlaceholder(menu.placeholder)
      .setMinValues(menu.minValues)
      .setMaxValues(Math.min(menu.maxValues, menu.options.length))
      .setDisabled(Boolean(menu.disabled))
      .addOptions(
        menu.options.slice(0, 25).map((option) => ({
          label: option.label,
          value: option.value,
          description: option.description,
          emoji: option.emoji
        }))
      );

    components.push(new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>().addComponents(select));
  }

  return { embeds: [embed], components };
}

export async function savePanel(panel: Omit<PanelConfig, "channelId" | "messageId">): Promise<PanelConfig> {
  const created = await (Panel as Model<any>).create(panel);
  return created.toObject() as PanelConfig;
}

export async function findPanel(guildId: string, panelId: string): Promise<PanelConfig | null> {
  return ((await (Panel as Model<any>).findOne({ guildId, panelId }).lean()) as unknown as PanelConfig | null) ?? null;
}

export async function listPanels(guildId: string): Promise<PanelConfig[]> {
  return ((await (Panel as Model<any>)
    .find({ guildId })
    .sort({ createdAt: -1 })
    .lean()) as unknown as PanelConfig[]) ?? [];
}

export async function deletePanel(guildId: string, panelId: string): Promise<boolean> {
  const result = await (Panel as Model<any>).deleteOne({ guildId, panelId });
  return result.deletedCount === 1;
}

export async function updatePanelMessage(input: {
  guildId: string;
  panelId: string;
  channelId: string;
  messageId: string;
}): Promise<void> {
  await (Panel as Model<any>).updateOne(
    { guildId: input.guildId, panelId: input.panelId },
    { $set: { channelId: input.channelId, messageId: input.messageId } }
  );
}

export async function sendPanelToChannel(panel: PanelConfig, channel: GuildTextBasedChannel): Promise<string> {
  const rendered = renderPanel(panel, channel.guild);
  const message = await channel.send(rendered);
  await updatePanelMessage({
    guildId: panel.guildId,
    panelId: panel.panelId,
    channelId: channel.id,
    messageId: message.id
  });
  return message.id;
}

function findButton(panel: PanelConfig, componentId: string): PanelButtonConfig | undefined {
  return panel.buttons.find((button) => button.customId === componentId);
}

function findSelect(panel: PanelConfig, componentId: string): PanelSelectMenuConfig | undefined {
  return panel.selectMenus.find((menu) => menu.customId === componentId);
}

function hasPanelAccess(interaction: ButtonInteraction | AnySelectMenuInteraction, panel: PanelConfig): boolean {
  if (!interaction.inCachedGuild()) return false;
  const allowedUsers = panel.permissions?.allowedUsers ?? [];
  const allowedRoles = panel.permissions?.allowedRoles ?? [];

  if (allowedUsers.length === 0 && allowedRoles.length === 0) return true;
  if (allowedUsers.includes(interaction.user.id)) return true;
  return interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id));
}

async function replyUnavailable(
  interaction: ButtonInteraction | AnySelectMenuInteraction,
  description: string
): Promise<void> {
  const payload: InteractionReplyOptions = {
    embeds: [embeds.info({ title: "Action reçue", description, guild: interaction.guild })],
    ephemeral: true
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload);
  } else {
    await interaction.reply(payload);
  }
}

export async function handlePanelComponent(interaction: ButtonInteraction | AnySelectMenuInteraction): Promise<boolean> {
  if (!interaction.customId.startsWith("panel:") || !interaction.guildId) return false;

  const [, panelId, componentId] = interaction.customId.split(":");
  if (!panelId || !componentId) return true;

  const panel = await findPanel(interaction.guildId, panelId);
  if (!panel || !panel.enabled) {
    await replyUnavailable(interaction, "Ce panel n'existe plus ou a été désactivé.");
    return true;
  }

  if (!hasPanelAccess(interaction, panel)) {
    await replyUnavailable(interaction, "Tu n'as pas la permission d'utiliser ce panel.");
    return true;
  }

  if (interaction.isButton()) {
    const button = findButton(panel, componentId);
    const action = button?.action;
    if (!button || !action) {
      await replyUnavailable(interaction, "Ce bouton n'est plus configuré.");
      return true;
    }

    const messages: Record<string, string> = {
      verify_user: "Le module vérification recevra cette demande. Aucun rôle n'est attribué tant que le module n'est pas configuré.",
      rules_accept: "Ton acceptation est enregistrable par le module vérification dès qu'il sera activé.",
      security_report: "Le signalement sécurité sera relié aux incidents et tickets sécurité dans le bloc sécurité.",
      custom: "Action personnalisée reçue."
    };

    if (action.type === "ticket_open" && interaction.inCachedGuild()) {
      const ticketType = typeof action.payload?.ticketType === "string" ? action.payload.ticketType : "general";
      const channel = await createTicketChannel({
        guild: interaction.guild,
        owner: interaction.user,
        member: interaction.member,
        type: ticketType
      });
      await replyUnavailable(interaction, `Ticket ouvert : ${channel}`);
      return true;
    }

    if ((action.type === "verify_user" || action.type === "rules_accept") && interaction.inCachedGuild()) {
      const result = await verifyMember(interaction.member);
      const payload: InteractionReplyOptions = {
        embeds: [verificationEmbed(result.ok, result.message)],
        ephemeral: true
      };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
      else await interaction.reply(payload);
      return true;
    }

    await replyUnavailable(interaction, messages[action.type] ?? "Action panel reçue.");
    return true;
  }

  if (interaction.isStringSelectMenu()) {
    const menu = findSelect(panel, componentId);
    if (!menu) {
      await replyUnavailable(interaction, "Ce menu n'est plus configuré.");
      return true;
    }

    if (menu.action.type === "ticket_open" && interaction.inCachedGuild()) {
      const channel = await createTicketChannel({
        guild: interaction.guild,
        owner: interaction.user,
        member: interaction.member,
        type: interaction.values[0] ?? "general"
      });
      await replyUnavailable(interaction, `Ticket ouvert : ${channel}`);
      return true;
    }

    await replyUnavailable(interaction, `Sélection reçue: ${interaction.values.map((value) => `\`${value}\``).join(", ")}`);
    return true;
  }

  return true;
}

export function isTextSendableChannel(channel: unknown): channel is GuildTextBasedChannel {
  return Boolean(
    channel &&
      typeof channel === "object" &&
      "type" in channel &&
      [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes((channel as { type: ChannelType }).type)
  );
}

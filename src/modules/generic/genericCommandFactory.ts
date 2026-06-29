import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type PermissionResolvable,
  type SlashCommandSubcommandBuilder
} from "discord.js";
import type { CommandCategory, SlashCommand } from "../../types/command.js";
import { embeds } from "../../utils/embeds.js";

type GenericOption = "user" | "target_user" | "role" | "channel" | "voice_channel" | "duration" | "reason" | "amount" | "text" | "json" | "confirm";

export interface GenericSubcommand {
  name: string;
  description: string;
  options?: GenericOption[];
  dangerous?: boolean;
  ephemeral?: boolean;
}

export interface GenericCommandGroup {
  name: string;
  description: string;
  category: CommandCategory;
  subcommands: GenericSubcommand[];
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  cooldownSeconds?: number;
}

function addOption(builder: SlashCommandSubcommandBuilder, option: GenericOption): SlashCommandSubcommandBuilder {
  if (option === "user") {
    return builder.addUserOption((input) => input.setName("user").setDescription("Utilisateur ciblé.").setRequired(true));
  }

  if (option === "target_user") {
    return builder.addUserOption((input) => input.setName("target").setDescription("Utilisateur cible.").setRequired(true));
  }

  if (option === "role") {
    return builder.addRoleOption((input) => input.setName("role").setDescription("Rôle ciblé.").setRequired(true));
  }

  if (option === "channel") {
    return builder.addChannelOption((input) =>
      input
        .setName("channel")
        .setDescription("Salon ciblé.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
    );
  }

  if (option === "voice_channel") {
    return builder.addChannelOption((input) =>
      input
        .setName("channel")
        .setDescription("Salon vocal ciblé.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
    );
  }

  if (option === "duration") {
    return builder.addStringOption((input) => input.setName("duration").setDescription("Durée, ex: 10m, 2h, 7d.").setRequired(true));
  }

  if (option === "reason") {
    return builder.addStringOption((input) => input.setName("reason").setDescription("Raison.").setRequired(false).setMaxLength(1000));
  }

  if (option === "amount") {
    return builder.addIntegerOption((input) => input.setName("amount").setDescription("Nombre.").setRequired(true).setMinValue(1).setMaxValue(1000));
  }

  if (option === "text") {
    return builder.addStringOption((input) => input.setName("text").setDescription("Texte ou valeur.").setRequired(true).setMaxLength(1500));
  }

  if (option === "json") {
    return builder.addStringOption((input) => input.setName("json").setDescription("JSON.").setRequired(true).setMaxLength(4000));
  }

  if (option === "confirm") {
    return builder.addStringOption((input) => input.setName("confirm").setDescription("Tape CONFIRM pour confirmer.").setRequired(true));
  }

  return builder;
}

function isRequiredOption(option: GenericOption): boolean {
  return option !== "reason";
}

function orderDiscordOptions(options: GenericOption[]): GenericOption[] {
  return [
    ...options.filter(isRequiredOption),
    ...options.filter((option) => !isRequiredOption(option))
  ];
}

function describeOptions(subcommand: GenericSubcommand, values: string[]): string {
  const optionText = values.length > 0 ? `\nOptions reçues:\n${values.join("\n")}` : "";
  const dangerousText = subcommand.dangerous
    ? "\nAction sensible: confirmation requise et journalisation recommandée."
    : "";
  return `${subcommand.description}${dangerousText}${optionText}`;
}

export function createGenericCommandGroup(group: GenericCommandGroup): SlashCommand {
  const builder = new SlashCommandBuilder().setName(group.name).setDescription(group.description);

  for (const subcommand of group.subcommands.slice(0, 25)) {
    builder.addSubcommand((sub) => {
      let configured = sub.setName(subcommand.name).setDescription(subcommand.description);
      const options = subcommand.dangerous
        ? [...(subcommand.options ?? []), ...((subcommand.options ?? []).includes("confirm") ? [] : ["confirm" as const])]
        : subcommand.options ?? [];

      for (const option of orderDiscordOptions(options)) configured = addOption(configured, option);
      return configured;
    });
  }

  return {
    category: group.category,
    guildOnly: true,
    cooldownSeconds: group.cooldownSeconds ?? 5,
    userPermissions: group.userPermissions,
    botPermissions: group.botPermissions,
    data: builder,
    async execute(interaction) {
      const name = interaction.options.getSubcommand();
      const subcommand = group.subcommands.find((item) => item.name === name);
      if (!subcommand) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Sous-commande inconnue", description: "Cette action n'est pas déclarée côté bot." })],
          ephemeral: true
        });
        return;
      }

      if (subcommand.dangerous && interaction.options.getString("confirm") !== "CONFIRM") {
        await interaction.reply({
          embeds: [
            embeds.confirmation({
              title: "Confirmation requise",
              description: "Cette action est sensible. Relance la commande avec `confirm: CONFIRM`.",
              guild: interaction.guild
            })
          ],
          ephemeral: true
        });
        return;
      }

      const values: string[] = [];
      const user = interaction.options.getUser("user") ?? interaction.options.getUser("target");
      const role = interaction.options.getRole("role");
      const channel = interaction.options.getChannel("channel");
      const duration = interaction.options.getString("duration");
      const reason = interaction.options.getString("reason");
      const amount = interaction.options.getInteger("amount");
      const text = interaction.options.getString("text");
      const json = interaction.options.getString("json");

      if (user) values.push(`Utilisateur: ${user} (${user.id})`);
      if (role) values.push(`Rôle: ${role} (${role.id})`);
      if (channel) values.push(`Salon: ${channel} (${channel.id})`);
      if (duration) values.push(`Durée: ${duration}`);
      if (reason) values.push(`Raison: ${reason}`);
      if (amount !== null) values.push(`Nombre: ${amount}`);
      if (text) values.push(`Texte: ${text.slice(0, 300)}`);
      if (json) values.push(`JSON reçu: ${json.length} caractères`);

      await interaction.reply({
        embeds: [
          embeds.info({
            title: `/${group.name} ${name}`,
            description: describeOptions(subcommand, values),
            guild: interaction.guild,
            user: interaction.user
          })
        ],
        ephemeral: subcommand.ephemeral ?? true
      });
    }
  };
}

export const manageGuild = [PermissionFlagsBits.ManageGuild];
export const manageMessages = [PermissionFlagsBits.ManageMessages];
export const manageChannels = [PermissionFlagsBits.ManageChannels];
export const manageRoles = [PermissionFlagsBits.ManageRoles];
export const moderateMembers = [PermissionFlagsBits.ModerateMembers];

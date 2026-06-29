import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { embeds } from "../../utils/embeds.js";

const command: SlashCommand = {
  category: "utility",
  guildOnly: true,
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Informations serveur, membre, rôle et salon.")
    .addSubcommand((sub) => sub.setName("server").setDescription("Infos serveur."))
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Infos membre.")
        .addUserOption((option) => option.setName("user").setDescription("Membre.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("role")
        .setDescription("Infos rôle.")
        .addRoleOption((option) => option.setName("role").setDescription("Rôle.").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Infos salon.")
        .addChannelOption((option) => option.setName("channel").setDescription("Salon.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("permissions")
        .setDescription("Permissions dangereuses d'un membre.")
        .addUserOption((option) => option.setName("user").setDescription("Membre.").setRequired(false))
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "server") {
      const owner = await interaction.guild.fetchOwner().catch(() => null);
      await interaction.reply({
        embeds: [
          embeds.info({
            title: interaction.guild.name,
            description: [
              `ID: \`${interaction.guild.id}\``,
              `Owner: ${owner?.user ?? "inconnu"}`,
              `Membres: **${interaction.guild.memberCount}**`,
              `Salons: **${interaction.guild.channels.cache.size}**`,
              `Rôles: **${interaction.guild.roles.cache.size}**`,
              `Créé: <t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:F>`
            ].join("\n"),
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "user") {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      await interaction.reply({
        embeds: [
          embeds.info({
            title: user.tag,
            description: [
              `ID: \`${user.id}\``,
              `Compte créé: <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
              `Arrivé: ${member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "hors serveur"}`,
              `Rôle le plus haut: ${member?.roles.highest ?? "aucun"}`,
              `Bot: **${user.bot ? "oui" : "non"}**`
            ].join("\n"),
            guild: interaction.guild,
            user
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "role") {
      const role = interaction.options.getRole("role", true);
      await interaction.reply({
        embeds: [
          embeds.info({
            title: role.name,
            description: [
              `ID: \`${role.id}\``,
              `Membres: **${role.members.size}**`,
              `Position: **${role.position}**`,
              `Couleur: **${role.hexColor}**`,
              `Mentionnable: **${role.mentionable ? "oui" : "non"}**`,
              `Créé: <t:${Math.floor(role.createdTimestamp / 1000)}:R>`
            ].join("\n"),
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "channel") {
      const channel = interaction.options.getChannel("channel") ?? interaction.channel;
      await interaction.reply({
        embeds: [
          embeds.info({
            title: channel?.name ?? "Salon",
            description: [
              `ID: \`${channel?.id ?? "n/a"}\``,
              `Type: **${channel?.type ?? "n/a"}**`,
              `Mention: ${channel && "toString" in channel ? channel.toString() : "n/a"}`,
              `Créé: ${channel?.createdTimestamp ? `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>` : "n/a"}`
            ].join("\n"),
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "permissions") {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const member = await interaction.guild.members.fetch(user.id);
      const dangerous = [
        PermissionFlagsBits.Administrator,
        PermissionFlagsBits.ManageGuild,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageWebhooks,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.MentionEveryone
      ];
      const active = dangerous.filter((permission) => member.permissions.has(permission)).map((permission) => String(permission));

      await interaction.reply({
        embeds: [
          embeds.security({
            title: `Permissions de ${user.tag}`,
            description: active.length > 0 ? active.map((permission) => `\`${permission}\``).join("\n") : "Aucune permission dangereuse détectée.",
            guild: interaction.guild,
            user
          })
        ],
        ephemeral: true
      });
    }
  }
};

export default command;

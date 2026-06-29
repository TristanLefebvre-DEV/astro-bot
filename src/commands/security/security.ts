import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type GuildTextBasedChannel } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { sendSecurityPanel } from "../../modules/security/securityPanelService.js";
import { embeds } from "../../utils/embeds.js";

const dangerousPermissions = [
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

function permissionName(permission: bigint): string {
  const names: Record<string, string> = {
    [PermissionFlagsBits.Administrator.toString()]: "Administrator",
    [PermissionFlagsBits.ManageGuild.toString()]: "ManageGuild",
    [PermissionFlagsBits.ManageRoles.toString()]: "ManageRoles",
    [PermissionFlagsBits.ManageChannels.toString()]: "ManageChannels",
    [PermissionFlagsBits.ManageWebhooks.toString()]: "ManageWebhooks",
    [PermissionFlagsBits.BanMembers.toString()]: "BanMembers",
    [PermissionFlagsBits.KickMembers.toString()]: "KickMembers",
    [PermissionFlagsBits.ManageMessages.toString()]: "ManageMessages",
    [PermissionFlagsBits.MentionEveryone.toString()]: "MentionEveryone"
  };
  return names[permission.toString()] ?? permission.toString();
}

const command: SlashCommand = {
  category: "security",
  guildOnly: true,
  cooldownSeconds: 10,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("security")
    .setDescription("Audit securite serveur.")
    .addSubcommand((sub) => sub.setName("status").setDescription("Resume securite du serveur."))
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Envoyer le panel interactif de securite.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Salon ou envoyer le panel.")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) => sub.setName("scan").setDescription("Scanner les roles dangereux."))
    .addSubcommand((sub) => sub.setName("adminlist").setDescription("Lister les membres administrateurs."))
    .addSubcommand((sub) => sub.setName("botlist").setDescription("Lister les bots du serveur.")),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "panel") {
      const channel = (interaction.options.getChannel("channel") ?? interaction.channel) as GuildTextBasedChannel | null;
      if (!channel || !("send" in channel)) {
        await interaction.reply({
          embeds: [
            embeds.error({
              title: "Salon invalide",
              description: "Choisis un salon textuel ou lance la commande dans un salon textuel."
            })
          ],
          ephemeral: true
        });
        return;
      }

      await sendSecurityPanel({ guild: interaction.guild, channel, createdBy: interaction.user });
      await interaction.reply({
        embeds: [embeds.success({ title: "Panel envoye", description: `Le panel securite a ete envoye dans ${channel}.` })],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "status") {
      const rolesWithDanger = interaction.guild.roles.cache.filter((role) =>
        dangerousPermissions.some((permission) => role.permissions.has(permission))
      );
      const bots = interaction.guild.members.cache.filter((member) => member.user.bot);
      await interaction.reply({
        embeds: [
          embeds.security({
            title: "Statut securite",
            description: [
              `Roles sensibles: **${rolesWithDanger.size}**`,
              `Bots: **${bots.size}**`,
              `MFA serveur: **${interaction.guild.mfaLevel}**`,
              `Niveau verification: **${interaction.guild.verificationLevel}**`,
              "Les scores restent indicatifs et doivent etre valides par un humain."
            ].join("\n"),
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "scan") {
      const rows = interaction.guild.roles.cache
        .filter((role) => dangerousPermissions.some((permission) => role.permissions.has(permission)))
        .sort((a, b) => b.position - a.position)
        .map((role) => {
          const perms = dangerousPermissions.filter((permission) => role.permissions.has(permission)).map(permissionName);
          return `${role} - ${perms.join(", ")}`;
        })
        .slice(0, 20);

      await interaction.reply({
        embeds: [
          embeds.security({
            title: "Roles dangereux",
            description: rows.join("\n") || "Aucun role dangereux detecte.",
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "adminlist") {
      await interaction.guild.members.fetch();
      const admins = interaction.guild.members.cache
        .filter((member) => member.permissions.has(PermissionFlagsBits.Administrator) && !member.user.bot)
        .map((member) => `${member.user.tag} (${member.id})`)
        .slice(0, 30);

      await interaction.reply({
        embeds: [
          embeds.security({
            title: "Administrateurs",
            description: admins.join("\n") || "Aucun administrateur humain detecte.",
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "botlist") {
      await interaction.guild.members.fetch();
      const bots = interaction.guild.members.cache
        .filter((member) => member.user.bot)
        .map((member) => `${member.user.tag} (${member.id}) - role haut: ${member.roles.highest}`)
        .slice(0, 30);

      await interaction.reply({
        embeds: [
          embeds.security({
            title: "Bots du serveur",
            description: bots.join("\n") || "Aucun bot detecte.",
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
    }
  }
};

export default command;

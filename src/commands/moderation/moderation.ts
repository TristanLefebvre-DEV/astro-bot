import { PermissionFlagsBits, SlashCommandBuilder, type GuildMember } from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { embeds } from "../../utils/embeds.js";
import {
  canBotModerateMember,
  canModerateMember,
  createModerationCase,
  createWarn,
  getUserHistory,
  getUserWarnings,
  moderationResultEmbed,
  parseDurationToMs,
  sendModerationLog
} from "../../modules/moderation/moderationService.js";
import { TempBan } from "../../database/models/index.js";
import type { Model } from "mongoose";

function reason(interactionReason: string | null): string {
  return interactionReason?.trim() || "Aucune raison fournie";
}

const command: SlashCommand = {
  category: "moderation",
  guildOnly: true,
  cooldownSeconds: 4,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Sanctions, warnings et historique de moderation.")
    .addSubcommand((sub) =>
      sub
        .setName("ban")
        .setDescription("Bannir un membre.")
        .addUserOption((option) => option.setName("user").setDescription("Membre vise.").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("tempban")
        .setDescription("Bannir temporairement un membre.")
        .addUserOption((option) => option.setName("user").setDescription("Membre vise.").setRequired(true))
        .addStringOption((option) => option.setName("duration").setDescription("Ex: 10m, 2h, 7d.").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("unban")
        .setDescription("Débannir un utilisateur par ID.")
        .addStringOption((option) => option.setName("user_id").setDescription("ID utilisateur.").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("kick")
        .setDescription("Expulser un membre.")
        .addUserOption((option) => option.setName("user").setDescription("Membre vise.").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("timeout")
        .setDescription("Mettre un membre en timeout.")
        .addUserOption((option) => option.setName("user").setDescription("Membre vise.").setRequired(true))
        .addStringOption((option) => option.setName("duration").setDescription("Ex: 10m, 2h, 7d.").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("untimeout")
        .setDescription("Retirer le timeout.")
        .addUserOption((option) => option.setName("user").setDescription("Membre vise.").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("warn")
        .setDescription("Avertir un membre.")
        .addUserOption((option) => option.setName("user").setDescription("Membre vise.").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("Raison.").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("warnings")
        .setDescription("Voir les warnings d'un membre.")
        .addUserOption((option) => option.setName("user").setDescription("Membre vise.").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("history")
        .setDescription("Voir l'historique moderation d'un membre.")
        .addUserOption((option) => option.setName("user").setDescription("Membre vise.").setRequired(true))
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("user");
    const targetMember = targetUser ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;
    const moderator = interaction.member;
    const botMember = interaction.guild.members.me;

    if (["ban", "tempban", "kick", "timeout", "untimeout"].includes(subcommand)) {
      if (!targetUser) return;
      if (!targetMember) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Membre introuvable", description: "Ce membre n'est pas dans le serveur." })],
          ephemeral: true
        });
        return;
      }

      if (!canModerateMember(moderator as GuildMember, targetMember)) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Action refusee", description: "Tu ne peux pas moderer ce membre." })],
          ephemeral: true
        });
        return;
      }

      if (!botMember || !canBotModerateMember(botMember, targetMember)) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Hierarchie insuffisante", description: "Mon role est trop bas pour agir." })],
          ephemeral: true
        });
        return;
      }
    }

    if (subcommand === "ban") {
      if (!targetUser) return;
      const actionReason = reason(interaction.options.getString("reason"));
      await interaction.guild.members.ban(targetUser.id, { reason: actionReason });
      const modCase = await createModerationCase({
        guildId: interaction.guild.id,
        type: "ban",
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: actionReason
      });
      const embed = moderationResultEmbed({
        guild: interaction.guild,
        title: "Membre banni",
        user: targetUser,
        moderator: interaction.user,
        reason: actionReason,
        caseId: modCase.caseId
      });
      await sendModerationLog(interaction.guild, embed);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "tempban") {
      if (!targetUser) return;
      const durationInput = interaction.options.getString("duration", true);
      const ms = parseDurationToMs(durationInput);
      if (!ms) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Durée invalide", description: "Utilise une durée comme 10m, 2h, 7d." })],
          ephemeral: true
        });
        return;
      }
      const actionReason = reason(interaction.options.getString("reason"));
      const expiresAt = new Date(Date.now() + ms);
      await interaction.guild.members.ban(targetUser.id, { reason: actionReason });
      await (TempBan as Model<any>).create({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: actionReason,
        expiresAt,
        active: true
      });
      const modCase = await createModerationCase({
        guildId: interaction.guild.id,
        type: "tempban",
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: actionReason,
        duration: ms,
        expiresAt
      });
      const embed = moderationResultEmbed({
        guild: interaction.guild,
        title: "Membre tempban",
        user: targetUser,
        moderator: interaction.user,
        reason: `${actionReason}\nExpire: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
        caseId: modCase.caseId
      });
      await sendModerationLog(interaction.guild, embed);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "unban") {
      const userId = interaction.options.getString("user_id", true);
      const actionReason = reason(interaction.options.getString("reason"));
      await interaction.guild.members.unban(userId, actionReason);
      await (TempBan as Model<any>).updateMany({ guildId: interaction.guild.id, userId }, { $set: { active: false } });
      const modCase = await createModerationCase({
        guildId: interaction.guild.id,
        type: "unban",
        userId,
        moderatorId: interaction.user.id,
        reason: actionReason,
        active: false,
        status: "closed"
      });
      await interaction.reply({
        embeds: [
          embeds.moderation({
            title: "Utilisateur débanni",
            description: `Utilisateur: \`${userId}\`\nRaison: ${actionReason}\nCase: #${modCase.caseId}`,
            guild: interaction.guild
          })
        ]
      });
      return;
    }

    if (subcommand === "kick") {
      if (!targetUser) return;
      const actionReason = reason(interaction.options.getString("reason"));
      await targetMember!.kick(actionReason);
      const modCase = await createModerationCase({
        guildId: interaction.guild.id,
        type: "kick",
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: actionReason,
        active: false,
        status: "closed"
      });
      const embed = moderationResultEmbed({
        guild: interaction.guild,
        title: "Membre expulse",
        user: targetUser,
        moderator: interaction.user,
        reason: actionReason,
        caseId: modCase.caseId
      });
      await sendModerationLog(interaction.guild, embed);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "timeout") {
      if (!targetUser) return;
      const durationInput = interaction.options.getString("duration", true);
      const ms = parseDurationToMs(durationInput);
      if (!ms || ms > 2_419_200_000) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Duree invalide", description: "Utilise une duree comme 10m, 2h, 7d ou 4w maximum." })],
          ephemeral: true
        });
        return;
      }

      const actionReason = reason(interaction.options.getString("reason"));
      const expiresAt = new Date(Date.now() + ms);
      await targetMember!.timeout(ms, actionReason);
      const modCase = await createModerationCase({
        guildId: interaction.guild.id,
        type: "timeout",
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: actionReason,
        duration: ms,
        expiresAt
      });
      const embed = moderationResultEmbed({
        guild: interaction.guild,
        title: "Membre timeout",
        user: targetUser,
        moderator: interaction.user,
        reason: `${actionReason}\nExpire: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
        caseId: modCase.caseId
      });
      await sendModerationLog(interaction.guild, embed);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "untimeout") {
      if (!targetUser) return;
      const actionReason = reason(interaction.options.getString("reason"));
      await targetMember!.timeout(null, actionReason);
      const modCase = await createModerationCase({
        guildId: interaction.guild.id,
        type: "untimeout",
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: actionReason,
        active: false,
        status: "closed"
      });
      const embed = moderationResultEmbed({
        guild: interaction.guild,
        title: "Timeout retire",
        user: targetUser,
        moderator: interaction.user,
        reason: actionReason,
        caseId: modCase.caseId
      });
      await sendModerationLog(interaction.guild, embed);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "warn") {
      if (!targetUser) return;
      const actionReason = reason(interaction.options.getString("reason"));
      const { warn, modCase } = await createWarn({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: actionReason
      });
      const embed = moderationResultEmbed({
        guild: interaction.guild,
        title: `Avertissement #${warn.warnId}`,
        user: targetUser,
        moderator: interaction.user,
        reason: actionReason,
        caseId: modCase.caseId
      });
      await sendModerationLog(interaction.guild, embed);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "warnings") {
      if (!targetUser) return;
      const warnings = await getUserWarnings(interaction.guild.id, targetUser.id);
      await interaction.reply({
        embeds: [
          embeds.warning({
            title: `Warnings de ${targetUser.tag}`,
            description:
              warnings
                .map((warn) => `#${warn.warnId} - ${warn.reason} - <t:${Math.floor(new Date(warn.createdAt).getTime() / 1000)}:R>`)
                .join("\n") || "Aucun warning actif.",
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "history") {
      if (!targetUser) return;
      const history = await getUserHistory(interaction.guild.id, targetUser.id);
      await interaction.reply({
        embeds: [
          embeds.info({
            title: `Historique de ${targetUser.tag}`,
            description:
              history
                .map(
                  (entry) =>
                    `#${entry.caseId} ${entry.type} - ${entry.reason} - <t:${Math.floor(new Date(entry.createdAt).getTime() / 1000)}:R>`
                )
                .join("\n") || "Aucune action enregistree.",
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
    }
  }
};

export default command;

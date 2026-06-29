import {
  ActionRowBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  type Guild,
  type GuildTextBasedChannel,
  type StringSelectMenuInteraction,
  type User
} from "discord.js";
import type { Model } from "mongoose";
import {
  AntiNukeConfig,
  AutoModConfig,
  GuildConfig,
  RoleProtectionConfig,
  ScamConfig
} from "../../database/models/index.js";
import { defaultGuildConfig } from "../../config/defaultConfig.js";
import { embeds } from "../../utils/embeds.js";

const securityLevelCustomId = "security:level";

type SecurityLevel = "low" | "standard" | "high" | "max";

const levelLabels: Record<SecurityLevel, string> = {
  low: "Faible",
  standard: "Standard",
  high: "Eleve",
  max: "Maximum"
};

const levelDescriptions: Record<SecurityLevel, string[]> = {
  low: [
    "Anti-raid actif avec seuils souples",
    "Automod basique actif",
    "Anti-nuke desactive"
  ],
  standard: [
    "Anti-raid actif",
    "Anti-liens, anti-invitations et anti-spam actifs",
    "Anti-nuke actif avec limites normales"
  ],
  high: [
    "Anti-raid renforce",
    "Anti-nuke strict",
    "RoleProtect et detection scam actifs"
  ],
  max: [
    "Protection maximale",
    "Anti-nuke tres strict",
    "Panic mode, RoleProtect et anti-webhook actifs"
  ]
};

function securityLevelRow(): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(securityLevelCustomId)
      .setPlaceholder("Choisir le niveau de securite")
      .addOptions(
        {
          label: "Faible",
          value: "low",
          description: "Protection douce pour petits serveurs calmes."
        },
        {
          label: "Standard",
          value: "standard",
          description: "Bon equilibre pour un serveur public."
        },
        {
          label: "Eleve",
          value: "high",
          description: "Protection forte contre raids et nukes."
        },
        {
          label: "Maximum",
          value: "max",
          description: "Mode tres strict pour serveur a risque."
        }
      )
  );
}

export async function sendSecurityPanel(input: {
  guild: Guild;
  channel: GuildTextBasedChannel;
  createdBy: User;
}): Promise<void> {
  await input.channel.send({
    embeds: [
      embeds.security({
        title: "Panel securite",
        description: [
          "Choisis un niveau pour appliquer automatiquement les protections du serveur.",
          "",
          "**Faible**: protection douce.",
          "**Standard**: anti-raid + automod utile.",
          "**Eleve**: anti-nuke + RoleProtect.",
          "**Maximum**: reglage tres strict."
        ].join("\n"),
        guild: input.guild,
        user: input.createdBy
      })
    ],
    components: [securityLevelRow()]
  });
}

async function applySecurityLevel(guildId: string, level: SecurityLevel): Promise<void> {
  const sharedGuildSet = {
    "automod.enabled": true,
    "automod.antiLinks.enabled": level !== "low",
    "automod.antiInvites.enabled": level !== "low",
    "automod.antiSpam.enabled": true,
    "automod.antiSpam.maxMessages": level === "max" ? 4 : level === "high" ? 5 : 7,
    "automod.antiSpam.windowSeconds": level === "max" ? 6 : 10,
    "antiraid.enabled": true,
    "antiraid.panicMode": level === "max",
    "antinuke.enabled": level !== "low",
    "scam.enabled": level === "high" || level === "max",
    "privacy.sensitiveScanEnabled": level === "high" || level === "max"
  };

  await (GuildConfig as Model<any>).findOneAndUpdate(
    { guildId },
    { $setOnInsert: { guildId, ...defaultGuildConfig } },
    { upsert: true }
  );
  await (GuildConfig as Model<any>).findOneAndUpdate({ guildId }, { $set: sharedGuildSet });

  await (AutoModConfig as Model<any>).findOneAndUpdate(
    { guildId },
    {
      $set: {
        enabled: true,
        antiLinks: { enabled: level !== "low", action: level === "max" ? "delete_warn" : "delete" },
        antiInvites: { enabled: level !== "low", action: "delete_warn" },
        antiSpam: {
          enabled: true,
          maxMessages: level === "max" ? 4 : level === "high" ? 5 : 7,
          windowSeconds: level === "max" ? 6 : 10,
          action: level === "low" ? "warn" : "timeout"
        },
        mentionLimit: level === "max" ? 4 : level === "high" ? 5 : 6
      }
    },
    { upsert: true }
  );

  await (AntiNukeConfig as Model<any>).findOneAndUpdate(
    { guildId },
    {
      $set: {
        enabled: level !== "low",
        maxBans: level === "max" ? 1 : level === "high" ? 2 : 3,
        maxKicks: level === "max" ? 1 : level === "high" ? 2 : 3,
        maxChannels: level === "max" ? 1 : level === "high" ? 2 : 3,
        maxRoles: level === "max" ? 1 : level === "high" ? 2 : 3,
        punishment: "quarantine",
        panicOnCritical: level === "high" || level === "max"
      }
    },
    { upsert: true }
  );

  await (RoleProtectionConfig as Model<any>).findOneAndUpdate(
    { guildId },
    {
      $set: {
        enabled: level === "high" || level === "max",
        autoRollback: true,
        panicOnCriticalAction: level === "max",
        punishment: "quarantine"
      }
    },
    { upsert: true }
  );

  await (ScamConfig as Model<any>).findOneAndUpdate(
    { guildId },
    {
      $set: {
        enabled: level === "high" || level === "max",
        antiWebhook: level === "max",
        punishments: {
          scam: level === "max" ? "timeout" : "delete_warn",
          webhook: level === "max" ? "quarantine" : "delete"
        }
      }
    },
    { upsert: true }
  );
}

export async function handleSecurityComponent(interaction: StringSelectMenuInteraction): Promise<boolean> {
  if (interaction.customId !== securityLevelCustomId) return false;
  if (!interaction.inCachedGuild()) return true;

  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      embeds: [
        embeds.error({
          title: "Permission refusee",
          description: "Il faut la permission Gerer le serveur pour utiliser ce panel."
        })
      ],
      ephemeral: true
    });
    return true;
  }

  const level = interaction.values[0] as SecurityLevel;
  if (!["low", "standard", "high", "max"].includes(level)) return true;

  await interaction.deferReply({ ephemeral: true });
  await applySecurityLevel(interaction.guild.id, level);

  await interaction.editReply({
    embeds: [
      embeds.success({
        title: `Securite ${levelLabels[level]} appliquee`,
        description: levelDescriptions[level].map((item) => `- ${item}`).join("\n"),
        guild: interaction.guild,
        user: interaction.user
      })
    ]
  });
  return true;
}

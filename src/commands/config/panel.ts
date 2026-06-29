import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextBasedChannel
} from "discord.js";
import type { SlashCommand } from "../../types/command.js";
import { embeds } from "../../utils/embeds.js";
import {
  createPanelFromTemplate,
  deletePanel,
  findPanel,
  isTextSendableChannel,
  listPanels,
  renderPanel,
  savePanel,
  sendPanelToChannel
} from "../../modules/panels/panelService.js";
import type { PanelConfig, PanelType } from "../../modules/panels/types.js";

const panelTypeChoices = [
  { name: "Ticket support premium", value: "ticket" },
  { name: "Vérification", value: "verification" },
  { name: "Rôles communautaires", value: "roles" },
  { name: "Maintenance", value: "maintenance" },
  { name: "Règlement", value: "rules" },
  { name: "Annonce premium", value: "announcement" },
  { name: "Sécurité", value: "security" },
  { name: "Custom", value: "custom" }
] as const;

function asPanelType(value: string): PanelType {
  if (panelTypeChoices.some((choice) => choice.value === value)) return value as PanelType;
  return "custom";
}

function exportPanel(panel: PanelConfig): string {
  return JSON.stringify(
    {
      type: panel.type,
      name: panel.name,
      title: panel.title,
      description: panel.description,
      color: panel.color,
      image: panel.image,
      thumbnail: panel.thumbnail,
      footer: panel.footer,
      emoji: panel.emoji,
      style: panel.style,
      buttons: panel.buttons,
      selectMenus: panel.selectMenus,
      actions: panel.actions,
      permissions: panel.permissions,
      enabled: panel.enabled
    },
    null,
    2
  );
}

const command: SlashCommand = {
  category: "config",
  guildOnly: true,
  cooldownSeconds: 5,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Créer et gérer les panels premium du serveur.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Créer un panel depuis un template.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type de panel.")
            .setRequired(true)
            .addChoices(...panelTypeChoices)
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("Nom interne du panel.").setRequired(true).setMaxLength(64)
        )
    )
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("Lister les panels du serveur."))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("preview")
        .setDescription("Prévisualiser un panel.")
        .addStringOption((option) => option.setName("panel_id").setDescription("ID du panel.").setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("send")
        .setDescription("Envoyer un panel dans un salon.")
        .addStringOption((option) => option.setName("panel_id").setDescription("ID du panel.").setRequired(true))
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Salon cible.")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("export")
        .setDescription("Exporter un panel en JSON.")
        .addStringOption((option) => option.setName("panel_id").setDescription("ID du panel.").setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("import")
        .setDescription("Importer un panel depuis JSON.")
        .addStringOption((option) =>
          option.setName("json").setDescription("JSON exporté par /panel export.").setRequired(true).setMaxLength(4000)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Supprimer un panel.")
        .addStringOption((option) => option.setName("panel_id").setDescription("ID du panel.").setRequired(true))
    ),
  async execute(interaction) {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      const type = asPanelType(interaction.options.getString("type", true));
      const name = interaction.options.getString("name", true);
      const panel = await savePanel(
        createPanelFromTemplate({
          guildId: interaction.guild.id,
          type,
          name,
          createdBy: interaction.user.id
        })
      );

      await interaction.reply({
        embeds: [
          embeds.success({
            title: "Panel créé",
            description: [`Nom: **${panel.name}**`, `Type: **${panel.type}**`, `ID: \`${panel.panelId}\``].join("\n"),
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "list") {
      const panels = await listPanels(interaction.guild.id);
      await interaction.reply({
        embeds: [
          embeds.info({
            title: "Panels du serveur",
            description:
              panels
                .map(
                  (panel) =>
                    `\`${panel.panelId}\` **${panel.name}** - ${panel.type} - ${panel.enabled ? "actif" : "désactivé"}`
                )
                .join("\n") || "Aucun panel créé.",
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "preview") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = await findPanel(interaction.guild.id, panelId);
      if (!panel) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Panel introuvable", description: `Aucun panel avec l'ID \`${panelId}\`.` })],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({ ...renderPanel(panel, interaction.guild), ephemeral: true });
      return;
    }

    if (subcommand === "send") {
      const panelId = interaction.options.getString("panel_id", true);
      const channel = interaction.options.getChannel("channel", true) as TextBasedChannel;
      const panel = await findPanel(interaction.guild.id, panelId);

      if (!panel) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Panel introuvable", description: `Aucun panel avec l'ID \`${panelId}\`.` })],
          ephemeral: true
        });
        return;
      }

      if (!isTextSendableChannel(channel)) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Salon invalide", description: "Choisis un salon textuel ou d'annonce." })],
          ephemeral: true
        });
        return;
      }

      const messageId = await sendPanelToChannel(panel, channel);
      await interaction.reply({
        embeds: [
          embeds.success({
            title: "Panel envoyé",
            description: `Message créé dans <#${channel.id}> avec l'ID \`${messageId}\`.`,
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "export") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = await findPanel(interaction.guild.id, panelId);
      if (!panel) {
        await interaction.reply({
          embeds: [embeds.error({ title: "Panel introuvable", description: `Aucun panel avec l'ID \`${panelId}\`.` })],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [
          embeds.info({
            title: "Export JSON",
            description: `\`\`\`json\n${exportPanel(panel).slice(0, 3900)}\n\`\`\``,
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "import") {
      const rawJson = interaction.options.getString("json", true);
      let parsed: Partial<PanelConfig>;

      try {
        parsed = JSON.parse(rawJson) as Partial<PanelConfig>;
      } catch {
        await interaction.reply({
          embeds: [embeds.error({ title: "JSON invalide", description: "Le contenu fourni n'est pas un JSON valide." })],
          ephemeral: true
        });
        return;
      }

      const base = createPanelFromTemplate({
        guildId: interaction.guild.id,
        type: asPanelType(parsed.type ?? "custom"),
        name: parsed.name ?? "Panel importé",
        createdBy: interaction.user.id
      });

      const panel = await savePanel({
        ...base,
        title: parsed.title ?? base.title,
        description: parsed.description ?? base.description,
        color: parsed.color ?? base.color,
        image: parsed.image ?? base.image,
        thumbnail: parsed.thumbnail ?? base.thumbnail,
        footer: parsed.footer ?? base.footer,
        emoji: parsed.emoji ?? base.emoji,
        style: parsed.style ?? base.style,
        buttons: parsed.buttons ?? base.buttons,
        selectMenus: parsed.selectMenus ?? base.selectMenus,
        actions: parsed.actions ?? base.actions,
        permissions: parsed.permissions ?? base.permissions,
        enabled: parsed.enabled ?? true
      });

      await interaction.reply({
        embeds: [
          embeds.success({
            title: "Panel importé",
            description: `Panel **${panel.name}** importé avec l'ID \`${panel.panelId}\`.`,
            guild: interaction.guild
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (subcommand === "delete") {
      const panelId = interaction.options.getString("panel_id", true);
      const deleted = await deletePanel(interaction.guild.id, panelId);

      await interaction.reply({
        embeds: [
          deleted
            ? embeds.success({ title: "Panel supprimé", description: `Le panel \`${panelId}\` a été supprimé.` })
            : embeds.error({ title: "Panel introuvable", description: `Aucun panel avec l'ID \`${panelId}\`.` })
        ],
        ephemeral: true
      });
      return;
    }
  }
};

export default command;

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type ChatInputCommandInteraction,
  type EmbedBuilder,
  type Message
} from "discord.js";

function controls(page: number, total: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("first").setLabel("Première").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId("prev").setLabel("Précédente").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Suivante")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= total - 1),
    new ButtonBuilder()
      .setCustomId("last")
      .setLabel("Dernière")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= total - 1),
    new ButtonBuilder().setCustomId("close").setLabel("Fermer").setStyle(ButtonStyle.Danger)
  );
}

export async function paginateEmbeds(
  interaction: ChatInputCommandInteraction,
  pages: EmbedBuilder[],
  ephemeral = true
): Promise<void> {
  let page = 0;
  const total = pages.length;

  const response = (await interaction.reply({
    embeds: [pages[page]!],
    components: total > 1 ? [controls(page, total)] : [],
    ephemeral,
    fetchReply: true
  })) as Message;

  if (total <= 1) return;

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000
  });

  collector.on("collect", async (buttonInteraction) => {
    if (buttonInteraction.user.id !== interaction.user.id) {
      await buttonInteraction.reply({ content: "Ce menu ne t'appartient pas.", ephemeral: true });
      return;
    }

    if (buttonInteraction.customId === "close") {
      collector.stop("closed");
      await buttonInteraction.update({ components: [] });
      return;
    }

    if (buttonInteraction.customId === "first") page = 0;
    if (buttonInteraction.customId === "prev") page = Math.max(0, page - 1);
    if (buttonInteraction.customId === "next") page = Math.min(total - 1, page + 1);
    if (buttonInteraction.customId === "last") page = total - 1;

    await buttonInteraction.update({
      embeds: [pages[page]!],
      components: [controls(page, total)]
    });
  });

  collector.on("end", async () => {
    await response.edit({ components: [] }).catch(() => undefined);
  });
}

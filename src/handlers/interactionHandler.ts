import type { ChatInputCommandInteraction, Client, Interaction } from "discord.js";
import { logger } from "../utils/logger.js";
import { embeds } from "../utils/embeds.js";
import { ensureCommandPermissions } from "./permissionHandler.js";
import { ensureCooldown } from "./cooldownHandler.js";
import { handlePanelComponent } from "../modules/panels/panelService.js";
import { handleGiveawayButton } from "../modules/giveaways/giveawayService.js";
import { handleTicketComponent } from "../modules/tickets/ticketService.js";
import { handleSecurityComponent } from "../modules/security/securityPanelService.js";
import { handleHelpComponent } from "../modules/help/helpService.js";

async function replyWithError(interaction: ChatInputCommandInteraction): Promise<void> {
  const payload = {
    embeds: [
      embeds.error({
        title: "Erreur",
        description: "Une erreur est survenue pendant l'exécution de la commande."
      })
    ],
    ephemeral: true
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(payload);
  } else {
    await interaction.reply(payload);
  }
}

export async function handleInteraction(client: Client<true>, interaction: Interaction): Promise<void> {
  if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
    try {
      if (
        (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) &&
        (await handleTicketComponent(interaction))
      ) {
        return;
      }
      if ((interaction.isButton() || interaction.isStringSelectMenu()) && (await handleHelpComponent(interaction, client))) return;
      if (interaction.isStringSelectMenu() && (await handleSecurityComponent(interaction))) return;
      if (interaction.isButton() && (await handleGiveawayButton(interaction))) return;
      if (interaction.isButton() || interaction.isStringSelectMenu()) {
        const handled = await handlePanelComponent(interaction);
        if (handled) return;
      }
    } catch (error) {
      logger.error("Erreur interaction panel", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [
            embeds.error({
              title: "Erreur panel",
              description: "Une erreur est survenue pendant le traitement du panel."
            })
          ],
          ephemeral: true
        });
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      embeds: [embeds.error({ title: "Commande inconnue", description: "Cette commande n'est pas chargée côté bot." })],
      ephemeral: true
    });
    return;
  }

  try {
    if (!(await ensureCommandPermissions(interaction, command))) return;
    if (!(await ensureCooldown(interaction, command))) return;
    await command.execute(interaction, { client });
  } catch (error) {
    logger.error(`Erreur commande /${interaction.commandName}`, error);
    await replyWithError(interaction);
  }
}

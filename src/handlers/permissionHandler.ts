import type { ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types/command.js";
import { embeds } from "../utils/embeds.js";
import { isOwner, missingBotPermissions, missingMemberPermissions } from "../utils/permissions.js";

export async function ensureCommandPermissions(
  interaction: ChatInputCommandInteraction,
  command: SlashCommand
): Promise<boolean> {
  if (command.guildOnly && !interaction.inGuild()) {
    await interaction.reply({
      embeds: [embeds.error({ title: "Commande indisponible", description: "Cette commande doit être utilisée dans un serveur." })],
      ephemeral: true
    });
    return false;
  }

  if (command.ownerOnly && !isOwner(interaction.user.id)) {
    await interaction.reply({
      embeds: [embeds.error({ title: "Accès refusé", description: "Cette commande est réservée aux owners du bot." })],
      ephemeral: true
    });
    return false;
  }

  const missingUser = missingMemberPermissions(interaction, command.userPermissions);
  if (missingUser.length > 0) {
    await interaction.reply({
      embeds: [
        embeds.error({
          title: "Permissions manquantes",
          description: `Il te manque: ${missingUser.join(", ")}`
        })
      ],
      ephemeral: true
    });
    return false;
  }

  const missingBot = missingBotPermissions(interaction, command.botPermissions);
  if (missingBot.length > 0) {
    await interaction.reply({
      embeds: [
        embeds.error({
          title: "Permissions bot manquantes",
          description: `Il me manque: ${missingBot.join(", ")}`
        })
      ],
      ephemeral: true
    });
    return false;
  }

  return true;
}

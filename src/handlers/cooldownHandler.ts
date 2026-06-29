import type { ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types/command.js";
import { checkCooldown } from "../utils/cooldowns.js";
import { embeds } from "../utils/embeds.js";

export async function ensureCooldown(
  interaction: ChatInputCommandInteraction,
  command: SlashCommand
): Promise<boolean> {
  const remainingSeconds = checkCooldown(interaction, command.data.name, command.cooldownSeconds ?? 3);
  if (remainingSeconds <= 0) return true;

  await interaction.reply({
    embeds: [
      embeds.warning({
        title: "Cooldown",
        description: `Réessaie dans ${remainingSeconds}s.`
      })
    ],
    ephemeral: true
  });
  return false;
}

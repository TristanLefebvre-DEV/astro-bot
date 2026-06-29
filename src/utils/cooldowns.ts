import type { ChatInputCommandInteraction } from "discord.js";

const cooldowns = new Map<string, number>();

export function checkCooldown(interaction: ChatInputCommandInteraction, commandName: string, seconds = 3): number {
  const key = `${interaction.user.id}:${commandName}`;
  const now = Date.now();
  const expiresAt = cooldowns.get(key) ?? 0;

  if (expiresAt > now) {
    return Math.ceil((expiresAt - now) / 1000);
  }

  cooldowns.set(key, now + seconds * 1000);
  return 0;
}

export function clearExpiredCooldowns(): void {
  const now = Date.now();
  for (const [key, expiresAt] of cooldowns.entries()) {
    if (expiresAt <= now) cooldowns.delete(key);
  }
}

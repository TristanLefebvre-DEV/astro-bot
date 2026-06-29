import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import type { Collection } from "discord.js";
import { config } from "../config/index.js";
import type { SlashCommand } from "../types/command.js";
import { logger } from "../utils/logger.js";

export async function syncCommands(commands: Collection<string, SlashCommand>): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
  const body: RESTPostAPIChatInputApplicationCommandsJSONBody[] = commands.map((command) => command.data.toJSON());

  if (config.COMMAND_SYNC_MODE === "guild") {
    if (!config.GUILD_ID) {
      throw new Error("GUILD_ID est requis quand COMMAND_SYNC_MODE=guild");
    }

    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body });
    logger.info(`Slash commands synchronisées en mode guild (${body.length})`);
    return;
  }

  await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body });
  logger.info(`Slash commands synchronisées en mode global (${body.length})`);
}

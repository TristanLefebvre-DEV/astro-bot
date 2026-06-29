import { Collection, type Client } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SlashCommand } from "../types/command.js";
import { logger } from "../utils/logger.js";
import { importModule, loadFiles } from "./fileLoader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CommandModule {
  default?: SlashCommand;
  command?: SlashCommand;
}

export async function loadCommands(client: Client): Promise<Collection<string, SlashCommand>> {
  const commands = new Collection<string, SlashCommand>();
  const commandsPath = path.resolve(__dirname, "../commands");
  const files = await loadFiles(commandsPath);

  for (const file of files) {
    const module = await importModule<CommandModule>(file);
    const command = module.default ?? module.command;

    if (!command?.data?.name || typeof command.execute !== "function") {
      logger.warn(`Commande ignorée: ${file}`);
      continue;
    }

    commands.set(command.data.name, command);
  }

  client.commands = commands;
  logger.info(`${commands.size} commande(s) chargée(s)`);
  return commands;
}

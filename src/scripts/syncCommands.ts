import "../types/client.js";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { loadCommands } from "../handlers/commandHandler.js";
import { syncCommands } from "../handlers/commandSync.js";
import { logger } from "../utils/logger.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commands = await loadCommands(client);
await syncCommands(commands);
logger.info("Synchronisation terminée");
client.destroy();

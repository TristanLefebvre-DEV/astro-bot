import "./types/client.js";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { config } from "./config/index.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { syncCommands } from "./handlers/commandSync.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { logger } from "./utils/logger.js";
import { clearExpiredCooldowns } from "./utils/cooldowns.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User]
});

client.commands = new Collection();

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
});

async function shutdown(signal: string): Promise<void> {
  logger.warn(`Arrêt demandé: ${signal}`);
  client.destroy();
  await disconnectDatabase().catch((error) => logger.error("Erreur déconnexion MongoDB", error));
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

setInterval(clearExpiredCooldowns, 60_000).unref();

async function bootstrap(): Promise<void> {
  logger.info("Démarrage Astro Discord Bot");
  await connectDatabase();
  await loadEvents(client);
  const commands = await loadCommands(client);
  await syncCommands(commands);
  await client.login(config.DISCORD_TOKEN);
}

void bootstrap().catch((error) => {
  logger.error("Démarrage impossible", error);
  process.exit(1);
});

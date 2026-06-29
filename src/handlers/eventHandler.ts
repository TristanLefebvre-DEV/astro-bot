import type { Client } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../utils/logger.js";
import { importModule, loadFiles } from "./fileLoader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface EventModule {
  default?: BotEvent;
  event?: BotEvent;
}

export interface BotEvent {
  name: string;
  once?: boolean;
  execute(...args: unknown[]): Promise<void> | void;
}

export async function loadEvents(client: Client): Promise<void> {
  const eventsPath = path.resolve(__dirname, "../events");
  const files = await loadFiles(eventsPath);
  let loaded = 0;

  for (const file of files) {
    const module = await importModule<EventModule>(file);
    const event = module.default ?? module.event;

    if (!event?.name || typeof event.execute !== "function") {
      logger.warn(`Event ignoré: ${file}`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => void event.execute(...args));
    } else {
      client.on(event.name, (...args) => void event.execute(...args));
    }
    loaded += 1;
  }

  logger.info(`${loaded} event(s) chargé(s)`);
}

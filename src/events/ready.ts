import { Events, type Client } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { logger } from "../utils/logger.js";
import { startDashboard } from "../modules/dashboard/dashboardServer.js";
import { startSchedulers } from "../modules/scheduler/schedulerService.js";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client<true>) {
    logger.info(`Connecté en tant que ${client.user.tag}`);
    logger.info(`Serveurs actifs: ${client.guilds.cache.size}`);
    startDashboard(client);
    startSchedulers(client);
  }
};

export default event;

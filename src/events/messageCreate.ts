import { Events, type Message } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { handleAutomodMessage } from "../modules/automod/automodService.js";
import { logger } from "../utils/logger.js";

const event: BotEvent = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    await handleAutomodMessage(message).catch((error) => logger.error("Erreur automod", error));
  }
};

export default event;

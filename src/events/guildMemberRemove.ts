import { Events, type GuildMember, type PartialGuildMember } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { handleLeave } from "../modules/welcome/welcomeService.js";
import { logger } from "../utils/logger.js";

const event: BotEvent = {
  name: Events.GuildMemberRemove,
  async execute(member: GuildMember | PartialGuildMember) {
    await handleLeave(member).catch((error) => logger.error("Erreur leave", error));
  }
};

export default event;

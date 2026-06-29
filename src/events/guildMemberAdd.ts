import { Events, type GuildMember } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { handleWelcome } from "../modules/welcome/welcomeService.js";
import { logger } from "../utils/logger.js";
import { handleAntiRaidJoin } from "../modules/security/antiRaidService.js";

const event: BotEvent = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    await handleAntiRaidJoin(member).catch((error) => logger.error("Erreur antiraid", error));
    await handleWelcome(member).catch((error) => logger.error("Erreur welcome", error));
  }
};

export default event;

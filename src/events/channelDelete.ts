import { AuditLogEvent, Events, type GuildChannel } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { handleAntiNukeAction } from "../modules/security/antiNukeService.js";

const event: BotEvent = {
  name: Events.ChannelDelete,
  async execute(channel: GuildChannel) {
    await handleAntiNukeAction(channel.guild, AuditLogEvent.ChannelDelete, "suppression salon");
  }
};

export default event;

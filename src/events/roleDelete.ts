import { AuditLogEvent, Events, type Role } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { handleAntiNukeAction } from "../modules/security/antiNukeService.js";

const event: BotEvent = {
  name: Events.GuildRoleDelete,
  async execute(role: Role) {
    await handleAntiNukeAction(role.guild, AuditLogEvent.RoleDelete, "suppression rôle");
  }
};

export default event;

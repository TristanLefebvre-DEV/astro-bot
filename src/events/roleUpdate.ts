import { Events, type Role } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { handleProtectedRoleUpdate } from "../modules/security/roleProtectService.js";

const event: BotEvent = {
  name: Events.GuildRoleUpdate,
  async execute(oldRole: Role, newRole: Role) {
    await handleProtectedRoleUpdate(oldRole, newRole);
  }
};

export default event;

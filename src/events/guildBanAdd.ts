import { Events, type GuildBan } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { sendGuildLog } from "../modules/logs/logService.js";
import { embeds } from "../utils/embeds.js";

const event: BotEvent = {
  name: Events.GuildBanAdd,
  async execute(ban: GuildBan) {
    await sendGuildLog(
      ban.guild,
      "moderation",
      embeds.moderation({
        title: "Ban ajouté",
        description: `${ban.user.tag} (${ban.user.id}) a été banni.`,
        guild: ban.guild,
        user: ban.user
      })
    );
  }
};

export default event;

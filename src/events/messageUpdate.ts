import { Events, type Message, type PartialMessage } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { sendGuildLog } from "../modules/logs/logService.js";
import { embeds } from "../utils/embeds.js";
import { redactSensitiveContent } from "../utils/redaction.js";

const event: BotEvent = {
  name: Events.MessageUpdate,
  async execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (!oldMessage.content && !newMessage.content) return;
    if (oldMessage.content === newMessage.content) return;

    await sendGuildLog(
      newMessage.guild,
      "message",
      embeds.logs({
        title: "Message modifié",
        description: [
          `Auteur: ${newMessage.author?.tag ?? "inconnu"} (${newMessage.author?.id ?? "n/a"})`,
          `Salon: ${newMessage.channel}`,
          `Avant: ${redactSensitiveContent(oldMessage.content ?? "").slice(0, 400) || "n/a"}`,
          `Après: ${redactSensitiveContent(newMessage.content ?? "").slice(0, 400) || "n/a"}`
        ].join("\n"),
        guild: newMessage.guild,
        user: newMessage.author ?? undefined
      })
    );
  }
};

export default event;

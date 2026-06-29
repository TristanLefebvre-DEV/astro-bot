import { Events, type Message, type PartialMessage } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { sendGuildLog } from "../modules/logs/logService.js";
import { embeds } from "../utils/embeds.js";
import { redactSensitiveContent } from "../utils/redaction.js";

const event: BotEvent = {
  name: Events.MessageDelete,
  async execute(message: Message | PartialMessage) {
    if (!message.guild || message.author?.bot) return;
    await sendGuildLog(
      message.guild,
      "message",
      embeds.logs({
        title: "Message supprimé",
        description: [`Auteur: ${message.author?.tag ?? "inconnu"} (${message.author?.id ?? "n/a"})`, `Salon: ${message.channel}`, `Contenu: ${redactSensitiveContent(message.content ?? "").slice(0, 900) || "non disponible"}`].join("\n"),
        guild: message.guild,
        user: message.author ?? undefined
      })
    );
  }
};

export default event;

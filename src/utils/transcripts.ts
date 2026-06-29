import type { Message } from "discord.js";
import { redactSensitiveContent } from "./redaction.js";

export function renderMessagesTranscript(messages: Message[]): string {
  return messages
    .map((message) => {
      const createdAt = message.createdAt.toISOString();
      const author = `${message.author.tag} (${message.author.id})`;
      return `[${createdAt}] ${author}: ${redactSensitiveContent(message.content)}`;
    })
    .join("\n");
}

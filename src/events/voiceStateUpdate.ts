import { Events, type VoiceState } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { sendGuildLog } from "../modules/logs/logService.js";
import { embeds } from "../utils/embeds.js";

const event: BotEvent = {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    const member = newState.member ?? oldState.member;
    if (!member || oldState.channelId === newState.channelId) return;
    await sendGuildLog(
      newState.guild,
      "voice",
      embeds.logs({
        title: "Vocal",
        description: [`Membre: ${member.user.tag}`, `Avant: ${oldState.channel ? oldState.channel.name : "aucun"}`, `Après: ${newState.channel ? newState.channel.name : "aucun"}`].join("\n"),
        guild: newState.guild,
        user: member.user
      })
    );
  }
};

export default event;

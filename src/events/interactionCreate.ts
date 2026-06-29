import { Events, type Client, type Interaction } from "discord.js";
import type { BotEvent } from "../handlers/eventHandler.js";
import { handleInteraction } from "../handlers/interactionHandler.js";

const event: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.client.isReady()) return;
    await handleInteraction(interaction.client as Client<true>, interaction);
  }
};

export default event;

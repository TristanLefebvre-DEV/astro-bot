import type { Model } from "mongoose";
import { GuildConfig } from "../../database/models/index.js";
import { defaultGuildConfig } from "../../config/defaultConfig.js";

export async function getOrCreateGuildConfig(guildId: string): Promise<any> {
  return (GuildConfig as Model<any>).findOneAndUpdate(
    { guildId },
    { $setOnInsert: { guildId, ...defaultGuildConfig } },
    { upsert: true, new: true }
  );
}

export async function updateGuildConfig(guildId: string, update: Record<string, unknown>): Promise<void> {
  await (GuildConfig as Model<any>).findOneAndUpdate(
    { guildId },
    { ...update, $setOnInsert: { guildId, ...defaultGuildConfig } },
    { upsert: true }
  );
}

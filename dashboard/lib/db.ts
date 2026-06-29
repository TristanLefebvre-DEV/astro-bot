import mongoose, { Schema, type Model } from "mongoose";
import { env } from "./env";

declare global {
  var astroDashboardMongoose: Promise<typeof mongoose> | undefined;
}

const baseTimestamps = {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const mixedObject = { type: Schema.Types.Mixed, default: {} };

const GuildConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    language: { type: String, default: "fr" },
    timezone: { type: String, default: "Europe/Paris" },
    logs: mixedObject,
    moderation: mixedObject,
    tickets: mixedObject,
    antiraid: mixedObject,
    antinuke: mixedObject,
    verification: mixedObject,
    welcome: mixedObject,
    leave: mixedObject,
    giveaways: mixedObject,
    tempvoice: mixedObject,
    roles: mixedObject,
    phishing: mixedObject,
    scam: mixedObject,
    backup: mixedObject,
    maintenance: mixedObject,
    announcements: mixedObject,
    dashboard: mixedObject,
    automod: mixedObject,
    privacy: mixedObject,
    risk: mixedObject
  },
  baseTimestamps
);

const PanelSchema = new Schema(
  {
    guildId: String,
    panelId: String,
    type: String,
    name: String,
    title: String,
    description: String,
    enabled: Boolean,
    channelId: String,
    messageId: String
  },
  baseTimestamps
);

const TicketSchema = new Schema(
  {
    guildId: String,
    channelId: String,
    ownerId: String,
    type: String,
    claimedBy: String,
    status: String,
    transcriptUrl: String,
    closedAt: Date
  },
  baseTimestamps
);

const ModerationCaseSchema = new Schema(
  {
    guildId: String,
    caseId: Number,
    type: String,
    userId: String,
    moderatorId: String,
    reason: String,
    status: String
  },
  baseTimestamps
);

export async function connectDatabase(): Promise<typeof mongoose> {
  globalThis.astroDashboardMongoose ??= mongoose.connect(env.DATABASE_URL, {
    bufferCommands: false
  });
  return globalThis.astroDashboardMongoose;
}

export function modelFor<T = any>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}

export async function models() {
  await connectDatabase();
  return {
    GuildConfig: modelFor("GuildConfig", GuildConfigSchema),
    Panel: modelFor("Panel", PanelSchema),
    Ticket: modelFor("Ticket", TicketSchema),
    ModerationCase: modelFor("ModerationCase", ModerationCaseSchema)
  };
}

export async function getOrCreateGuildConfig(guildId: string) {
  const { GuildConfig } = await models();
  return GuildConfig.findOneAndUpdate(
    { guildId },
    { $setOnInsert: { guildId, language: "fr", timezone: "Europe/Paris" } },
    { upsert: true, new: true }
  ).lean();
}

import { z } from "zod";

const looseObject = z.record(z.string(), z.unknown());

export const guildConfigPatchSchema = z
  .object({
    language: z.string().min(2).max(12).optional(),
    timezone: z.string().min(1).max(64).optional(),
    logs: looseObject.optional(),
    moderation: looseObject.optional(),
    tickets: looseObject.optional(),
    antiraid: looseObject.optional(),
    antinuke: looseObject.optional(),
    verification: looseObject.optional(),
    welcome: looseObject.optional(),
    leave: looseObject.optional(),
    giveaways: looseObject.optional(),
    tempvoice: looseObject.optional(),
    roles: looseObject.optional(),
    phishing: looseObject.optional(),
    scam: looseObject.optional(),
    backup: looseObject.optional(),
    maintenance: looseObject.optional(),
    announcements: looseObject.optional(),
    dashboard: looseObject.optional(),
    automod: looseObject.optional(),
    privacy: looseObject.optional(),
    risk: looseObject.optional()
  })
  .strict();

import { z } from "zod";

export const snowflakeSchema = z.string().regex(/^\d{17,20}$/);

export const serverTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  roles: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
        permissions: z.array(z.string().min(1).max(64)).max(64).optional()
      })
    )
    .max(50)
    .optional(),
  categories: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        channels: z
          .array(
            z.object({
              name: z.string().min(1).max(100),
              type: z.enum(["text", "voice"])
            })
          )
          .max(20)
          .optional()
      })
    )
    .max(20)
    .optional()
});

export type ValidatedServerTemplate = z.infer<typeof serverTemplateSchema>;

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

export type ValidatedGuildConfigPatch = z.infer<typeof guildConfigPatchSchema>;

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");
}

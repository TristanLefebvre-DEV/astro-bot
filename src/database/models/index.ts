import mongoose from "mongoose";
import { defaultGuildConfig } from "../../config/defaultConfig.js";

const { Schema, model, models } = mongoose;

const stringArray = { type: [String], default: [] };
const mixedObject = { type: Schema.Types.Mixed, default: {} };

const baseTimestamps = {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const GuildConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    language: { type: String, default: defaultGuildConfig.language },
    timezone: { type: String, default: defaultGuildConfig.timezone },
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

const ModerationCaseSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    caseId: { type: Number, required: true },
    type: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true, index: true },
    reason: { type: String, default: "Aucune raison fournie" },
    proof: mixedObject,
    duration: { type: Number, default: null },
    expiresAt: { type: Date, default: null, index: true },
    active: { type: Boolean, default: true },
    status: { type: String, default: "open", index: true },
    notes: { type: [String], default: [] }
  },
  baseTimestamps
);
ModerationCaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });

const WarnSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    warnId: { type: Number, required: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    deleted: { type: Boolean, default: false },
    deletedBy: { type: String, default: null },
    deletedAt: { type: Date, default: null }
  },
  baseTimestamps
);
WarnSchema.index({ guildId: 1, warnId: 1 }, { unique: true });

const MuteSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, default: null },
    roleId: { type: String, default: null },
    expiresAt: { type: Date, default: null, index: true },
    active: { type: Boolean, default: true }
  },
  baseTimestamps
);

const TempBanSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, default: null },
    expiresAt: { type: Date, required: true, index: true },
    active: { type: Boolean, default: true }
  },
  baseTimestamps
);

const TicketSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    type: { type: String, default: "general" },
    claimedBy: { type: String, default: null },
    status: { type: String, default: "open", index: true },
    transcriptUrl: { type: String, default: null },
    transcriptContent: { type: String, default: null },
    closedAt: { type: Date, default: null }
  },
  baseTimestamps
);

const GiveawaySchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    messageId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    prize: { type: String, required: true },
    winners: { type: Number, default: 1 },
    endsAt: { type: Date, required: true, index: true },
    participants: stringArray,
    ended: { type: Boolean, default: false }
  },
  baseTimestamps
);

const TempVoiceSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true }
  },
  baseTimestamps
);

const BackupSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    backupId: { type: String, required: true },
    name: { type: String, required: true },
    data: mixedObject,
    createdBy: { type: String, required: true }
  },
  baseTimestamps
);
BackupSchema.index({ guildId: 1, backupId: 1 }, { unique: true });

const MaintenanceConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    categoryId: { type: String, default: null },
    staffRoles: stringArray,
    whitelistedRoles: stringArray,
    whitelistedUsers: stringArray,
    message: { type: String, default: "Le serveur est temporairement en maintenance." },
    deleteChannelOnDisable: { type: Boolean, default: false },
    allowMembersToTalk: { type: Boolean, default: false },
    startedAt: { type: Date, default: null },
    startedBy: { type: String, default: null },
    reason: { type: String, default: null },
    estimatedEnd: { type: Date, default: null },
    savedPermissions: mixedObject
  },
  baseTimestamps
);

const AntiNukeConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    maxBans: { type: Number, default: 3 },
    maxBansDuration: { type: Number, default: 60 },
    maxKicks: { type: Number, default: 3 },
    maxKicksDuration: { type: Number, default: 60 },
    maxChannels: { type: Number, default: 3 },
    maxChannelsDuration: { type: Number, default: 60 },
    maxRoles: { type: Number, default: 3 },
    maxRolesDuration: { type: Number, default: 60 },
    punishment: { type: String, default: "quarantine" },
    panicOnCritical: { type: Boolean, default: true },
    whitelistedUsers: stringArray,
    whitelistedRoles: stringArray,
    savedPermissions: mixedObject,
    logsChannelId: { type: String, default: null }
  },
  baseTimestamps
);

const RoleProtectionConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    protectedRoles: stringArray,
    whitelistedUsers: stringArray,
    whitelistedRoles: stringArray,
    dangerousPermissions: stringArray,
    punishment: { type: String, default: "quarantine" },
    logsChannelId: { type: String, default: null },
    autoRollback: { type: Boolean, default: true },
    panicOnCriticalAction: { type: Boolean, default: true }
  },
  baseTimestamps
);

const AnnouncementSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    announcementId: { type: String, required: true },
    channelId: { type: String, default: null },
    createdBy: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    color: { type: String, default: "#5865F2" },
    image: { type: String, default: null },
    thumbnail: { type: String, default: null },
    footer: { type: String, default: null },
    author: mixedObject,
    fields: { type: [Schema.Types.Mixed], default: [] },
    mentionRoleId: { type: String, default: null },
    mentionEveryone: { type: Boolean, default: false },
    buttons: { type: [Schema.Types.Mixed], default: [] },
    scheduledAt: { type: Date, default: null, index: true },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date, default: null }
  },
  baseTimestamps
);
AnnouncementSchema.index({ guildId: 1, announcementId: 1 }, { unique: true });

const ScamConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    scamWords: stringArray,
    blockedDomains: stringArray,
    allowedDomains: stringArray,
    antiWebhook: { type: Boolean, default: false },
    punishments: mixedObject,
    logsChannelId: { type: String, default: null },
    ignoredRoles: stringArray,
    ignoredChannels: stringArray
  },
  baseTimestamps
);

const PhishingLogSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    url: { type: String, required: true },
    riskScore: { type: Number, default: 0 },
    reasons: stringArray,
    actionTaken: { type: String, default: "none" }
  },
  baseTimestamps
);

const AutoModConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    blockedWords: stringArray,
    regexFilters: stringArray,
    antiSpam: mixedObject,
    antiLinks: mixedObject,
    antiInvites: mixedObject,
    antiCaps: mixedObject,
    antiEmoji: mixedObject,
    antiMention: mixedObject,
    mentionLimit: { type: Number, default: 6 },
    punishments: mixedObject,
    ignoredRoles: stringArray,
    ignoredChannels: stringArray,
    bypassUsers: stringArray
  },
  baseTimestamps
);

const EvidenceSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    evidenceId: { type: String, required: true },
    caseId: { type: Number, default: null, index: true },
    userId: { type: String, required: true, index: true },
    savedBy: { type: String, required: true },
    messageId: { type: String, default: null },
    channelId: { type: String, default: null },
    contentRedacted: { type: String, default: null },
    attachmentsMetadata: { type: [Schema.Types.Mixed], default: [] },
    jumpUrl: { type: String, default: null }
  },
  baseTimestamps
);
EvidenceSchema.index({ guildId: 1, evidenceId: 1 }, { unique: true });

const IncidentSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    incidentId: { type: String, required: true },
    name: { type: String, required: true },
    createdBy: { type: String, required: true },
    status: { type: String, default: "open", index: true },
    caseIds: { type: [Number], default: [] },
    userIds: stringArray,
    notes: { type: [String], default: [] },
    closedAt: { type: Date, default: null }
  },
  baseTimestamps
);
IncidentSchema.index({ guildId: 1, incidentId: 1 }, { unique: true });

const RiskProfileSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    riskScore: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100 },
    reasons: stringArray,
    flags: stringArray,
    linkedUsers: stringArray,
    lastCalculatedAt: { type: Date, default: null }
  },
  baseTimestamps
);
RiskProfileSchema.index({ guildId: 1, userId: 1 }, { unique: true });

const StaffAuditLogSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true, index: true },
    actionType: { type: String, required: true, index: true },
    targetId: { type: String, default: null, index: true },
    reason: { type: String, default: null },
    caseId: { type: Number, default: null }
  },
  baseTimestamps
);

const StaffRestrictionSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    staffId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    restrictedBy: { type: String, required: true },
    reason: { type: String, default: null },
    expiresAt: { type: Date, default: null, index: true },
    savedRoles: stringArray,
    active: { type: Boolean, default: true }
  },
  baseTimestamps
);

const TwoManApprovalSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    approvalId: { type: String, required: true },
    actionType: { type: String, required: true },
    requestedBy: { type: String, required: true },
    targetId: { type: String, default: null },
    caseId: { type: Number, default: null },
    status: { type: String, default: "pending", index: true },
    approvedBy: stringArray,
    deniedBy: stringArray
  },
  baseTimestamps
);
TwoManApprovalSchema.index({ guildId: 1, approvalId: 1 }, { unique: true });

const UserRestrictionSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, default: null },
    expiresAt: { type: Date, default: null, index: true },
    active: { type: Boolean, default: true }
  },
  baseTimestamps
);

const MediaSecurityConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    mediaScanEnabled: { type: Boolean, default: false },
    blockedExtensions: stringArray,
    blockedHashes: stringArray,
    nsfwFilterEnabled: { type: Boolean, default: false },
    goreFilterEnabled: { type: Boolean, default: false },
    imageQuarantineEnabled: { type: Boolean, default: false },
    newbieAccountAgeLimit: { type: Number, default: 604800 },
    reviewChannelId: { type: String, default: null },
    logsChannelId: { type: String, default: null }
  },
  baseTimestamps
);

const ModWatchSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    addedBy: { type: String, required: true },
    reason: { type: String, default: null },
    alerts: { type: [Schema.Types.Mixed], default: [] },
    active: { type: Boolean, default: true }
  },
  baseTimestamps
);
ModWatchSchema.index({ guildId: 1, userId: 1 }, { unique: true });

const PrivacyProtectionConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    doxFilterEnabled: { type: Boolean, default: false },
    sensitiveScanEnabled: { type: Boolean, default: false },
    victimProtectionEnabled: { type: Boolean, default: false },
    logsChannelId: { type: String, default: null },
    redactByDefault: { type: Boolean, default: true },
    punishment: mixedObject
  },
  baseTimestamps
);

const PanelSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    panelId: { type: String, required: true },
    type: { type: String, required: true, index: true },
    name: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    color: { type: String, default: "#5865F2" },
    image: { type: String, default: null },
    thumbnail: { type: String, default: null },
    footer: { type: String, default: null },
    emoji: { type: String, default: null },
    style: { type: String, default: "premium" },
    channelId: { type: String, default: null, index: true },
    messageId: { type: String, default: null, index: true },
    buttons: { type: [Schema.Types.Mixed], default: [] },
    selectMenus: { type: [Schema.Types.Mixed], default: [] },
    actions: { type: [Schema.Types.Mixed], default: [] },
    permissions: {
      allowedRoles: stringArray,
      allowedUsers: stringArray,
      ephemeralResponses: { type: Boolean, default: true }
    },
    createdBy: { type: String, required: true },
    enabled: { type: Boolean, default: true, index: true }
  },
  baseTimestamps
);
PanelSchema.index({ guildId: 1, panelId: 1 }, { unique: true });

export const GuildConfig = models.GuildConfig ?? model("GuildConfig", GuildConfigSchema);
export const ModerationCase = models.ModerationCase ?? model("ModerationCase", ModerationCaseSchema);
export const Warn = models.Warn ?? model("Warn", WarnSchema);
export const Mute = models.Mute ?? model("Mute", MuteSchema);
export const TempBan = models.TempBan ?? model("TempBan", TempBanSchema);
export const Ticket = models.Ticket ?? model("Ticket", TicketSchema);
export const Giveaway = models.Giveaway ?? model("Giveaway", GiveawaySchema);
export const TempVoice = models.TempVoice ?? model("TempVoice", TempVoiceSchema);
export const Backup = models.Backup ?? model("Backup", BackupSchema);
export const MaintenanceConfig = models.MaintenanceConfig ?? model("MaintenanceConfig", MaintenanceConfigSchema);
export const AntiNukeConfig = models.AntiNukeConfig ?? model("AntiNukeConfig", AntiNukeConfigSchema);
export const RoleProtectionConfig =
  models.RoleProtectionConfig ?? model("RoleProtectionConfig", RoleProtectionConfigSchema);
export const Announcement = models.Announcement ?? model("Announcement", AnnouncementSchema);
export const ScamConfig = models.ScamConfig ?? model("ScamConfig", ScamConfigSchema);
export const PhishingLog = models.PhishingLog ?? model("PhishingLog", PhishingLogSchema);
export const AutoModConfig = models.AutoModConfig ?? model("AutoModConfig", AutoModConfigSchema);
export const Evidence = models.Evidence ?? model("Evidence", EvidenceSchema);
export const Incident = models.Incident ?? model("Incident", IncidentSchema);
export const RiskProfile = models.RiskProfile ?? model("RiskProfile", RiskProfileSchema);
export const StaffAuditLog = models.StaffAuditLog ?? model("StaffAuditLog", StaffAuditLogSchema);
export const StaffRestriction = models.StaffRestriction ?? model("StaffRestriction", StaffRestrictionSchema);
export const TwoManApproval = models.TwoManApproval ?? model("TwoManApproval", TwoManApprovalSchema);
export const UserRestriction = models.UserRestriction ?? model("UserRestriction", UserRestrictionSchema);
export const MediaSecurityConfig =
  models.MediaSecurityConfig ?? model("MediaSecurityConfig", MediaSecurityConfigSchema);
export const ModWatch = models.ModWatch ?? model("ModWatch", ModWatchSchema);
export const PrivacyProtectionConfig =
  models.PrivacyProtectionConfig ?? model("PrivacyProtectionConfig", PrivacyProtectionConfigSchema);
export const Panel = models.Panel ?? model("Panel", PanelSchema);

export const defaultGuildConfig = {
  language: "fr",
  timezone: "Europe/Paris",
  logs: {
    enabled: false,
    moderationChannelId: null,
    securityChannelId: null,
    messageChannelId: null,
    memberChannelId: null,
    voiceChannelId: null
  },
  moderation: {
    enabled: true,
    modRoleIds: [],
    muteRoleId: null,
    quarantineRoleId: null,
    confirmDangerousActions: true
  },
  tickets: {
    enabled: false,
    categoryId: null,
    logsChannelId: null,
    supportRoleIds: [],
    cooldownSeconds: 300
  },
  antiraid: { enabled: false, panicMode: false, whitelistedUsers: [], whitelistedRoles: [] },
  antinuke: { enabled: false, whitelistedUsers: [], whitelistedRoles: [] },
  verification: { enabled: false, roleId: null, channelId: null },
  automod: { enabled: false, ignoredRoles: [], ignoredChannels: [], bypassUsers: [] },
  dashboard: { enabled: false },
  privacy: { redactByDefault: true },
  risk: { enabled: true, humanReviewRequired: true }
} as const;

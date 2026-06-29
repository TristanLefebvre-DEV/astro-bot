# Modèles MongoDB

Tous les modèles serveur contiennent `guildId` et des index adaptés.

- GuildConfig
- ModerationCase
- Warn
- Mute
- TempBan
- Ticket
- Giveaway
- TempVoice
- Backup
- MaintenanceConfig
- AntiNukeConfig
- RoleProtectionConfig
- Announcement
- ScamConfig
- PhishingLog
- AutoModConfig
- Evidence
- Incident
- RiskProfile
- StaffAuditLog
- StaffRestriction
- TwoManApproval
- UserRestriction
- MediaSecurityConfig
- ModWatch
- PrivacyProtectionConfig

Les schémas Mongoose sont centralisés dans `src/database/models/index.ts` pour le socle. Ils pourront être séparés par fichier quand chaque module grossira.

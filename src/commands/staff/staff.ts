import { createGenericCommandGroup, manageGuild } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "staff",
  description: "Staff audit, anti-abus et outils internes.",
  category: "moderation",
  userPermissions: manageGuild,
  subcommands: [
    { name: "audit", description: "Audit permissions staff." },
    { name: "risk", description: "Risque staff." },
    { name: "actions", description: "Actions récentes staff.", options: ["user"] },
    { name: "abusereport", description: "Reporter abus modo.", options: ["user", "reason"] },
    { name: "cooldown", description: "Limiter un modo.", options: ["user", "duration"] },
    { name: "suspend", description: "Suspendre modo.", options: ["user", "reason"], dangerous: true },
    { name: "restore", description: "Restaurer modo.", options: ["user"], dangerous: true },
    { name: "twomanon", description: "Activer double validation." },
    { name: "twomanoff", description: "Désactiver double validation.", dangerous: true },
    { name: "approveban", description: "Approuver ban sensible.", options: ["text"] },
    { name: "denyban", description: "Refuser ban sensible.", options: ["text"] },
    { name: "lock", description: "Stafflock urgence.", dangerous: true },
    { name: "verify", description: "Vérifier staff.", options: ["user"] },
    { name: "notes", description: "Notes staff.", options: ["user", "text"] },
    { name: "permissiondiff", description: "Diff permissions rôle.", options: ["role"] },
    { name: "poll", description: "Vote modo.", options: ["text"] },
    { name: "chat", description: "Message staffchat.", options: ["text"] },
    { name: "alert", description: "Alerte staff.", options: ["text"] },
    { name: "modmailreply", description: "Réponse modmail.", options: ["text"] },
    { name: "anonymousreport", description: "Signalement anonyme.", options: ["text"] },
    { name: "suggestapprove", description: "Approuver suggestion.", options: ["text"] },
    { name: "suggestdeny", description: "Refuser suggestion.", options: ["text"] },
    { name: "rulessend", description: "Envoyer règlement.", options: ["channel"] },
    { name: "rulesupdate", description: "Modifier règlement.", options: ["text"] }
  ]
});

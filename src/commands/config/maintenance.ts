import { createGenericCommandGroup, manageGuild } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "maintenance",
  description: "Mode maintenance serveur.",
  category: "config",
  userPermissions: manageGuild,
  subcommands: [
    { name: "enable", description: "Activer maintenance.", options: ["reason"], dangerous: true },
    { name: "disable", description: "Désactiver maintenance.", options: ["reason"], dangerous: true },
    { name: "status", description: "Statut maintenance." },
    { name: "config", description: "Configurer maintenance.", options: ["text"] },
    { name: "message", description: "Modifier message maintenance.", options: ["text"] },
    { name: "whitelistadd", description: "Ajouter membre whitelist.", options: ["user"] },
    { name: "whitelistremove", description: "Retirer membre whitelist.", options: ["user"] },
    { name: "roleadd", description: "Ajouter rôle whitelist.", options: ["role"] },
    { name: "roleremove", description: "Retirer rôle whitelist.", options: ["role"] },
    { name: "forcedisable", description: "Forcer désactivation.", dangerous: true }
  ]
});

import { createGenericCommandGroup, manageGuild } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "logs",
  description: "Logs serveur par type d'événement.",
  category: "config",
  userPermissions: manageGuild,
  subcommands: [
    { name: "setup", description: "Configurer logs.", options: ["channel"] },
    { name: "config", description: "Voir config logs." },
    { name: "enable", description: "Activer type de logs.", options: ["text", "channel"] },
    { name: "disable", description: "Désactiver type de logs.", options: ["text"], dangerous: true },
    { name: "messages", description: "Logs messages.", options: ["channel"] },
    { name: "members", description: "Logs membres.", options: ["channel"] },
    { name: "voice", description: "Logs vocaux.", options: ["channel"] },
    { name: "roles", description: "Logs rôles.", options: ["channel"] },
    { name: "channels", description: "Logs salons.", options: ["channel"] },
    { name: "security", description: "Logs sécurité.", options: ["channel"] }
  ]
});

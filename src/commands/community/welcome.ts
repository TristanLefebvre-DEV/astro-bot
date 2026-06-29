import { createGenericCommandGroup, manageGuild } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "welcome",
  description: "Bienvenue et départ.",
  category: "config",
  userPermissions: manageGuild,
  subcommands: [
    { name: "enable", description: "Activer bienvenue.", options: ["channel"] },
    { name: "disable", description: "Désactiver bienvenue.", dangerous: true },
    { name: "channel", description: "Définir salon bienvenue.", options: ["channel"] },
    { name: "message", description: "Définir message bienvenue.", options: ["text"] },
    { name: "embed", description: "Configurer embed bienvenue.", options: ["text"] },
    { name: "test", description: "Tester bienvenue." },
    { name: "leaveenable", description: "Activer message départ.", options: ["channel"] },
    { name: "leavedisable", description: "Désactiver message départ.", dangerous: true },
    { name: "leavemessage", description: "Définir message départ.", options: ["text"] },
    { name: "autorole", description: "Définir autorole.", options: ["role"] }
  ]
});

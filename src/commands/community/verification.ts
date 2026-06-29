import { createGenericCommandGroup, manageGuild } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "verification",
  description: "Système de vérification.",
  category: "config",
  userPermissions: manageGuild,
  subcommands: [
    { name: "setup", description: "Configurer la vérification.", options: ["role", "channel"] },
    { name: "enable", description: "Activer vérification." },
    { name: "disable", description: "Désactiver vérification.", dangerous: true },
    { name: "panel", description: "Créer/afficher panel vérification." },
    { name: "roleset", description: "Définir rôle vérifié.", options: ["role"] },
    { name: "logs", description: "Définir salon logs.", options: ["channel"] },
    { name: "config", description: "Voir config vérification." },
    { name: "verify", description: "Vérifier un membre.", options: ["user"] },
    { name: "unverify", description: "Retirer vérification.", options: ["user"], dangerous: true }
  ]
});

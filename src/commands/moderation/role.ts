import { createGenericCommandGroup, manageRoles } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "role",
  description: "Gestion des rôles et pseudos.",
  category: "moderation",
  userPermissions: manageRoles,
  botPermissions: manageRoles,
  subcommands: [
    { name: "add", description: "Ajouter un rôle à un membre.", options: ["user", "role", "reason"] },
    { name: "remove", description: "Retirer un rôle à un membre.", options: ["user", "role", "reason"] },
    { name: "nickname", description: "Changer le pseudo d'un membre.", options: ["user", "text", "reason"] },
    { name: "resetnick", description: "Réinitialiser le pseudo.", options: ["user", "reason"] },
    { name: "autorole", description: "Configurer l'autorole.", options: ["role"] },
    { name: "autoroleoff", description: "Désactiver l'autorole." },
    { name: "massadd", description: "Ajouter un rôle en masse.", options: ["role", "reason"], dangerous: true },
    { name: "massremove", description: "Retirer un rôle en masse.", options: ["role", "reason"], dangerous: true }
  ]
});

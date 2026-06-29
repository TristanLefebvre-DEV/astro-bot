import { createGenericCommandGroup, manageRoles } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "roles",
  description: "Rôles par boutons et menus.",
  category: "config",
  userPermissions: manageRoles,
  botPermissions: manageRoles,
  subcommands: [
    { name: "panelcreate", description: "Créer panel rôles." },
    { name: "paneledit", description: "Modifier panel rôles.", options: ["text"] },
    { name: "paneldelete", description: "Supprimer panel rôles.", options: ["text"], dangerous: true },
    { name: "panelsend", description: "Envoyer panel rôles.", options: ["channel"] },
    { name: "add", description: "Ajouter rôle au panel.", options: ["role"] },
    { name: "remove", description: "Retirer rôle du panel.", options: ["role"] },
    { name: "config", description: "Configurer rôles boutons.", options: ["text"] },
    { name: "exclusive", description: "Définir exclusivité.", options: ["text"] },
    { name: "stackable", description: "Définir cumulable.", options: ["text"] }
  ]
});

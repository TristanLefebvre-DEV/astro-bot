import { createGenericCommandGroup, manageGuild } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "announce",
  description: "Annonces avancées.",
  category: "utility",
  userPermissions: manageGuild,
  subcommands: [
    { name: "create", description: "Créer annonce.", options: ["text"] },
    { name: "embed", description: "Constructeur embed annonce.", options: ["text"] },
    { name: "preview", description: "Prévisualiser annonce.", options: ["text"] },
    { name: "send", description: "Envoyer annonce.", options: ["channel", "text"], dangerous: true },
    { name: "schedule", description: "Programmer annonce.", options: ["channel", "duration", "text"] },
    { name: "edit", description: "Modifier annonce.", options: ["text"] },
    { name: "delete", description: "Supprimer annonce.", options: ["text"], dangerous: true },
    { name: "list", description: "Lister annonces." },
    { name: "config", description: "Configurer annonces.", options: ["text"] },
    { name: "message", description: "Annonce rapide.", options: ["channel", "text"], dangerous: true }
  ]
});

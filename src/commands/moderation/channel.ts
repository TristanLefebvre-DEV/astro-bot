import { createGenericCommandGroup, manageChannels } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "channel",
  description: "Gestion des salons et lockdown.",
  category: "moderation",
  userPermissions: manageChannels,
  botPermissions: manageChannels,
  subcommands: [
    { name: "slowmode", description: "Activer le mode lent.", options: ["channel", "duration", "reason"] },
    { name: "slowmodeoff", description: "Désactiver le mode lent.", options: ["channel", "reason"] },
    { name: "lock", description: "Verrouiller un salon.", options: ["channel", "reason"] },
    { name: "unlock", description: "Déverrouiller un salon.", options: ["channel", "reason"] },
    { name: "lockdown", description: "Verrouiller plusieurs salons.", options: ["reason"], dangerous: true },
    { name: "unlockdown", description: "Retirer le lockdown.", options: ["reason"], dangerous: true },
    { name: "hide", description: "Cacher un salon.", options: ["channel", "reason"] },
    { name: "unhide", description: "Rendre un salon visible.", options: ["channel", "reason"] },
    { name: "nuke", description: "Recréer un salon pour le vider.", options: ["channel", "reason"], dangerous: true },
    { name: "clone", description: "Cloner un salon.", options: ["channel", "reason"] },
    { name: "archive", description: "Archiver un salon.", options: ["channel", "reason"] },
    { name: "close", description: "Fermer un salon temporairement.", options: ["channel", "reason"] },
    { name: "reopen", description: "Rouvrir un salon.", options: ["channel", "reason"] }
  ]
});

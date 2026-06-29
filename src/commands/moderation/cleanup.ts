import { createGenericCommandGroup, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "purge",
  description: "Nettoyage avancé des messages.",
  category: "moderation",
  userPermissions: manageMessages,
  botPermissions: manageMessages,
  subcommands: [
    { name: "messages", description: "Supprimer plusieurs messages.", options: ["amount"], dangerous: true },
    { name: "user", description: "Supprimer les messages d'un utilisateur.", options: ["user", "amount"], dangerous: true },
    { name: "bots", description: "Supprimer les messages de bots.", options: ["amount"], dangerous: true },
    { name: "links", description: "Supprimer les messages contenant des liens.", options: ["amount"], dangerous: true },
    { name: "invites", description: "Supprimer les invitations Discord.", options: ["amount"], dangerous: true },
    { name: "embeds", description: "Supprimer les messages avec embeds.", options: ["amount"], dangerous: true },
    { name: "attachments", description: "Supprimer les messages avec fichiers.", options: ["amount"], dangerous: true },
    { name: "after", description: "Supprimer après un message ID.", options: ["text"], dangerous: true },
    { name: "before", description: "Supprimer avant un message ID.", options: ["text"], dangerous: true },
    { name: "between", description: "Supprimer entre deux IDs.", options: ["text"], dangerous: true },
    { name: "reactions", description: "Nettoyer les réactions d'un message.", options: ["text"], dangerous: true },
    { name: "emojis", description: "Supprimer les messages avec trop d'emojis.", options: ["amount"], dangerous: true },
    { name: "caps", description: "Supprimer les messages en majuscules abusives.", options: ["amount"], dangerous: true },
    { name: "duplicates", description: "Supprimer les messages répétés.", options: ["amount"], dangerous: true }
  ]
});

import { createGenericCommandGroup, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "scam",
  description: "Anti-scam, anti-market et credentials.",
  category: "security",
  userPermissions: manageMessages,
  subcommands: [
    { name: "check", description: "Vérifier un contenu scam.", options: ["text"] },
    { name: "wordsadd", description: "Ajouter mot scam.", options: ["text"] },
    { name: "wordsremove", description: "Retirer mot scam.", options: ["text"] },
    { name: "wordslist", description: "Lister mots scam." },
    { name: "massdel", description: "Supprimer messages scam récents.", options: ["amount"], dangerous: true },
    { name: "dmraid", description: "Signaler un DM raid.", options: ["user", "reason"] },
    { name: "marketban", description: "Bannir pour marché noir.", options: ["user", "reason"], dangerous: true },
    { name: "uhqon", description: "Activer filtre UHQ." },
    { name: "uhqoff", description: "Désactiver filtre UHQ.", dangerous: true },
    { name: "uhqadd", description: "Ajouter terme UHQ.", options: ["text"] },
    { name: "uhqremove", description: "Retirer terme UHQ.", options: ["text"] },
    { name: "accountscan", description: "Scanner trade de comptes.", options: ["amount"] },
    { name: "accountpurge", description: "Purger trade comptes.", options: ["amount"], dangerous: true },
    { name: "credentialon", description: "Activer filtre credentials." },
    { name: "credentialoff", description: "Désactiver filtre credentials.", dangerous: true },
    { name: "leakreport", description: "Créer rapport leak.", options: ["text"] },
    { name: "leakpurge", description: "Purger leaks.", options: ["amount"], dangerous: true },
    { name: "blackmarketscan", description: "Scanner marché noir.", options: ["amount"] }
  ]
});

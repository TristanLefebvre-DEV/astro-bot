import { createGenericCommandGroup, manageGuild } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "automod",
  description: "Automodération avancée.",
  category: "security",
  userPermissions: manageGuild,
  subcommands: [
    { name: "status", description: "Voir l'état automod." },
    { name: "wordadd", description: "Ajouter un mot bloqué.", options: ["text"] },
    { name: "wordremove", description: "Retirer un mot bloqué.", options: ["text"] },
    { name: "wordslist", description: "Lister les mots bloqués." },
    { name: "spam", description: "Configurer anti-spam.", options: ["text"] },
    { name: "links", description: "Configurer anti-liens.", options: ["text"] },
    { name: "invites", description: "Configurer anti-invitations.", options: ["text"] },
    { name: "caps", description: "Configurer anti-caps.", options: ["amount"] },
    { name: "emoji", description: "Configurer anti-emoji.", options: ["amount"] },
    { name: "mentions", description: "Définir limite mentions.", options: ["amount"] },
    { name: "punish", description: "Définir punition.", options: ["text"] },
    { name: "threshold", description: "Définir seuil.", options: ["amount"] },
    { name: "exemptrole", description: "Exempter un rôle.", options: ["role"] },
    { name: "exemptchannel", description: "Exempter un salon.", options: ["channel"] },
    { name: "regexadd", description: "Ajouter regex.", options: ["text"] },
    { name: "regexremove", description: "Retirer regex.", options: ["text"] },
    { name: "regexlist", description: "Lister regex." },
    { name: "allowlink", description: "Autoriser domaine.", options: ["text"] },
    { name: "antibot", description: "Configurer anti-bot.", options: ["text"] },
    { name: "on", description: "Activer automod." },
    { name: "off", description: "Désactiver automod.", dangerous: true }
  ]
});

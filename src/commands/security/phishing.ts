import { createGenericCommandGroup, manageGuild, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "phishing",
  description: "Anti-phishing et domaines.",
  category: "security",
  userPermissions: manageMessages,
  subcommands: [
    { name: "enable", description: "Activer anti-phishing." },
    { name: "disable", description: "Désactiver anti-phishing.", dangerous: true },
    { name: "config", description: "Configurer anti-phishing.", options: ["text"] },
    { name: "test", description: "Tester un lien.", options: ["text"] },
    { name: "scamcheck", description: "Vérifier un texte/lien.", options: ["text"] },
    { name: "linkscan", description: "Scanner un lien.", options: ["text"] },
    { name: "domainadd", description: "Bloquer un domaine.", options: ["text"] },
    { name: "domainremove", description: "Débloquer un domaine.", options: ["text"] },
    { name: "domainlist", description: "Lister domaines bloqués." },
    { name: "invitecheck", description: "Vérifier une invitation.", options: ["text"] },
    { name: "antiwebhook", description: "Configurer anti-webhook.", options: ["text"] },
    { name: "webhooklist", description: "Lister webhooks." },
    { name: "deletewebhook", description: "Supprimer webhook.", options: ["text"], dangerous: true },
    { name: "logs", description: "Voir les logs phishing." }
  ]
});

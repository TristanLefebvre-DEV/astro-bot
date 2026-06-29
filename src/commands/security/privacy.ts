import { createGenericCommandGroup, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "privacy",
  description: "Anti-doxxing, confidentialité et protection victimes.",
  category: "security",
  userPermissions: manageMessages,
  botPermissions: manageMessages,
  subcommands: [
    { name: "doxon", description: "Activer dox filter." },
    { name: "doxoff", description: "Désactiver dox filter.", dangerous: true },
    { name: "doxtest", description: "Tester message sensible.", options: ["text"] },
    { name: "doxpurge", description: "Purger messages suspects.", options: ["amount"], dangerous: true },
    { name: "doxcase", description: "Créer dossier doxxing.", options: ["user"] },
    { name: "lock", description: "Privacy lock membre.", options: ["user"], dangerous: true },
    { name: "redact", description: "Supprimer et sauvegarder censuré.", options: ["text"], dangerous: true },
    { name: "sensitivescan", description: "Scanner messages récents.", options: ["amount"] },
    { name: "sensitivereport", description: "Rapport interne." },
    { name: "victimprotect", description: "Protéger victime.", options: ["user"] },
    { name: "nomention", description: "Bloquer mentions ciblées.", options: ["user", "duration"] }
  ]
});

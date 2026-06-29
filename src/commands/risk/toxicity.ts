import { createGenericCommandGroup, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "toxicity",
  description: "Toxicité, harcèlement et dogpile.",
  category: "security",
  userPermissions: manageMessages,
  subcommands: [
    { name: "user", description: "Voir toxicité récente.", options: ["user"] },
    { name: "scan", description: "Scanner derniers messages.", options: ["amount"] },
    { name: "insulton", description: "Activer filtre insultes." },
    { name: "insultoff", description: "Désactiver filtre insultes.", dangerous: true },
    { name: "sluron", description: "Activer filtre slurs." },
    { name: "sluroff", description: "Désactiver filtre slurs.", dangerous: true },
    { name: "harassment", description: "Détecter harcèlement.", options: ["user"] },
    { name: "targetprotect", description: "Protéger une cible.", options: ["user"] },
    { name: "dogpiledetect", description: "Détecter dogpile." },
    { name: "dogpilestop", description: "Stopper dogpile.", options: ["user"], dangerous: true },
    { name: "cooldown", description: "Limiter membre.", options: ["user", "duration"] },
    { name: "shadowflag", description: "Marquer suspect.", options: ["user", "reason"] },
    { name: "modwatch", description: "Surveiller membre.", options: ["user", "reason"] },
    { name: "watchlist", description: "Liste surveillance." },
    { name: "watchremove", description: "Retirer surveillance.", options: ["user"] },
    { name: "ragebait", description: "Scanner ragebait.", options: ["amount"] },
    { name: "conflict", description: "Voir conflit.", options: ["user", "target_user"] }
  ]
});

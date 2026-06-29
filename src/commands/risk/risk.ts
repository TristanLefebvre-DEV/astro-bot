import { createGenericCommandGroup, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "risk",
  description: "Risk score, trust score et comportement.",
  category: "security",
  userPermissions: manageMessages,
  subcommands: [
    { name: "trustscore", description: "Afficher score confiance.", options: ["user"] },
    { name: "score", description: "Afficher score risque.", options: ["user"] },
    { name: "list", description: "Lister membres suspects." },
    { name: "config", description: "Configurer critères risque.", options: ["text"] },
    { name: "activity", description: "Voir activité récente.", options: ["user"] },
    { name: "joinedrecently", description: "Membres arrivés récemment.", options: ["duration"] },
    { name: "inactive", description: "Membres inactifs.", options: ["duration"] },
    { name: "lurkers", description: "Membres qui ne parlent jamais." },
    { name: "suspiciousnames", description: "Pseudos suspects." },
    { name: "duplicates", description: "Comptes similaires." },
    { name: "avatarcheck", description: "Vérifier avatar.", options: ["user"] },
    { name: "namehistory", description: "Historique pseudos.", options: ["user"] },
    { name: "joinposition", description: "Position arrivée.", options: ["user"] },
    { name: "accountage", description: "Âge compte.", options: ["user"] },
    { name: "serverage", description: "Ancienneté serveur.", options: ["user"] },
    { name: "firstmessage", description: "Premier message.", options: ["user"] },
    { name: "lastmessages", description: "Derniers messages.", options: ["user", "amount"] },
    { name: "deletedmessages", description: "Messages supprimés.", options: ["user"] },
    { name: "nameflags", description: "Flags pseudo.", options: ["user"] },
    { name: "avatarflags", description: "Flags avatar.", options: ["user"] },
    { name: "altsuspect", description: "Suspicion alt.", options: ["user"] },
    { name: "similarusers", description: "Utilisateurs similaires.", options: ["user"] },
    { name: "freshaccounts", description: "Comptes récents.", options: ["duration"] }
  ]
});

import { createGenericCommandGroup, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "media",
  description: "Sécurité médias et fichiers.",
  category: "security",
  userPermissions: manageMessages,
  subcommands: [
    { name: "scanon", description: "Activer media scan." },
    { name: "scanoff", description: "Désactiver media scan.", dangerous: true },
    { name: "fileblock", description: "Bloquer extension.", options: ["text"] },
    { name: "fileunblock", description: "Débloquer extension.", options: ["text"] },
    { name: "filelist", description: "Lister extensions bloquées." },
    { name: "attachmentrisk", description: "Analyser pièce jointe.", options: ["text"] },
    { name: "quarantineon", description: "Activer quarantaine images." },
    { name: "quarantineoff", description: "Désactiver quarantaine images.", dangerous: true },
    { name: "nsfwon", description: "Activer filtre NSFW." },
    { name: "nsfwoff", description: "Désactiver filtre NSFW.", dangerous: true },
    { name: "goreon", description: "Activer filtre gore." },
    { name: "goreoff", description: "Désactiver filtre gore.", dangerous: true },
    { name: "report", description: "Rapport média.", options: ["text"] },
    { name: "hashadd", description: "Bloquer hash.", options: ["text"] },
    { name: "hashremove", description: "Retirer hash.", options: ["text"] },
    { name: "hashlist", description: "Lister hashes." },
    { name: "reviewqueue", description: "File revue média." }
  ]
});

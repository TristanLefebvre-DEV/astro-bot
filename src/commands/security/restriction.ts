import { createGenericCommandGroup, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "restriction",
  description: "Restrictions temporaires.",
  category: "moderation",
  userPermissions: manageMessages,
  subcommands: [
    { name: "nolinks", description: "Interdire liens.", options: ["user", "duration"] },
    { name: "noimages", description: "Interdire images.", options: ["user", "duration"] },
    { name: "noattachments", description: "Interdire fichiers.", options: ["user", "duration"] },
    { name: "nomedia", description: "Interdire médias.", options: ["user", "duration"] },
    { name: "nomentionrole", description: "Interdire mentions rôles.", options: ["user", "duration"] },
    { name: "nochannels", description: "Limiter salons.", options: ["user", "duration"] },
    { name: "onlyread", description: "Lecture seule.", options: ["user", "duration"] },
    { name: "newbieonly", description: "Limiter nouveaux.", options: ["duration"] },
    { name: "linkprobation", description: "Probation liens.", options: ["user", "duration"] },
    { name: "messageapprove", description: "Approbation messages.", options: ["user", "duration"] },
    { name: "list", description: "Lister restrictions." },
    { name: "remove", description: "Retirer restriction.", options: ["user", "text"], dangerous: true }
  ]
});

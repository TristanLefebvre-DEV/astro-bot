import { createGenericCommandGroup, manageMessages } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "evidence",
  description: "Preuves, transcripts et incidents.",
  category: "moderation",
  userPermissions: manageMessages,
  subcommands: [
    { name: "save", description: "Sauvegarder preuve.", options: ["text"] },
    { name: "user", description: "Preuves d'un utilisateur.", options: ["user"] },
    { name: "export", description: "Exporter preuves.", options: ["text"] },
    { name: "transcriptchannel", description: "Transcript salon.", options: ["channel"] },
    { name: "transcriptuser", description: "Transcript utilisateur.", options: ["user"] },
    { name: "incidentcreate", description: "Créer incident.", options: ["text"] },
    { name: "incidentadd", description: "Ajouter au dossier incident.", options: ["text"] },
    { name: "incidentclose", description: "Fermer incident.", options: ["text"], dangerous: true },
    { name: "incidentreport", description: "Rapport incident.", options: ["text"] },
    { name: "chain", description: "Chaîne d'interactions.", options: ["user"] },
    { name: "timeline", description: "Timeline modération.", options: ["user"] },
    { name: "whointeracted", description: "Voir interactions.", options: ["user"] },
    { name: "modbrief", description: "Résumé staff.", options: ["user"] },
    { name: "heatmap", description: "Heatmap incidents." }
  ]
});

import { createGenericCommandGroup, manageChannels } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "tempvoice",
  description: "Vocaux temporaires.",
  category: "utility",
  userPermissions: manageChannels,
  subcommands: [
    { name: "setup", description: "Configurer vocal temporaire.", options: ["voice_channel"] },
    { name: "disable", description: "Désactiver vocal temporaire.", dangerous: true },
    { name: "config", description: "Configurer paramètres.", options: ["text"] },
    { name: "rename", description: "Renommer son vocal.", options: ["text"] },
    { name: "limit", description: "Définir limite utilisateurs.", options: ["amount"] },
    { name: "lock", description: "Verrouiller son vocal." },
    { name: "unlock", description: "Déverrouiller son vocal." },
    { name: "permit", description: "Autoriser membre.", options: ["user"] },
    { name: "reject", description: "Refuser membre.", options: ["user"] },
    { name: "transfer", description: "Transférer propriété.", options: ["user"] },
    { name: "claim", description: "Réclamer vocal abandonné." }
  ]
});

import { createGenericCommandGroup, manageChannels } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "stats",
  description: "Statistiques serveur.",
  category: "utility",
  userPermissions: manageChannels,
  subcommands: [
    { name: "setup", description: "Créer salons statistiques." },
    { name: "refresh", description: "Rafraîchir stats." },
    { name: "config", description: "Configurer stats.", options: ["text"] },
    { name: "disable", description: "Désactiver stats.", dangerous: true }
  ]
});

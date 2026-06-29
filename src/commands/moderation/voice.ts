import { createGenericCommandGroup, moderateMembers } from "../../modules/generic/genericCommandFactory.js";

export default createGenericCommandGroup({
  name: "voice",
  description: "Modération vocale.",
  category: "moderation",
  userPermissions: moderateMembers,
  subcommands: [
    { name: "mute", description: "Mute vocal.", options: ["user", "reason"] },
    { name: "unmute", description: "Retirer mute vocal.", options: ["user", "reason"] },
    { name: "deafen", description: "Rendre sourd.", options: ["user", "reason"] },
    { name: "undeafen", description: "Retirer sourdine.", options: ["user", "reason"] },
    { name: "disconnect", description: "Déconnecter d'un vocal.", options: ["user", "reason"] },
    { name: "move", description: "Déplacer un membre.", options: ["user", "voice_channel", "reason"] }
  ]
});

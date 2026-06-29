import type { PanelConfig, PanelType } from "./types.js";

type TemplateInput = {
  guildId: string;
  panelId: string;
  name: string;
  createdBy: string;
};

type TemplateFactory = (input: TemplateInput) => Omit<PanelConfig, "channelId" | "messageId">;

const basePermissions = {
  allowedRoles: [],
  allowedUsers: [],
  ephemeralResponses: true
};

export const panelTemplates: Record<Exclude<PanelType, "custom">, TemplateFactory> = {
  ticket: ({ guildId, panelId, name, createdBy }) => ({
    guildId,
    panelId,
    type: "ticket",
    name,
    title: "Centre de support",
    description:
      "Besoin d'aide ? Choisis un type de demande puis ouvre un ticket. Un membre du staff te répondra dès que possible.",
    color: "#5865F2",
    image: null,
    thumbnail: null,
    footer: "Support propre, rapide et organisé",
    emoji: "🎫",
    style: "support",
    buttons: [
      {
        customId: "open",
        label: "Ouvrir un ticket",
        emoji: "🎫",
        style: "Primary",
        action: { type: "ticket_open", module: "tickets", payload: { ticketType: "general" } }
      }
    ],
    selectMenus: [
      {
        customId: "type",
        placeholder: "Choisir le type de ticket",
        minValues: 1,
        maxValues: 1,
        action: { type: "ticket_open", module: "tickets" },
        options: [
          { label: "Support général", value: "general", emoji: "💬" },
          { label: "Boutique", value: "shop", emoji: "🛒" },
          { label: "Plainte", value: "complaint", emoji: "⚠️" },
          { label: "Partenariat", value: "partnership", emoji: "🤝" },
          { label: "Candidature", value: "application", emoji: "📋" },
          { label: "Bug", value: "bug", emoji: "🐛" },
          { label: "Signalement sécurité", value: "security", emoji: "🛡️" },
          { label: "Autre", value: "other", emoji: "✨" }
        ]
      }
    ],
    actions: [{ type: "ticket_open", module: "tickets" }],
    permissions: basePermissions,
    createdBy,
    enabled: true
  }),
  verification: ({ guildId, panelId, name, createdBy }) => ({
    guildId,
    panelId,
    type: "verification",
    name,
    title: "Vérification",
    description: "Clique sur le bouton ci-dessous pour accéder au serveur.",
    color: "#22C55E",
    image: null,
    thumbnail: null,
    footer: "Vérification sécurisée",
    emoji: "✅",
    style: "minimal",
    buttons: [
      {
        customId: "verify",
        label: "Se vérifier",
        emoji: "✅",
        style: "Success",
        action: { type: "verify_user", module: "verification" }
      }
    ],
    selectMenus: [],
    actions: [{ type: "verify_user", module: "verification" }],
    permissions: basePermissions,
    createdBy,
    enabled: true
  }),
  roles: ({ guildId, panelId, name, createdBy }) => ({
    guildId,
    panelId,
    type: "roles",
    name,
    title: "Choisis tes rôles",
    description: "Sélectionne tes notifications, plateformes ou centres d'intérêt.",
    color: "#A855F7",
    image: null,
    thumbnail: null,
    footer: "Rôles communautaires",
    emoji: "🎭",
    style: "community",
    buttons: [],
    selectMenus: [
      {
        customId: "roles",
        placeholder: "Choisir mes rôles",
        minValues: 0,
        maxValues: 3,
        action: { type: "role_select", module: "reactionRoles" },
        options: [
          { label: "Annonces", value: "announcements", emoji: "📢" },
          { label: "Giveaways", value: "giveaways", emoji: "🎁" },
          { label: "Events", value: "events", emoji: "🎉" }
        ]
      }
    ],
    actions: [{ type: "role_select", module: "reactionRoles" }],
    permissions: basePermissions,
    createdBy,
    enabled: true
  }),
  maintenance: ({ guildId, panelId, name, createdBy }) => ({
    guildId,
    panelId,
    type: "maintenance",
    name,
    title: "Maintenance en cours",
    description: "Le serveur est temporairement fermé. Merci de patienter pendant l'intervention du staff.",
    color: "#F59E0B",
    image: null,
    thumbnail: null,
    footer: "Maintenance serveur",
    emoji: "🛠️",
    style: "sobriety",
    buttons: [],
    selectMenus: [],
    actions: [],
    permissions: basePermissions,
    createdBy,
    enabled: true
  }),
  rules: ({ guildId, panelId, name, createdBy }) => ({
    guildId,
    panelId,
    type: "rules",
    name,
    title: "Règlement du serveur",
    description: "Lis les règles du serveur puis clique sur le bouton pour confirmer ton accord.",
    color: "#0EA5E9",
    image: null,
    thumbnail: null,
    footer: "Merci de respecter la communauté",
    emoji: "📜",
    style: "community",
    buttons: [
      {
        customId: "accept",
        label: "J'accepte",
        emoji: "📜",
        style: "Success",
        action: { type: "rules_accept", module: "verification" }
      }
    ],
    selectMenus: [],
    actions: [{ type: "rules_accept", module: "verification" }],
    permissions: basePermissions,
    createdBy,
    enabled: true
  }),
  announcement: ({ guildId, panelId, name, createdBy }) => ({
    guildId,
    panelId,
    type: "announcement",
    name,
    title: "Annonce officielle",
    description: "Une annonce importante sera publiée ici.",
    color: "#F97316",
    image: null,
    thumbnail: null,
    footer: "Annonce premium",
    emoji: "📢",
    style: "premium",
    buttons: [],
    selectMenus: [],
    actions: [],
    permissions: basePermissions,
    createdBy,
    enabled: true
  }),
  security: ({ guildId, panelId, name, createdBy }) => ({
    guildId,
    panelId,
    type: "security",
    name,
    title: "Centre de sécurité",
    description: "Signale un scam, du harcèlement, un contenu dangereux ou un problème urgent au staff.",
    color: "#EF4444",
    image: null,
    thumbnail: null,
    footer: "Signalements confidentiels",
    emoji: "🛡️",
    style: "security",
    buttons: [
      {
        customId: "report",
        label: "Signaler",
        emoji: "🛡️",
        style: "Danger",
        action: { type: "security_report", module: "security" }
      },
      {
        customId: "help",
        label: "Aide",
        emoji: "💬",
        style: "Secondary",
        action: { type: "ticket_open", module: "tickets", payload: { ticketType: "security" } }
      }
    ],
    selectMenus: [],
    actions: [{ type: "security_report", module: "security" }],
    permissions: basePermissions,
    createdBy,
    enabled: true
  })
};

export function createCustomPanel(input: TemplateInput): Omit<PanelConfig, "channelId" | "messageId"> {
  return {
    guildId: input.guildId,
    panelId: input.panelId,
    type: "custom",
    name: input.name,
    title: "Panel personnalisé",
    description: "Configure ce panel avec tes propres actions, boutons et textes.",
    color: "#5865F2",
    image: null,
    thumbnail: null,
    footer: "Panel personnalisable",
    emoji: "✨",
    style: "premium",
    buttons: [],
    selectMenus: [],
    actions: [],
    permissions: basePermissions,
    createdBy: input.createdBy,
    enabled: true
  };
}

export type PanelType = "ticket" | "verification" | "roles" | "rules" | "maintenance" | "announcement" | "security" | "custom";

export type PanelStyle = "premium" | "sobriety" | "gaming" | "support" | "security" | "community" | "minimal";

export interface PanelAction {
  type: "ticket_open" | "verify_user" | "role_select" | "rules_accept" | "security_report" | "link" | "custom";
  module: string;
  payload?: Record<string, unknown>;
}

export interface PanelButtonConfig {
  customId: string;
  label: string;
  emoji?: string;
  style: "Primary" | "Secondary" | "Success" | "Danger" | "Link";
  url?: string;
  action: PanelAction;
  disabled?: boolean;
}

export interface PanelSelectOptionConfig {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
}

export interface PanelSelectMenuConfig {
  customId: string;
  placeholder: string;
  minValues: number;
  maxValues: number;
  options: PanelSelectOptionConfig[];
  action: PanelAction;
  disabled?: boolean;
}

export interface PanelConfig {
  guildId: string;
  panelId: string;
  type: PanelType;
  name: string;
  title: string;
  description: string;
  color: string;
  image?: string | null;
  thumbnail?: string | null;
  footer?: string | null;
  emoji?: string | null;
  style: PanelStyle;
  channelId?: string | null;
  messageId?: string | null;
  buttons: PanelButtonConfig[];
  selectMenus: PanelSelectMenuConfig[];
  actions: PanelAction[];
  permissions: {
    allowedRoles: string[];
    allowedUsers: string[];
    ephemeralResponses: boolean;
  };
  createdBy: string;
  enabled: boolean;
}

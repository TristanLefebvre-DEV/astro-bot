import type {
  ChatInputCommandInteraction,
  Client,
  PermissionResolvable
} from "discord.js";
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";

export type CommandCategory =
  | "help"
  | "owner"
  | "config"
  | "moderation"
  | "tickets"
  | "security"
  | "utility";

export interface CommandContext {
  client: Client<true>;
}

export interface SlashCommand {
  data: {
    name: string;
    description: string;
    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  category: CommandCategory;
  cooldownSeconds?: number;
  ownerOnly?: boolean;
  guildOnly?: boolean;
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  execute(interaction: ChatInputCommandInteraction, context: CommandContext): Promise<void>;
}

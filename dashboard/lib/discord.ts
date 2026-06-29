import { env } from "./env";

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string | null;
  owner?: boolean;
  permissions?: string;
}

const manageGuildPermission = 0x20n;

export function canManageGuild(guild: DiscordGuild): boolean {
  if (guild.owner) return true;
  return (BigInt(guild.permissions ?? "0") & manageGuildPermission) === manageGuildPermission;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const body = new URLSearchParams({
    client_id: env.CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI
  });

  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) throw new Error(`OAuth Discord refusé: ${response.status}`);
  return response.json();
}

export async function discordFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`Discord API ${path} refusée: ${response.status}`);
  return response.json();
}

export async function getCurrentUser(accessToken: string): Promise<DiscordUser> {
  return discordFetch<DiscordUser>("/users/@me", accessToken);
}

export async function getManageableGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const guilds = await discordFetch<DiscordGuild[]>("/users/@me/guilds", accessToken);
  return guilds
    .filter(canManageGuild)
    .filter((guild) => !env.GUILD_ID || guild.id === env.GUILD_ID);
}

export async function assertGuildAccess(accessToken: string, guildId: string): Promise<void> {
  const guilds = await getManageableGuilds(accessToken);
  if (!guilds.some((guild) => guild.id === guildId)) throw new Error("Forbidden");
}

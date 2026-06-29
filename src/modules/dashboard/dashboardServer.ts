import crypto from "node:crypto";
import http from "node:http";
import { parse as parseUrl } from "node:url";
import type { Client } from "discord.js";
import type { Model } from "mongoose";
import { config } from "../../config/index.js";
import { GuildConfig, ModerationCase, Panel, Ticket } from "../../database/models/index.js";
import { logger } from "../../utils/logger.js";
import { getOrCreateGuildConfig } from "../config/guildConfigService.js";
import { formatZodError, guildConfigPatchSchema } from "../validation/schemas.js";

interface DashboardSession {
  id: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: DiscordUser;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string | null;
  global_name?: string | null;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon?: string | null;
  owner?: boolean;
  permissions?: string;
}

const sessions = new Map<string, DashboardSession>();
let server: http.Server | null = null;
let botClient: Client | null = null;

const manageGuildPermission = 0x20n;

function isOAuthConfigured(): boolean {
  return Boolean(config.DISCORD_CLIENT_SECRET && config.DISCORD_REDIRECT_URI);
}

function html(response: http.ServerResponse, body: string, status = 200): void {
  response.writeHead(status, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(body);
}

function json(response: http.ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function redirect(response: http.ServerResponse, location: string): void {
  response.writeHead(302, { location });
  response.end();
}

function parseCookies(request: http.IncomingMessage): Record<string, string> {
  const header = request.headers.cookie ?? "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function setCookie(response: http.ServerResponse, name: string, value: string, maxAgeSeconds: number): void {
  response.setHeader(
    "set-cookie",
    `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`
  );
}

function clearCookie(response: http.ServerResponse, name: string): void {
  response.setHeader("set-cookie", `${name}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function getSession(request: http.IncomingMessage): DashboardSession | null {
  const sessionId = parseCookies(request).astro_session;
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(sessionId);
    return null;
  }
  return session;
}

function requireSession(request: http.IncomingMessage, response: http.ServerResponse): DashboardSession | null {
  const session = getSession(request);
  if (!session) {
    json(response, 401, { error: "Unauthorized" });
    return null;
  }
  return session;
}

async function readJsonBody<T>(request: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return (raw ? JSON.parse(raw) : {}) as T;
}

async function discordFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(`Discord API ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
}

async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const body = new URLSearchParams({
    client_id: config.CLIENT_ID,
    client_secret: config.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.DISCORD_REDIRECT_URI
  });

  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) throw new Error(`OAuth token exchange failed: ${response.status}`);
  return response.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number }>;
}

function canManageGuild(guild: DiscordGuild): boolean {
  if (guild.owner) return true;
  const permissions = BigInt(guild.permissions ?? "0");
  return (permissions & manageGuildPermission) === manageGuildPermission;
}

async function getManageableBotGuilds(session: DashboardSession): Promise<DiscordGuild[]> {
  const guilds = await discordFetch<DiscordGuild[]>("/users/@me/guilds", session.accessToken);
  return guilds.filter((guild) => canManageGuild(guild) && botClient?.guilds.cache.has(guild.id));
}

async function assertGuildAccess(session: DashboardSession, guildId: string): Promise<DiscordGuild> {
  const guild = (await getManageableBotGuilds(session)).find((item) => item.id === guildId);
  if (!guild) throw new Error("Forbidden");
  return guild;
}

function sanitizeConfigPatch(input: unknown): Record<string, unknown> {
  const result = guildConfigPatchSchema.safeParse(input);
  if (!result.success) throw new Error(`Config invalide: ${formatZodError(result.error)}`);
  return result.data;
}

function dashboardPage(): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Astro Dashboard</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #101114;
      --panel: #17191f;
      --panel-2: #1f232b;
      --text: #eef2f8;
      --muted: #9aa3b2;
      --line: #303642;
      --brand: #5b8cff;
      --ok: #35c77b;
      --warn: #ffbd4a;
      --danger: #ff5d68;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font: 14px/1.45 system-ui, -apple-system, Segoe UI, sans-serif; background: var(--bg); color: var(--text); }
    button, input, textarea, select { font: inherit; }
    .layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; }
    aside { border-right: 1px solid var(--line); background: #121419; padding: 18px; }
    main { padding: 22px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 16px; margin: 0 0 12px; }
    p { color: var(--muted); margin: 0 0 14px; }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
    .logo { width: 34px; height: 34px; display: grid; place-items: center; background: var(--brand); border-radius: 7px; font-weight: 800; }
    .user { padding: 12px; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; margin-bottom: 16px; }
    .nav { display: grid; gap: 6px; }
    .nav button, .primary, .secondary, .danger { border: 1px solid var(--line); color: var(--text); background: var(--panel); border-radius: 7px; padding: 9px 10px; cursor: pointer; text-align: left; }
    .nav button.active, .primary { background: var(--brand); border-color: var(--brand); color: white; }
    .secondary { background: var(--panel-2); text-align: center; }
    .danger { background: transparent; border-color: #65323a; color: #ff9aa2; text-align: center; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
    select, input, textarea { width: 100%; border: 1px solid var(--line); background: var(--panel); color: var(--text); border-radius: 7px; padding: 9px 10px; }
    textarea { min-height: 260px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; resize: vertical; }
    .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
    .span-4 { grid-column: span 4; }
    .span-6 { grid-column: span 6; }
    .span-8 { grid-column: span 8; }
    .span-12 { grid-column: span 12; }
    .section { border: 1px solid var(--line); background: var(--panel); border-radius: 8px; padding: 14px; }
    .metric { font-size: 26px; font-weight: 750; }
    .muted { color: var(--muted); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { color: var(--muted); font-weight: 600; }
    .row-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .status { border-left: 3px solid var(--brand); padding: 9px 10px; background: var(--panel-2); border-radius: 6px; white-space: pre-wrap; }
    .login { max-width: 420px; margin: 12vh auto; padding: 24px; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      aside { border-right: 0; border-bottom: 1px solid var(--line); }
      .span-4, .span-6, .span-8 { grid-column: span 12; }
      .topbar { align-items: stretch; flex-direction: column; }
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    const state = { me: null, status: null, guilds: [], guildId: "", config: null, tab: "overview" };
    const app = document.getElementById("app");

    async function api(path, options = {}) {
      const res = await fetch(path, { headers: { "content-type": "application/json" }, ...options });
      if (res.status === 401) throw new Error("unauthorized");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    function esc(value) {
      return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    }

    function loginView(status) {
      app.innerHTML = '<div class="login"><div class="brand"><div class="logo">A</div><div><h1>Astro Dashboard</h1><p>Configuration web optionnelle du bot.</p></div></div>' +
        (status.oauthConfigured ? '<button class="primary" onclick="location.href=\\'/login\\'">Connexion Discord</button>' : '<div class="status">OAuth2 non configuré. Renseigne DISCORD_CLIENT_SECRET et DISCORD_REDIRECT_URI dans .env.</div>') +
        '<p style="margin-top:14px">Le bot reste utilisable depuis Discord même sans dashboard.</p></div>';
    }

    function shell(content) {
      app.innerHTML = '<div class="layout"><aside><div class="brand"><div class="logo">A</div><div><h1>Astro</h1><p>Dashboard</p></div></div>' +
        '<div class="user"><strong>' + esc(state.me.global_name || state.me.username) + '</strong><br><span class="muted">' + esc(state.me.id) + '</span></div>' +
        '<select onchange="selectGuild(this.value)">' + state.guilds.map(g => '<option value="' + g.id + '"' + (g.id === state.guildId ? ' selected' : '') + '>' + esc(g.name) + '</option>').join("") + '</select>' +
        '<div class="nav" style="margin-top:14px">' + ["overview","config","panels","tickets","cases"].map(tab => '<button class="' + (state.tab === tab ? 'active' : '') + '" onclick="openTab(\\'' + tab + '\\')">' + tabLabel(tab) + '</button>').join("") + '</div>' +
        '<div style="margin-top:16px"><button class="danger" onclick="location.href=\\'/logout\\'">Déconnexion</button></div></aside><main>' + content + '</main></div>';
    }

    function tabLabel(tab) {
      return ({ overview: "Vue d'ensemble", config: "Configuration", panels: "Panels", tickets: "Tickets", cases: "Sanctions" })[tab];
    }

    async function selectGuild(id) {
      state.guildId = id;
      await loadGuildData();
      render();
    }

    async function openTab(tab) {
      state.tab = tab;
      await loadGuildData();
      render();
    }

    async function loadGuildData() {
      if (!state.guildId) return;
      if (state.tab === "config" || state.tab === "overview") state.config = await api('/api/guilds/' + state.guildId + '/config');
      if (state.tab === "panels") state.panels = await api('/api/guilds/' + state.guildId + '/panels');
      if (state.tab === "tickets") state.tickets = await api('/api/guilds/' + state.guildId + '/tickets');
      if (state.tab === "cases") state.cases = await api('/api/guilds/' + state.guildId + '/cases');
    }

    function renderOverview() {
      const cfg = state.config || {};
      shell('<div class="topbar"><div><h1>Vue d\\'ensemble</h1><p>' + esc(state.guilds.find(g => g.id === state.guildId)?.name) + '</p></div><button class="secondary" onclick="refresh()">Rafraîchir</button></div>' +
        '<div class="grid"><div class="section span-4"><div class="metric">' + state.status.commands + '</div><p>Commandes chargées</p></div>' +
        '<div class="section span-4"><div class="metric">' + state.status.guilds + '</div><p>Serveurs bot</p></div>' +
        '<div class="section span-4"><div class="metric">' + Math.floor(state.status.uptimeSeconds / 60) + 'm</div><p>Uptime</p></div>' +
        '<div class="section span-12"><h2>Modules</h2><table><tbody>' +
        ['tickets','verification','automod','antiraid','antinuke','maintenance'].map(k => '<tr><td>' + k + '</td><td>' + (cfg[k]?.enabled ? 'Activé' : 'Désactivé') + '</td></tr>').join("") +
        '</tbody></table></div></div>');
    }

    function renderConfig() {
      const cfg = state.config || {};
      shell('<div class="topbar"><div><h1>Configuration</h1><p>Formulaires rapides + JSON avancé.</p></div><button class="primary" onclick="saveConfig()">Sauvegarder JSON</button></div>' +
        '<div class="grid">' +
        '<div class="section span-6"><h2>Général</h2><label>Langue</label><input id="quickLanguage" value="' + esc(cfg.language || "fr") + '"><label>Timezone</label><input id="quickTimezone" value="' + esc(cfg.timezone || "Europe/Paris") + '"><button class="secondary" onclick="saveGeneral()">Sauvegarder général</button></div>' +
        '<div class="section span-6"><h2>Vérification</h2><label>Role ID vérifié</label><input id="quickVerifyRole" value="' + esc(cfg.verification?.roleId || "") + '"><label>Channel ID</label><input id="quickVerifyChannel" value="' + esc(cfg.verification?.channelId || "") + '"><button class="secondary" onclick="saveVerification()">Sauvegarder vérification</button></div>' +
        '<div class="section span-6"><h2>Welcome</h2><label>Channel ID</label><input id="quickWelcomeChannel" value="' + esc(cfg.welcome?.channelId || "") + '"><label>Message</label><input id="quickWelcomeMessage" value="' + esc(cfg.welcome?.message || "Bienvenue {user} sur {server} !") + '"><button class="secondary" onclick="saveWelcome()">Sauvegarder welcome</button></div>' +
        '<div class="section span-6"><h2>Automod</h2><label><input id="quickAutomodEnabled" type="checkbox" style="width:auto" ' + (cfg.automod?.enabled ? 'checked' : '') + '> Activé</label><label><input id="quickLinksEnabled" type="checkbox" style="width:auto" ' + (cfg.automod?.antiLinks?.enabled ? 'checked' : '') + '> Anti-liens</label><label><input id="quickInvitesEnabled" type="checkbox" style="width:auto" ' + (cfg.automod?.antiInvites?.enabled ? 'checked' : '') + '> Anti-invitations</label><button class="secondary" onclick="saveAutomod()">Sauvegarder automod</button></div>' +
        '<div class="section span-12"><h2>JSON avancé</h2><textarea id="configEditor">' + esc(JSON.stringify(state.config, null, 2)) + '</textarea></div>' +
        '<div class="span-12"><div id="notice" class="status">Prêt.</div></div></div>');
    }

    async function patchConfig(patch) {
      const notice = document.getElementById("notice");
      try {
        state.config = await api('/api/guilds/' + state.guildId + '/config', { method: 'PATCH', body: JSON.stringify(patch) });
        notice.textContent = "Configuration sauvegardée.";
        renderConfig();
      } catch (error) {
        notice.textContent = "Erreur: " + error.message;
      }
    }

    function saveGeneral() {
      patchConfig({ language: document.getElementById("quickLanguage").value, timezone: document.getElementById("quickTimezone").value });
    }

    function saveVerification() {
      patchConfig({ verification: { enabled: true, roleId: document.getElementById("quickVerifyRole").value || null, channelId: document.getElementById("quickVerifyChannel").value || null } });
    }

    function saveWelcome() {
      patchConfig({ welcome: { enabled: true, channelId: document.getElementById("quickWelcomeChannel").value || null, message: document.getElementById("quickWelcomeMessage").value } });
    }

    function saveAutomod() {
      patchConfig({ automod: { enabled: document.getElementById("quickAutomodEnabled").checked, antiLinks: { enabled: document.getElementById("quickLinksEnabled").checked }, antiInvites: { enabled: document.getElementById("quickInvitesEnabled").checked } } });
    }

    async function saveConfig() {
      const notice = document.getElementById("notice");
      try {
        const patch = JSON.parse(document.getElementById("configEditor").value);
        state.config = await api('/api/guilds/' + state.guildId + '/config', { method: 'PATCH', body: JSON.stringify(patch) });
        notice.textContent = "Configuration sauvegardée.";
      } catch (error) {
        notice.textContent = "Erreur: " + error.message;
      }
    }

    function renderPanels() {
      const rows = (state.panels || []).map(p => '<tr><td><strong>' + esc(p.name) + '</strong><br><span class="muted">' + esc(p.panelId) + '</span></td><td>' + esc(p.type) + '</td><td>' + esc(p.title) + '</td><td>' + (p.enabled ? 'Actif' : 'Désactivé') + '</td></tr>').join("");
      shell('<div class="topbar"><div><h1>Panels</h1><p>Panels Discord premium configurés sur ce serveur.</p></div></div><div class="section"><table><thead><tr><th>Nom</th><th>Type</th><th>Titre</th><th>État</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">Aucun panel.</td></tr>') + '</tbody></table></div>');
    }

    function renderTickets() {
      const rows = (state.tickets || []).map(t => '<tr><td><#' + esc(t.channelId) + '><br><span class="muted">' + esc(t.channelId) + '</span></td><td>' + esc(t.ownerId) + '</td><td>' + esc(t.type) + '</td><td>' + esc(t.status) + '</td></tr>').join("");
      shell('<div class="topbar"><div><h1>Tickets</h1><p>Consultation des tickets sauvegardés.</p></div></div><div class="section"><table><thead><tr><th>Salon</th><th>Owner</th><th>Type</th><th>Status</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">Aucun ticket.</td></tr>') + '</tbody></table></div>');
    }

    function renderCases() {
      const rows = (state.cases || []).map(c => '<tr><td>#' + esc(c.caseId) + '</td><td>' + esc(c.type) + '</td><td>' + esc(c.userId) + '</td><td>' + esc(c.reason) + '</td><td>' + esc(c.status) + '</td></tr>').join("");
      shell('<div class="topbar"><div><h1>Sanctions</h1><p>Derniers cases de modération.</p></div></div><div class="section"><table><thead><tr><th>Case</th><th>Type</th><th>User</th><th>Raison</th><th>Status</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">Aucun case.</td></tr>') + '</tbody></table></div>');
    }

    function render() {
      if (state.tab === "overview") return renderOverview();
      if (state.tab === "config") return renderConfig();
      if (state.tab === "panels") return renderPanels();
      if (state.tab === "tickets") return renderTickets();
      if (state.tab === "cases") return renderCases();
    }

    async function refresh() {
      state.status = await api('/api/status');
      await loadGuildData();
      render();
    }

    async function boot() {
      const publicStatus = await api('/api/public-status');
      try {
        state.me = await api('/api/me');
        state.status = await api('/api/status');
        state.guilds = await api('/api/guilds');
        state.guildId = state.guilds[0]?.id || "";
        if (!state.guildId) {
          app.innerHTML = '<div class="login"><h1>Aucun serveur disponible</h1><p>Tu dois gérer un serveur où le bot est présent.</p><button class="danger" onclick="location.href=\\'/logout\\'">Déconnexion</button></div>';
          return;
        }
        await loadGuildData();
        render();
      } catch {
        loginView(publicStatus);
      }
    }

    boot();
  </script>
</body>
</html>`;
}

async function handleApi(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  pathname: string,
  method: string
): Promise<void> {
  if (pathname === "/api/public-status") {
    json(response, 200, {
      enabled: config.DASHBOARD_ENABLED,
      oauthConfigured: isOAuthConfigured()
    });
    return;
  }

  if (pathname === "/api/status") {
    const session = requireSession(request, response);
    if (!session) return;
    json(response, 200, {
      ready: botClient?.isReady() ?? false,
      guilds: botClient?.guilds.cache.size ?? 0,
      commands: botClient?.commands?.size ?? 0,
      uptimeSeconds: Math.floor(process.uptime()),
      user: session.user
    });
    return;
  }

  if (pathname === "/api/me") {
    const session = requireSession(request, response);
    if (!session) return;
    json(response, 200, session.user);
    return;
  }

  if (pathname === "/api/guilds") {
    const session = requireSession(request, response);
    if (!session) return;
    json(response, 200, await getManageableBotGuilds(session));
    return;
  }

  const match = /^\/api\/guilds\/(\d+)\/(config|panels|tickets|cases)$/.exec(pathname);
  if (!match) {
    json(response, 404, { error: "Not found" });
    return;
  }

  const session = requireSession(request, response);
  if (!session) return;

  const guildId = match[1]!;
  const resource = match[2]!;
  await assertGuildAccess(session, guildId);

  if (resource === "config" && method === "GET") {
    json(response, 200, await getOrCreateGuildConfig(guildId));
    return;
  }

  if (resource === "config" && method === "PATCH") {
    const patch = sanitizeConfigPatch(await readJsonBody<unknown>(request));
    await (GuildConfig as Model<any>).findOneAndUpdate({ guildId }, { $set: patch }, { upsert: true });
    json(response, 200, await getOrCreateGuildConfig(guildId));
    return;
  }

  if (resource === "panels" && method === "GET") {
    json(response, 200, await (Panel as Model<any>).find({ guildId }).sort({ updatedAt: -1 }).limit(100).lean());
    return;
  }

  if (resource === "tickets" && method === "GET") {
    json(response, 200, await (Ticket as Model<any>).find({ guildId }).sort({ createdAt: -1 }).limit(100).lean());
    return;
  }

  if (resource === "cases" && method === "GET") {
    json(response, 200, await (ModerationCase as Model<any>).find({ guildId }).sort({ createdAt: -1 }).limit(100).lean());
    return;
  }

  json(response, 405, { error: "Method not allowed" });
}

async function handleRequest(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const parsed = parseUrl(request.url ?? "/", true);
  const pathname = parsed.pathname ?? "/";
  const method = request.method ?? "GET";

  try {
    if (pathname === "/" || pathname === "/dashboard") {
      html(response, dashboardPage());
      return;
    }

    if (pathname === "/health") {
      json(response, 200, { ok: true, enabled: config.DASHBOARD_ENABLED, oauthConfigured: isOAuthConfigured() });
      return;
    }

    if (pathname === "/login") {
      if (!isOAuthConfigured()) {
        redirect(response, "/");
        return;
      }

      const state = crypto.randomBytes(16).toString("hex");
      setCookie(response, "astro_oauth_state", state, 300);
      const params = new URLSearchParams({
        client_id: config.CLIENT_ID,
        redirect_uri: config.DISCORD_REDIRECT_URI,
        response_type: "code",
        scope: "identify guilds",
        state,
        prompt: "none"
      });
      redirect(response, `https://discord.com/oauth2/authorize?${params.toString()}`);
      return;
    }

    if (pathname === "/callback") {
      const code = typeof parsed.query.code === "string" ? parsed.query.code : "";
      const state = typeof parsed.query.state === "string" ? parsed.query.state : "";
      const cookieState = parseCookies(request).astro_oauth_state;
      if (!code || !state || state !== cookieState) {
        html(response, "<h1>OAuth invalide</h1>", 400);
        return;
      }

      const token = await exchangeCode(code);
      const user = await discordFetch<DiscordUser>("/users/@me", token.access_token);
      const sessionId = crypto.randomBytes(24).toString("hex");
      sessions.set(sessionId, {
        id: sessionId,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + token.expires_in * 1000,
        user
      });
      clearCookie(response, "astro_oauth_state");
      setCookie(response, "astro_session", sessionId, token.expires_in);
      redirect(response, "/dashboard");
      return;
    }

    if (pathname === "/logout") {
      const sessionId = parseCookies(request).astro_session;
      if (sessionId) sessions.delete(sessionId);
      clearCookie(response, "astro_session");
      redirect(response, "/");
      return;
    }

    if (pathname.startsWith("/api/")) {
      await handleApi(request, response, pathname, method);
      return;
    }

    json(response, 404, { error: "Not found" });
  } catch (error) {
    logger.error("Erreur dashboard", error);
    json(response, String((error as Error).message).includes("Forbidden") ? 403 : 500, {
      error: (error as Error).message
    });
  }
}

export function startDashboard(client: Client): void {
  if (!config.DASHBOARD_ENABLED || server) return;
  botClient = client;
  const url = new URL(config.DASHBOARD_URL);
  const port = Number(url.port || 3000);
  const host = url.hostname || "127.0.0.1";

  server = http.createServer((request, response) => {
    void handleRequest(request, response);
  });

  server.listen(port, host, () => {
    logger.info(`Dashboard démarré sur http://${host}:${port}`);
  });
}

export function stopDashboard(): void {
  server?.close();
  server = null;
}

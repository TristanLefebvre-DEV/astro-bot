"use client";

import { useEffect, useMemo, useState } from "react";
import type { SessionUser } from "../../lib/auth";
import type { DiscordGuild } from "../../lib/discord";

type Tab = "overview" | "config" | "panels" | "tickets" | "cases";

interface Summary {
  config: any;
  panels: any[];
  tickets: any[];
  cases: any[];
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store"
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export default function DashboardClient({ initialUser }: { initialUser: SessionUser | null }) {
  const [user] = useState(initialUser);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState("Prêt.");
  const [loading, setLoading] = useState(Boolean(initialUser));

  const guild = useMemo(() => guilds.find((item) => item.id === guildId), [guildId, guilds]);

  useEffect(() => {
    if (!user) return;

    void api<DiscordGuild[]>("/api/guilds")
      .then((items) => {
        setGuilds(items);
        setGuildId(items[0]?.id ?? "");
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);
    void api<Summary>(`/api/guilds/${guildId}/summary`)
      .then(setSummary)
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));
  }, [guildId]);

  async function patchConfig(patch: Record<string, unknown>) {
    if (!guildId) return;
    setNotice("Sauvegarde en cours...");
    const config = await api<any>(`/api/guilds/${guildId}/config`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
    setSummary((current) => (current ? { ...current, config } : current));
    setNotice("Configuration sauvegardée.");
  }

  if (!user) {
    return (
      <main className="login">
        <div className="brand">
          <div className="logo">A</div>
          <div>
            <h1>Astro Dashboard</h1>
            <p>Connecte-toi avec Discord pour gérer ton serveur.</p>
          </div>
        </div>
        <a className="primary" href="/login">Connexion Discord</a>
      </main>
    );
  }

  if (!loading && guilds.length === 0) {
    return (
      <main className="login">
        <h1>Aucun serveur disponible</h1>
        <p>Tu dois avoir la permission “Gérer le serveur” sur le serveur configuré.</p>
        <a className="danger" href="/logout">Déconnexion</a>
      </main>
    );
  }

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <div className="logo">A</div>
          <div>
            <h1>Astro</h1>
            <p>Dashboard</p>
          </div>
        </div>

        <div className="user">
          <strong>{user.global_name || user.username}</strong>
          <span>{user.id}</span>
        </div>

        <label>Serveur</label>
        <select value={guildId} onChange={(event) => setGuildId(event.target.value)}>
          {guilds.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <nav>
          {(["overview", "config", "panels", "tickets", "cases"] as Tab[]).map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {labels[item]}
            </button>
          ))}
        </nav>

        <a className="danger" href="/logout">Déconnexion</a>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <h1>{labels[tab]}</h1>
            <p>{guild?.name ?? "Chargement..."}</p>
          </div>
          <button className="secondary" onClick={() => guildId && api<Summary>(`/api/guilds/${guildId}/summary`).then(setSummary)}>
            Rafraîchir
          </button>
        </header>

        {loading || !summary ? <div className="section">Chargement...</div> : null}
        {!loading && summary && tab === "overview" ? <Overview summary={summary} /> : null}
        {!loading && summary && tab === "config" ? <Config summary={summary} notice={notice} onPatch={patchConfig} /> : null}
        {!loading && summary && tab === "panels" ? <Table rows={summary.panels} columns={["panelId", "type", "name", "title", "enabled"]} /> : null}
        {!loading && summary && tab === "tickets" ? <Table rows={summary.tickets} columns={["channelId", "ownerId", "type", "status", "createdAt"]} /> : null}
        {!loading && summary && tab === "cases" ? <Table rows={summary.cases} columns={["caseId", "type", "userId", "reason", "status"]} /> : null}
      </main>
    </div>
  );
}

const labels: Record<Tab, string> = {
  overview: "Vue d'ensemble",
  config: "Configuration",
  panels: "Panels",
  tickets: "Tickets",
  cases: "Sanctions"
};

function Overview({ summary }: { summary: Summary }) {
  const config = summary.config ?? {};
  const modules = ["tickets", "verification", "automod", "antiraid", "antinuke", "maintenance"];

  return (
    <div className="grid">
      <div className="section span-4"><strong>{summary.panels.length}</strong><p>Panels</p></div>
      <div className="section span-4"><strong>{summary.tickets.length}</strong><p>Tickets</p></div>
      <div className="section span-4"><strong>{summary.cases.length}</strong><p>Sanctions</p></div>
      <div className="section span-12">
        <h2>Modules</h2>
        <table>
          <tbody>
            {modules.map((name) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{config[name]?.enabled ? "Activé" : "Désactivé"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Config({
  summary,
  notice,
  onPatch
}: {
  summary: Summary;
  notice: string;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const config = summary.config ?? {};
  const [json, setJson] = useState(JSON.stringify(config, null, 2));

  useEffect(() => {
    setJson(JSON.stringify(config, null, 2));
  }, [config]);

  return (
    <div className="grid">
      <div className="section span-6">
        <h2>Général</h2>
        <label>Langue</label>
        <input id="language" defaultValue={config.language ?? "fr"} />
        <label>Fuseau horaire</label>
        <input id="timezone" defaultValue={config.timezone ?? "Europe/Paris"} />
        <button
          className="secondary"
          onClick={() => onPatch({
            language: (document.getElementById("language") as HTMLInputElement).value,
            timezone: (document.getElementById("timezone") as HTMLInputElement).value
          })}
        >
          Sauvegarder
        </button>
      </div>

      <div className="section span-6">
        <h2>Automod</h2>
        <label><input id="automod" type="checkbox" defaultChecked={Boolean(config.automod?.enabled)} /> Activé</label>
        <label><input id="antilinks" type="checkbox" defaultChecked={Boolean(config.automod?.antiLinks?.enabled)} /> Anti-liens</label>
        <label><input id="antiinvites" type="checkbox" defaultChecked={Boolean(config.automod?.antiInvites?.enabled)} /> Anti-invitations</label>
        <button
          className="secondary"
          onClick={() => onPatch({
            automod: {
              enabled: (document.getElementById("automod") as HTMLInputElement).checked,
              antiLinks: { enabled: (document.getElementById("antilinks") as HTMLInputElement).checked },
              antiInvites: { enabled: (document.getElementById("antiinvites") as HTMLInputElement).checked }
            }
          })}
        >
          Sauvegarder
        </button>
      </div>

      <div className="section span-12">
        <h2>JSON avancé</h2>
        <textarea value={json} onChange={(event) => setJson(event.target.value)} />
        <button className="primary" onClick={() => onPatch(JSON.parse(json))}>Sauvegarder JSON</button>
      </div>

      <div className="status span-12">{notice}</div>
    </div>
  );
}

function Table({ rows, columns }: { rows: any[]; columns: string[] }) {
  return (
    <div className="section">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>Aucune donnée.</td></tr>
          ) : rows.map((row, index) => (
            <tr key={row._id ?? index}>
              {columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

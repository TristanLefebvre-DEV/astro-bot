# Astro Discord Bot

Astro est une base de bot Discord premium, multi-serveur et modulaire, construite avec Discord.js v14, TypeScript et MongoDB.

Le dashboard web est prévu comme module optionnel. Le bot reste utilisable à 100 % depuis Discord avec les slash commands.

## Installation

```bash
npm install
cp .env.example .env
```

Remplis ensuite `.env` avec le token Discord, l'ID client, l'URI MongoDB et les IDs owners séparés par des virgules.

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Synchronisation des commandes

`COMMAND_SYNC_MODE=guild` synchronise instantanément sur `GUILD_ID`.

`COMMAND_SYNC_MODE=global` synchronise globalement en production.

```bash
npm run sync:commands
```

## Permissions Discord recommandées

Le bot doit avoir les intents Server Members, Message Content et Guild Moderation activés dans le portail Discord si les modules associés sont utilisés.

Permissions serveur recommandées selon modules : gérer messages, bannir, expulser, gérer rôles, gérer salons, gérer webhooks, voir audit logs, gérer threads et timeout membres.

## Documentation

- Architecture : `docs/ARCHITECTURE.md`
- Commandes : `docs/COMMANDS.md`
- Modèles MongoDB : `docs/DATABASE_MODELS.md`
- Exemple server builder : `examples/server-template.json`

## Déploiement VPS

1. Installer Node.js 20+ et MongoDB.
2. Cloner le projet.
3. Créer `.env`.
4. Exécuter `npm install && npm run build`.
5. Lancer avec `npm start` ou un process manager comme PM2.

## Dashboard web

Le dashboard intégré démarre avec le bot si `DASHBOARD_ENABLED=true`.

Routes principales :

- `GET /` : interface web
- `GET /login` : connexion Discord OAuth2
- `GET /callback` : retour OAuth2
- `GET /api/status` : statut bot
- `GET /api/guilds` : serveurs administrables où le bot est présent
- `GET/PATCH /api/guilds/:guildId/config` : configuration serveur
- `GET /api/guilds/:guildId/panels` : panels
- `GET /api/guilds/:guildId/tickets` : tickets
- `GET /api/guilds/:guildId/cases` : sanctions

Configuration Discord Developer Portal :

1. Ajouter `http://localhost:3000/callback` dans les Redirect URIs OAuth2.
2. Copier le client secret dans `DISCORD_CLIENT_SECRET`.
3. Vérifier que `DASHBOARD_URL` correspond au domaine public en production.

Le dashboard vérifie côté serveur que l'utilisateur peut gérer le serveur Discord et que le bot y est présent.

## Dépannage

- `Missing DISCORD_TOKEN` : variable absente dans `.env`.
- Commandes absentes : vérifier `CLIENT_ID`, `GUILD_ID` et `COMMAND_SYNC_MODE`.
- MongoDB refuse la connexion : vérifier `DATABASE_URL`.
- Dashboard désactivé : normal si `DASHBOARD_ENABLED=false`, les commandes Discord restent disponibles.
- Dashboard OAuth invalide : vérifier `DISCORD_CLIENT_SECRET` et `DISCORD_REDIRECT_URI`.

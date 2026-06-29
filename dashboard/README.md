# Astro Dashboard

Dashboard Vercel pour Astro Discord Bot.

## Vercel

Dans Vercel, importe le repo GitHub puis mets :

- Root Directory: `dashboard`
- Build Command: `npm run build`
- Output: valeur par défaut Next.js

Variables nécessaires :

```env
DATABASE_URL=
CLIENT_ID=
DISCORD_CLIENT_SECRET=
DASHBOARD_URL=
DISCORD_REDIRECT_URI=
SESSION_SECRET=
GUILD_ID=
```

Dans Discord Developer Portal > OAuth2, ajoute l'URI de redirection :

```txt
https://project-faalp.vercel.app/callback
```

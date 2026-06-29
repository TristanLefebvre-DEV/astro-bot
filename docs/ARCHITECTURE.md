# Architecture

```text
src/
  commands/        Slash commands organisees par categorie
  config/          Configuration runtime et valeurs par defaut
  database/        Connexion MongoDB et modeles Mongoose
  events/          Events Discord charges automatiquement
  handlers/        Chargement commandes, events, interactions et sync slash
  modules/         Logique metier par domaine
  scripts/         Scripts CLI
  types/           Types partages
  utils/           Embeds, permissions, cooldowns, pagination, securite
```

Principes :

- chaque donnée serveur contient `guildId`
- les commandes sont uniquement slash commands
- les actions dangereuses passent par confirmation ou double validation quand configuré
- le dashboard est optionnel
- les modules doivent exposer une API testable et être appelés depuis events/commands
- les handlers centralisent permissions, cooldowns et erreurs
- le dashboard intégré utilise Discord OAuth2, des sessions HTTP-only en mémoire et des routes API protégées par serveur

Ordre de démarrage :

1. charger les variables d'environnement
2. créer le client Discord
3. connecter MongoDB
4. charger events
5. charger commandes
6. synchroniser les slash commands
7. connecter Discord
8. démarrer le dashboard optionnel quand le client est prêt

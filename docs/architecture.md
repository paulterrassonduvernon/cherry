# Architecture — Cherry

Ce document traduit le [cahier des charges](./cahier-des-charges.md) en structure de projet concrète. Il décrit le squelette posé à ce stade et la façon dont les briques restantes viendront s'y greffer.

## Découpage en phases

Le repo est scaffoldé en une fois, mais l'implémentation se fera par étapes pour limiter le risque (notamment sur whisper.cpp, qui dépend d'un binaire + modèle local, et sur l'intégration Claude, qui dépend d'une clé API) :

1. **Phase 1 — Socle** (ce commit) : structure de repo, serveur Express minimal, client React/Vite minimal, schéma SQLite, gitignore/env/licence/README. Aucune logique métier.
2. **Phase 2 — Cœur fonctionnel** : espaces (CRUD), capture texte, stockage Markdown, index SQLite, archive chronologique, écrans 1 et 2 sans vocal ni IA.
3. **Phase 3 — Capture vocale** : enregistrement audio navigateur + transcription locale (whisper.cpp).
4. **Phase 4 — IA** : auto-tagging + synthèse via l'API Claude, historique des synthèses, cron hebdomadaire.
5. **Phase 5 — Compléments** : vue transversale, recherche full-text, corbeille, paramètres, thèmes clair/sombre, archivage d'espace.

## Structure de repo

```
/app
  /server              # Backend Node.js + Express (API locale + service du build frontend)
    package.json
    src/
      index.js          # Point d'entrée : démarre Express, monte les routes API
      config.js          # Charge .env (clé API, port, dossier data, cron, modèle whisper)
      db/
        schema.sql       # Schéma de l'index SQLite — régénérable, jamais source de vérité
      routes/            # (Phase 2+) routes API REST par ressource (spaces, entries, synthesis...)
      services/          # (Phase 2+) logique métier (fichiers markdown, synthèse, transcription)
  /client              # Frontend React + Vite (SPA)
    package.json
    vite.config.js
    index.html
    src/
      main.jsx
      App.jsx            # Layout racine (sidebar navigation + zone de contenu)
      styles/
        theme.css         # Variables CSS : couleurs clair/sombre + accent unique
      components/         # (Phase 2+) composants d'écran (SpaceList, SpaceView, Capture, ...)
/data                  # Données utilisateur — gitignored, jamais commité
  spaces/                # /data/spaces/{space-id}/entries/*.md + /synthesis/*.md
  trash/                 # Entrées/espaces supprimés (soft delete)
/docs
  cahier-des-charges.md
  architecture.md
.env.example
.gitignore
LICENSE
README.md
package.json           # Racine : npm workspaces (app/server, app/client) + script dev commun
```

## Choix d'architecture actés

- **Monorepo npm workspaces** (`app/server`, `app/client`) plutôt que deux repos séparés : un seul `npm install` / `npm run dev` à la racine, cohérent avec l'esprit "petit outil perso".
- **Identifiants stables pour les espaces** : chaque espace a un `id` interne stable (indépendant du `folder_name` affiché), pour que le renommage d'un espace (§11 du cahier des charges) ne casse jamais les liens vers les entrées déjà stockées.
- **Index SQLite = cache, jamais source de vérité** : reconstructible à tout moment à partir des fichiers `.md` (`schema.sql` documente les tables ; le service de reconstruction viendra en Phase 2).
- **Séparation stricte réseau/local** : le serveur Express ne fait d'appel réseau que pour l'API Claude (texte transcrit uniquement) ; whisper.cpp tourne en sous-processus local, jamais d'audio envoyé à un tiers.
- **Une seule couleur d'accent** définie comme variable CSS (`--accent`), déclinée en clair/sombre — reste de la palette en nuances de gris (voir `src/styles/theme.css`).

## Schéma SQLite (proposition, `app/server/src/db/schema.sql`)

Trois tables couvrent les besoins de recherche/filtre du MVP :

- `spaces` : id stable, nom d'affichage, nom de dossier, statut archivé.
- `entries` : miroir indexé des fichiers `.md` d'entrées (espace, type, date, source, chemin fichier, contenu pour recherche full-text).
- `syntheses` : historique versionné des synthèses par espace, avec un flag `is_current`.

Le détail est commenté directement dans le fichier `schema.sql`.

## Ce qui n'est pas encore fait (volontairement)

- Aucune route API ni service métier (CRUD espaces/entrées, génération markdown, reconstruction d'index) — Phase 2.
- Aucune intégration whisper.cpp ni Claude — Phases 3 et 4.
- Aucun composant d'écran réel (juste un layout vide) — Phase 2+.
- Aucun cron — Phase 4.

Ce document sera mis à jour à chaque phase pour rester le reflet de l'état réel du code.

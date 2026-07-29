# Architecture — Cherry

Ce document traduit le [cahier des charges](./cahier-des-charges.md) en structure de projet concrète. Il décrit le squelette posé à ce stade et la façon dont les briques restantes viendront s'y greffer.

## Découpage en phases

Le repo est scaffoldé en une fois, mais l'implémentation se fera par étapes pour limiter le risque (notamment sur whisper.cpp, qui dépend d'un binaire + modèle local, et sur l'intégration Claude, qui dépend d'une clé API) :

1. **Phase 1 — Socle** ✅ : structure de repo, serveur Express minimal, client React/Vite minimal, schéma SQLite, gitignore/env/licence/README. Aucune logique métier.
2. **Phase 2 — Cœur fonctionnel** ✅ : espaces (créer/lister/consulter), capture texte, stockage Markdown, index SQLite régénéré à chaque écriture, archive chronologique, édition et suppression (corbeille) d'entrées, écrans 1 et 2 branchés sur l'API. Pas de vocal ni d'IA — la synthèse affiche un message d'attente.
3. **Phase 3 — Capture vocale** ✅ : enregistrement audio navigateur (MediaRecorder) + transcription locale (whisper.cpp en sous-processus, audio converti via ffmpeg). Repli sur la saisie manuelle si la transcription échoue.
4. **Phase 4 — IA** ✅ : synthèse via un fournisseur interchangeable (API Claude *ou* Ollama en local), historique versionné des synthèses, resynthétisation manuelle + cron automatique.
5. **Phase 5 — Compléments** : vue transversale, recherche full-text, corbeille consultable depuis l'UI, écran paramètres, renommage/archivage d'espace depuis l'UI, bascule clair/sombre manuelle.

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
      routes/            # routes API REST par ressource (spaces, entries ; synthesis viendra en Phase 4)
      services/          # logique métier (spaces, entries, reindex ; synthèse/transcription en Phase 3-4)
      lib/               # helpers partagés (chemins disque, slug, constantes de types)
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

## Implémentation Phase 2

- **Espace = dossier stable** : `id` d'espace = slug du nom à la création (`data/spaces/{id}/`), qui **ne change jamais**, même en cas de renommage — le nom affiché vit dans `meta.json` (`{ id, name, createdAt, archived }`) à la racine du dossier de l'espace. Les collisions de slug sont résolues par suffixe `-2`, `-3`, etc.
- **Entrée = fichier Markdown** : nommé `YYYY-MM-DD-HHmmss-mmm.md` (précision milliseconde ; un suffixe aléatoire est ajouté dans le cas extrême d'une collision). Front-matter géré par `gray-matter`. L'id public d'une entrée exposé par l'API est `{spaceId}__{nomFichierSansExtension}`.
- **Index toujours reconstruit** : `reindexAll()` (dans `services/reindex.js`) vide et repeuple entièrement les tables `spaces`/`entries` à partir du disque — appelé au démarrage du serveur et après chaque mutation (créer/éditer/supprimer). Pas de synchronisation incrémentale : plus simple, et garantit qu'un `index.sqlite` corrompu ou supprimé se répare tout seul au redémarrage suivant (§11 du cahier des charges).
- **Suppression = déplacement vers `/data/trash/{spaceId}/entries/`**, jamais un `rm` définitif.
- **API REST** : `GET/POST /api/spaces`, `GET/PATCH /api/spaces/:id`, `GET/POST /api/entries` (création + liste filtrée par `?spaceId=`), `GET/PATCH/DELETE /api/entries/:id`, `GET /api/entry-types` (source unique de vérité pour la liste fermée de tags, partagée par le formulaire de capture).
- **Frontend** : contexte React `SpacesProvider` partagé par la sidebar et l'écran d'accueil ; chaque écran garde un compteur de requête (`requestIdRef`) pour ignorer une réponse réseau arrivée en retard et éviter d'écraser un état plus récent par un état périmé.

## Implémentation Phase 3 (voix) & Phase 4 (IA)

- **Fournisseur de synthèse interchangeable** : `services/synthesis-providers/{claude,ollama}.js`, choisi via `SYNTHESIS_PROVIDER` (`.env`). Les deux exposent la même fonction `generate({ systemPrompt, userPrompt })` — `services/synthesis-providers/index.js` fait le dispatch. Claude passe par `@anthropic-ai/sdk` ; Ollama appelle `POST {OLLAMA_BASE_URL}/api/chat` en HTTP local, sans SDK.
- **Synthèse = fichier Markdown versionné** : `services/synthesis.js` construit le prompt à partir de l'historique chronologique des entrées (`listEntries` inversé), écrit un fichier horodaté dans `data/spaces/{id}/synthesis/` **et** une copie dans `current.md` (pointeur). Rien n'écrase une version précédente — l'historique complet reste consultable via `GET /api/spaces/:id/synthesis`.
- **Cron** : `services/cron.js` planifie `generateSynthesis()` pour chaque espace non-archivé et non-vide, selon `SYNTHESIS_CRON` (`node-cron`, hebdo par défaut). Une erreur sur un espace (ex : Ollama éteint) n'interrompt pas les autres.
- **Voix → texte, 100% local** : le micro est capturé côté navigateur (`MediaRecorder`), l'audio est envoyé tel quel au serveur (`POST /api/transcribe`, corps brut), converti en WAV 16kHz mono par `ffmpeg`, puis transcrit par un sous-processus `whisper-cli` (`services/transcription.js`). Aucun octet audio ne transite par un service tiers.
- **Installation de whisper.cpp** : `npm run setup:whisper` (`scripts/setup-whisper.sh`) clone + compile whisper.cpp dans `vendor/whisper.cpp` (gitignored, jamais commité — binaire spécifique à la machine) et télécharge le modèle choisi. Les chemins par défaut dans `config.js` pointent vers ce dossier ; `WHISPER_BINARY_PATH`/`WHISPER_MODEL_PATH` permettent de pointer ailleurs (ex : install Homebrew).
- **Erreurs traitées comme des états, pas des crashs** (§11 du cahier des charges) : clé Claude manquante, Ollama injoignable, binaire/modèle whisper absent, ffmpeg en échec → toujours une erreur HTTP explicite affichée dans l'UI, jamais un blocage de la capture texte. La zone de texte reste éditable même après un échec de transcription.

## Ce qui n'est pas encore fait (volontairement)

- Pas de vue transversale, recherche full-text, renommage/archivage d'espace depuis l'UI, corbeille consultable, écran paramètres (choix du fournisseur de synthèse, taille whisper, thème... actuellement tout se configure via `.env`), ni de bascule clair/sombre manuelle — Phase 5.

Ce document sera mis à jour à chaque phase pour rester le reflet de l'état réel du code.

# Cherry

Cherry est une app de "second brain" pour la prise de note dynamique : capture rapide (texte ou vocal) organisée par espaces thématiques, avec une synthèse "du moment" régénérée automatiquement et une archive chronologique qui ne perd jamais rien.

MVP pensé comme une app web locale (Mac), sans dépendance à un service tiers pour le stockage : toutes les données restent sur ta machine.

➡️ Cahier des charges complet : [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md)
➡️ Architecture technique : [`docs/architecture.md`](docs/architecture.md)

## État du projet

En cours de construction, par phases (voir `docs/architecture.md`). À ce stade : squelette de repo uniquement (pas encore de fonctionnalité).

## Confidentialité

- Les notes (texte + audio) restent en local, dans `/data` (jamais versionné, jamais envoyé nulle part).
- Seul le **texte transcrit** transite vers l'API Claude, pour l'auto-tagging et la synthèse — jamais l'audio brut.
- La transcription vocale se fait 100% en local via Whisper (whisper.cpp), sans appel réseau.

## Stack

- Backend : Node.js + Express
- Frontend : React + Vite
- Stockage : fichiers Markdown (source de vérité) + index SQLite régénérable (`better-sqlite3`)
- Transcription vocale locale : whisper.cpp
- Synthèse & auto-tagging : API Claude (`@anthropic-ai/sdk`)

## Installation locale

Prérequis : Node.js ≥ 20.

```bash
git clone <url-du-repo>
cd cherry
cp .env.example .env   # puis renseigne ta clé API Claude dans .env
npm install
npm run dev
```

Le serveur backend et le client frontend démarrent ensemble. L'app est accessible sur `http://localhost:5173` (le frontend proxy les appels API vers le backend sur `http://localhost:3001`).

## Structure du repo

```
/app          # code source (backend Express + frontend React/Vite)
/data         # tes notes (gitignored, jamais commité)
/docs         # cahier des charges, architecture, captures d'écran
.env.example  # modèle de config sans clé réelle
```

## Licence

MIT — voir [`LICENSE`](LICENSE).

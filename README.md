# Cherry

Cherry est une app de "second brain" pour la prise de note dynamique : capture rapide (texte ou vocal) organisée par espaces thématiques, avec une synthèse "du moment" régénérée automatiquement et une archive chronologique qui ne perd jamais rien.

MVP pensé comme une app web locale (Mac), sans dépendance à un service tiers pour le stockage : toutes les données restent sur ta machine.

➡️ Cahier des charges complet : [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md)
➡️ Architecture technique : [`docs/architecture.md`](docs/architecture.md)

## État du projet

En cours de construction, par phases (voir `docs/architecture.md`). À ce stade : espaces, capture texte/vocale, archive chronologique, et synthèse IA (Claude ou 100% locale via Ollama) sont fonctionnels. Reste à venir : vue transversale, recherche, écran paramètres.

## Confidentialité

- Les notes (texte + audio) restent en local, dans `/data` (jamais versionné, jamais envoyé nulle part).
- La transcription vocale se fait 100% en local via whisper.cpp — l'audio brut ne quitte jamais la machine.
- Pour la synthèse, deux options :
  - **API Claude** : seul le **texte** (jamais l'audio) transite vers Anthropic.
  - **Ollama en local** : rien ne quitte la machine, tout tourne sur un modèle installé localement.

## Stack

- Backend : Node.js + Express
- Frontend : React + Vite
- Stockage : fichiers Markdown (source de vérité) + index SQLite régénérable (`better-sqlite3`)
- Transcription vocale locale : whisper.cpp (sous-processus, converti via ffmpeg)
- Synthèse : fournisseur interchangeable — API Claude (`@anthropic-ai/sdk`) ou Ollama en local (HTTP)

## Installation locale

Prérequis : Node.js ≥ 20, [ffmpeg](https://ffmpeg.org) (`brew install ffmpeg`).

```bash
git clone <url-du-repo>
cd cherry
cp .env.example .env
npm install
```

### Synthèse : Claude ou local (Ollama) ?

Dans `.env`, choisis `SYNTHESIS_PROVIDER` :

- `claude` (par défaut) : renseigne `ANTHROPIC_API_KEY`. Meilleure qualité, nécessite internet.
- `ollama` : 100% local et privé. Installe [Ollama](https://ollama.com), lance `ollama pull llama3.1` puis `ollama serve`. Ajuste `OLLAMA_MODEL` si tu utilises un autre modèle.

Tu peux changer d'avis à tout moment en changeant `SYNTHESIS_PROVIDER` (pas besoin de migrer quoi que ce soit — les synthèses déjà générées restent lisibles, chacune garde une trace de son fournisseur).

### Capture vocale (whisper.cpp)

```bash
npm run setup:whisper            # clone + compile whisper.cpp, télécharge le modèle "base"
npm run setup:whisper -- small    # ou une autre taille : tiny | base | small
```

Ce script installe whisper.cpp dans `vendor/whisper.cpp` (gitignored — binaire compilé localement, jamais commité). Si tu préfères une install existante (ex: Homebrew), renseigne `WHISPER_BINARY_PATH` et `WHISPER_MODEL_PATH` dans `.env` à la place.

### Lancer l'app

```bash
npm run dev
```

Le serveur backend et le client frontend démarrent ensemble. L'app est accessible sur `http://localhost:5173` (le frontend proxy les appels API vers le backend sur `http://localhost:3001`).

## Structure du repo

```
/app          # code source (backend Express + frontend React/Vite)
/data         # tes notes (gitignored, jamais commité)
/docs         # cahier des charges, architecture, captures d'écran
/scripts      # setup-whisper.sh
/vendor       # whisper.cpp cloné/compilé localement (gitignored)
.env.example  # modèle de config sans clé réelle
```

## Licence

MIT — voir [`LICENSE`](LICENSE).

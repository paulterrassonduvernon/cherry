-- Index SQLite pour Cherry.
--
-- Cet index est un CACHE : il sert uniquement à la recherche et aux filtres
-- rapides depuis l'UI. Les fichiers Markdown dans /data/spaces restent la
-- seule source de vérité. En cas de corruption ou de suppression de ce
-- fichier, l'index doit pouvoir être entièrement reconstruit à partir des
-- .md au démarrage suivant (voir §11 du cahier des charges).

-- Un espace. `id` est un identifiant stable et interne, indépendant du nom
-- affiché ou du nom de dossier sur disque, pour que renommer un espace ne
-- casse jamais les liens vers ses entrées déjà stockées.
CREATE TABLE IF NOT EXISTS spaces (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  folder_name TEXT NOT NULL UNIQUE,
  archived    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

-- Une entrée = miroir indexé d'un fichier .md dans /data/spaces/{folder}/entries/.
CREATE TABLE IF NOT EXISTS entries (
  id        TEXT PRIMARY KEY,
  space_id  TEXT NOT NULL REFERENCES spaces(id),
  type      TEXT NOT NULL CHECK (type IN ('action', 'réflexion', 'conviction', 'idée')),
  source    TEXT NOT NULL CHECK (source IN ('voice', 'text')),
  date      TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  content   TEXT NOT NULL,
  deleted   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_entries_space ON entries (space_id);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries (type);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries (date);

-- Historique versionné des synthèses par espace. `is_current` marque la
-- dernière version en date (miroir de synthesis/current.md).
CREATE TABLE IF NOT EXISTS syntheses (
  id           TEXT PRIMARY KEY,
  space_id     TEXT NOT NULL REFERENCES spaces(id),
  file_path    TEXT NOT NULL UNIQUE,
  generated_at TEXT NOT NULL,
  is_current   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_syntheses_space ON syntheses (space_id);

-- Recherche plein texte sur le contenu des entrées (Phase 5).
CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
  content,
  content = 'entries',
  content_rowid = 'rowid'
);

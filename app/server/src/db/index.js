import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

const schemaPath = path.join(import.meta.dirname, "schema.sql");

let db;

export function getDb() {
  if (!db) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    db = new Database(path.join(config.dataDir, "index.sqlite"));
    db.pragma("journal_mode = WAL");
    db.exec(fs.readFileSync(schemaPath, "utf-8"));
  }
  return db;
}

// The SQLite index is a disposable cache of what's on disk under
// /data/spaces. Rebuilding it from scratch on every boot is the simplest way
// to guarantee it never drifts from the Markdown source of truth (see §11 of
// the spec: index corruption/loss must self-heal on next startup).
export function rebuildIndex({ listSpacesFromDisk, listEntriesFromDisk }) {
  const database = getDb();
  const spaces = listSpacesFromDisk();

  const insertSpace = database.prepare(
    `INSERT INTO spaces (id, name, folder_name, archived, created_at)
     VALUES (@id, @name, @folderName, @archived, @createdAt)`
  );
  const insertEntry = database.prepare(
    `INSERT INTO entries (id, space_id, type, source, date, file_path, content, deleted)
     VALUES (@id, @spaceId, @type, @source, @date, @filePath, @content, @deleted)`
  );

  const rebuild = database.transaction(() => {
    database.exec("DELETE FROM entries; DELETE FROM spaces;");
    for (const space of spaces) {
      insertSpace.run({
        id: space.id,
        name: space.name,
        folderName: space.id,
        archived: space.archived ? 1 : 0,
        createdAt: space.createdAt,
      });
      for (const entry of listEntriesFromDisk(space.id)) {
        insertEntry.run({
          id: entry.id,
          spaceId: space.id,
          type: entry.type,
          source: entry.source,
          date: entry.date,
          filePath: entry.filePath,
          content: entry.content,
          deleted: 0,
        });
      }
    }
  });

  rebuild();
}

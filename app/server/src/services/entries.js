import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { config } from "../config.js";
import { ENTRY_TYPES, ENTRY_SOURCES } from "../lib/constants.js";
import { entriesDir, trashEntriesDir } from "../lib/paths.js";
import { timestampFilename } from "../lib/timestamp.js";
import { spaceExistsOnDisk } from "./spaces.js";
import { getDb } from "../db/index.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function assertSpaceExists(spaceId) {
  if (!spaceExistsOnDisk(spaceId)) {
    throw httpError(404, `Espace "${spaceId}" introuvable`);
  }
}

function assertValidType(type) {
  if (!ENTRY_TYPES.includes(type)) {
    throw httpError(400, `Type invalide. Valeurs autorisées : ${ENTRY_TYPES.join(", ")}`);
  }
}

function toEntryId(spaceId, filenameBase) {
  return `${spaceId}__${filenameBase}`;
}

function parseEntryId(id) {
  const sep = id.indexOf("__");
  if (sep === -1) throw httpError(400, `Identifiant d'entrée invalide: "${id}"`);
  return { spaceId: id.slice(0, sep), filenameBase: id.slice(sep + 2) };
}

// Used by the index rebuild — reads directly from disk, no DB involved.
export function listEntriesFromDisk(spaceId) {
  const dir = entriesDir(spaceId);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const absPath = path.join(dir, name);
      const { data, content } = matter(fs.readFileSync(absPath, "utf-8"));
      return {
        id: toEntryId(spaceId, path.basename(name, ".md")),
        type: data.type,
        source: data.source,
        date: data.date,
        filePath: path.relative(config.dataDir, absPath),
        content: content.trim(),
      };
    });
}

export function listEntries(spaceId) {
  assertSpaceExists(spaceId);
  return getDb()
    .prepare(
      `SELECT id, space_id AS spaceId, type, source, date, content
       FROM entries WHERE space_id = ? AND deleted = 0 ORDER BY date DESC`
    )
    .all(spaceId);
}

export function getEntry(id) {
  const row = getDb()
    .prepare(
      `SELECT id, space_id AS spaceId, type, source, date, content
       FROM entries WHERE id = ? AND deleted = 0`
    )
    .get(id);
  if (!row) throw httpError(404, `Entrée "${id}" introuvable`);
  return row;
}

export function createEntry({ spaceId, type, content, source = "text" }) {
  assertSpaceExists(spaceId);
  assertValidType(type);
  if (!ENTRY_SOURCES.includes(source)) throw httpError(400, `Source invalide: "${source}"`);
  const trimmed = (content || "").trim();
  if (!trimmed) throw httpError(400, "Le contenu de l'entrée ne peut pas être vide.");

  const dir = entriesDir(spaceId);
  fs.mkdirSync(dir, { recursive: true });

  const now = new Date();
  let filenameBase = timestampFilename(now);
  while (fs.existsSync(path.join(dir, `${filenameBase}.md`))) {
    filenameBase += `-${Math.random().toString(36).slice(2, 6)}`;
  }

  const date = now.toISOString();
  const fileContents = matter.stringify(trimmed, { date, type, space: spaceId, source });
  fs.writeFileSync(path.join(dir, `${filenameBase}.md`), fileContents);

  return toEntryId(spaceId, filenameBase);
}

export function updateEntry(id, { content, type }) {
  const { spaceId, filenameBase } = parseEntryId(id);
  assertSpaceExists(spaceId);
  const filePath = path.join(entriesDir(spaceId), `${filenameBase}.md`);
  if (!fs.existsSync(filePath)) throw httpError(404, `Entrée "${id}" introuvable`);

  const existing = matter(fs.readFileSync(filePath, "utf-8"));
  const nextType = type ?? existing.data.type;
  assertValidType(nextType);
  const nextContent = (content ?? existing.content).trim();
  if (!nextContent) throw httpError(400, "Le contenu de l'entrée ne peut pas être vide.");

  const fileContents = matter.stringify(nextContent, { ...existing.data, type: nextType });
  fs.writeFileSync(filePath, fileContents);
}

export function deleteEntry(id) {
  const { spaceId, filenameBase } = parseEntryId(id);
  assertSpaceExists(spaceId);
  const filePath = path.join(entriesDir(spaceId), `${filenameBase}.md`);
  if (!fs.existsSync(filePath)) throw httpError(404, `Entrée "${id}" introuvable`);

  const trashDir = trashEntriesDir(spaceId);
  fs.mkdirSync(trashDir, { recursive: true });
  let trashPath = path.join(trashDir, `${filenameBase}.md`);
  if (fs.existsSync(trashPath)) {
    trashPath = path.join(trashDir, `${filenameBase}-${Date.now()}.md`);
  }
  fs.renameSync(filePath, trashPath);
}

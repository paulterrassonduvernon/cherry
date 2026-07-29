import fs from "node:fs";
import { slugify } from "../lib/slug.js";
import { spacesRoot, spaceDir, metaPath, entriesDir, synthesisDir } from "../lib/paths.js";
import { getDb } from "../db/index.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function readMeta(spaceId) {
  return JSON.parse(fs.readFileSync(metaPath(spaceId), "utf-8"));
}

function writeMeta(spaceId, meta) {
  fs.writeFileSync(metaPath(spaceId), JSON.stringify(meta, null, 2));
}

export function spaceExistsOnDisk(spaceId) {
  return fs.existsSync(metaPath(spaceId));
}

function assertSpaceExists(spaceId) {
  if (!spaceExistsOnDisk(spaceId)) {
    throw httpError(404, `Espace "${spaceId}" introuvable`);
  }
}

// Used by the index rebuild — reads directly from disk, no DB involved.
export function listSpacesFromDisk() {
  fs.mkdirSync(spacesRoot(), { recursive: true });
  return fs
    .readdirSync(spacesRoot(), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && spaceExistsOnDisk(entry.name))
    .map((entry) => readMeta(entry.name));
}

function withActivity(meta) {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS entryCount, MAX(date) AS lastEntryAt
       FROM entries WHERE space_id = ? AND deleted = 0`
    )
    .get(meta.id);
  return {
    ...meta,
    entryCount: row.entryCount,
    lastActivityAt: row.lastEntryAt || meta.createdAt,
  };
}

export function listSpaces() {
  return listSpacesFromDisk()
    .map(withActivity)
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

export function getSpace(spaceId) {
  assertSpaceExists(spaceId);
  return withActivity(readMeta(spaceId));
}

export function createSpace(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) throw httpError(400, "Le nom de l'espace ne peut pas être vide.");

  fs.mkdirSync(spacesRoot(), { recursive: true });
  const base = slugify(trimmed);
  let id = base;
  let suffix = 2;
  while (spaceExistsOnDisk(id)) {
    id = `${base}-${suffix++}`;
  }

  fs.mkdirSync(entriesDir(id), { recursive: true });
  fs.mkdirSync(synthesisDir(id), { recursive: true });
  writeMeta(id, {
    id,
    name: trimmed,
    createdAt: new Date().toISOString(),
    archived: false,
  });

  return id;
}

export function renameSpace(spaceId, name) {
  assertSpaceExists(spaceId);
  const trimmed = (name || "").trim();
  if (!trimmed) throw httpError(400, "Le nom de l'espace ne peut pas être vide.");
  const meta = readMeta(spaceId);
  meta.name = trimmed;
  writeMeta(spaceId, meta);
}

export function setSpaceArchived(spaceId, archived) {
  assertSpaceExists(spaceId);
  const meta = readMeta(spaceId);
  meta.archived = !!archived;
  writeMeta(spaceId, meta);
}

export { assertSpaceExists };

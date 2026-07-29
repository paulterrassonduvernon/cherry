import path from "node:path";
import { config } from "../config.js";

export const spacesRoot = () => path.join(config.dataDir, "spaces");
export const spaceDir = (spaceId) => path.join(spacesRoot(), spaceId);
export const metaPath = (spaceId) => path.join(spaceDir(spaceId), "meta.json");
export const entriesDir = (spaceId) => path.join(spaceDir(spaceId), "entries");
export const synthesisDir = (spaceId) => path.join(spaceDir(spaceId), "synthesis");

export const trashRoot = () => path.join(config.dataDir, "trash");
export const trashEntriesDir = (spaceId) => path.join(trashRoot(), spaceId, "entries");

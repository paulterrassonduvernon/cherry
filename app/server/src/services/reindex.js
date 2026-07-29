import { rebuildIndex } from "../db/index.js";
import { listSpacesFromDisk } from "./spaces.js";
import { listEntriesFromDisk } from "./entries.js";

// Called at startup and after every write, so the SQLite cache always
// matches what's on disk under /data/spaces (see docs/architecture.md).
export function reindexAll() {
  rebuildIndex({ listSpacesFromDisk, listEntriesFromDisk });
}

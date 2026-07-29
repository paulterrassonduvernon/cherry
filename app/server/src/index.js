import express from "express";
import { config } from "./config.js";
import { ENTRY_TYPES } from "./lib/constants.js";
import { reindexAll } from "./services/reindex.js";
import { startSynthesisCron } from "./services/cron.js";
import spacesRouter from "./routes/spaces.js";
import entriesRouter from "./routes/entries.js";
import transcribeRouter from "./routes/transcribe.js";

// The SQLite index is disposable — always rebuild it from the Markdown
// files on disk at boot, so a corrupted/deleted index.sqlite self-heals.
reindexAll();
startSynthesisCron();

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/entry-types", (_req, res) => {
  res.json(ENTRY_TYPES);
});

app.use("/api/spaces", spacesRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/transcribe", transcribeRouter);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || "Erreur interne" });
});

app.listen(config.port, () => {
  console.log(`Cherry server listening on http://localhost:${config.port}`);
});

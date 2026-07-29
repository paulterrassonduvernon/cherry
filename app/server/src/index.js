import express from "express";
import { config } from "./config.js";

const app = express();
app.use(express.json());

// TODO (Phase 2): mount real API routes (spaces, entries, synthesis) under /api.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`Cherry server listening on http://localhost:${config.port}`);
});

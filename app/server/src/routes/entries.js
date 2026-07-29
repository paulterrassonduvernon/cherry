import { Router } from "express";
import * as entries from "../services/entries.js";
import { reindexAll } from "../services/reindex.js";

const router = Router();

router.get("/", (req, res, next) => {
  try {
    const { spaceId } = req.query;
    if (!spaceId) return res.status(400).json({ error: "Le paramètre spaceId est requis." });
    res.json(entries.listEntries(spaceId));
  } catch (err) {
    next(err);
  }
});

router.post("/", (req, res, next) => {
  try {
    const { spaceId, type, content, source } = req.body || {};
    const id = entries.createEntry({ spaceId, type, content, source });
    reindexAll();
    res.status(201).json(entries.getEntry(id));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    res.json(entries.getEntry(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", (req, res, next) => {
  try {
    entries.updateEntry(req.params.id, req.body || {});
    reindexAll();
    res.json(entries.getEntry(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    entries.deleteEntry(req.params.id);
    reindexAll();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

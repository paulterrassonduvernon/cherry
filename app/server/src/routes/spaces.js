import { Router } from "express";
import * as spaces from "../services/spaces.js";
import { reindexAll } from "../services/reindex.js";
import { generateSynthesis, getCurrentSynthesis, listSynthesisHistory } from "../services/synthesis.js";

const router = Router();

router.get("/", (_req, res, next) => {
  try {
    res.json(spaces.listSpaces());
  } catch (err) {
    next(err);
  }
});

router.post("/", (req, res, next) => {
  try {
    const id = spaces.createSpace(req.body?.name);
    reindexAll();
    res.status(201).json(spaces.getSpace(id));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    res.json(spaces.getSpace(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", (req, res, next) => {
  try {
    const { name, archived } = req.body || {};
    if (name !== undefined) spaces.renameSpace(req.params.id, name);
    if (archived !== undefined) spaces.setSpaceArchived(req.params.id, archived);
    reindexAll();
    res.json(spaces.getSpace(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/synthesis", (req, res, next) => {
  try {
    spaces.getSpace(req.params.id); // 404 if missing
    res.json({
      current: getCurrentSynthesis(req.params.id),
      history: listSynthesisHistory(req.params.id),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/synthesis", async (req, res, next) => {
  try {
    await generateSynthesis(req.params.id);
    res.status(201).json({
      current: getCurrentSynthesis(req.params.id),
      history: listSynthesisHistory(req.params.id),
    });
  } catch (err) {
    next(err);
  }
});

export default router;

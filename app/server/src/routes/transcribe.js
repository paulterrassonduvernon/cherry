import { Router } from "express";
import express from "express";
import { transcribeAudio } from "../services/transcription.js";

const router = Router();

router.post("/", express.raw({ type: () => true, limit: "25mb" }), async (req, res, next) => {
  try {
    if (!req.body || !req.body.length) {
      return res.status(400).json({ error: "Aucun audio reçu." });
    }
    const text = await transcribeAudio(req.body);
    res.json({ text });
  } catch (err) {
    next(err);
  }
});

export default router;

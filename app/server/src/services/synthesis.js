import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { config } from "../config.js";
import { synthesisDir } from "../lib/paths.js";
import { timestampFilename } from "../lib/timestamp.js";
import { getSpace } from "./spaces.js";
import { listEntries } from "./entries.js";
import { generateSynthesisText } from "./synthesis-providers/index.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function buildPrompt(spaceName, entriesChronological) {
  const entriesBlock = entriesChronological.map((e) => `- [${e.date}] (${e.type}) ${e.content}`).join("\n");

  const systemPrompt =
    "Tu es un assistant qui aide à synthétiser l'état actuel de la réflexion d'un utilisateur sur un sujet donné, " +
    "à partir d'un historique chronologique de notes courtes (tags : action, réflexion, conviction, idée). " +
    "Réponds uniquement avec la synthèse elle-même, en français, au format Markdown, sans préambule ni méta-commentaire.";

  const userPrompt = [
    `Espace : ${spaceName}`,
    "",
    "Voici l'historique chronologique des notes de cet espace (de la plus ancienne à la plus récente) :",
    "",
    entriesBlock,
    "",
    "Rédige une synthèse concise de l'état ACTUEL de la réflexion sur ce sujet : dégage les grandes lignes, " +
      "les convictions qui se dégagent, les actions en cours, les idées qui reviennent régulièrement.",
    "Ne fais pas un simple résumé chronologique : capture où en est la pensée MAINTENANT, en tenant compte de ce " +
      "qui a pu évoluer ou être abandonné au fil des entrées.",
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function readSynthesisFile(filePath) {
  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
  return { generatedAt: data.generatedAt, provider: data.provider, content: content.trim() };
}

export function getCurrentSynthesis(spaceId) {
  const currentPath = path.join(synthesisDir(spaceId), "current.md");
  if (!fs.existsSync(currentPath)) return null;
  return readSynthesisFile(currentPath);
}

export function listSynthesisHistory(spaceId) {
  const dir = synthesisDir(spaceId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md") && name !== "current.md")
    .map((name) => ({ id: path.basename(name, ".md"), ...readSynthesisFile(path.join(dir, name)) }))
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export async function generateSynthesis(spaceId) {
  const space = getSpace(spaceId); // throws 404 if missing
  const entries = listEntries(spaceId); // desc by date
  if (entries.length === 0) {
    throw httpError(400, "Cet espace est vide — ajoute au moins une entrée avant de générer une synthèse.");
  }

  const { systemPrompt, userPrompt } = buildPrompt(space.name, [...entries].reverse());
  const text = await generateSynthesisText({ systemPrompt, userPrompt });

  const dir = synthesisDir(spaceId);
  fs.mkdirSync(dir, { recursive: true });
  const now = new Date();
  let base = timestampFilename(now);
  while (fs.existsSync(path.join(dir, `${base}.md`))) {
    base += `-${Math.random().toString(36).slice(2, 6)}`;
  }

  const fileContents = matter.stringify(text.trim(), {
    generatedAt: now.toISOString(),
    provider: config.synthesisProvider,
  });
  fs.writeFileSync(path.join(dir, `${base}.md`), fileContents);
  fs.writeFileSync(path.join(dir, "current.md"), fileContents);

  return getCurrentSynthesis(spaceId);
}

import dotenv from "dotenv";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../../../");

// `npm run dev` (npm workspaces) runs this process with app/server as the
// working directory, not the repo root — so the default `dotenv/config`
// (which loads ".env" relative to process.cwd()) would silently miss the
// root .env and fall back to every default below. Load it explicitly.
dotenv.config({ path: path.join(repoRoot, ".env") });

export const config = {
  port: Number(process.env.PORT) || 3001,
  dataDir: path.resolve(repoRoot, process.env.DATA_DIR || "./data"),

  // Synthesis (Phase 4) — pluggable provider, so synthesis can run either
  // through the Claude API or fully offline through a local Ollama server.
  synthesisProvider: process.env.SYNTHESIS_PROVIDER || "claude",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.1",
  synthesisCron: process.env.SYNTHESIS_CRON || "0 23 * * 0",

  // Voice capture (Phase 3) — whisper.cpp binary + model run as a local
  // subprocess; audio never leaves the machine. Defaults match the layout
  // produced by `npm run setup:whisper` (see scripts/setup-whisper.sh).
  whisperModelSize: process.env.WHISPER_MODEL_SIZE || "base",
  whisperBinaryPath:
    process.env.WHISPER_BINARY_PATH || path.resolve(repoRoot, "vendor/whisper.cpp/build/bin/whisper-cli"),
  whisperModelPath:
    process.env.WHISPER_MODEL_PATH ||
    path.resolve(repoRoot, `vendor/whisper.cpp/models/ggml-${process.env.WHISPER_MODEL_SIZE || "base"}.bin`),
  ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
};

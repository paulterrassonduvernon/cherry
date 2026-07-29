import "dotenv/config";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../../../");

export const config = {
  port: Number(process.env.PORT) || 3001,
  dataDir: path.resolve(repoRoot, process.env.DATA_DIR || "./data"),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
  whisperModelSize: process.env.WHISPER_MODEL_SIZE || "base",
  synthesisCron: process.env.SYNTHESIS_CRON || "0 23 * * 0",
};

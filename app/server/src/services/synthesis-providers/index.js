import * as claude from "./claude.js";
import * as ollama from "./ollama.js";
import { config } from "../../config.js";

const providers = { claude, ollama };

export async function generateSynthesisText({ systemPrompt, userPrompt }) {
  const provider = providers[config.synthesisProvider];
  if (!provider) {
    const err = new Error(
      `Fournisseur de synthèse inconnu : "${config.synthesisProvider}". Valeurs possibles : ${Object.keys(providers).join(", ")}.`
    );
    err.status = 500;
    throw err;
  }
  return provider.generate({ systemPrompt, userPrompt });
}

import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function generate({ systemPrompt, userPrompt }) {
  if (!config.anthropicApiKey) {
    throw httpError(
      503,
      "Clé API Claude manquante. Renseigne ANTHROPIC_API_KEY dans .env, ou passe " +
        'SYNTHESIS_PROVIDER=ollama pour une synthèse 100% locale.'
    );
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  let response;
  try {
    response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (err) {
    throw httpError(503, `API Claude indisponible (pas d'internet ou service en panne) : ${err.message}`);
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  if (!text) throw httpError(502, "Réponse vide de l'API Claude.");
  return text;
}

import { config } from "../../config.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function generate({ systemPrompt, userPrompt }) {
  let response;
  try {
    response = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.ollamaModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });
  } catch {
    throw httpError(
      503,
      `Impossible de contacter Ollama sur ${config.ollamaBaseUrl}. Vérifie qu'Ollama tourne en local ` +
        `("ollama serve") et que le modèle "${config.ollamaModel}" est installé ("ollama pull ${config.ollamaModel}").`
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw httpError(502, `Ollama a répondu avec une erreur (${response.status}): ${body || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.message?.content?.trim();
  if (!text) throw httpError(502, "Réponse vide d'Ollama.");
  return text;
}

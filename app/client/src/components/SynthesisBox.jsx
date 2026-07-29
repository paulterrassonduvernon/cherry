import { useState } from "react";
import { regenerateSynthesis } from "../api.js";

export default function SynthesisBox({ spaceId, synthesis, hasEntries, onRegenerated }) {
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      await regenerateSynthesis(spaceId);
      await onRegenerated();
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  }

  const current = synthesis?.current;
  const history = synthesis?.history || [];
  const previousVersions = history.filter((h) => h.generatedAt !== current?.generatedAt);

  return (
    <section className="synthesis-box">
      <div className="synthesis-header">
        <h3>Synthèse du moment</h3>
        <button type="button" onClick={handleRegenerate} disabled={regenerating || !hasEntries}>
          {regenerating ? "Génération..." : "Resynthétiser"}
        </button>
      </div>

      {!hasEntries && <p className="muted">Ajoute une première entrée pour pouvoir générer une synthèse.</p>}

      {hasEntries && !current && (
        <p className="muted">Aucune synthèse générée pour l'instant — clique sur "Resynthétiser".</p>
      )}

      {current && (
        <>
          <p className="muted synthesis-meta">
            Générée le {formatDateTime(current.generatedAt)} · {current.provider}
          </p>
          <p className="synthesis-content">{current.content}</p>
        </>
      )}

      {error && <p className="error">{error}</p>}

      {previousVersions.length > 0 && (
        <>
          <button type="button" className="link-button" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? "Masquer" : "Voir"} l'historique ({previousVersions.length})
          </button>
          {showHistory && (
            <ul className="synthesis-history">
              {previousVersions.map((version) => (
                <li key={version.id}>
                  <p className="muted synthesis-meta">
                    {formatDateTime(version.generatedAt)} · {version.provider}
                  </p>
                  <p className="synthesis-content">{version.content}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

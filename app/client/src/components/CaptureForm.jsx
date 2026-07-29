import { useEffect, useState } from "react";
import { createEntry } from "../api.js";

export default function CaptureForm({ spaceId, entryTypes, onCreated }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!type && entryTypes.length) setType(entryTypes[0]);
  }, [entryTypes, type]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || !type) return;
    setSubmitting(true);
    setError(null);
    try {
      await createEntry({ spaceId, type, content: content.trim(), source: "text" });
      setContent("");
      await onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="capture-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Note rapide..."
        rows={3}
      />
      <div className="capture-actions">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {entryTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="mic-button"
          disabled
          title="Capture vocale — bientôt disponible (Phase 3)"
        >
          🎙
        </button>
        <button type="submit" disabled={submitting || !content.trim()}>
          Enregistrer
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

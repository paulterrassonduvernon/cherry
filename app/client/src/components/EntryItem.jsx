import { useState } from "react";
import { updateEntry, deleteEntry } from "../api.js";

export default function EntryItem({ entry, entryTypes, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(entry.content);
  const [type, setType] = useState(entry.type);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateEntry(entry.id, { content: content.trim(), type });
      setEditing(false);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer cette entrée ? (déplacée dans la corbeille, jamais perdue)")) return;
    await deleteEntry(entry.id);
    await onChanged();
  }

  return (
    <li className="entry-item">
      <button type="button" className="entry-row" onClick={() => setExpanded((v) => !v)}>
        <span className={`badge`}>{entry.type}</span>
        <span className="entry-excerpt">{excerpt(entry.content)}</span>
        <span className="entry-date muted">{formatDateTime(entry.date)}</span>
      </button>

      {expanded && (
        <div className="entry-detail">
          {editing ? (
            <>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {entryTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
              <div className="entry-actions">
                <button onClick={handleSave} disabled={saving || !content.trim()}>
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setContent(entry.content);
                    setType(entry.type);
                  }}
                  disabled={saving}
                >
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="entry-full-content">{entry.content}</p>
              <div className="entry-actions">
                <button onClick={() => setEditing(true)}>Éditer</button>
                <button onClick={handleDelete} className="danger">
                  Supprimer
                </button>
              </div>
            </>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </li>
  );
}

function excerpt(text) {
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
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

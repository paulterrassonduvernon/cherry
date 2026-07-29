import { useState } from "react";
import { Link } from "react-router-dom";
import { useSpaces } from "../contexts/SpacesContext.jsx";
import { createSpace } from "../api.js";
import QuickCapture from "./QuickCapture.jsx";

export default function SpaceList() {
  const { spaces, loading, error, refresh } = useSpaces();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setFormError(null);
    try {
      await createSpace(name.trim());
      setName("");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h2>Nouvelle note</h2>
      <QuickCapture />

      <h2>Espaces</h2>

      <details className="new-space-details">
        <summary>Créer un espace vide (sans note)</summary>
        <form onSubmit={handleCreate} className="new-space-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nouvel espace (ex: Carrière)"
          />
          <button type="submit" disabled={creating || !name.trim()}>
            Créer
          </button>
        </form>
        {formError && <p className="error">{formError}</p>}
      </details>

      {loading && <p className="muted">Chargement...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && spaces.length === 0 && (
        <p className="muted">Aucun espace pour l'instant — crée le premier ci-dessus.</p>
      )}

      <div className="space-grid">
        {spaces.map((space) => (
          <Link key={space.id} to={`/spaces/${space.id}`} className="space-card">
            <h3>{space.name}</h3>
            <p className="muted">
              {space.entryCount} entrée{space.entryCount === 1 ? "" : "s"} · dernière activité{" "}
              {formatDate(space.lastActivityAt)}
            </p>
            <p className="synthesis-preview muted">Synthèse indisponible pour l'instant.</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

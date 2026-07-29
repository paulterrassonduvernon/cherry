import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSpace, getEntries, getEntryTypes } from "../api.js";
import { useSpaces } from "../contexts/SpacesContext.jsx";
import CaptureForm from "./CaptureForm.jsx";
import EntryItem from "./EntryItem.jsx";

export default function SpaceView() {
  const { id } = useParams();
  const { refresh: refreshSpaces } = useSpaces();
  const [space, setSpace] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entryTypes, setEntryTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Guards against out-of-order responses: two loads can overlap (e.g. a
  // quick second capture right after the first, or React StrictMode's
  // double effect invocation in dev) and an older response resolving last
  // would otherwise silently overwrite newer state.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [spaceData, entriesData, types] = await Promise.all([
        getSpace(id),
        getEntries(id),
        getEntryTypes(),
      ]);
      if (requestIdRef.current !== requestId) return;
      setSpace(spaceData);
      setEntries(entriesData);
      setEntryTypes(types);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err.message);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleChanged() {
    await Promise.all([load(), refreshSpaces()]);
  }

  if (loading && !space) return <p className="muted">Chargement...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!space) return null;

  return (
    <div>
      <Link to="/" className="back-link">
        ← Tous les espaces
      </Link>
      <h2>{space.name}</h2>

      <section className="synthesis-box">
        <h3>Synthèse du moment</h3>
        <p className="muted">
          Synthèse indisponible pour l'instant — arrivera en Phase 4 (API Claude).
        </p>
      </section>

      <CaptureForm spaceId={id} entryTypes={entryTypes} onCreated={handleChanged} />

      <section>
        <h3>Archive ({entries.length})</h3>
        {entries.length === 0 && <p className="muted">Aucune entrée pour l'instant.</p>}
        <ul className="entry-list">
          {entries.map((entry) => (
            <EntryItem key={entry.id} entry={entry} entryTypes={entryTypes} onChanged={handleChanged} />
          ))}
        </ul>
      </section>
    </div>
  );
}

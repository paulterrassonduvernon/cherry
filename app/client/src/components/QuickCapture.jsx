import { useEffect, useState } from "react";
import { createEntry, createSpace, getEntryTypes } from "../api.js";
import { useSpaces } from "../contexts/SpacesContext.jsx";
import { useVoiceCapture } from "../hooks/useVoiceCapture.js";
import VoiceCaptureButton from "./VoiceCaptureButton.jsx";

const NEW_SPACE = "__new__";

// Capture-first, categorize-second: write or record the note, then pick (or
// create) the space it belongs to — no need to navigate into a space before
// jotting something down. Lives on the home screen, one click away from
// anywhere in the app via the "Tous les espaces" sidebar link.
export default function QuickCapture() {
  const { spaces, refresh: refreshSpaces } = useSpaces();
  const [entryTypes, setEntryTypes] = useState([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState("");
  const [source, setSource] = useState("text");
  const [spaceId, setSpaceId] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);

  const { recording, transcribing, voiceError, startRecording, stopRecording } = useVoiceCapture((text) => {
    setContent((prev) => (prev ? `${prev}\n${text}` : text));
    setSource("voice");
  });

  useEffect(() => {
    getEntryTypes().then(setEntryTypes);
  }, []);

  useEffect(() => {
    if (!type && entryTypes.length) setType(entryTypes[0]);
  }, [entryTypes, type]);

  useEffect(() => {
    if (!spaceId) setSpaceId(spaces.length ? spaces[0].id : NEW_SPACE);
  }, [spaces, spaceId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || !type) return;
    if (spaceId === NEW_SPACE && !newSpaceName.trim()) return;

    setSubmitting(true);
    setError(null);
    setSavedMessage(null);
    try {
      let targetSpaceId = spaceId;
      if (spaceId === NEW_SPACE) {
        const space = await createSpace(newSpaceName.trim());
        targetSpaceId = space.id;
      }
      await createEntry({ spaceId: targetSpaceId, type, content: content.trim(), source });
      await refreshSpaces();
      setContent("");
      setSource("text");
      setSpaceId(targetSpaceId);
      setNewSpaceName("");
      const spaceName = spaces.find((s) => s.id === targetSpaceId)?.name || newSpaceName.trim();
      setSavedMessage(`Enregistré dans "${spaceName}".`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="quick-capture">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setSource("text");
          setSavedMessage(null);
        }}
        placeholder="Écris ou dicte une note..."
        rows={3}
        autoFocus
      />
      <div className="capture-actions">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {entryTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)}>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value={NEW_SPACE}>+ Nouvel espace...</option>
        </select>
        <VoiceCaptureButton
          recording={recording}
          transcribing={transcribing}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <button type="submit" disabled={submitting || !content.trim() || (spaceId === NEW_SPACE && !newSpaceName.trim())}>
          Enregistrer
        </button>
      </div>
      {spaceId === NEW_SPACE && (
        <input
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
          placeholder="Nom du nouvel espace"
        />
      )}
      {recording && <p className="muted recording-indicator">● Enregistrement en cours...</p>}
      {transcribing && <p className="muted">Transcription en cours (local, whisper.cpp)...</p>}
      {voiceError && <p className="error">{voiceError}</p>}
      {error && <p className="error">{error}</p>}
      {savedMessage && <p className="muted">✓ {savedMessage}</p>}
    </form>
  );
}

import { useEffect, useState } from "react";
import { createEntry } from "../api.js";
import { useVoiceCapture } from "../hooks/useVoiceCapture.js";
import VoiceCaptureButton from "./VoiceCaptureButton.jsx";

export default function CaptureForm({ spaceId, entryTypes, onCreated }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("");
  const [source, setSource] = useState("text");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { recording, transcribing, voiceError, startRecording, stopRecording } = useVoiceCapture((text) => {
    setContent((prev) => (prev ? `${prev}\n${text}` : text));
    setSource("voice");
  });

  useEffect(() => {
    if (!type && entryTypes.length) setType(entryTypes[0]);
  }, [entryTypes, type]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || !type) return;
    setSubmitting(true);
    setError(null);
    try {
      await createEntry({ spaceId, type, content: content.trim(), source });
      setContent("");
      setSource("text");
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
        onChange={(e) => {
          setContent(e.target.value);
          setSource("text");
        }}
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
        <VoiceCaptureButton
          recording={recording}
          transcribing={transcribing}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <button type="submit" disabled={submitting || !content.trim()}>
          Enregistrer
        </button>
      </div>
      {recording && <p className="muted recording-indicator">● Enregistrement en cours...</p>}
      {transcribing && <p className="muted">Transcription en cours (local, whisper.cpp)...</p>}
      {voiceError && <p className="error">{voiceError}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}

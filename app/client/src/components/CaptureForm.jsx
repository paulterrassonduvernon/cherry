import { useEffect, useRef, useState } from "react";
import { createEntry, transcribeAudio } from "../api.js";

export default function CaptureForm({ spaceId, entryTypes, onCreated }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("");
  const [source, setSource] = useState("text");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!type && entryTypes.length) setType(entryTypes[0]);
  }, [entryTypes, type]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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

  async function startRecording() {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          setContent((prev) => (prev ? `${prev}\n${text}` : text));
          setSource("voice");
        } catch (err) {
          setVoiceError(`${err.message} Tu peux saisir le texte manuellement en attendant.`);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch (err) {
      setVoiceError(`Impossible d'accéder au micro : ${err.message}`);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
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
        <button
          type="button"
          className={`mic-button${recording ? " recording" : ""}`}
          onClick={recording ? stopRecording : startRecording}
          disabled={transcribing}
          title={recording ? "Arrêter l'enregistrement" : "Capture vocale"}
        >
          {recording ? "⏹" : "🎙"}
        </button>
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

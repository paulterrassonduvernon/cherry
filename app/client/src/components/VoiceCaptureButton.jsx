export default function VoiceCaptureButton({ recording, transcribing, onStart, onStop }) {
  return (
    <button
      type="button"
      className={`mic-button${recording ? " recording" : ""}`}
      onClick={recording ? onStop : onStart}
      disabled={transcribing}
      title={recording ? "Arrêter l'enregistrement" : "Capture vocale"}
    >
      {recording ? "⏹" : "🎙"}
    </button>
  );
}

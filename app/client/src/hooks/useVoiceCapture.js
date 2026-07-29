import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../api.js";

// Shared MediaRecorder + whisper.cpp transcription flow, used by both the
// per-space capture form and the frictionless quick-capture on the home
// screen so the recording logic only lives in one place.
export function useVoiceCapture(onTranscribed) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
          onTranscribed(text);
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

  return { recording, transcribing, voiceError, startRecording, stopRecording };
}

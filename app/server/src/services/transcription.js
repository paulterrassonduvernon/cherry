import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { config } from "../config.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(command, args);
    } catch (err) {
      reject(httpError(503, `Impossible de lancer "${command}": ${err.message}`));
      return;
    }
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => {
      reject(httpError(503, `Impossible de lancer "${command}": ${err.message}`));
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(httpError(502, `"${command}" a échoué (code ${code}): ${(stderr || stdout).trim()}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Converts whatever the browser recorded (webm/opus) into the 16kHz mono WAV
// whisper.cpp expects, then runs the transcription as a local subprocess.
// The raw audio never leaves the machine — no network call happens here.
export async function transcribeAudio(audioBuffer) {
  if (!fs.existsSync(config.whisperBinaryPath)) {
    throw httpError(
      503,
      `Binaire whisper.cpp introuvable à "${config.whisperBinaryPath}". Lance "npm run setup:whisper" pour ` +
        `l'installer, ou renseigne WHISPER_BINARY_PATH dans .env.`
    );
  }
  if (!fs.existsSync(config.whisperModelPath)) {
    throw httpError(
      503,
      `Modèle whisper introuvable à "${config.whisperModelPath}". Lance "npm run setup:whisper" pour le ` +
        `télécharger, ou renseigne WHISPER_MODEL_PATH dans .env.`
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cherry-voice-"));
  const inputPath = path.join(tmpDir, "input.webm");
  const wavPath = path.join(tmpDir, "audio.wav");

  try {
    fs.writeFileSync(inputPath, audioBuffer);

    try {
      await runCommand(config.ffmpegPath, ["-y", "-i", inputPath, "-ar", "16000", "-ac", "1", wavPath]);
    } catch (err) {
      err.message = `Conversion audio impossible (ffmpeg) : ${err.message}`;
      throw err;
    }

    let stdout;
    try {
      ({ stdout } = await runCommand(config.whisperBinaryPath, [
        "-m",
        config.whisperModelPath,
        "-f",
        wavPath,
        "-l",
        "auto",
        "-nt",
        "-np",
      ]));
    } catch (err) {
      err.message = `Transcription impossible (whisper.cpp) : ${err.message}`;
      throw err;
    }

    const text = stdout.trim();
    if (!text) {
      throw httpError(422, "Aucun texte détecté dans l'enregistrement — réessaie ou saisis le texte manuellement.");
    }
    return text;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

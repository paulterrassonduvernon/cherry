#!/usr/bin/env bash
# Clones, builds, and downloads a model for whisper.cpp (local, offline voice
# transcription — see docs/cahier-des-charges.md §6). Safe to re-run.
#
# Usage: npm run setup:whisper -- [tiny|base|small]   (defaults to "base")
set -euo pipefail

MODEL_SIZE="${1:-base}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$REPO_ROOT/vendor/whisper.cpp"

for cmd in git cmake make; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Erreur : '$cmd' est requis mais introuvable. Installe-le puis relance ce script." >&2
    exit 1
  fi
done

if [ -d "$VENDOR_DIR" ]; then
  echo "whisper.cpp déjà cloné dans $VENDOR_DIR — mise à jour..."
  git -C "$VENDOR_DIR" pull --ff-only
else
  echo "Clonage de whisper.cpp dans $VENDOR_DIR..."
  git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git "$VENDOR_DIR"
fi

echo "Compilation (cmake)..."
cmake -B "$VENDOR_DIR/build" -S "$VENDOR_DIR" -DCMAKE_BUILD_TYPE=Release
cmake --build "$VENDOR_DIR/build" --config Release -j"$(nproc 2>/dev/null || sysctl -n hw.ncpu)"

echo "Téléchargement du modèle ggml-$MODEL_SIZE.bin..."
bash "$VENDOR_DIR/models/download-ggml-model.sh" "$MODEL_SIZE"

echo ""
echo "OK. Dans .env, assure-toi d'avoir : WHISPER_MODEL_SIZE=$MODEL_SIZE"
echo "(les chemins par défaut pointent déjà vers vendor/whisper.cpp/build et /models — voir .env.example)"

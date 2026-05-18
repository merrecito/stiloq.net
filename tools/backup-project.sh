#!/bin/bash
# Copia de seguridad local del sitio STILOQ (sin .git)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$HOME/stiloq-web-backup}"
python3 "$ROOT/tools/generate-showcase-manifest.py"
rsync -a --delete --exclude '.git' --exclude '.DS_Store' "$ROOT/" "$DEST/"
echo "Backup actualizado: $DEST"

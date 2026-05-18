#!/usr/bin/env python3
"""Genera assets/showcase/manifest.json a partir de los archivos en cada carpeta."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "assets" / "showcase"
MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm", ".mov"}
VIDEO_EXT = {".mp4", ".webm", ".mov"}


def main() -> None:
    manifest: dict[str, dict[str, str]] = {}
    for folder in sorted(ROOT.iterdir()):
        if not folder.is_dir():
            continue
        files = sorted(
            f
            for f in folder.iterdir()
            if f.is_file() and f.suffix.lower() in MEDIA_EXT and f.name != ".gitkeep"
        )
        if not files:
            continue
        chosen = max(files, key=lambda f: f.stat().st_mtime)
        manifest[folder.name] = {
            "file": chosen.name,
            "type": "video" if chosen.suffix.lower() in VIDEO_EXT else "image",
        }

    out = ROOT / "manifest.json"
    out.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {out} ({len(manifest)} categorías)")


if __name__ == "__main__":
    main()

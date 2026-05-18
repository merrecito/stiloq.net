#!/usr/bin/env python3
"""Regenera el track del carrusel Quiénes somos."""
from pathlib import Path

CATEGORIES = [
    ("mujer", "Moda mujer", "photo-1483985988355-763728e1935b"),
    ("hombre", "Moda hombre", "photo-1617127365659-c47fa864d8bc"),
    ("nino", "Niño", "photo-1503454537844-983a37ef61d1"),
    ("nina", "Niña", "photo-1578662996442-48f60103fc96"),
    ("hogar", "Hogar", "photo-1555041469-a586c61ea9bc"),
    ("calzado-accesorios", "Calzado y accesorios", "photo-1543163521-1bf539c55dd2"),
    ("licenciados", "Licenciados", "photo-1562157873-818bc0726f68"),
    ("utensilios-electro", "Utensilios y electro", "photo-1556909114-f6e7ad7d3136"),
]

COPY_BLOCKS = [
    ("tagline", '<p class="about-editorial__copy-tagline">Designing a better future, together.</p>'),
    (
        "default",
        '<p class="about-editorial__copy-line">Creemos en una moda que va más allá del producto.</p>',
    ),
    (
        "default",
        '<p class="about-editorial__copy-line">Una moda que conecta, transforma y genera valor.</p>',
    ),
    (
        "default",
        "<p class=\"about-editorial__copy-line\">Diseñamos, desarrollamos y llevamos ideas al mundo, combinando creatividad, operación y visión global.</p>",
    ),
    ("default", '<p class="about-editorial__copy-line">Trabajamos como partners.</p>'),
    ("default", '<p class="about-editorial__copy-line">Pensamos a largo plazo.</p>'),
    ("default", '<p class="about-editorial__copy-line">Actuamos con responsabilidad.</p>'),
    (
        "close",
        """<p class="about-editorial__copy-line">Porque el futuro de la industria no solo se construye.</p>
                    <p class="about-editorial__copy-accent">Se diseña.</p>""",
    ),
]


def frame(cat: str, label: str, photo_id: str, mod: str, inner: str) -> str:
    url = f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=960&h=1280&q=80"
    return f"""                <div class="about-editorial__frame" data-showcase-category="{cat}">
                  <div class="about-editorial__media-wrap">
                    <img
                      class="about-editorial__media"
                      src="{url}"
                      alt="{label}"
                      width="960"
                      height="1280"
                      loading="lazy"
                      decoding="async"
                      data-showcase-fallback
                    />
                  </div>
                  <motion class="about-editorial__shade" aria-hidden="true"></motion>
                  <div class="about-editorial__overlay">
                    <div class="about-editorial__copy about-editorial__copy--{mod}">
                    {inner}
                    </div>
                  </div>
                </div>""".replace("<motion", "<div").replace("</motion>", "</div>")


def main() -> None:
    parts = [
        frame(cat, label, photo, COPY_BLOCKS[i][0], COPY_BLOCKS[i][1])
        for i, (cat, label, photo) in enumerate(CATEGORIES)
    ]
    sequence = "\n".join(parts)
    track_lines = [
        "              <!-- 8 medios con texto superpuesto × 2 (bucle) -->",
        '              <div class="about-editorial__track" data-about-track>',
        sequence,
        sequence,
        "              </div>",
    ]

    path = Path(__file__).resolve().parents[1] / "index.html"
    lines = path.read_text().splitlines()
    track_start = next(i for i, l in enumerate(lines) if "8 medios" in l and "texto" in l)
    below_idx = next(i for i, l in enumerate(lines) if "container about-editorial__below" in l)
    track_end = next(
        i for i in range(below_idx - 1, track_start, -1) if lines[i].strip() == "</div>"
    )

    new_lines = lines[:track_start] + track_lines + lines[track_end + 1 :]
    path.write_text("\n".join(new_lines) + "\n")
    print("OK", len(parts) * 2, "frames")


if __name__ == "__main__":
    main()

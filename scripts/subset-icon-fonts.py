#!/usr/bin/env python3
"""Regenerate the icon-font subsets that the site actually loads.

The vendored icon fonts (rtmicon, Font Awesome solid and brands) ship every glyph,
but the pages use only a handful. This script keeps exactly the glyphs whose CSS
class names appear in the site's HTML, JS and PHP, and writes WOFF2 subsets next to
the full fonts. css/vendor/{rtmicons,solid,brands}.css list the subsets first.

Run this after adding a new icon class to any page, then commit the changed .woff2:

    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/subset-icon-fonts.py
"""
import re
import sys
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [p for pattern in ("*.html", "**/*.html", "js/*.js", "php/*.php") for p in ROOT.glob(pattern)]
USED_TEXT = "\n".join(p.read_text(encoding="utf-8", errors="replace") for p in set(SOURCES))


def css_codepoints(css_path: Path, selector_re: str) -> dict[str, int]:
    """Map class name -> codepoint for rules like `.name::before { content: "\\f0e0"; }`."""
    css = css_path.read_text(encoding="utf-8")
    mapping: dict[str, int] = {}
    for selectors, code in re.findall(r"([^{}]+)\{\s*content:\s*\"\\([0-9a-fA-F]+)\";\s*\}", css):
        for name in re.findall(selector_re, selectors):
            mapping[name] = int(code, 16)
    return mapping


def used_classes(prefix: str) -> set[str]:
    return set(re.findall(rf"\b({prefix}[a-z0-9-]+)\b", USED_TEXT))


def write_subset(source: Path, target: Path, codepoints: set[int]) -> None:
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = []
    options.name_IDs = [1, 2]
    options.notdef_outline = True
    options.glyph_names = False
    font = subset.load_font(str(source), options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=sorted(codepoints))
    subsetter.subset(font)
    subset.save_font(font, str(target), options)
    print(f"{target.relative_to(ROOT)}: {len(codepoints)} glyphs, {target.stat().st_size} bytes")


def main() -> int:
    fa_map = css_codepoints(ROOT / "css/vendor/fontawesome.css", r"\.(fa-[a-z0-9-]+)::?before")
    brand_map = css_codepoints(ROOT / "css/vendor/brands.css", r"\.(fa-[a-z0-9-]+)::?before")
    rtm_map = css_codepoints(ROOT / "css/vendor/rtmicons.css", r"\.(rtmicon-[a-z0-9-]+)::?before")

    classes = used_classes("fa-")
    brands = {brand_map[c] for c in classes if c in brand_map}
    solids = {fa_map[c] for c in classes if c in fa_map and c not in brand_map}
    rtm_used = {c for c in used_classes("rtmicon-") if c in rtm_map}
    if not solids or not brands or not rtm_used:
        print("no icon classes found; refusing to write empty subsets", file=sys.stderr)
        return 1

    write_subset(ROOT / "font/fa-solid-900.woff2", ROOT / "font/fa-solid-900-subset.woff2", solids)
    write_subset(ROOT / "font/fa-brands-400.woff2", ROOT / "font/fa-brands-400-subset.woff2", brands)
    write_subset(ROOT / "font/rtmicon/rtmicon.ttf", ROOT / "font/rtmicon/rtmicon-subset.woff2",
                 {rtm_map[c] for c in rtm_used})
    return 0


if __name__ == "__main__":
    sys.exit(main())

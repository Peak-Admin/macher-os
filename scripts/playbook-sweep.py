#!/usr/bin/env python3
"""Passt Tailwind-Klassen an das Brand-Playbook an (idempotent).

- Hauptaktionen auf `bg-signal` bekommen weiße Schrift.
- Oberzeilen (Versalien mit Laufweite) nutzen Poppins (`font-tagline`).
- Reines `text-signal` (nur auf dunklen Flächen genutzt) wird Akzentgrün.
- Pillen-Badges (`rounded-full` mit Innenabstand) werden zu kleinen Rechtecken.

Aufruf: python3 scripts/playbook-sweep.py src
"""
import pathlib
import re
import sys

CLASS_RE = re.compile(r'(className=)(\{`[^`]*`\}|"[^"]*")', re.S)
STR_RE = re.compile(r'"[^"\n]*"')
BG_SIGNAL = re.compile(r"(?<![\w-])(?:hover:)?bg-signal(?![\w/-])")


def fix_classes(cls: str) -> str:
    if cls.startswith("{`"):
        # Template-Literal: nur die statischen Teile prüfen, Ausdrücke ${...} unverändert lassen.
        parts = re.split(r"(\$\{[^}]*\})", cls)
        return "".join(p if p.startswith("${") else fix_static(p) for p in parts)
    return fix_static(cls)


def fix_static(cls: str) -> str:
    # Reines `text-signal` / `bg-signal/NN` wurde nur auf dunklen Flächen genutzt
    # (auf hellen Flächen steht `text-signal-dark`) – dort Akzentgrün verwenden.
    cls = re.sub(r"(?<![\w-])((?:hover:)?)text-signal(?![\w/-])", r"\1text-accent", cls)
    cls = re.sub(r"(?<![\w-])bg-signal/", "bg-accent/", cls)
    if BG_SIGNAL.search(cls):
        cls = re.sub(r"(?<![\w:-])text-ink(?![\w/-])", "text-white", cls)
    if "uppercase" in cls and re.search(r"tracking-\[0\.1\d?em\]|tracking-wider|tracking-widest", cls) and "font-tagline" not in cls:
        cls = cls.replace("uppercase", "font-tagline uppercase", 1)
    if "font-tagline" in cls:
        cls = cls.replace("tracking-[0.14em]", "tracking-[0.06em]")
        cls = re.sub(r"(?<![\w:-])font-display ", "", cls)
    cls = re.sub(r"rounded-full(?= (?:[\w:/.\[\]-]+ )*?p[xy]-)", "rounded", cls)
    return cls


def main(root: str) -> None:
    changed = 0
    for path in pathlib.Path(root).rglob("*.tsx"):
        src = path.read_text()
        out = CLASS_RE.sub(lambda m: m.group(1) + fix_classes(m.group(2)), src)
        # Klassen in Objekten/Variablen, z. B. { primary: "bg-signal text-ink ..." }
        out = STR_RE.sub(lambda m: fix_classes(m.group(0)) if BG_SIGNAL.search(m.group(0)) else m.group(0), out)
        if out != src:
            path.write_text(out)
            changed += 1
    print(f"{changed} Dateien angepasst")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "src")

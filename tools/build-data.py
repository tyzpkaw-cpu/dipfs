#!/usr/bin/env python3
"""Build the JSON files under data/ from a Zuxia parts table.

Usage:
    python3 tools/build-data.py [SOURCE.tsv] [OUT_DIR]

SOURCE defaults to data-src/zuxia.parts.tsv and OUT_DIR to data/.
The input format (produced by the Zuxia IME project's generate_zuxia.py):

    # char<TAB>structure<TAB>part|names|keys|reading|per-name<TAB>...=traditional,...

See data-src/README.md for details. The output layout is documented in the
README and on https://dipfs.js.org/api.html.
"""
from __future__ import annotations

import collections
import datetime
import json
import pathlib
import sys

CHUNK_SIZE = 512
STRUCTURE_CODES = "zsbdp"


def parse(path: pathlib.Path) -> list[list]:
    records: list[list] = []
    seen: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        fields = line.split("\t")
        char, structure = fields[0], fields[1]
        if char in seen:
            continue
        seen.add(char)
        parts: list[list] = []
        traditional: list[str] = []
        for column in fields[2:]:
            if column.startswith("="):
                traditional = [t for t in column[1:].split(",") if t]
                continue
            bits = column.split("|")
            glyph = bits[0]
            names = bits[1].split(",") if len(bits) > 1 and bits[1] else [glyph]
            keys = bits[2] if len(bits) > 2 else ""
            per_name = bits[4].split(",") if len(bits) > 4 and bits[4] else []
            entries = []
            for index, name in enumerate(names):
                if index < len(per_name):
                    key, _, reading = per_name[index].partition(":")
                else:
                    key, reading = keys[:1], ""
                entries.append([name, reading, key])
            parts.append([glyph, entries])
        records.append([char, structure, parts, traditional] if traditional
                       else [char, structure, parts])
    return records


def main() -> int:
    root = pathlib.Path(__file__).resolve().parent.parent
    source = (pathlib.Path(sys.argv[1]) if len(sys.argv) > 1
              else root / "data-src" / "zuxia.parts.tsv")
    out_dir = (pathlib.Path(sys.argv[2]) if len(sys.argv) > 2
               else root / "data")
    records = parse(source)
    if len(records) < 8000:
        raise SystemExit(f"refusing to write: only {len(records)} records in {source}")
    records.sort(key=lambda record: ord(record[0]))
    out_dir.mkdir(parents=True, exist_ok=True)

    chunks = [records[i:i + CHUNK_SIZE] for i in range(0, len(records), CHUNK_SIZE)]
    chunk_meta = []
    for index, chunk in enumerate(chunks):
        name = f"chars-{index:02d}.json"
        payload = json.dumps(chunk, ensure_ascii=False, separators=(",", ":"))
        (out_dir / name).write_text(payload + "\n", encoding="utf-8")
        chunk_meta.append({"file": name, "first": ord(chunk[0][0]), "last": ord(chunk[-1][0])})

    index: dict[str, list[str]] = collections.defaultdict(list)
    for char, _structure, parts, *_rest in records:
        for glyph, _entries in parts:
            if glyph != char:
                index[glyph].append(char)
    parts_payload = {glyph: "".join(chars) for glyph, chars in sorted(index.items())}
    (out_dir / "parts.json").write_text(
        json.dumps(parts_payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8")

    names = {entry[0] for record in records
             for _glyph, entries in record[2] for entry in entries}
    traditional = sum(1 for record in records if len(record) > 3 and record[3])
    structures = collections.Counter(record[1] for record in records)
    unknown = set(structures) - set(STRUCTURE_CODES)
    if unknown:
        raise SystemExit(f"unknown structure codes: {sorted(unknown)}")
    meta = {
        "name": "dipfs",
        "version": "0.1.0",
        "generated": datetime.date.today().isoformat(),
        "source": "data-src/zuxia.parts.tsv (Zuxia IME data pipeline)",
        "chars": len(records),
        "partGlyphs": len(parts_payload),
        "partNames": len(names),
        "traditionalForms": traditional,
        "structures": {code: structures.get(code, 0) for code in STRUCTURE_CODES},
        "chunks": chunk_meta,
    }
    (out_dir / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"{len(records)} characters -> {len(chunks)} chunks; "
          f"{len(parts_payload)} parts, {len(names)} part names")
    print("structure:", dict(meta["structures"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

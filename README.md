# dipfs

**Decomposition Into Parts for Sinograms** — a dependency-free JavaScript library that
breaks Chinese characters into their component parts, with names and readings.

[dipfs.js.org](https://dipfs.js.org/) · [API reference](https://dipfs.js.org/api.html) · [Data sources](DATA-SOURCES.md)

```js
import { decompose } from 'https://dipfs.js.org/dipfs.js';

const results = await decompose('好汉');
for (const r of results) {
  console.log(r.char, r.structure.en, r.parts.map((p) => p.glyph).join(' + '));
}
// 好 left–right 女 + 子
// 汉 left–right 氵 + 又
```

## What you get

- **8,183 characters** — the source project's character set, based on the
  Table of General Standard Chinese Characters (通用规范汉字表).
- **Structure classes** — left–right (左右), top–bottom (上下), enclosure (包围),
  standalone (独体), pyramid / other (品字形及其他).
- **1,596 distinct parts**, with 1,645 names (走之, 提手, 宝盖 …) and readings.
  A part can carry several names, and each name comes with the key letter the
  source IME assigns to it.
- **2,546 traditional-form mappings** from the General Standard table
  (这 → 這, 发 → 發 髮).
- **Lazy loading** — the dataset is split into 16 JSON chunks of 512 characters;
  showing one character fetches one ~60 KB chunk, cached after that.
- **Reverse lookup** — `charsWith('氵')` returns all 523 characters containing 氵.
- **No dependencies** — one ES module, works in browsers and Node.js 18+.

## API

| Function | Result |
| --- | --- |
| `decompose(text)` | `Promise<(Record \| null)[]>` — one entry per code point |
| `lookup(char)` | `Promise<Record \| null>` — a single character |
| `charsWith(part)` | `Promise<string[]>` — characters containing a part |
| `preload(text)` | `Promise<number>` — fetch the covering chunks early |
| `stats()` | `Promise<Meta>` — counts, structure distribution, chunk table |
| `structureInfo(code)` | `{ code, zh, en } \| null` |
| `loadAll()` | `Promise<number>` — load every chunk (Node / offline) |

A record carries `char`, `structure`, `parts` (glyph, names, reading, key, and a
`whole` flag for standalone characters) and `traditional`. Full details and the
data format are on [dipfs.js.org/api.html](https://dipfs.js.org/api.html).

## Data

`data/` ships the compiled dataset as JSON. `data-src/zuxia.parts.tsv` is the
source table, and `tools/build-data.py` regenerates the JSON from it. The dataset
is compiled from open sources by the [Zuxia IME](https://github.com/27gscn/zuxia-ime)
project — see [DATA-SOURCES.md](DATA-SOURCES.md) for provenance and licenses.

## Development

```sh
node --test                  # test suite (Node 18+)
python3 tools/build-data.py  # rebuild data/ from data-src/zuxia.parts.tsv
```

## License

Code: MIT (see `LICENSE`). Data: see [DATA-SOURCES.md](DATA-SOURCES.md) — the
dataset keeps the terms of its upstream sources (LGPL-3.0-or-later for
Make Me a Hanzi-derived content; CHISE / CJKVI terms for IDS-derived content).

# Data sources and licenses

The `data/` directory is a compiled dataset. It is generated from
`data-src/zuxia.parts.tsv`, which the [Zuxia IME][zuxia] data pipeline
(`generate_zuxia.py`) builds from the sources below. `tools/build-data.py`
converts the TSV into the JSON files under `data/`.

| Source | What it contributes | Terms |
| --- | --- | --- |
| [Make Me a Hanzi][mmh] (`dictionary.txt`) | structure, components, component and character readings | LGPL-3.0-or-later — see `licenses/NOTICE-Make-Me-a-Hanzi.txt` |
| [CJKVI IDS][cjkvi] (`ids.txt`) | structure refinement, fallback components | `ids.txt` is derived from the [CHISE project][chise]; see `licenses/NOTICE-CJKVI-IDS.md` |
| GF 0013—2009 《现代常用独体字表》 | standalone-character classification (`d` structure) | Chinese national standard |
| GF 0014—2009 《现代常用字部件及部件名称规范》 | official component names (宝盖, 病字框, …) | Chinese national standard |
| 《通用规范汉字表》 (2013), Annex 1 | traditional forms for 2,546 characters | Chinese national standard; the machine-readable transcription is Apache-2.0 |
| The Zuxia IME / 应物 projects | curated component names and structure overrides | by the source project's authors |

## License summary

- **Code** (JavaScript module, tests, site): MIT — see `LICENSE`.
- **Data** (`data/`, `data-src/`): distributed under the terms of the sources
  above. Content derived from Make Me a Hanzi is available under the
  LGPL-3.0-or-later; content derived from CJKVI IDS follows the CHISE project's
  terms. Full license texts and notices are in `licenses/`.

If you redistribute the dataset, keep these notices with it.

[zuxia]: https://github.com/27gscn/zuxia-ime
[mmh]: https://github.com/skishore/makemeahanzi
[cjkvi]: https://github.com/cjkvi/cjkvi-ids
[chise]: http://www.chise.org/

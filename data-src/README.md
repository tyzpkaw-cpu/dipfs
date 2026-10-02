# data-src

`zuxia.parts.tsv` is the source table for the `data/` directory. It is
produced by the [Zuxia IME][zuxia] data pipeline (`generate_zuxia.py`).

Format (tab-separated):

    char  structure  part|names|keys|reading|per-name  ...  =traditional,...

- `structure`: one of `z` 左右, `s` 上下, `b` 包围, `d` 独体, `p` 品字形及其他
- `part|names|keys|reading|per-name`: one column per part; `names` is
  comma-separated; `per-name` gives `key:reading` for each name
- a trailing `=traditional,...` column lists traditional forms, when they exist

Run `python3 tools/build-data.py` to regenerate `data/` from this file.

[zuxia]: https://github.com/27gscn/zuxia-ime

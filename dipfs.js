/**
 * dipfs — Decomposition Into Parts for Sinograms
 *
 * A dependency-free ES module that decomposes Chinese characters into their
 * component parts, with names and readings: 8,183 characters, 1,596 distinct
 * parts, 2,546 of the characters with traditional forms.
 *
 *   import { decompose, lookup, charsWith } from './dipfs.js';
 *
 *   const [hao] = await decompose('好');
 *   hao.structure.en;                 // 'left–right'
 *   hao.parts.map((p) => p.glyph);    // ['女', '子']
 *   hao.parts[0].names[0].reading;    // 'nǚ'
 *
 *   await charsWith('氵');            // ['江', '汉', '湖', …]
 *
 * Works in browsers and in Node.js (>= 18). Data under ./data/ is loaded
 * lazily; every chunk is fetched at most once and cached.
 *
 * Code: MIT. Data: see DATA-SOURCES.md. Site: https://dipfs.js.org/
 */

const STRUCTURES = Object.freeze({
  z: { code: 'z', zh: '左右', en: 'left–right' },
  s: { code: 's', zh: '上下', en: 'top–bottom' },
  b: { code: 'b', zh: '包围', en: 'enclosure' },
  d: { code: 'd', zh: '独体', en: 'standalone' },
  p: { code: 'p', zh: '品字形及其他', en: 'pyramid / other' },
});

const DATA_ROOT = new URL('data/', import.meta.url);
const IS_NODE =
  typeof process !== 'undefined' && !!process.versions && !!process.versions.node;

let metaPromise = null;
let partsIndexPromise = null;
const chunkPromises = new Map(); // file name -> Promise<Array>
const records = new Map(); // character -> record

async function readJSON(name) {
  const url = new URL(name, DATA_ROOT);
  if (IS_NODE) {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(url, 'utf8'));
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('dipfs: failed to load ' + url + ' (HTTP ' + response.status + ')');
  }
  return response.json();
}

/** Dataset metadata: counts, structure distribution, chunk table. */
export async function stats() {
  if (!metaPromise) metaPromise = readJSON('meta.json');
  return metaPromise;
}

/** Structure information for a code ('z' … 'p'), or null if unknown. */
export function structureInfo(code) {
  return STRUCTURES[code] ?? null;
}

function toRecord(raw) {
  const [char, code, parts, traditional = []] = raw;
  return {
    char,
    structure: STRUCTURES[code] ?? { code, zh: '', en: '' },
    parts: parts.map(([glyph, names]) => {
      const entries = names.map(([name, reading, key]) => ({ name, reading, key }));
      const first = entries[0] ?? { name: glyph, reading: '', key: '' };
      return {
        glyph,
        names: entries,
        reading: first.reading,
        key: first.key,
        whole: entries.length === 1 && first.name === '整字',
      };
    }),
    traditional,
  };
}

function loadChunk(file) {
  if (!chunkPromises.has(file)) chunkPromises.set(file, readJSON(file));
  return chunkPromises.get(file);
}

async function chunkFor(codePoint) {
  const meta = await stats();
  const chunks = meta.chunks;
  let lo = 0;
  let hi = chunks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (codePoint < chunks[mid].first) hi = mid - 1;
    else if (codePoint > chunks[mid].last) lo = mid + 1;
    else return loadChunk(chunks[mid].file);
  }
  return null;
}

function remember(chunk) {
  for (const raw of chunk) {
    if (!records.has(raw[0])) records.set(raw[0], toRecord(raw));
  }
}

/**
 * Preload the chunks that cover `text`.
 * Resolves to the number of chunks that were actually fetched.
 */
export async function preload(text) {
  const before = chunkPromises.size;
  await Promise.all([...String(text)].map((c) => chunkFor(c.codePointAt(0))));
  return chunkPromises.size - before;
}

/**
 * Look up a single character.
 * Resolves to a record, or null when the character is not in the dataset.
 */
export async function lookup(char) {
  if (typeof char !== 'string' || [...char].length !== 1) {
    throw new TypeError('dipfs: lookup() expects a single character');
  }
  if (!records.has(char)) {
    const chunk = await chunkFor(char.codePointAt(0));
    if (chunk) remember(chunk);
  }
  return records.get(char) ?? null;
}

/**
 * Decompose a string.
 * Resolves to one entry per code point, in order: a record or null.
 */
export async function decompose(text) {
  const chars = [...String(text)];
  const chunks = await Promise.all(chars.map((c) => chunkFor(c.codePointAt(0))));
  for (const chunk of chunks) if (chunk) remember(chunk);
  return chars.map((c) => records.get(c) ?? null);
}

/**
 * All characters that list `part` among their parts (whole-character entries
 * excluded). Resolves to an array of characters, or [] if the part is unknown.
 */
export async function charsWith(part) {
  if (!partsIndexPromise) partsIndexPromise = readJSON('parts.json');
  const index = await partsIndexPromise;
  return index[part] ? [...index[part]] : [];
}

/** Load every chunk of the dataset. Resolves to the number of characters. */
export async function loadAll() {
  const meta = await stats();
  const chunks = await Promise.all(meta.chunks.map((c) => loadChunk(c.file)));
  for (const chunk of chunks) remember(chunk);
  return meta.chars;
}

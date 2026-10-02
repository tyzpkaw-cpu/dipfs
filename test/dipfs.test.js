import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decompose,
  lookup,
  charsWith,
  preload,
  stats,
  structureInfo,
  loadAll,
} from '../dipfs.js';

test('lookup: 好 decomposes into 女 + 子', async () => {
  const record = await lookup('好');
  assert.ok(record);
  assert.equal(record.char, '好');
  assert.equal(record.structure.code, 'z');
  assert.equal(record.structure.en, 'left–right');
  assert.equal(record.structure.zh, '左右');
  assert.deepEqual(record.parts.map((part) => part.glyph), ['女', '子']);
  assert.equal(record.parts[0].names[0].reading, 'nǚ');
  assert.equal(record.parts[0].key, 'n');
  assert.deepEqual(record.traditional, []);
});

test('lookup: standalone characters carry a whole-character part', async () => {
  const record = await lookup('一');
  assert.equal(record.structure.code, 'd');
  assert.equal(record.parts[0].whole, true);
  assert.equal(record.parts[0].names[0].name, '整字');
});

test('lookup: traditional forms', async () => {
  assert.deepEqual((await lookup('这')).traditional, ['這']);
  assert.deepEqual((await lookup('发')).traditional, ['發', '髮']);
});

test('lookup: characters outside the dataset resolve to null', async () => {
  assert.equal(await lookup('A'), null);
  assert.equal(await lookup('🎉'), null);
});

test('lookup: rejects non-single-character input', async () => {
  await assert.rejects(() => lookup('ab'), TypeError);
});

test('decompose: one entry per code point, in order', async () => {
  const results = await decompose('好A');
  assert.equal(results.length, 2);
  assert.equal(results[0].char, '好');
  assert.equal(results[1], null);
});

test('charsWith: reverse lookup by part', async () => {
  const list = await charsWith('氵');
  assert.ok(list.length > 100);
  assert.ok(list.includes('江'));
  assert.ok(list.includes('汉'));
});

test('charsWith: unknown part resolves to an empty array', async () => {
  assert.deepEqual(await charsWith('𝄞'), []);
});

test('structureInfo: codes and unknown values', () => {
  assert.equal(structureInfo('s').zh, '上下');
  assert.equal(structureInfo('p').en, 'pyramid / other');
  assert.equal(structureInfo('x'), null);
});

test('stats: dataset metadata', async () => {
  const meta = await stats();
  assert.equal(meta.chars, 8183);
  assert.equal(meta.partGlyphs, 1596);
  assert.ok(meta.chunks.length >= 8);
});

test('preload + loadAll', async () => {
  await preload('好');
  const count = await loadAll();
  assert.equal(count, 8183);
  const record = await lookup('赢');
  assert.equal(record.structure.code, 's');
  assert.deepEqual(record.traditional, ['贏']);
});

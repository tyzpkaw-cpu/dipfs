import { decompose, charsWith, stats } from '../dipfs.js';

const input = document.getElementById('q');
const out = document.getElementById('out');
const partBox = document.getElementById('partbox');
const partTitle = document.getElementById('part-title');
const partList = document.getElementById('part-chars');
const statsLine = document.getElementById('stats-line');

let seq = 0;
let timer = null;

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function partLabel(part) {
  const names = part.names.map((n) => n.name).filter((n) => n !== '整字');
  return names.join(' / ') || part.glyph;
}

function card(record) {
  const box = el('div', 'card');
  const head = el('div', 'head');
  head.append(el('span', 'glyph', record.char));
  head.append(el('span', 'struct', record.structure.en + ' · ' + record.structure.zh));
  box.append(head);

  const parts = el('div', 'parts');
  for (const part of record.parts) {
    const button = el('button', 'part');
    button.type = 'button';
    button.title = 'Show characters containing ' + part.glyph;
    button.append(el('span', 'g', part.glyph));
    let label = partLabel(part);
    if (part.reading) label += ' · ' + part.reading;
    if (part.whole) label += ' · whole';
    button.append(el('span', 'n', label));
    button.addEventListener('click', () => showPart(part.glyph));
    parts.append(button);
  }
  box.append(parts);

  if (record.traditional.length) {
    box.append(el('div', 'trad', 'traditional: ' + record.traditional.join(' ')));
  }
  return box;
}

function missingCard(char) {
  const box = el('div', 'card miss');
  const head = el('div', 'head');
  head.append(el('span', 'glyph', char));
  head.append(el('span', 'struct', 'not in the dataset'));
  box.append(head);
  return box;
}

async function render() {
  const text = input.value.trim().slice(0, 48);
  const my = ++seq;
  partBox.hidden = true;
  const chars = [...text];
  const results = await decompose(text);
  if (my !== seq) return;
  const cards = [];
  chars.forEach((char, index) => {
    if (/\s/.test(char)) return;
    const record = results[index];
    cards.push(record ? card(record) : missingCard(char));
  });
  out.replaceChildren(...cards);
}

async function showPart(glyph) {
  partBox.hidden = false;
  partTitle.textContent = glyph;
  partList.replaceChildren(el('span', 'muted', 'loading…'));
  const list = await charsWith(glyph);
  if (!list.length) {
    partList.replaceChildren(el('span', 'muted', 'no characters found'));
    return;
  }
  partList.replaceChildren(...list.map((char) => {
    const button = el('button', null, char);
    button.type = 'button';
    button.addEventListener('click', () => {
      input.value = char;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return button;
  }));
}

input.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(render, 120);
});

document.querySelectorAll('.chips button').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = button.dataset.q;
    render();
  });
});

stats()
  .then((meta) => {
    statsLine.textContent =
      meta.chars.toLocaleString('en-US') + ' characters · ' +
      meta.partGlyphs.toLocaleString('en-US') + ' parts · ' +
      meta.partNames.toLocaleString('en-US') + ' part names · ' +
      meta.traditionalForms.toLocaleString('en-US') + ' with traditional forms';
  })
  .catch(() => {});

render();

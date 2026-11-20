/**
 * Güvenli embed URL doğrulayıcı ve HTML5 etkileşimli oyun/etkinlik üreticisi
 * ------------------------------------------------------------
 * Yalnızca güvenilir eğitim sağlayıcılarının HTTPS embed adreslerine
 * izin verir; ayrıca Wordwall/H5P/HTML5 kartlarının çevrimdışı veya
 * kısıtlı ağlarda dahi anında çalışması için sandbox içi HTML5
 * oyun/etkinlik srcDoc içeriği üretir.
 */
import type { ActivityProvider, InteractiveActivity } from '../types'

const ALLOWED_EMBED_HOSTS: Record<string, ActivityProvider> = {
  'wordwall.net': 'wordwall',
  'www.wordwall.net': 'wordwall',
  'h5p.org': 'h5p',
  'www.h5p.org': 'h5p',
  'h5p.com': 'h5p',
  'learningapps.org': 'html5',
  'www.learningapps.org': 'html5',
  'phet.colorado.edu': 'html5',
  'view.genially.com': 'html5',
  'view.genial.ly': 'html5',
  'geogebra.org': 'html5',
  'www.geogebra.org': 'html5',
  'educaplay.com': 'html5',
  'www.educaplay.com': 'html5',
  'scratch.mit.edu': 'html5',
  'liveworksheets.com': 'html5',
  'www.liveworksheets.com': 'html5',
  'desmos.com': 'html5',
  'www.desmos.com': 'html5',
}

export const allowedEmbedDomainsText =
  'wordwall.net, h5p.org, learningapps.org, phet.colorado.edu, view.genially.com, geogebra.org, educaplay.com, scratch.mit.edu, desmos.com'

export function validateEmbedUrl(raw: string): { valid: boolean; normalized?: string; provider?: ActivityProvider; error?: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { valid: false, error: 'Lütfen bir embed URL adresi girin.' }

  // Eğer kullanıcı doğrudan <iframe src="..."> kodu yapıştırdıysa src değerini çıkar
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i)
  const candidate = iframeMatch ? iframeMatch[1]! : trimmed

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return { valid: false, error: 'Geçerli bir https:// adresi veya iframe kodu girin.' }
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Güvenlik gereği yalnızca HTTPS bağlantıları desteklenir.' }
  }

  const host = parsed.hostname.toLowerCase()
  const provider = ALLOWED_EMBED_HOSTS[host]
  if (!provider) {
    return {
      valid: false,
      error: `Bu alan adı desteklenmiyor (${host}). İzin verilen sağlayıcılar: ${allowedEmbedDomainsText}.`,
    }
  }

  return { valid: true, normalized: parsed.toString(), provider }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    background: #faf7f0;
    color: #12204a;
    min-height: 100vh;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .topbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: #ffffff;
    border: 1px solid #e5dfd0;
    border-radius: 14px;
    padding: 12px 16px;
  }
  .title { font-size: 15px; font-weight: 800; color: #12204a; }
  .meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .pill {
    font-size: 12px; font-weight: 700; padding: 5px 10px; border-radius: 999px;
    background: #e6ecfc; color: #2241a8;
  }
  .pill.sun { background: #fdf0cc; color: #8a5a00; }
  .pill.ok { background: #dff3ea; color: #17714f; }
  .btn {
    border: 1px solid #12204a; background: #12204a; color: #faf7f0;
    border-radius: 10px; padding: 7px 14px; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: transform .12s, opacity .15s;
  }
  .btn:hover { opacity: .92; }
  .btn:active { transform: translateY(1px); }
  .btn.ghost { background: #ffffff; color: #12204a; border-color: #cfc6b1; }
  .btn.sun { background: #f5b82e; color: #12204a; }
  .stage {
    flex: 1;
    background: #ffffff;
    border: 1px solid #e5dfd0;
    border-radius: 16px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .hint { font-size: 13px; color: #545d7a; }
  .banner {
    display: none; align-items: center; justify-content: space-between; gap: 12px;
    padding: 14px 16px; border-radius: 14px; background: #dff3ea; color: #17714f;
    border: 1px solid #17714f44; font-weight: 700; font-size: 14px;
  }
  .banner.show { display: flex; }
`

function buildMatchingHtml(title: string, pairs: Array<{ left: string; right: string }>): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
${BASE_CSS}
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 560px) { .cols { grid-template-columns: 1fr; } }
.col { display: flex; flex-direction: column; gap: 8px; }
.col-h { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: #545d7a; margin-bottom: 2px; }
.tile {
  text-align: left; width: 100%; border: 2px solid #e5dfd0; background: #faf7f0;
  border-radius: 12px; padding: 12px 14px; font-size: 14px; font-weight: 700; color: #12204a;
  cursor: pointer; transition: all .15s;
}
.tile:hover:not(:disabled) { border-color: #2f55d4; background: #e6ecfc; }
.tile.selected { border-color: #2f55d4; background: #2f55d4; color: #ffffff; }
.tile.matched { border-color: #17714f; background: #dff3ea; color: #17714f; cursor: default; }
.tile.wrong { border-color: #b42318; background: #fde7e4; color: #b42318; }
</style></head><body>
<div class="topbar">
  <div class="title">${escapeHtml(title)}</div>
  <div class="meta">
    <span class="pill" id="score">Eşleşme: 0 / ${pairs.length}</span>
    <span class="pill sun" id="moves">Deneme: 0</span>
    <button class="btn ghost" id="resetBtn" type="button">Karıştır</button>
  </div>
</div>
<div class="stage">
  <p class="hint">Sol sütundan bir kavram seç, ardından sağ sütundan doğru karşılığına tıkla.</p>
  <div class="banner" id="doneBanner"><span>Tebrikler! Tüm kavramları doğru eşleştirdin.</span><button class="btn sun" id="playAgain" type="button">Tekrar Oyna</button></div>
  <div class="cols">
    <div class="col"><div class="col-h">Kavram / İfade</div><div id="leftCol" class="col"></div></div>
    <div class="col"><div class="col-h">Eşleşen Karşılık</div><div id="rightCol" class="col"></div></div>
  </div>
</div>
<script>
const PAIRS = ${safeJsonForScript(pairs)};
let selL = null, selR = null, matched = new Set(), moves = 0, locked = false;
const shuffle = a => [...a].sort(() => Math.random() - 0.5);
let leftOrder = [], rightOrder = [];

function init() {
  selL = null; selR = null; matched = new Set(); moves = 0; locked = false;
  leftOrder = shuffle(PAIRS.map((p, i) => ({ i, text: p.left })));
  rightOrder = shuffle(PAIRS.map((p, i) => ({ i, text: p.right })));
  document.getElementById('doneBanner').classList.remove('show');
  render();
}
function render() {
  document.getElementById('score').textContent = 'Eşleşme: ' + matched.size + ' / ' + PAIRS.length;
  document.getElementById('moves').textContent = 'Deneme: ' + moves;
  const lEl = document.getElementById('leftCol');
  const rEl = document.getElementById('rightCol');
  lEl.innerHTML = ''; rEl.innerHTML = '';
  leftOrder.forEach(item => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tile' + (matched.has(item.i) ? ' matched' : selL === item.i ? ' selected' : '');
    b.textContent = item.text; b.disabled = matched.has(item.i);
    b.onclick = () => { if (locked) return; selL = item.i; check(); };
    lEl.appendChild(b);
  });
  rightOrder.forEach(item => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tile' + (matched.has(item.i) ? ' matched' : selR === item.i ? ' selected' : '');
    b.textContent = item.text; b.disabled = matched.has(item.i);
    b.onclick = () => { if (locked) return; selR = item.i; check(); };
    rEl.appendChild(b);
  });
}
function check() {
  render();
  if (selL === null || selR === null) return;
  moves++;
  if (selL === selR) {
    matched.add(selL); selL = null; selR = null;
    render();
    if (matched.size === PAIRS.length) document.getElementById('doneBanner').classList.add('show');
  } else {
    locked = true;
    const buttons = document.querySelectorAll('.tile.selected');
    buttons.forEach(b => { b.classList.remove('selected'); b.classList.add('wrong'); });
    setTimeout(() => { selL = null; selR = null; locked = false; render(); }, 650);
  }
}
document.getElementById('resetBtn').onclick = init;
document.getElementById('playAgain').onclick = init;
init();
</script></body></html>`
}

function buildFlashcardsHtml(title: string, cards: Array<{ front: string; back: string; tag?: string }>): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
${BASE_CSS}
.deck-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
.card-box {
  width: 100%; max-width: 520px; min-height: 220px; border-radius: 20px; padding: 28px;
  display: flex; flex-direction: column; justify-content: space-between; cursor: pointer;
  border: 2px solid #12204a; box-shadow: 0 5px 0 #12204a; transition: background .2s, transform .15s;
  background: linear-gradient(135deg, #ffffff 0%, #f3eee2 100%);
}
.card-box.flipped { background: linear-gradient(135deg, #12204a 0%, #2241a8 100%); color: #faf7f0; }
.card-box:active { transform: translateY(2px); }
.card-tag { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; opacity: .75; }
.card-text { font-size: 20px; font-weight: 800; line-height: 1.45; margin: 18px 0; text-align: center; }
.card-foot { font-size: 12px; opacity: .75; text-align: center; }
.controls { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
</style></head><body>
<div class="topbar">
  <div class="title">${escapeHtml(title)}</div>
  <div class="meta">
    <span class="pill" id="counter">Kart 1 / ${cards.length}</span>
    <span class="pill ok" id="known">Öğrenildi: 0</span>
  </div>
</div>
<div class="stage">
  <div class="deck-wrap">
    <div class="card-box" id="cardBox" tabindex="0" role="button" aria-label="Kartı çevir">
      <div class="card-tag" id="cardTag">ÖN YÜZ</div>
      <div class="card-text" id="cardText"></div>
      <div class="card-foot" id="cardFoot">Cevabı görmek için karta tıkla</div>
    </div>
    <div class="controls">
      <button class="btn ghost" id="prevBtn" type="button">← Önceki</button>
      <button class="btn sun" id="flipBtn" type="button">Kartı Çevir</button>
      <button class="btn" id="knowBtn" type="button">Öğrendim ✓</button>
      <button class="btn ghost" id="nextBtn" type="button">Sonraki →</button>
    </div>
  </div>
</div>
<script>
const CARDS = ${safeJsonForScript(cards)};
let idx = 0, flipped = false, known = new Set();
function render() {
  const c = CARDS[idx];
  const box = document.getElementById('cardBox');
  box.classList.toggle('flipped', flipped);
  document.getElementById('counter').textContent = 'Kart ' + (idx + 1) + ' / ' + CARDS.length;
  document.getElementById('known').textContent = 'Öğrenildi: ' + known.size + ' / ' + CARDS.length;
  document.getElementById('cardTag').textContent = (flipped ? 'ARKA YÜZ · AÇIKLAMA' : 'ÖN YÜZ · KAVRAM') + (c.tag ? ' · ' + c.tag : '');
  document.getElementById('cardText').textContent = flipped ? c.back : c.front;
  document.getElementById('cardFoot').textContent = flipped ? 'Ön yüze dönmek için tıkla' : 'Açıklamayı görmek için karta tıkla';
  document.getElementById('knowBtn').textContent = known.has(idx) ? 'Öğrenildi ✓' : 'Öğrendim ✓';
}
document.getElementById('cardBox').onclick = () => { flipped = !flipped; render(); };
document.getElementById('flipBtn').onclick = () => { flipped = !flipped; render(); };
document.getElementById('prevBtn').onclick = () => { idx = (idx - 1 + CARDS.length) % CARDS.length; flipped = false; render(); };
document.getElementById('nextBtn').onclick = () => { idx = (idx + 1) % CARDS.length; flipped = false; render(); };
document.getElementById('knowBtn').onclick = () => { if (known.has(idx)) known.delete(idx); else known.add(idx); idx = (idx + 1) % CARDS.length; flipped = false; render(); };
render();
</script></body></html>`
}

function buildMemoryHtml(title: string, pairs: Array<{ a: string; b: string }>): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
${BASE_CSS}
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 560px) { .grid { grid-template-columns: repeat(2, 1fr); } }
.mcard {
  min-height: 92px; border-radius: 14px; border: 2px solid #12204a;
  background: linear-gradient(135deg, #2f55d4, #12204a); color: #faf7f0;
  font-size: 13px; font-weight: 800; padding: 10px; cursor: pointer;
  display: grid; place-items: center; text-align: center; transition: all .18s;
}
.mcard.open { background: #ffffff; color: #12204a; border-color: #2f55d4; }
.mcard.matched { background: #dff3ea; color: #17714f; border-color: #17714f; cursor: default; }
</style></head><body>
<div class="topbar">
  <div class="title">${escapeHtml(title)}</div>
  <div class="meta">
    <span class="pill" id="found">Bulunan: 0 / ${pairs.length}</span>
    <span class="pill sun" id="turns">Hamle: 0</span>
    <button class="btn ghost" id="resetBtn" type="button">Yeniden Başlat</button>
  </div>
</div>
<div class="stage">
  <p class="hint">Kartları açarak ilişkili çiftleri bul. En az hamlede tamamlamaya çalış!</p>
  <div class="banner" id="doneBanner"><span>Harika hafıza! Tüm çiftleri buldun.</span><button class="btn sun" id="againBtn" type="button">Tekrar Oyna</button></div>
  <div class="grid" id="grid"></div>
</div>
<script>
const PAIRS = ${safeJsonForScript(pairs)};
let deck = [], opened = [], matched = new Set(), turns = 0, lock = false;
function init() {
  deck = PAIRS.flatMap((p, i) => [{ id: i + '-a', pair: i, text: p.a }, { id: i + '-b', pair: i, text: p.b }])
    .sort(() => Math.random() - 0.5);
  opened = []; matched = new Set(); turns = 0; lock = false;
  document.getElementById('doneBanner').classList.remove('show');
  render();
}
function render() {
  document.getElementById('found').textContent = 'Bulunan: ' + matched.size + ' / ' + PAIRS.length;
  document.getElementById('turns').textContent = 'Hamle: ' + turns;
  const g = document.getElementById('grid'); g.innerHTML = '';
  deck.forEach((card, idx) => {
    const isMatched = matched.has(card.pair);
    const isOpen = opened.includes(idx) || isMatched;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mcard' + (isMatched ? ' matched' : isOpen ? ' open' : '');
    b.textContent = isOpen ? card.text : '?';
    b.disabled = isMatched;
    b.onclick = () => flip(idx);
    g.appendChild(b);
  });
}
function flip(idx) {
  if (lock || opened.includes(idx)) return;
  opened.push(idx); render();
  if (opened.length === 2) {
    turns++; lock = true;
    const [i1, i2] = opened;
    if (deck[i1].pair === deck[i2].pair) {
      matched.add(deck[i1].pair); opened = []; lock = false; render();
      if (matched.size === PAIRS.length) document.getElementById('doneBanner').classList.add('show');
    } else {
      setTimeout(() => { opened = []; lock = false; render(); }, 750);
    }
  }
}
document.getElementById('resetBtn').onclick = init;
document.getElementById('againBtn').onclick = init;
init();
</script></body></html>`
}

function buildTimelineHtml(title: string, events: Array<{ year: string; label: string }>): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
${BASE_CSS}
.list { display: flex; flex-direction: column; gap: 8px; }
.row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  border: 2px solid #e5dfd0; background: #faf7f0; border-radius: 12px; padding: 11px 14px;
}
.row.ok { border-color: #17714f; background: #dff3ea; }
.row.bad { border-color: #b42318; background: #fde7e4; }
.row-left { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px; }
.num {
  width: 26px; height: 26px; border-radius: 8px; background: #12204a; color: #faf7f0;
  display: grid; place-items: center; font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.year { font-size: 12px; font-weight: 800; color: #17714f; background: #ffffff; padding: 3px 8px; border-radius: 999px; }
.arrows { display: flex; gap: 6px; }
.arr {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid #cfc6b1; background: #ffffff;
  color: #12204a; font-weight: 800; cursor: pointer;
}
.arr:disabled { opacity: .35; cursor: default; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
</style></head><body>
<div class="topbar">
  <div class="title">${escapeHtml(title)}</div>
  <div class="meta">
    <span class="pill" id="status">Kronolojik Sıralama</span>
    <button class="btn ghost" id="shuffleBtn" type="button">Karıştır</button>
  </div>
</div>
<div class="stage">
  <p class="hint">Olayları en eskiden en yeniye doğru yukarı/aşağı oklarla sırala, sonra "Sıramı Kontrol Et" düğmesine bas.</p>
  <div class="banner" id="doneBanner"><span>Tebrikler! Kronolojiyi tamamen doğru sıraladın.</span></div>
  <div class="list" id="list"></div>
  <div class="actions">
    <button class="btn sun" id="checkBtn" type="button">Sıramı Kontrol Et</button>
  </div>
</div>
<script>
const EVENTS = ${safeJsonForScript(events.map((e, i) => ({ ...e, order: i })))};
let items = [], checked = false;
function init() {
  items = [...EVENTS].sort(() => Math.random() - 0.5);
  checked = false;
  document.getElementById('doneBanner').classList.remove('show');
  document.getElementById('status').textContent = 'Kronolojik Sıralama';
  render();
}
function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  checked = false;
  document.getElementById('doneBanner').classList.remove('show');
  render();
}
function render() {
  const el = document.getElementById('list'); el.innerHTML = '';
  items.forEach((item, idx) => {
    const isOk = checked && item.order === idx;
    const isBad = checked && item.order !== idx;
    const row = document.createElement('div');
    row.className = 'row' + (isOk ? ' ok' : isBad ? ' bad' : '');
    row.innerHTML = '<div class="row-left"><span class="num">' + (idx + 1) + '</span><span>' + item.label + '</span>' + (checked ? '<span class="year">' + item.year + '</span>' : '') + '</div>';
    const arrows = document.createElement('div'); arrows.className = 'arrows';
    const up = document.createElement('button'); up.className = 'arr'; up.textContent = '↑'; up.disabled = idx === 0; up.onclick = () => move(idx, -1);
    const dn = document.createElement('button'); dn.className = 'arr'; dn.textContent = '↓'; dn.disabled = idx === items.length - 1; dn.onclick = () => move(idx, 1);
    arrows.append(up, dn); row.appendChild(arrows); el.appendChild(row);
  });
}
document.getElementById('checkBtn').onclick = () => {
  checked = true;
  const correct = items.filter((it, idx) => it.order === idx).length;
  document.getElementById('status').textContent = 'Doğru konum: ' + correct + ' / ' + items.length;
  if (correct === items.length) document.getElementById('doneBanner').classList.add('show');
  render();
};
document.getElementById('shuffleBtn').onclick = init;
init();
</script></body></html>`
}

function buildSortingHtml(title: string, groups: [string, string], items: Array<{ label: string; group: 0 | 1 }>): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
${BASE_CSS}
.item-card {
  border: 2px solid #12204a; border-radius: 16px; padding: 24px; text-align: center;
  background: linear-gradient(135deg, #ffffff, #f3eee2); font-size: 20px; font-weight: 800;
}
.buckets { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 520px) { .buckets { grid-template-columns: 1fr; } }
.bucket {
  border: 2px solid #2f55d4; background: #e6ecfc; color: #12204a; border-radius: 14px;
  padding: 16px; font-size: 15px; font-weight: 800; cursor: pointer; transition: transform .12s;
}
.bucket:hover { background: #2f55d4; color: #ffffff; }
.bucket.alt { border-color: #0e7c66; background: #dff3ea; }
.bucket.alt:hover { background: #0e7c66; color: #ffffff; }
.log { font-size: 13px; font-weight: 700; min-height: 20px; text-align: center; }
.log.ok { color: #17714f; }
.log.bad { color: #b42318; }
</style></head><body>
<div class="topbar">
  <div class="title">${escapeHtml(title)}</div>
  <div class="meta">
    <span class="pill" id="prog">Kalan: ${items.length}</span>
    <span class="pill ok" id="score">Doğru: 0</span>
    <button class="btn ghost" id="resetBtn" type="button">Yeniden Başlat</button>
  </div>
</div>
<div class="stage">
  <p class="hint">Ekrandaki öğeyi doğru kategori kutusuna gönder.</p>
  <div class="banner" id="doneBanner"><span id="doneText">Tamamlandı!</span><button class="btn sun" id="againBtn" type="button">Tekrar Oyna</button></div>
  <div id="playArea" style="display:flex;flex-direction:column;gap:14px;">
    <div class="item-card" id="currentItem"></div>
    <div class="buckets">
      <button class="bucket" id="g0" type="button">${escapeHtml(groups[0])}</button>
      <button class="bucket alt" id="g1" type="button">${escapeHtml(groups[1])}</button>
    </div>
    <div class="log" id="log"></div>
  </div>
</div>
<script>
const ITEMS = ${safeJsonForScript(items)};
let queue = [], score = 0;
function init() {
  queue = [...ITEMS].sort(() => Math.random() - 0.5);
  score = 0;
  document.getElementById('doneBanner').classList.remove('show');
  document.getElementById('playArea').style.display = 'flex';
  document.getElementById('log').textContent = '';
  render();
}
function render() {
  document.getElementById('prog').textContent = 'Kalan: ' + queue.length;
  document.getElementById('score').textContent = 'Doğru: ' + score;
  if (!queue.length) {
    document.getElementById('playArea').style.display = 'none';
    document.getElementById('doneText').textContent = 'Etkinlik bitti! Skorun: ' + score + ' / ' + ITEMS.length;
    document.getElementById('doneBanner').classList.add('show');
    return;
  }
  document.getElementById('currentItem').textContent = queue[0].label;
}
function pick(g) {
  if (!queue.length) return;
  const cur = queue.shift();
  const log = document.getElementById('log');
  if (cur.group === g) {
    score++; log.className = 'log ok'; log.textContent = '✓ Doğru sınıflandırdın: ' + cur.label;
  } else {
    log.className = 'log bad'; log.textContent = '✕ Yanlış kutu: ' + cur.label;
  }
  render();
}
document.getElementById('g0').onclick = () => pick(0);
document.getElementById('g1').onclick = () => pick(1);
document.getElementById('resetBtn').onclick = init;
document.getElementById('againBtn').onclick = init;
init();
</script></body></html>`
}

export function buildActivitySrcDoc(activity: InteractiveActivity): string | null {
  const payload = activity.html5_payload
  if (!activity.html5_type || !payload) return null

  switch (activity.html5_type) {
    case 'matching':
      return buildMatchingHtml(activity.title, (payload.pairs as Array<{ left: string; right: string }>) ?? [])
    case 'flashcards':
      return buildFlashcardsHtml(activity.title, (payload.cards as Array<{ front: string; back: string; tag?: string }>) ?? [])
    case 'memory':
      return buildMemoryHtml(activity.title, (payload.pairs as Array<{ a: string; b: string }>) ?? [])
    case 'timeline':
      return buildTimelineHtml(activity.title, (payload.events as Array<{ year: string; label: string }>) ?? [])
    case 'sorting':
      return buildSortingHtml(
        activity.title,
        (payload.groups as [string, string]) ?? ['Grup 1', 'Grup 2'],
        (payload.items as Array<{ label: string; group: 0 | 1 }>) ?? [],
      )
  }
}

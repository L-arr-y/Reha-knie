// Wiederverwendbare Bausteine: Symbole, Chips, Ampel, Schmerzskala, YouTube-Button, Sheet, Toast.
import { esc } from './util.js';
import { ampel, youtubeUrl } from './regeln.js';

const svg = (inner, vb = '0 0 24 24') =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export const icon = {
  heute: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/>'),
  uebungen: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none"/>'),
  verlauf: svg('<path d="M4 20V4M4 20h16"/><path d="M7.5 15l4-4.5 3 3L20 7"/>'),
  warnzeichen: svg('<path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17.3" r="1.1" fill="currentColor" stroke="none"/>'),
  einstellungen: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', '0 0 24 24').replace('stroke-width="2"', 'stroke-width="3"'),
  chev: `<svg class="chev" viewBox="0 0 10 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 2l6 6-6 6"/></svg>`,
  play: svg('<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  video: svg('<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9v6l5-3z" fill="currentColor"/>'),
  phone: svg('<path d="M5 3.5h3.5l1.8 4.5-2.3 1.5a11 11 0 005.5 5.5l1.5-2.3 4.5 1.8V18a2.5 2.5 0 01-2.5 2.5A16 16 0 013.5 6 2.5 2.5 0 015 3.5z"/>'),
  share: svg('<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M5 11v8.5h14V11"/>'),
};

export function statusChip(status, eigen = false) {
  if (eigen) return `<span class="chip eigen">eigener Wert</span>`;
  if (!status || status === 'gesichert') return '';
  return `<span class="chip ${esc(status)}">${esc(status === 'ergänzend' ? 'ergänzend' : 'OFFEN')}</span>`;
}

/** Ampel als Chip: Farbe + Symbol + Text (nie nur Farbe). */
export function ampelChip(wert, r, mitText = false) {
  const a = ampel(wert, r);
  if (!a) return '';
  const st = r.ampel.stufen[a];
  return `<span class="ampel ${a}" role="status"><span class="s" aria-hidden="true">${esc(st.symbol)}</span>${esc(st.titel)} · ${esc(wert)}/10</span>${
    mitText ? `<div class="ampel-text">${esc(st.text)}</div>` : ''}`;
}

/**
 * Schmerzskala 0–10 mit großen Tasten.
 * mitAmpel: gewählte Taste in Ampelfarbe (sonst neutral blau).
 */
export function schmerzSkala(action, wert, r, { mitAmpel = true, extra = '' } = {}) {
  let html = `<div class="scale" role="group" aria-label="Schmerz 0 bis 10">`;
  for (let i = 0; i <= 10; i++) {
    const sel = wert !== null && wert !== undefined && Number(wert) === i;
    const cls = mitAmpel ? ampel(i, r) : 'neutral';
    html += `<button type="button" class="${cls}" aria-pressed="${sel}" data-action="${esc(action)}" data-wert="${i}" ${extra}>${i}</button>`;
  }
  html += `</div><div class="scale-labels"><span>0 = kein Schmerz</span><span>10 = stärkster</span></div>`;
  return html;
}

export function ytButton(uebung, regeln, online) {
  const url = youtubeUrl(uebung.suchbegriff);
  return `<div class="yt">
    <a class="btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-action="yt">${icon.video}Übung auf YouTube suchen</a>
    ${online ? '' : `<div class="offline">${esc(regeln.hinweise.offline_video)}</div>`}
    <div class="hint">${esc(regeln.hinweise.video_disclaimer)}</div>
  </div>`;
}

export function banner(typ, symbol, titel, text, actions = '') {
  return `<div class="banner ${typ}" role="${typ === 'rot' ? 'alert' : 'status'}">
    <div class="sym" aria-hidden="true">${esc(symbol)}</div>
    <div class="body"><div class="headline">${esc(titel)}</div>${text ? `<div class="footnote" style="color:inherit">${text}</div>` : ''}
    ${actions ? `<div class="actions">${actions}</div>` : ''}</div>
  </div>`;
}

// ---------- Sheet ----------
let sheetState = null;

export function sheetOffen() { return !!sheetState; }

export function openSheet(titel, renderFn) {
  sheetState = { titel, renderFn };
  const root = document.getElementById('sheet-root');
  root.innerHTML = `<div class="backdrop" data-action="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(titel)}">
      <div class="sheet-bar"><div class="t">${esc(titel)}</div><button class="btn-done" data-action="sheet-close">Fertig</button></div>
      <div class="sheet-content" id="sheet-content"></div>
    </div>`;
  renderSheet();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelector('.backdrop')?.classList.add('open');
    root.querySelector('.sheet')?.classList.add('open');
  }));
}

export function renderSheet() {
  if (!sheetState) return;
  const c = document.getElementById('sheet-content');
  if (c) c.innerHTML = sheetState.renderFn();
}

export function closeSheet() {
  const root = document.getElementById('sheet-root');
  const sh = root.querySelector('.sheet');
  sheetState = null;
  if (!sh) return;
  sh.classList.remove('open');
  root.querySelector('.backdrop')?.classList.remove('open');
  setTimeout(() => { if (!sheetState) root.innerHTML = ''; }, 320);
}

// ---------- Toast ----------
let toastTimer = null;
export function toast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

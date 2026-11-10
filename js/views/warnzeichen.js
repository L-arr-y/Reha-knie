// Tab "Warnzeichen": Red Flags, jederzeit erreichbar.
import { S } from '../store.js';
import { esc } from '../util.js';
import { icon, statusChip, banner } from '../ui.js';

export function render() {
  const w = S.daten.warnzeichen;
  let html = `<h1 class="large-title">${esc(w.titel)}</h1>`;
  html += banner('rot', '!', w.aufforderung, esc(S.daten.regeln.hinweise.keine_diagnose));
  for (const k of w.kategorien) {
    const sym = k.id === 'sofort_arzt' ? '✕' : '!';
    html += `<div class="section"><div class="section-header">${esc(k.titel)}</div><div class="list">`;
    for (const e of k.eintraege) {
      html += `<div class="cell-block"><div class="checkrow">
        <div class="banner ${k.id === 'sofort_arzt' ? 'rot' : 'gelb'}" style="padding:0;margin:4px 0 0;background:none"><div class="sym" aria-hidden="true">${sym}</div></div>
        <div class="grow" style="padding-top:2px"><div class="headline">${esc(e.title || e.titel)} ${statusChip(e.status)}</div><div class="footnote">${esc(e.text)}</div></div>
      </div></div>`;
    }
    html += `</div></div>`;
  }
  html += `<div class="section"><div class="section-header">Arzt erreichen ${statusChip(w.notruf_status)}</div>
    <div class="card">
      <div class="footnote">${esc(w.notruf_hinweis)}</div>
      <div class="row mt12">
        <a class="btn" href="tel:116117">${icon.phone}116 117</a>
        <a class="btn danger filled" href="tel:112">${icon.phone}112</a>
      </div>
    </div>
    <div class="section-footer">${esc(w.notruf_quelle)}</div></div>`;
  return html;
}

export const actions = {};

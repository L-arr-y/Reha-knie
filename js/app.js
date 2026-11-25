// Start der App: Daten laden, Tabs, Klicks und Eingaben an die Ansichten verteilen, Timer-Takt.
import { S, laden, setKV } from './store.js';
import { icon, openSheet, closeSheet, renderSheet, sheetOffen, toast } from './ui.js';
import { esc } from './util.js';
import * as heute from './views/heute.js';
import * as uebersicht from './views/uebersicht.js';
import * as uebungen from './views/uebungen.js';
import * as verlauf from './views/verlauf.js';
import * as mehr from './views/mehr.js';
import * as daten from './daten.js';

const TABS = [
  { id: 'heute', label: 'Heute', view: heute },
  { id: 'uebersicht', label: 'Übersicht', view: uebersicht },
  { id: 'uebungen', label: 'Übungen', view: uebungen },
  { id: 'verlauf', label: 'Verlauf', view: verlauf },
  { id: 'mehr', label: 'Mehr', view: mehr },
];

const actions = {
  ...daten.actions, ...verlauf.actions, ...uebungen.actions, ...mehr.actions, ...uebersicht.actions, ...heute.actions,
  'willkommen-ok': async () => { await setKV('ersterStartGesehen', true); closeSheet(); },
  'willkommen-home': () => mehr.oeffneHomeAnleitung(),
};
const inputs = { ...heute.inputs, ...uebungen.inputs, ...mehr.inputs, ...verlauf.inputs, ...daten.inputs };

let tab = 'heute';
try { tab = localStorage.getItem('tab') || 'heute'; } catch (_) { /* privat */ }
if (!TABS.some((t) => t.id === tab)) tab = 'heute';

function render() {
  const t = TABS.find((x) => x.id === tab);
  document.getElementById('view').innerHTML = t.view.render();
  document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
  if (sheetOffen()) renderSheet();
}

function tabbar() {
  document.getElementById('tabbar').innerHTML = TABS.map((t) =>
    `<button class="tab" data-action="tab" data-tab="${t.id}" aria-label="${esc(t.label)}">${icon[t.id]}<span>${esc(t.label)}</span></button>`).join('');
}

function wechsleTab(id) {
  if (tab === id) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  tab = id;
  try { localStorage.setItem('tab', id); } catch (_) { /* egal */ }
  closeSheet();
  render();
  window.scrollTo(0, 0);
}

document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const name = el.dataset.action;
  if (name === 'yt') {
    if (!navigator.onLine) { ev.preventDefault(); toast(S.daten.regeln.hinweise.offline_video); }
    return;
  }
  if (name === 'download') { actions.download(); return; } // Link lädt die Datei selbst
  if (name === 'sheet-close') { closeSheet(); render(); return; }
  if (name === 'tab') { wechsleTab(el.dataset.tab); return; }
  const fn = actions[name];
  if (!fn) return;
  ev.preventDefault();
  try {
    await fn(el, ev);
  } catch (err) {
    console.error(err);
    toast('Fehler: ' + err.message);
  }
  render();
});

async function onInput(ev) {
  const el = ev.target.closest('[data-input]');
  if (!el) return;
  const fn = inputs[el.dataset.input];
  if (!fn) return;
  if (await fn(el, ev)) render();
}
const perChange = (t) => t.type === 'checkbox' || t.type === 'file' || t.type === 'date';
document.addEventListener('input', (ev) => { if (!perChange(ev.target)) onInput(ev); });
document.addEventListener('change', (ev) => { if (perChange(ev.target)) onInput(ev); });

window.addEventListener('online', () => { S.online = true; render(); });
window.addEventListener('offline', () => { S.online = false; render(); });

function takt() { if (heute.tick() && tab === 'heute') render(); }
setInterval(takt, 250);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') takt(); });

function willkommen() {
  const r = S.daten.regeln;
  openSheet('Willkommen', () => `
    <div class="title2">Dein Reha-Assistent</div>
    <div class="banner rot mt16"><div class="sym" aria-hidden="true">!</div><div class="body"><div class="headline">${esc(r.hinweise.disclaimer)}</div>
      <div class="footnote" style="color:inherit">${esc(r.hinweise.keine_diagnose)}</div></div></div>
    <div class="section"><div class="list">
      <div class="cell-block"><div class="headline">Jeden Morgen: 10-Sekunden-Test</div><div class="footnote">${esc(r.morgentest.anleitung)} Daraus ergibt sich die Ampel und der Trainingsvorschlag.</div></div>
      <div class="cell-block"><div class="headline">Deine Daten bleiben auf dem iPhone</div><div class="footnote">Kein Konto, kein Upload, kein Tracking.</div></div>
      <div class="cell-block"><div class="headline">Zum Home-Bildschirm hinzufügen</div><div class="footnote">${S.standalone ? '✓ Erledigt.' : 'Bitte gleich machen: Dann läuft die App offline und Safari löscht deine Daten nicht so leicht.'}</div></div>
    </div></div>
    ${S.standalone ? '' : `<button class="btn block mb8" data-action="willkommen-home">So geht's</button>`}
    <button class="btn filled lg" data-action="willkommen-ok">Verstanden</button>`);
}

async function start() {
  tabbar();
  try {
    await laden();
  } catch (err) {
    document.getElementById('view').innerHTML = `<h1 class="large-title">Fehler</h1><div class="card">Die App-Daten konnten nicht geladen werden: ${esc(err.message)}</div>`;
    return;
  }
  try {
    if (navigator.storage?.persisted) {
      S.persistiert = await navigator.storage.persisted();
      if (!S.persistiert && navigator.storage.persist) S.persistiert = await navigator.storage.persist();
    }
  } catch (_) { S.persistiert = null; }
  render();
  if (!S.kv.ersterStartGesehen) willkommen();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Service Worker nicht registriert', e));
  }
}

start();

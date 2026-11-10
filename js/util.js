// Kleine Hilfsfunktionen ohne Abhängigkeiten.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const pad = (n) => String(n).padStart(2, '0');

/** Lokales Datum als JJJJ-MM-TT (nicht UTC!). */
export function isoDatum(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** JJJJ-MM-TT -> TT.MM.JJJJ */
export function deDatum(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

/** JJJJ-MM-TT -> Date (Mittag, damit Zeitumstellung egal ist) */
export function parseIso(iso) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addTage(iso, n) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return isoDatum(d);
}

/** Ganze Tage von a nach b (b - a). */
export function diffTage(aIso, bIso) {
  return Math.round((parseIso(bIso) - parseIso(aIso)) / 86400000);
}

/** Montag der Woche (ISO-Woche) als JJJJ-MM-TT. */
export function wochenStart(iso) {
  const d = parseIso(iso);
  const wd = (d.getDay() + 6) % 7; // Mo=0 … So=6
  d.setDate(d.getDate() - wd);
  return isoDatum(d);
}

export const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const WOCHENTAGE_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export function wochentag(iso) {
  return WOCHENTAGE_LANG[parseIso(iso).getDay()];
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function zahlDE(n, stellen = 1) {
  if (n === null || n === undefined || n === '') return '';
  return Number(n).toLocaleString('de-DE', { maximumFractionDigits: stellen });
}

/** "2,5" oder "2.5" -> 2.5; leer -> null */
export function parseZahl(s) {
  if (s === null || s === undefined) return null;
  const t = String(s).trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function mmss(sek) {
  const s = Math.max(0, Math.ceil(sek));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

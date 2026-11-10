// Regelwerk als reine Funktionen (ohne Bildschirm, ohne Datenbank) – dadurch testbar.
// Alle Schwellen kommen aus data/regeln.json (Parameter r).
import { diffTage, wochenStart, parseIso } from './util.js';

const istZahl = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

/** Ampel für einen Schmerzwert: 'gruen' | 'gelb' | 'rot' | null */
export function ampel(wert, r) {
  if (!istZahl(wert)) return null;
  const v = Number(wert);
  if (v <= r.ampel.gruen_max) return 'gruen';
  if (v <= r.ampel.gelb_max) return 'gelb';
  return 'rot';
}

export function ueberSchwelle(wert, r) {
  return istZahl(wert) && Number(wert) > r.reduktion.schwelle_ueber;
}

/** Höchster Schmerz während der Übungen einer Einheit (oder null). */
export function maxSchmerzWaehrend(einheit) {
  if (!einheit) return null;
  const werte = (einheit.uebungen || []).map((u) => u.schmerzWaehrend).filter(istZahl).map(Number);
  return werte.length ? Math.max(...werte) : null;
}

/** Hatte die Einheit Schmerz über der Schwelle (während der Übungen)? */
export function einheitRot(einheit, r) {
  return ueberSchwelle(maxSchmerzWaehrend(einheit), r);
}

export function abgeschlossene(einheiten) {
  return (einheiten || [])
    .filter((e) => e.abgeschlossen)
    .sort((a, b) => (a.startISO < b.startISO ? -1 : a.startISO > b.startISO ? 1 : 0));
}

export function letzteAbgeschlossene(einheiten, filter = () => true) {
  const l = abgeschlossene(einheiten).filter(filter);
  return l.length ? l[l.length - 1] : null;
}

/** Reduktionshinweis für die nächste Einheit: letzte abgeschlossene Einheit war rot. */
export function reduktionAktiv(einheiten, r) {
  const l = letzteAbgeschlossene(einheiten);
  return l && einheitRot(l, r) ? { einheit: l, wert: maxSchmerzWaehrend(l) } : null;
}

/** Älteste unbeantwortete Rot-Meldung, deren Prüffrist (z. B. 7 Tage) erreicht ist. */
export function faelligePruefung(ereignisse, heuteIso, r) {
  const offen = (ereignisse || [])
    .filter((e) => e.typ === 'rot' && !e.antwort)
    .sort((a, b) => (a.datumISO < b.datumISO ? -1 : 1));
  return offen.find((e) => diffTage(e.datumISO, heuteIso) >= r.reduktion.pruefung_nach_tagen) || null;
}

/**
 * Pausenempfehlung (Programm pausieren, Arzt kontaktieren).
 * Auslöser: Antwort "nicht besser" auf die 7-Tage-Frage oder "zunehmende Alltagsschmerzen" am Morgen.
 * quittiertISO: Zeitpunkt, an dem du bestätigt hast, dass du es mit dem Arzt besprochen hast.
 */
export function pauseStatus({ ereignisse = [], morgen = [], quittiertISO = null }) {
  const ausloeser = [];
  for (const e of ereignisse) {
    if (e.typ === 'rot' && e.antwort === 'nicht_besser') ausloeser.push({ zeit: e.antwortISO, grund: 'keine_besserung' });
  }
  for (const m of morgen) {
    if (m.alltagsschmerzZunahme) ausloeser.push({ zeit: m.erfasstISO, grund: 'alltagsschmerz' });
  }
  ausloeser.sort((a, b) => (a.zeit < b.zeit ? -1 : 1));
  const letzter = ausloeser[ausloeser.length - 1];
  if (!letzter) return { aktiv: false };
  if (quittiertISO && quittiertISO >= letzter.zeit) return { aktiv: false };
  return { aktiv: true, grund: letzter.grund, zeit: letzter.zeit };
}

/**
 * Stand des Phasenwechsels für die aktuelle Stufe.
 * Automatische Kriterien (automatisch: "schmerz") werden aus der letzten Einheit dieser Stufe gelesen,
 * alle anderen (außer OFFEN) musst du selbst abhaken.
 */
export function phasenwechselStatus(phaseId, einheiten, checks, phasen, r) {
  const phase = phasen.find((p) => p.id === phaseId);
  const regel = (r.phasenwechsel || []).find((x) => x.von === phaseId);
  if (!phase || !phase.uebergang || !regel) return null;
  const letzte = letzteAbgeschlossene(einheiten, (e) => e.phase === phaseId);
  const letzterWert = maxSchmerzWaehrend(letzte);
  const schwelleOffen = regel.schmerz_max === null || regel.schmerz_max === undefined;
  const schmerzOk = schwelleOffen ? null : letzterWert !== null && letzterWert <= regel.schmerz_max;
  const kriterien = phase.uebergang.kriterien.map((k) => {
    let erfuellt;
    if (k.status === 'OFFEN') erfuellt = null;
    else if (k.automatisch === 'schmerz') erfuellt = schmerzOk;
    else erfuellt = !!(checks && checks[k.id]);
    return { ...k, erfuellt };
  });
  const bereit = kriterien.every((k) => k.erfuellt !== false);
  return { regel, phase, nach: regel.nach, letzterWert, schmerzOk, schwelleOffen, kriterien, bereit };
}

/**
 * Progressionsvorschlag Exzentrik nach einer Einheit.
 * Nur wenn die Einheit als beschwerdefrei markiert ist und alle geplanten Sätze geschafft sind.
 */
export function exzProgression(einheit, stufeIdx, r) {
  const p = r.progression_exzentrik;
  if (!einheit || einheit.beschwerdefrei !== true || einheitRot(einheit, r)) return null;
  const ue = (einheit.uebungen || []).find((u) => u.uebungId === p.uebung);
  if (!ue || ue.abgebrochen) return null;
  const idx = Math.min(Math.max(0, stufeIdx || 0), p.stufen.length - 1);
  const st = p.stufen[idx];
  if ((ue.saetzeErledigt || 0) < st.saetze) return null;
  if (idx < p.stufen.length - 1) return { typ: 'steigern', von: st, nach: p.stufen[idx + 1], naechsterIdx: idx + 1 };
  if (st.saetze >= r.zusatzlast.ab_saetze && st.wiederholungen >= r.zusatzlast.ab_wiederholungen) return { typ: 'zusatzlast' };
  return null;
}

/** Anzahl Einheiten mit Plyometrie in der Woche (Mo–So) des Datums. */
export function plyoEinheitenWoche(einheiten, heuteIso, uebungenById) {
  const ws = wochenStart(heuteIso);
  return abgeschlossene(einheiten).filter((e) => {
    if (wochenStart(e.datumISO) !== ws) return false;
    return (e.uebungen || []).some((u) => uebungenById[u.uebungId]?.plyometrie && (u.saetzeErledigt || 0) > 0);
  }).length;
}

export function plyoErlaubt(anzahlDieseWoche, r) {
  return anzahlDieseWoche < r.plyometrie.max_pro_woche;
}

export function istTrainingstag(wochenplan, iso) {
  return (wochenplan || []).includes(parseIso(iso).getDay());
}

/** Erinnerung fällig, wenn noch nie oder vor mindestens `tage` Tagen. */
export function faellig(letzteIso, heuteIso, tage) {
  if (!letzteIso) return true;
  return diffTage(letzteIso.slice(0, 10), heuteIso) >= tage;
}

export function youtubeUrl(begriff) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(begriff || '');
}

/**
 * Wirksame Dosierung einer Übung: eigener Wert (Einstellungen) vor JSON-Wert.
 * Gibt je Feld { wert, wert_max, text, status, quelle, eigen } zurück.
 */
export function wirksameDosierung(uebung, eigene = {}) {
  const out = {};
  for (const [key, d] of Object.entries(uebung.dosierung || {})) {
    const eigen = eigene[key];
    if (istZahl(eigen)) out[key] = { ...d, wert: Number(eigen), wert_max: undefined, eigen: true };
    else if (typeof eigen === 'string' && eigen.trim() !== '') out[key] = { ...d, text: eigen.trim(), eigen: true };
    else out[key] = { ...d, eigen: false };
  }
  return out;
}

/** Übungen des heutigen Plans für Stufe + aktive Varianten (Hauptübungen + Begleitübungen). */
export function planUebungen(phase, varianten = {}) {
  if (!phase) return { haupt: [], begleitend: [] };
  const haupt = [...(phase.uebungen || [])];
  for (const v of phase.varianten || []) {
    const aktiv = varianten[v.id] ?? v.standard_aktiv;
    if (aktiv) haupt.push(...v.uebungen);
  }
  return { haupt, begleitend: [...(phase.begleitend || [])] };
}

// Tab "Mehr": Warnzeichen, Return-to-Play, Einstellungen (Körper, Plan, Stufe, Grenzwerte), Speicher, Daten.
import { S, R, setKV, speichern, status, plan, REGEL_FELDER, regelStandard } from '../store.js';
import { rtpAuswertung } from '../regeln.js';
import { APP_VERSION } from '../version.js';
import { db, STORES } from '../db.js';
import { esc, isoDatum, deDatum, uid, parseZahl, zahlDE } from '../util.js';
import { icon, statusChip, banner, openSheet, kopf, toast } from '../ui.js';

export function render() {
  const r = R();
  const st = status();
  const pl = plan();
  let html = kopf('Mehr');

  html += `<div class="section"><div class="list">
    <button class="cell" data-action="warn-open"><span style="color:var(--red);width:24px;display:inline-flex">${icon.warnzeichen}</span><div class="grow">Warnzeichen</div>${icon.chev}</button>
    <button class="cell" data-action="rtp-open"><span style="width:24px;text-align:center">✓</span><div class="grow">Return-to-Play-Check<div class="footnote">${rtpKurz()}</div></div>${icon.chev}</button>
  </div></div>`;

  html += `<div class="section"><div class="list"><div class="cell-block">
    <div class="headline">Wichtiger Hinweis</div><div class="footnote mt8" style="color:var(--label)">${esc(r.hinweise.disclaimer)}</div>
    <div class="footnote mt8">${esc(r.hinweise.keine_diagnose)}</div></div></div></div>`;

  // Persönliches
  html += `<div class="section"><div class="section-header">Persönliches</div><div class="list">
    <div class="cell"><div class="grow">Körpergewicht<div class="footnote">für das 150-%-Kriterium (Stufe 2 → 3)</div></div>
      <input class="num-input" inputmode="decimal" data-input="koerpergewicht" value="${S.kv.koerpergewicht != null ? zahlDE(S.kv.koerpergewicht, 1) : ''}" placeholder="kg"></div>
    <div class="cell-block"><div class="mb8">Betroffenes Bein</div><div class="seg">
      ${['links', 'rechts'].map((b) => `<button data-action="bein" data-wert="${b}" aria-pressed="${S.kv.bein === b}">${b}</button>`).join('')}</div></div>
  </div><div class="section-footer">Das betroffene Bein nutzt der Seitenvergleich im Return-to-Play-Check.</div></div>`;

  // Plan
  html += `<div class="section"><div class="section-header">8-Wochen-Plan</div><div class="list">
    <div class="cell"><div class="grow">Planstart</div><input type="date" style="width:170px" data-input="planstart" value="${esc(pl.start)}"></div>
    <div class="cell"><div class="grow">Ziel erstes Spiel (Idealverlauf)</div><div class="value">${deDatum(S.kv.planStart ? addTageSafe(S.daten.plan.zielSpiel, S.daten.plan.start, pl.start) : S.daten.plan.zielSpiel)}</div></div>
  </div><div class="section-footer">Standard laut Leitfaden: Start 23.11.2026, erstes vorsichtiges Spiel ca. 18.01.2027. Nur Orientierung.</div></div>`;

  // Stufe manuell
  html += `<div class="section"><div class="section-header">Stufe manuell festlegen</div><div class="list">`;
  for (const s of S.daten.stufen) {
    html += `<button class="cell" data-action="stufe-manuell" data-nr="${s.nr}"><div class="grow">${s.nr <= 4 ? `Stufe ${s.nr} – ` : ''}${esc(s.name)}</div>${s.nr === st.stufe ? '<span class="value">✓ aktuell</span>' : ''}</button>`;
  }
  html += `</div><div class="section-footer">Nur nach Rücksprache mit Physio/Arzt. Normalerweise steuern Ampel und Übersicht die Stufe.</div></div>`;

  // Grenzwerte
  html += `<div class="section"><div class="section-header">Grenzwerte (aus dem Leitfaden, änderbar)</div><div class="list">`;
  for (const f of REGEL_FELDER) {
    const eigen = S.kv.regelWerte?.[f.pfad];
    html += `<div class="cell"><div class="grow">${esc(f.label)}<div class="footnote">Standard: ${zahlDE(regelStandard(f.pfad))} ${esc(f.einheit)}</div></div>
      <input class="num-input" inputmode="decimal" data-input="regelwert" data-pfad="${esc(f.pfad)}" value="${eigen != null ? zahlDE(eigen) : ''}" placeholder="${zahlDE(regelStandard(f.pfad))}"></div>`;
  }
  html += `</div><div class="section-footer">Leer = Standard. Laut Leitfaden sind die Grenzwerte Konventionen aus Studien, keine Naturgesetze. Änderungen am besten mit Physio.</div></div>`;

  // Speicher
  html += `<div class="section"><div class="section-header">Speicher</div><div class="list">
    <div class="cell"><div class="grow">Dauerhafter Speicher</div><div class="value">${S.persistiert === true ? '✓ gewährt' : S.persistiert === false ? 'nicht gewährt' : 'unbekannt'}</div></div>
    <div class="cell"><div class="grow">Als App installiert</div><div class="value">${S.standalone ? '✓ ja' : 'nein'}</div></div>
    <button class="cell" data-action="home-anleitung"><div class="grow" style="color:var(--blue)">Zum Home-Bildschirm hinzufügen – Anleitung</div>${icon.chev}</button>
  </div><div class="section-footer">Deine Daten liegen nur auf diesem iPhone. Kein Tracking, keine externen Dienste.</div></div>`;

  // Daten
  html += `<div class="section"><div class="section-header">Daten</div><div class="list">
    <button class="cell" data-action="export"><div class="grow" style="color:var(--blue)">Daten exportieren (CSV)</div>${icon.chev}</button>
    <button class="cell" data-action="import"><div class="grow" style="color:var(--blue)">Daten importieren (CSV)</div>${icon.chev}</button>
    <button class="cell" data-action="alles-loeschen"><div class="grow" style="color:var(--red)">Alle meine Daten löschen</div></button>
  </div><div class="section-footer">Export: 7 CSV-Dateien (Morgentests, Einheiten, Sätze, Stufen, Return-to-Play, VISA-P, Einstellungen) für Excel/Numbers. ${S.kv.letzterExportISO ? `Letzter Export: ${deDatum(S.kv.letzterExportISO.slice(0, 10))}.` : 'Noch nie exportiert.'}</div></div>`;

  html += `<div class="footnote center mb8">App-Version ${esc(APP_VERSION)}</div>`;
  html += `<div class="footnote center">Grundlage: Reha-Leitfaden Patellarsehne & Basketball-Oberkörper (docs/reha_leitfaden.md)</div>`;
  return html;
}

function addTageSafe(ziel, alterStart, neuerStart) {
  const ms = new Date(neuerStart) - new Date(alterStart);
  const d = new Date(new Date(ziel).getTime() + ms);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- Sheets
export function oeffneWarnzeichen() {
  const w = S.daten.warnzeichen;
  openSheet('Warnzeichen', () => {
    let html = banner('rot', '!', w.aufforderung, esc(S.daten.regeln.hinweise.keine_diagnose));
    for (const k of w.kategorien) {
      html += `<div class="section"><div class="section-header">${esc(k.titel)}</div><div class="list">`;
      for (const e of k.eintraege) {
        html += `<div class="cell-block"><div class="headline">${k.id === 'sofort_arzt' ? '✕' : '!'} ${esc(e.titel)}</div><div class="footnote">${esc(e.text)}</div></div>`;
      }
      html += `</div></div>`;
    }
    html += `<div class="section"><div class="section-header">Arzt erreichen ${statusChip(w.notruf_status)}</div><div class="card">
      <div class="footnote">${esc(w.notruf_hinweis)}</div>
      <div class="row mt12"><a class="btn" href="tel:116117">${icon.phone}116 117</a><a class="btn danger filled" href="tel:112">${icon.phone}112</a></div></div>
      <div class="section-footer">${esc(w.notruf_quelle)}</div></div>`;
    return html;
  });
}

// ---------------------------------------------------------------- Return to Play
const rtp = { entwurf: {} };
const letzterRtp = () => [...S.rtpchecks].sort((a, b) => (a.datum < b.datum ? -1 : 1)).pop() || null;

function rtpKurz() {
  const l = letzterRtp();
  if (!l) return 'Noch nicht gemacht – sinnvoll ab Stufe 4';
  const a = rtpAuswertung(l, { verlauf: status().verlauf, heute: isoDatum(), bein: S.kv.bein }, R());
  return `${a.punkte.filter((p) => p.ok).length}/${a.punkte.length} erfüllt · ${deDatum(l.datum)}`;
}

function rtpSheet() {
  const r = R();
  const d = rtp.entwurf;
  const st = status();
  const a = rtpAuswertung(d, { verlauf: st.verlauf, heute: isoDatum(), bein: S.kv.bein }, r);
  const feldZ = (key, label, einheit) => `<div class="cell"><div class="grow">${label}</div>
    <input class="num-input" inputmode="decimal" data-input="rtp-feld" data-key="${key}" value="${d[key] != null ? zahlDE(d[key], 2) : ''}" placeholder="${einheit}"></div>`;
  const jn = (key, label) => `<div class="cell-block"><div class="mb8">${label}</div><div class="seg">
    ${[['ja', true], ['nein', false]].map(([t, v]) => `<button data-action="rtp-jn" data-key="${key}" data-wert="${v}" aria-pressed="${d[key] === v}">${t}</button>`).join('')}</div></div>`;
  const betroffen = S.kv.bein;
  let html = `<div class="title2">Return-to-Play-Check</div>
    <div class="footnote mt8">Wettkampf erst, wenn alle Stufe-4-Inhalte bei Schmerz ≤ ${r.rtp.slsMax} laufen und der Morgenwert stabil bleibt. Betroffenes Bein: <b>${esc(betroffen)}</b> (änderbar unter Mehr → Persönliches).</div>
    <div class="section mt16"><div class="section-header">Einbeiniger Sprung auf Weite</div><div class="list">
      ${feldZ('sprungweiteL', 'Links', 'cm')}${feldZ('sprungweiteR', 'Rechts', 'cm')}${feldZ('sprungSchmerz', 'Schmerz dabei (0–10)', '0–10')}
      <div class="cell"><div class="grow">Seitenvergleich (LSI)</div><div class="value">${a.lsiSprung != null ? `${zahlDE(a.lsiSprung)} %` : '–'}</div></div></div></div>
    <div class="section"><div class="section-header">6-m-Hop-Test (einbeinig auf Zeit)</div><div class="list">
      ${feldZ('hop6mL', 'Links', 's')}${feldZ('hop6mR', 'Rechts', 's')}
      <div class="cell"><div class="grow">Seitenvergleich (LSI)</div><div class="value">${a.lsiHop != null ? `${zahlDE(a.lsiHop)} %` : '–'}</div></div>
      ${jn('hopOhneAnstieg', 'Ohne Schmerzanstieg?')}</div></div>
    <div class="section"><div class="section-header">Weitere Punkte</div><div class="list">
      ${jn('teamtraining', 'Volles Teamtraining inkl. Kontakt 2× ohne Ampel Gelb am Folgetag?')}
      ${feldZ('selbsteinschaetzung', 'Selbsteinschätzung des Knies', '%')}</div></div>
    <div class="section"><div class="section-header">Auswertung</div><div class="card">`;
  for (const p of a.punkte) html += `<div class="punkt ${p.ok ? 'ok' : ''}"><span class="sym" aria-hidden="true">${p.ok ? '✓' : '·'}</span><div>${esc(p.text)}${p.automatisch === 'sls' || p.automatisch === 'morgen_stabil' ? '<div class="footnote">automatisch aus deinen Morgentests</div>' : ''}</div></div>`;
  html += `<div class="hinweis-box">${a.alleErfuellt ? '✓ Alle Punkte erfüllt.' : 'Noch nicht alle Punkte erfüllt.'} ${esc(r.rtp.hinweis)}</div></div></div>
    <button class="btn filled lg" data-action="rtp-speichern">Check speichern</button>`;
  return html;
}

export function oeffneRtp() {
  const h = isoDatum();
  const l = letzterRtp();
  rtp.entwurf = l && l.datum === h ? { ...l } : { id: null, datum: h };
  openSheet('Return to Play', rtpSheet);
}

export function oeffneHomeAnleitung() {
  openSheet('Zum Home-Bildschirm', () => `
    <div class="title2">App installieren</div>
    <div class="footnote mt8">So verhält sich die Seite wie eine App: Vollbild, eigenes Symbol, offline nutzbar – und Safari löscht deine Daten nicht so leicht.</div>
    <div class="section mt16"><div class="list">
      <div class="cell-block"><b>1.</b> Seite in <b>Safari</b> öffnen.</div>
      <div class="cell-block"><b>2.</b> Unten auf <span style="color:var(--blue);display:inline-flex;vertical-align:middle;width:22px">${icon.share}</span> <b>Teilen</b> tippen (ggf. erst „…“).</div>
      <div class="cell-block"><b>3.</b> <b>„Zum Home-Bildschirm“</b> wählen.</div>
      <div class="cell-block"><b>4.</b> „Als Web-App öffnen“ eingeschaltet lassen, <b>Hinzufügen</b>.</div>
      <div class="cell-block"><b>5.</b> Ab jetzt immer über das neue Symbol starten.</div>
    </div></div>
    <div class="footnote">Die installierte App hat einen eigenen Speicher – am besten gleich zu Beginn installieren.</div>`);
}

export const actions = {
  'warn-open': () => oeffneWarnzeichen(),
  'rtp-open': () => oeffneRtp(),
  'rtp-jn': (el) => { rtp.entwurf[el.dataset.key] = el.dataset.wert === 'true'; },
  'rtp-speichern': async () => {
    const d = rtp.entwurf;
    await speichern('rtpchecks', { ...d, id: d.id || uid(), datum: isoDatum() });
    rtp.entwurf = { ...d, id: d.id || S.rtpchecks[S.rtpchecks.length - 1].id };
    toast('Return-to-Play-Check gespeichert.');
  },
  'home-anleitung': () => oeffneHomeAnleitung(),
  bein: async (el) => { await setKV('bein', el.dataset.wert); },
  'stufe-manuell': async (el) => {
    const nr = Number(el.dataset.nr);
    if (nr === status().stufe) return;
    if (!confirm(`Stufe ${nr <= 4 ? nr : '„Erhaltung“'} manuell festlegen? Nur nach Rücksprache mit Physio/Arzt. Der Grün-Zähler startet neu.`)) return;
    await speichern('stufenwechsel', { id: uid(), datum: isoDatum(), nach: nr, grund: 'manuell', zeitISO: new Date().toISOString() });
    await setKV('bestaetigt', {});
    toast('Stufe gesetzt.');
  },
  'alles-loeschen': async () => {
    if (!confirm('Alle Morgentests, Einheiten und Einstellungen auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.')) return;
    if (!confirm('Wirklich endgültig löschen?')) return;
    for (const s of STORES) await db.clear(s);
    location.reload();
  },
};

export const inputs = {
  'rtp-feld': (el) => {
    const n = parseZahl(el.value);
    if (el.value.trim() === '') rtp.entwurf[el.dataset.key] = null;
    else if (n !== null && n >= 0) rtp.entwurf[el.dataset.key] = n;
    return false;
  },
  koerpergewicht: async (el) => { const n = parseZahl(el.value); if (el.value.trim() === '' || (n && n > 0)) await setKV('koerpergewicht', n); return false; },
  planstart: async (el) => { if (/^\d{4}-\d{2}-\d{2}$/.test(el.value)) await setKV('planStart', el.value === S.daten.plan.start ? null : el.value); return true; },
  regelwert: async (el) => {
    const n = parseZahl(el.value);
    const rw = { ...S.kv.regelWerte };
    if (el.value.trim() === '') delete rw[el.dataset.pfad];
    else if (n !== null && n >= 0) rw[el.dataset.pfad] = n;
    else return false;
    await setKV('regelWerte', rw);
    return false;
  },
};


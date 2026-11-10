// Mini-Testlauf ohne Bibliotheken.
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function gleich(ist, soll, msg = '') {
  const a = JSON.stringify(ist);
  const b = JSON.stringify(soll);
  if (a !== b) throw new Error(`${msg} erwartet ${b}, erhalten ${a}`);
}
export function wahr(x, msg = 'erwartet wahr') { if (!x) throw new Error(msg); }

export async function lauf(mods, ctx) {
  let ok = 0; let fail = 0; const zeilen = [];
  for (const m of mods) {
    for (const [name, fn] of Object.entries(m.tests(ctx))) {
      try { await fn(); ok++; zeilen.push(`<li class="ok">✓ ${esc(name)}</li>`); }
      catch (e) { fail++; zeilen.push(`<li class="fail">✕ ${esc(name)}<pre>${esc(e.message)}</pre></li>`); }
    }
  }
  return { ok, fail, zeilen };
}

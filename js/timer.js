// Timer auf Basis von Zeitstempeln: Die Restzeit wird immer aus "jetzt - Start" berechnet.
// Dadurch stimmt der Timer auch, wenn der Bildschirm gesperrt war oder du die App gewechselt hast.

/**
 * Status eines Satz-Segments: erst Halten (halteS), danach Pause (pauseS).
 * halteS = 0 → nur Pause (z. B. nach einem Satz mit Wiederholungen).
 */
export function segmentStatus({ startMs, halteS = 0, pauseS = 0, ohnePause = false }, nowMs) {
  const t = (nowMs - startMs) / 1000;
  if (t < halteS) return { phase: 'halten', rest: halteS - t, halteFertig: false };
  if (ohnePause || !pauseS) return { phase: 'fertig', rest: 0, halteFertig: true };
  if (t < halteS + pauseS) return { phase: 'pause', rest: halteS + pauseS - t, halteFertig: true };
  return { phase: 'fertig', rest: 0, halteFertig: true };
}

// ---------- Ton, Vibration, Bildschirm wach halten ----------
let audioCtx = null;

/** Muss bei einem Antippen aufgerufen werden, sonst blockiert Safari den Ton. */
export function audioFreischalten() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Ein stiller Ton entsperrt die Wiedergabe auf iOS.
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    g.gain.value = 0;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.01);
  } catch (_) { /* kein Ton verfügbar */ }
}

export function signal(anzahl = 1) {
  try {
    if (navigator.vibrate) navigator.vibrate(Array(anzahl).fill([200, 120]).flat());
  } catch (_) { /* iOS: keine Vibration aus Web-Apps */ }
  if (!audioCtx) return;
  try {
    for (let i = 0; i < anzahl; i++) {
      const t0 = audioCtx.currentTime + i * 0.28;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0);
      o.stop(t0 + 0.24);
    }
  } catch (_) { /* ignorieren */ }
}

let wakeLock = null;
let wachHalten = false;

export async function bildschirmWach(an) {
  wachHalten = an;
  try {
    if (an && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!an && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (_) { wakeLock = null; }
}

// Nach Rückkehr in die App wird die Sperre neu angefordert.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wachHalten) bildschirmWach(true);
});

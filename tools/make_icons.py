"""Erzeugt die App-Symbole (PNG) ohne Zusatzbibliotheken.
Motiv: weiße, ansteigende Verlaufslinie mit Punkten auf blauem Verlauf.
Aufruf: python3 -I tools/make_icons.py <Projektordner>
"""
import math
import struct
import sys
import zlib

PUNKTE = [(0.20, 0.68), (0.40, 0.52), (0.58, 0.60), (0.80, 0.32)]
OBEN = (10, 132, 255)
UNTEN = (0, 82, 204)


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def pixel(n, x, y):
    u, v = (x + 0.5) / n, (y + 0.5) / n
    r = [int(OBEN[i] + (UNTEN[i] - OBEN[i]) * v) for i in range(3)]
    d = min(seg_dist(u, v, *PUNKTE[i], *PUNKTE[i + 1]) for i in range(len(PUNKTE) - 1))
    linie = 0.045
    dot = min(math.hypot(u - a, v - b) for a, b in PUNKTE) - 0.065
    k = min(d - linie, dot)
    aa = 1.0 / n
    alpha = max(0.0, min(1.0, 0.5 - k / aa))
    return tuple(int(c + (255 - c) * alpha) for c in r)


def png(n, pfad):
    roh = bytearray()
    for y in range(n):
        roh.append(0)
        for x in range(n):
            roh.extend(pixel(n, x, y))
    def chunk(typ, daten):
        return struct.pack('>I', len(daten)) + typ + daten + struct.pack('>I', zlib.crc32(typ + daten) & 0xFFFFFFFF)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 2, 0, 0, 0)) \
        + chunk(b'IDAT', zlib.compress(bytes(roh), 9)) + chunk(b'IEND', b'')
    with open(pfad, 'wb') as f:
        f.write(data)


if __name__ == '__main__':
    ziel = sys.argv[1]
    for n in (180, 192, 512):
        png(n, f'{ziel}/icons/icon-{n}.png')
    print('ok')

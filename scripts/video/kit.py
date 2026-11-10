"""Shared drawing helpers for the Kopi Academy lesson videos (taken from the is-04 scenes).
Copy this file next to scenes.py and use: from kit import *"""
import cairo
from engine import *

RAIL = 842
HEADER = 'KOPI ACADEMY'
TCOL = hx('3E6F4E'); FCOL = hx('B5432F')
FAM = {'sans': SANS, 'sansb': SANSB, 'serif': SERIF}


# ---------------------------------------------------------------- helpers
def tut(t, xs, pts):
    """xs: [(time, x)] tutor x keyframes; pts: [(time, (px,py) or None)] pointer targets."""
    x = kf(t, [(tt, (v,)) for tt, v in xs], dur=0.8)[0]
    fr = []; last = (x, RAIL - 300)
    for tt, p in pts:
        if p is None: fr.append((tt, (last[0], last[1], 0.0)))
        else: fr.append((tt, (p[0], p[1], 1.0))); last = p
    if not fr or t < fr[0][0]: return x, None, 0.0
    px, py, pa = kf(t, fr, dur=0.5)
    return x, (px, py), pa


def mt(d, x, y, s, size, col, a=1.0, anchor='l', bold=False, colf=None):
    """Mono text, one cell per character. Logic symbols come from DejaVu Sans Mono;
    the entailment sign is not in that font, so it is drawn by hand."""
    if a <= 0.002 or not s: return 0
    d.font(MONO, size, bold=bold); cw = d.tw('M'); w = cw * len(s)
    if anchor == 'c': x -= w / 2
    elif anchor == 'r': x -= w
    c = d.c
    for i, ch in enumerate(s):
        if ch == ' ': continue
        cc = colf(i, ch) if colf else col
        cx = x + i * cw
        if ch == '⊨':
            d.src(cc, a); c.set_line_width(size * (0.115 if bold else 0.09)); c.set_line_cap(cairo.LINE_CAP_BUTT)
            sx = cx + cw * 0.2
            c.move_to(sx, y - size * 0.68); c.line_to(sx, y - size * 0.04); c.stroke()
            for yy in (y - size * 0.47, y - size * 0.25):
                c.move_to(sx, yy); c.line_to(cx + cw * 0.92, yy); c.stroke()
        else:
            c.move_to(cx, y); d.src(cc, a); c.show_text(ch)
    return w


def seg(d, x, y, parts, a=1.0, anchor='l'):
    """One line of mixed fonts. parts: [(text, 'sans'|'sansb'|'serif'|'mono'|'monob', size, colour)]"""
    if a <= 0.002: return 0
    ws = []
    for s, kind, size, col in parts:
        if kind.startswith('mono'):
            d.font(MONO, size, bold=kind == 'monob'); ws.append(d.tw('M') * len(s))
        else: ws.append(d.tw(s, FAM[kind], size))
    tot = sum(ws)
    if anchor == 'c': x -= tot / 2
    elif anchor == 'r': x -= tot
    for (s, kind, size, col), w in zip(parts, ws):
        if kind.startswith('mono'): mt(d, x, y, s, size, col, a=a, bold=kind == 'monob')
        else: d.text(x, y, s, FAM[kind], size, col, a=a)
        x += w
    return tot


def ring(d, rect, col, a, lw=3.5, rad=12):
    if a <= 0.002: return
    x, y, w, h = rect
    d.rrect(x, y, w, h, rad, fill=col, a=a * 0.12); d.rrect(x, y, w, h, rad, stroke=col, a=a, lw=lw)


def tile(d, x, y, w, h, letter, text, a, size=34, ta=1.0):
    """Legend tile: a letter chip and what it stands for."""
    if a <= 0.002: return
    yo = (1 - a) * 18
    card(d, x, y, w, h, a=a)
    d.rrect(x + 26, y + yo + h / 2 - 39, 78, 78, 20, fill=CLAY_SOFT, a=a)
    mt(d, x + 65, y + yo + h / 2 + 17, letter, 48, CLAY_D, a=a, anchor='c', bold=True)
    d.text(x + 128, y + yo + h / 2 + size * 0.36, text, SANS, size, INK, a=a * ta)


def verdict(d, x, y, text, ok, a=1.0, size=26, anchor='l'):
    """Pill with a drawn check or cross (never colour alone)."""
    if a <= 0.002: return 0
    fg, bg = (TCOL, SAGE_SOFT) if ok else (FCOL, RED_SOFT)
    w = d.tw(text, SANSB, size) + 84; h = size * 1.9
    if anchor == 'c': x -= w / 2
    elif anchor == 'r': x -= w
    k = lerp(0.85, 1, clamp(a))
    d.c.save(); d.c.translate(x + w / 2, y); d.c.scale(k, k); d.c.translate(-(x + w / 2), -y)
    d.rrect(x, y - h / 2, w, h, h / 2, fill=bg, a=a)
    if ok: d.check(x + 36, y, size * 0.62, fg, a=clamp(a), lw=4.5)
    else: d.cross(x + 36, y, size * 0.3, fg, a=clamp(a), lw=4.5)
    d.text(x + 62, y + size * 0.36, text, SANSB, size, fg, a=a)
    d.c.restore(); return w


# ---------------------------------------------------------------- more helpers (from the is-05 scenes)
SKYD = hx('3F628C')

def cw_of(d, size, bold=False):
    """Width of one character cell of the mono font at this size."""
    d.font(MONO, size, bold=bold); return d.tw('M')

def conn(i, ch):
    """Colour function for mt(): AND in clay, OR in blue."""
    return CLAY_D if ch == '∧' else SKYD if ch == '∨' else INK

def chip(d, x, y, s, size=44, a=1.0, anchor='l', fill=CARD, col=INK, colf=None, bold=False, pad=24):
    """A formula in a rounded box. (x, y) = left edge and text baseline. Returns the box width."""
    w = cw_of(d, size, bold) * len(s) + 2 * pad
    if a <= 0.002: return w
    if anchor == 'c': x -= w / 2
    elif anchor == 'r': x -= w
    yo = (1 - clamp(a)) * 14
    d.rrect(x, y - size * 1.18 + yo, w, size * 1.75, 16, fill=fill, a=clamp(a), stroke=LINE, lw=2, shadow=True)
    mt(d, x + pad, y + yo, s, size, col, a=clamp(a), colf=colf, bold=bold)
    return w

def span(d, x, y, s, size, i0, i1):
    """Screen rectangle of characters i0..i1 of a mono string drawn at (x, y)."""
    cw = cw_of(d, size)
    return (x + i0 * cw - 9, y - size * 0.98, (i1 - i0) * cw + 18, size * 1.36)

def num(d, x, y, n, a, r=25, fill=CLAY):
    """A numbered dot."""
    d.circle(x, y, r, fill=fill, a=a); d.text(x, y + r * 0.38, str(n), SANSB, r * 1.05, CARD, a=a, anchor='c')

def phase(t, start, end):
    """Alpha of a screen that shows from `start` until just before `end`."""
    return ap(t, start - 0.05) * (1 - ap(t, end - 0.4, 0.3))

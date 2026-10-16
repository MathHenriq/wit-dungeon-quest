#!/usr/bin/env python3
"""Bonecos dos professores feitos por código, pela descrição (visual.json).

Parte da folha de um modelo do jogo (public/game/sprites/modelos, cores-molde) e,
quadro a quadro: troca cabelo/pele, põe calça comprida, deixa careca ou de boné,
estica (altura de adulto) e alarga ou afina o tronco, pinta a camisa verde com
WIT no peito, barba, óculos, trança, bolsos de calça cargo e tênis de skate.

  python3 scripts/arte/professores/bonecos.py [--folha revisao.png]

Saída: public/game/sprites/professores/prof-<id>.png (4 × 4 quadros de 64 × 80,
como os modelos) e a lista src/game/world/prof-sprites.ts (o jogo usa o boneco
de quem está na lista).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
KIT = Path(__file__).resolve().parent
CFG = json.loads((KIT / 'visual.json').read_text(encoding='utf-8'))
OUT = ROOT / 'public/game/sprites/professores'
W, H = 64, 80

MOLDE = {
    'H': ['#0e5a66', '#1a8a9a', '#24b4c8', '#7ae0ee'],
    'T': ['#1c6a28', '#2c9038', '#3cb44a', '#86dc8e'],
    'B': ['#1a2c74', '#26409c', '#3456c8', '#7890e8'],
    'S': ['#a8704c', '#d0946c', '#e8b48c', '#f8d4b4'],
}
SKIN = {
    'pele-1': ['#c8987c', '#e8bca0', '#f8d8c4', '#fff0e4'],
    'pele-2': ['#b8845c', '#d8a47c', '#f0c49c', '#fcdcbc'],
    'pele-3': ['#a8704c', '#d0946c', '#e8b48c', '#f8d4b4'],
    'pele-4': ['#8a5434', '#b07448', '#c89060', '#e0b080'],
    'pele-5': ['#5e3620', '#84502e', '#a06a40', '#bc8858'],
    'pele-6': ['#3a2014', '#54321e', '#6e442a', '#8a5c3c'],
}
HAIR = {
    'castanho': ['#3a2010', '#6a4020', '#94602e', '#c08a4a'],
    'castanho-escuro': ['#1c0f08', '#38200f', '#55331c', '#7a4e2e'],
    'preto': ['#14121c', '#262236', '#3a3450', '#5a5474'],
    'loiro': ['#8a6424', '#c89a3c', '#e8c464', '#f8e4a0'],
    'ruivo': ['#5a200e', '#9a3a1a', '#c85a28', '#ec8a44'],
    'grisalho': ['#4a4a52', '#7a7a84', '#a8a8b2', '#d4d4dc'],
}
CLOTH = {
    'verde-wit': ['#0d4a26', '#178a44', '#22b05a', '#6fdc94'],
    'preto': ['#0c0c14', '#1e1e2c', '#30303e', '#4a4a5c'],
    'jeans': ['#141e3a', '#2c4070', '#40609c', '#6484bc'],
    'jeans-claro': ['#34507e', '#5a7eb0', '#82a4d2', '#b0c8e6'],
    'caqui': ['#3e3018', '#6e5a34', '#94804e', '#b8a474'],
    'moletom': ['#33353d', '#555863', '#7b7f8b', '#a6aab4'],
    'branco': ['#7a8090', '#b4bccc', '#dce2ec', '#f6f8fc'],
    'vermelho': ['#5a0e16', '#a4202e', '#d8343e', '#f47074'],
    'azul': ['#122a5c', '#2450a8', '#3a72d4', '#7aa4ec'],
    'amarelo': ['#6a4a0c', '#c8901c', '#f0bc30', '#fce070'],
}
OUTLINE = (24, 20, 32, 255)
WHITE = (246, 248, 252, 255)
E, CH, CS, CT, CB, CO, CW, CC, CX = range(9)  # vazio, cabelo, pele, camisa, calça, contorno, branco, boné, outro
ROWS = ['frente', 'esquerda', 'direita', 'costas']


def rgb(h):
    n = int(h[1:], 16)
    return (n >> 16) & 255, (n >> 8) & 255, n & 255


LUT = {rgb(c): (k, i) for k, cs in MOLDE.items() for i, c in enumerate(cs)}
KCLS = {'H': CH, 'S': CS, 'T': CT, 'B': CB}


def classify(f):
    """Quadro RGBA (molde) → classe e tom (0..3) de cada pixel."""
    cls = np.zeros(f.shape[:2], np.uint8)
    idx = np.zeros(f.shape[:2], np.uint8)
    for y in range(f.shape[0]):
        for x in range(f.shape[1]):
            r, g, b, a = f[y, x]
            if a < 128:
                continue
            hit = LUT.get((int(r), int(g), int(b)))
            if hit:
                cls[y, x], idx[y, x] = KCLS[hit[0]], hit[1]
            elif max(r, g, b) < 90:
                cls[y, x] = CO
            elif min(r, g, b) > 140:
                cls[y, x] = CW
                idx[y, x] = 3 if r > 230 else 2 if r > 200 else 1
            else:
                cls[y, x] = CX
    return cls, idx


def rows_of(m):
    ys = np.where(m.any(1))[0]
    return (int(ys[0]), int(ys[-1])) if len(ys) else (None, None)


# ---------------------------------------------------------------- mexer no corpo (em classes)

def calca_comprida(cls, idx):
    """A perna (pele abaixo do short) vira calça."""
    t0, _ = rows_of(cls == CT)
    _, t1 = rows_of(cls == CT)
    # o short começa abaixo do peito (ignora pixel solto da cor-molde no rosto)
    bm = (cls == CB) & (np.arange(H)[:, None] > t0)
    if not bm.any():
        return
    bx = np.where(bm)[1]
    legs = (cls == CS) & (np.arange(H)[:, None] > t1)
    legs[:, :bx.min()] = False
    legs[:, bx.max() + 1:] = False
    cls[legs] = CB
    # pixels soltos de calça no rosto voltam a ser pele
    cls[(cls == CB) & (np.arange(H)[:, None] < t0)] = CS


def cabeca(cls, idx, tipo):
    t0, _ = rows_of(cls == CT)
    hair = (cls == CH) & (np.arange(H)[:, None] < t0)
    if tipo == 'careca':
        cls[hair] = CS
    elif tipo == 'bone':
        skin = (cls == CS) & (np.arange(H)[:, None] < t0)
        brow, _ = rows_of(skin)
        top = hair & (np.arange(H)[:, None] <= brow)
        cls[hair & ~top] = CS
        cls[top] = CC
    elif tipo == 'capacete':
        # o cabelo inteiro (modelo-09, redondinho) vira o casco; abaixo da testa, pele
        skin = (cls == CS) & (np.arange(H)[:, None] < t0)
        brow, _ = rows_of(skin)
        top = hair & (np.arange(H)[:, None] <= brow + 1)
        cls[hair & ~top] = CS
        cls[top] = CC
    elif tipo == 'ralo':
        y0, y1 = rows_of(hair)
        ys, xs = np.where(hair)
        cx = xs.mean()
        for y, x in zip(ys, xs):
            if y < y0 + (y1 - y0) * 0.4 and abs(x - cx) < 6 and ((x * 7 + y * 13) % 11) in (0, 4):
                idx[y, x] = 3  # fio claro: couro aparecendo


def esticar(arrs, cls, n):
    """Altura de adulto: repete n linhas do tronco e das pernas (as mais lisas), pés no lugar."""
    if n <= 0:
        return arrs
    t0, _ = rows_of(cls == CT)
    _, yb = rows_of(cls != E)
    band = list(range(t0 + 3, yb - 3))
    # linha "lisa" = quase igual à de baixo (repetir não engrossa contorno)
    cost = {y: int((cls[y] != cls[y + 1]).sum()) for y in band}
    pick = sorted(band, key=lambda y: (cost[y], abs(y - (t0 + yb) / 2)))
    dup = {}
    for k in range(n):
        y = pick[k % len(pick)]
        dup[y] = dup.get(y, 0) + 1
    seq = []
    for y in range(H):
        seq += [y] * (1 + dup.get(y, 0))
    seq = seq[len(seq) - H:]
    return [a[seq] for a in arrs]


def alargar(arrs, cls, k):
    """Porte: põe (k > 0) ou tira (k < 0) colunas do tronco para baixo, dos dois lados do meio."""
    if k == 0:
        return arrs
    t0, _ = rows_of(cls == CT)
    xs = np.where(cls == CT)[1]
    cx = int(round(xs.mean()))
    out = [a.copy() for a in arrs]
    for half, x in ((k // 2, cx - 4), (k - k // 2, cx + 4)):
        if half == 0:
            continue
        for a, o in zip(arrs, out):
            src = o[t0:].copy()
            if half > 0:
                cols = list(range(W))
                seqc = cols[:x] + [x] * half + cols[x:]
                if x > cx:  # cresce para a direita
                    seqc = seqc[:W]
                else:       # cresce para a esquerda
                    seqc = seqc[len(seqc) - W:]
                o[t0:] = src[:, seqc]
            else:
                n = -half
                cols = [c for c in range(W) if not (x <= c < x + n)]
                if x > cx:
                    seqc = cols + [W - 1] * n
                else:
                    seqc = [0] * n + cols
                o[t0:] = src[:, seqc]
    return out


# ---------------------------------------------------------------- pintar

def pintar(cls, idx, raw, v):
    pele = SKIN[v['pele']]
    cabelo = HAIR[v.get('cabelo', 'castanho')]
    camisa = CLOTH[CFG.get('camisa', 'verde-wit')]
    calca = CLOTH[v.get('calca', 'jeans')]
    bone = CLOTH[v.get('bone', 'preto')]
    img = raw.copy()
    for c, ramp in ((CH, cabelo), (CS, pele), (CT, camisa), (CB, calca), (CC, bone)):
        m = cls == c
        cols = np.array([rgb(h) + (255,) for h in ramp], np.uint8)
        img[m] = cols[idx[m]]
    img[cls == E] = 0
    return img


def face(cls, r):
    """Cabeça: pele acima da camisa, olhos (contorno no meio da pele), queixo e frente do rosto."""
    t0, _ = rows_of(cls == CT)
    if t0 is None:
        return None
    pele = (cls == CS) & (np.arange(H)[:, None] < t0)
    if not pele.any():
        return None
    eyes = np.zeros_like(pele)
    for y, x in zip(*np.where((cls == CO) | (cls == CW))):
        if y >= t0 - 2:
            continue
        row = pele[y]
        if row[max(0, x - 7):x].any() and row[x + 1:x + 8].any():
            eyes[y, x] = True
    ys, xs = np.where(pele)
    f = {'pele': pele, 't0': t0, 'y0': int(ys.min()), 'chin': int(ys.max()), 'x0': int(xs.min()), 'x1': int(xs.max())}
    if eyes.any():
        ey, ex = np.where(eyes)
        f['e0'], f['e1'] = int(ey.min()), int(ey.max())
        # blocos de olho (separados por coluna vazia)
        cols = sorted(set(ex.tolist()))
        blobs, cur = [], [cols[0]]
        for c in cols[1:]:
            if c - cur[-1] > 1:
                blobs.append(cur)
                cur = []
            cur.append(c)
        blobs.append(cur)
        f['olhos'] = [(b[0], b[-1]) for b in blobs if len(b) >= 2]
    f['cx'] = (f['x0'] + f['x1']) / 2
    # frente do rosto (de lado): o lado para onde olha
    f['frente'] = f['x0'] if r == 1 else f['x1'] if r == 2 else None
    return f


def put(img, y, x, c):
    if 0 <= y < H and 0 <= x < W:
        img[y, x] = c


def barba(img, cls, f, r, tipo, ramp):
    """O rosto do modelo tem só 2 linhas abaixo dos olhos: o bigode fica nelas e o
    cavanhaque desce abaixo do queixo (por cima da gola), com contorno."""
    if not f or 'e1' not in f or r == 3:
        return
    # tons 1 e 2 da rampa: o 0 some no contorno (cabelo preto, pele escura)
    escuro, meio = rgb(ramp[1]) + (255,), rgb(ramp[2]) + (255,)
    pele, chin, e1 = f['pele'], f['chin'], f['e1']
    yb = chin - 1
    desce = {'cavanhaque': 2, 'bigode+cavanhaque': 2, 'cavanhaque-grande': 3, 'curta': 1, 'cheia': 3, 'ralinha': 1}.get(tipo, 0)
    if r == 0:
        cx = f['olhos'][0][1] + (f['olhos'][-1][0] - f['olhos'][0][1]) / 2 if len(f.get('olhos', [])) >= 2 else f['cx']
        cx = int(round(cx))

        def linha(y, w, c, so_pele=True):
            for x in range(cx - w // 2, cx - w // 2 + w):
                if not so_pele or pele[y, x]:
                    put(img, y, x, c)

        def queixo(w, n, ralo=False):
            for k in range(0, n + 1):
                ww = max(2, w - 2 * max(0, k - 1))
                for x in range(cx - ww // 2, cx - ww // 2 + ww):
                    if ralo and (x + k) % 2:
                        continue
                    put(img, chin + k, x, meio if k < n else escuro)
            ww = max(2, w - 2 * max(0, n - 1))
            if not ralo:
                for x in range(cx - ww // 2, cx - ww // 2 + ww):
                    put(img, chin + n + 1, x, OUTLINE)

        if tipo == 'bigodinho':
            linha(yb, 4, meio)
        if tipo in ('bigode', 'bigode+cavanhaque', 'cavanhaque-grande', 'curta', 'cheia'):
            linha(yb, 8, escuro)
        if tipo == 'ralinha':
            linha(yb, 6, meio)
            queixo(6, 1, ralo=True)
        if tipo in ('cavanhaque', 'bigode+cavanhaque'):
            queixo(6, desce)
        if tipo == 'cavanhaque-grande':
            queixo(8, desce)
        if tipo in ('curta', 'cheia'):
            # costeletas e maxilar
            for y in range(f.get('e0', e1) + 1, chin + 1):
                xs = np.where(pele[y])[0]
                if len(xs):
                    for x in (xs.min(), xs.min() + 1, xs.max(), xs.max() - 1):
                        put(img, y, x, meio)
            linha(chin, f['x1'] - f['x0'], meio)
            queixo(f['x1'] - f['x0'] - 6 if tipo == 'cheia' else 10, desce)
    else:
        sgn = -1 if r == 1 else 1

        def frente(y):
            xs = np.where(pele[y])[0]
            return None if not len(xs) else int(xs.min() if r == 1 else xs.max())

        ys, xs = np.where(pele)
        for y, x in zip(ys, xs):
            fy = frente(y)
            d = (fy - x) * sgn
            if tipo in ('curta', 'cheia') and y >= e1 - 1 and d < 9:
                put(img, y, x, meio)
            if y == yb and d < 4 and tipo != 'cavanhaque':
                put(img, y, x, meio if tipo in ('bigodinho', 'ralinha') else escuro)
        if desce:
            # pendurado no queixo: começa onde o queixo está, não na ponta do nariz
            fc = frente(chin)
            n0 = 8 if tipo == 'cheia' else 5
            for k in range(0, desce + 1):
                for dd in range(0, n0 - k):
                    if tipo == 'ralinha' and dd % 2:
                        continue
                    put(img, chin + k, fc - sgn * (dd + k // 2), meio if k < desce else escuro)
            if tipo != 'ralinha':
                for dd in range(0, n0 - desce):
                    put(img, chin + desce + 1, fc - sgn * (dd + (desce + 1) // 2), OUTLINE)


def oculos(img, f, r, tipo):
    if not f or not f.get('olhos') or r == 3:
        return
    e0, e1 = f['e0'], f['e1']
    grande = tipo.startswith('grande')
    pad = 2 if grande else 1
    quadrado = tipo.endswith('quadrado')
    blobs = f['olhos']
    if r != 0:  # de lado: só o olho da frente
        blobs = [min(blobs, key=lambda b: abs((b[0] + b[1]) / 2 - f['frente']))]
    if tipo == 'redondo-pequeno':
        pad = 1
    lente = []
    for x0, x1 in blobs:
        X0, X1, Y0, Y1 = x0 - pad, x1 + pad, e0 - pad, e1 + pad - (1 if tipo == 'redondo-pequeno' else 0)
        for y in range(Y0, Y1 + 1):
            for x in range(X0, X1 + 1):
                borda = y in (Y0, Y1) or x in (X0, X1)
                canto = (y in (Y0, Y1)) and (x in (X0, X1))
                if borda and not (canto and not quadrado):
                    put(img, y, x, OUTLINE)
                elif not borda:
                    lente.append((y, x))
        # vidro: clareia a pele de dentro
    for y, x in lente:
        p = img[y, x].astype(int)
        if p[3] and f['pele'][y, x]:
            img[y, x] = np.array([min(255, (p[0] * 3 + 255) // 4), min(255, (p[1] * 3 + 255) // 4), min(255, (p[2] * 3 + 255) // 4), 255], np.uint8)
    if r == 0 and len(blobs) >= 2:
        (a0, a1), (b0, b1) = blobs[0], blobs[-1]
        for x in range(a1 + pad, b0 - pad + 1):
            put(img, e0 + 1, x, OUTLINE)
    elif r != 0:
        # haste até a orelha
        x0, x1 = blobs[0]
        sgn = -1 if r == 1 else 1
        start = (x1 + pad) if r == 1 else (x0 - pad)
        for k in range(1, 7):
            put(img, e0 + 1, start - sgn * k, OUTLINE)


GLYPH = {
    'W': ['X...X', 'X...X', 'X.X.X', '.X.X.'],
    'I': ['X', 'X', 'X', 'X'],
    'T': ['XXX', '.X.', '.X.', '.X.'],
}


def logo(img, cls, r):
    """WIT em branco no peito (de frente) e nas costas."""
    if r not in (0, 3):
        return
    t0, _ = rows_of(cls == CT)
    ys, xs = np.where(cls == CT)
    if not len(xs):
        return
    y = t0 + 4
    row = np.where(cls[y] == CT)[0]
    cx = (row.min() + row.max()) / 2 if len(row) else xs.mean()
    texto = 'WIT'
    w = sum(len(GLYPH[c][0]) for c in texto) + len(texto) - 1
    x = int(round(cx - w / 2))
    for c in texto:
        g = GLYPH[c]
        for dy, line in enumerate(g):
            for dx, ch in enumerate(line):
                if ch == 'X' and cls[y + dy, x + dx] == CT:
                    img[y + dy, x + dx] = WHITE
        x += len(g[0]) + 1


def tranca(img, cls, f, r, ramp):
    """Trança na lateral direita do professor (esquerda da tela de frente)."""
    if not f or r == 1:
        return
    hair = cls == CH
    ys, xs = np.where(hair)
    if not len(xs):
        return
    y0 = f.get('e0', f['chin'] - 6)
    if r == 0:
        x = int(xs[(ys >= y0) & (ys <= f['chin'])].min()) + 1 if ((ys >= y0) & (ys <= f['chin'])).any() else int(xs.min()) + 1
    elif r == 2:
        x = int(f['x0']) - 1
    else:
        x = int(xs.max()) - 3
    c1, c2, c3 = (rgb(ramp[i]) + (255,) for i in (1, 2, 3))
    for k in range(10):
        y = y0 + 2 + k
        put(img, y, x - 1, OUTLINE)
        put(img, y, x + 2, OUTLINE)
        put(img, y, x, c2 if k % 3 else c1)
        put(img, y, x + 1, c1 if k % 3 else c3)
    put(img, y0 + 12, x, OUTLINE)
    put(img, y0 + 12, x + 1, OUTLINE)


def risca(img, cls, f, r, ramp, lado='direita'):
    if not f or r != 0:
        return
    hair = cls == CH
    ys, xs = np.where(hair)
    x = int(round(f['cx'])) + (0 if lado == 'meio' else 4)
    top = int(ys[xs == x].min()) if (xs == x).any() else int(ys.min())
    for k in range(2, 8):
        if hair[top + k, x]:
            put(img, top + k, x, rgb(ramp[0]) + (255,))


def aba(img, cls, f, r, ramp):
    """Aba do boné: de frente, uma faixa mais escura na testa; de lado, para a frente."""
    cap = cls == CC
    if not cap.any():
        return
    ys, xs = np.where(cap)
    yb = int(ys.max())
    c0, c2 = rgb(ramp[0]) + (255,), rgb(ramp[2]) + (255,)
    if r == 0:
        row = xs[ys == yb]
        for x in range(int(row.min()) - 1, int(row.max()) + 2):
            put(img, yb, x, c2)
            put(img, yb + 1, x, OUTLINE)
    elif r in (1, 2):
        sgn = -1 if r == 1 else 1
        row = xs[ys == yb]
        fr = int(row.min()) if r == 1 else int(row.max())
        for k in range(0, 7):
            put(img, yb, fr + sgn * k, c2)
            put(img, yb + 1, fr + sgn * k, OUTLINE)
        put(img, yb, fr + sgn * 7, OUTLINE)


def faixa_capacete(img, cls, r, cor):
    cap = cls == CC
    if not cap.any():
        return
    ys, xs = np.where(cap)
    c = rgb(CLOTH[cor][3]) + (255,)
    if r in (0, 3):
        cx = int(round(xs.mean()))
        for y, x in zip(ys, xs):
            if abs(x - cx) <= 1:
                img[y, x] = c
    else:
        y0, y1 = int(ys.min()), int(ys.max())
        ym = y0 + (y1 - y0) // 2
        for y, x in zip(ys, xs):
            if y in (ym, ym + 1):
                img[y, x] = c
    # viseira: borda de baixo do casco mais escura
    for x in set(xs.tolist()):
        y = int(ys[xs == x].max())
        put(img, y + 1, x, OUTLINE) if cls[min(H - 1, y + 1), x] == CS and r != 3 else None


def bolsos(img, cls, r, ramp):
    b0, b1 = rows_of(cls == CB)
    if b0 is None:
        return
    c0 = rgb(ramp[0]) + (255,)
    y = b0 + 3
    row = np.where(cls[y] == CB)[0]
    if not len(row):
        return
    spots = [row.min() + 1, row.max() - 2] if r in (0, 3) else [int(row.mean()) - 1]
    for x in spots:
        for dy in range(3):
            for dx in range(2):
                if cls[y + dy, x + dx] == CB:
                    put(img, y + dy, x + dx, c0)


def tenis_skate(img, cls, raw_cls):
    t0, _ = rows_of(cls == CT)
    m = (cls == CW) & (np.arange(H)[:, None] > t0)
    ys, xs = np.where(m)
    if not len(xs):
        return
    low = {}
    for y, x in zip(ys, xs):
        low[x] = max(low.get(x, -1), y)
    dark = [rgb(CLOTH['preto'][i]) + (255,) for i in range(4)]
    for y, x in zip(ys, xs):
        if y < low[x]:
            lum = int(img[y, x, 0])
            img[y, x] = dark[3 if lum > 240 else 2 if lum > 200 else 1]


# ---------------------------------------------------------------- montar

def boneco(pid, v):
    src = np.array(Image.open(ROOT / f"public/game/sprites/modelos/{v['modelo']}.png").convert('RGBA'))
    sheet = np.zeros((H * 4, W * 4, 4), np.uint8)
    for r in range(4):
        for c in range(4):
            raw = src[r * H:(r + 1) * H, c * W:(c + 1) * W].copy()
            cls, idx = classify(raw)
            calca_comprida(cls, idx)
            if v.get('cabeca'):
                cabeca(cls, idx, v['cabeca'])
            cls0 = cls.copy()
            raw, cls, idx = esticar([raw, cls, idx], cls0, v.get('altura', 6))
            raw, cls, idx = alargar([raw, cls, idx], cls, v.get('largura', 0))
            img = pintar(cls, idx, raw, v)
            f = face(cls, r)
            cabelo = HAIR[v.get('cabelo', 'castanho')]
            if v.get('risca'):
                risca(img, cls, f, r, cabelo, v['risca'])
            if v.get('cabeca') == 'bone':
                aba(img, cls, f, r, CLOTH[v.get('bone', 'preto')])
            if v.get('cabeca') == 'capacete':
                faixa_capacete(img, cls, r, v.get('faixa', 'branco'))
            if v.get('barba'):
                barba(img, cls, f, r, v['barba'], HAIR[v.get('barbaCor', v.get('cabelo', 'castanho'))])
            if v.get('oculos'):
                oculos(img, f, r, v['oculos'])
            logo(img, cls, r)
            if v.get('tranca'):
                tranca(img, cls, f, r, cabelo)
            if v.get('cargo'):
                bolsos(img, cls, r, CLOTH[v.get('calca', 'jeans')])
            if v.get('tenis') == 'skate':
                tenis_skate(img, cls, None)
            sheet[r * H:(r + 1) * H, c * W:(c + 1) * W] = img
    return sheet


def classify_final(f):
    """Cintura de um quadro já pintado: a última linha da camisa verde (+1), em px do mundo."""
    camisa = [rgb(h) for h in CLOTH[CFG.get('camisa', 'verde-wit')]] + [WHITE[:3]]
    m = np.zeros(f.shape[:2], bool)
    for c in camisa:
        m |= (f[..., 0] == c[0]) & (f[..., 1] == c[1]) & (f[..., 2] == c[2]) & (f[..., 3] > 0)
    # só o tronco: linhas com pelo menos 6 px de camisa
    rows = np.where(m.sum(1) >= 6)[0]
    return (int(rows.max()) + 2) // 2 if len(rows) else 30, None


def folha(sheets, dest):
    """Revisão: cada professor de frente, de lado e de costas (×3), com o nome."""
    from_ts = json.loads((KIT / 'professores.json').read_text(encoding='utf-8'))
    nomes = {p['id']: p['nome'] for p in from_ts['professores']}
    Z, cols = 3, 4
    cellw, cellh = W * Z * 4 + 20, H * Z + 40
    n = len(sheets)
    rows = (n + 1) // 2
    img = Image.new('RGB', (cellw * 2, cellh * rows), (150, 200, 130))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.load_default(size=26)
    except TypeError:
        font = ImageFont.load_default()
    for i, (pid, s) in enumerate(sheets.items()):
        ox, oy = (i % 2) * cellw, (i // 2) * cellh
        d.text((ox + 10, oy + 6), nomes.get(pid, pid), fill='black', font=font)
        for k, r in enumerate((0, 1, 2, 3)):
            fr = Image.fromarray(s[r * H:(r + 1) * H, 0:W], 'RGBA').resize((W * Z, H * Z), Image.NEAREST)
            img.paste(fr, (ox + 10 + k * W * Z, oy + 36), fr)
    img.save(dest)
    print('folha:', dest)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    so = [a for a in sys.argv[1:] if not a.startswith('--') and not a.endswith('.png')]
    sheets = {}
    for pid, v in CFG['professores'].items():
        if so and pid not in so:
            continue
        s = boneco(pid, v)
        Image.fromarray(s, 'RGBA').save(OUT / f'prof-{pid}.png')
        sheets[pid] = s
        cap = CFG.get('capacete', {}).get(pid)
        if cap:
            vc = {**v, 'modelo': 'modelo-09', 'cabeca': 'capacete', 'bone': cap['cor'], 'faixa': cap['faixa']}
            vc.pop('tranca', None), vc.pop('risca', None)
            Image.fromarray(boneco(pid, vc), 'RGBA').save(OUT / f'prof-{pid}-capacete.png')
    nomes = sorted(p.stem for p in OUT.glob('prof-*.png'))
    # cintura de cada direção (px do mundo, do topo do quadro): onde corta quem está sentado (moto, carro)
    cintura = {}
    for n in nomes:
        a = np.array(Image.open(OUT / f'{n}.png').convert('RGBA'))
        cs = []
        for r in range(4):
            cls, _ = classify_final(a[r * H:(r + 1) * H, 0:W])
            cs.append(cls)
        cintura[n] = cs
    man = OUT / 'manifest.json'
    m = json.loads(man.read_text()) if man.exists() else {}
    m.update({'cell': [W, H], 'foot': 76, 'sprites': nomes, 'cintura': cintura})
    man.write_text(json.dumps(m, indent=1))
    (ROOT / 'src/game/world/prof-sprites.ts').write_text(
        '// Gerado por scripts/arte/professores/bonecos.py (e importar-sprites.py): os professores que já têm\n'
        '// boneco próprio (public/game/sprites/professores/<id>.png). Os outros usam o visual provisório (look).\n'
        f'export const PROF_SPRITES: string[] = {json.dumps(nomes)};\n', encoding='utf-8')
    print(len(sheets), 'bonecos')
    if '--folha' in sys.argv:
        folha(sheets, sys.argv[sys.argv.index('--folha') + 1])


if __name__ == '__main__':
    main()

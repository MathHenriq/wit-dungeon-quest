"""
Converte os modelos-base do personagem (folhas do GPT em cores-molde) para o
jogo: public/game/sprites/modelos/modelo-XX.png, 4 × 4 quadros de 64 × 80
(resolução hd do jogo: 2 pixels por pixel do mundo; o boneco ocupa 32 × 40 no mundo)
(linhas: frente, esquerda, direita, costas; colunas: parado, pé esquerdo,
parado, pé direito).

Cada pixel da folha grande ganha uma classe pela cor-molde (cabelo ciano,
parte de cima verde, parte de baixo azul, pele, branco, contorno) e um tom
(0 = sombra … 3 = brilho). Na redução, cada pixel do jogo fica com a classe
mais frequente do bloco e o tom mediano dela, pintado numa paleta fixa
(PALETTE abaixo). O jogo troca essas cores exatas pelas rampas escolhidas
(src/game/world/outfit.ts), então a paleta aqui e lá tem de ser a mesma.

Uso: python3 scripts/arte/importar-personagem.py [--folha saida.png]
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/Novos assets/personagem/modelos'
OUT = ROOT / 'public/game/sprites/modelos'
CELL, CELL_H, FEET = 64, 80, 76
# O GPT desenha todas as folhas no mesmo tamanho de corpo, então a escala é
# uma só: cabelo alto (black power, coque) fica mais alto, não encolhe o boneco.
SCALE = 3.75

spec = importlib.util.spec_from_file_location('imp', ROOT / 'scripts/arte/importar-gpt.py')
imp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(imp)

OUTLINE, HAIR, TOP, BOTTOM, SKIN, WHITE = 1, 2, 3, 4, 5, 6
PALETTE = {
    OUTLINE: ['#181420'],
    HAIR: ['#0e5a66', '#1a8a9a', '#24b4c8', '#7ae0ee'],
    TOP: ['#1c6a28', '#2c9038', '#3cb44a', '#86dc8e'],
    BOTTOM: ['#1a2c74', '#26409c', '#3456c8', '#7890e8'],
    SKIN: ['#a8704c', '#d0946c', '#e8b48c', '#f8d4b4'],
    WHITE: ['#9aa4b4', '#d8dee8', '#f4f6fa', '#ffffff'],
}


def rgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def classify(img):
    """Classe e luminância de cada pixel da folha grande."""
    a = img.astype(float) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = d / (mx + 1e-6)
    cls = np.zeros(r.shape, np.uint8)
    opaque = img[..., 3] > 127
    colored = opaque & (s > 0.35) & (mx > 0.3)
    cls[opaque] = OUTLINE
    cls[opaque & (s < 0.25) & (mx > 0.6)] = WHITE
    cls[opaque & (h > 8) & (h < 48) & (s > 0.12) & (mx > 0.42)] = SKIN
    cls[colored & (h > 165) & (h < 205)] = HAIR
    cls[colored & (h > 85) & (h < 165)] = TOP
    cls[colored & (h >= 205) & (h < 265)] = BOTTOM
    return cls, mx


def frames(path, cols=4, rows=4):
    rgb_, al = imp.load(str(path))
    A = al > 0.5
    img = np.dstack([rgb_, A * 255]).astype(np.uint8)
    ys, xs = np.where(A.any(1))[0], np.where(A.any(0))[0]
    Y = [ys[0] + (ys[-1] + 1 - ys[0]) * k // rows for k in range(rows + 1)]
    X = [xs[0] + (xs[-1] + 1 - xs[0]) * k // cols for k in range(cols + 1)]
    out = []
    for r in range(rows):
        for c in range(cols):
            sub = A[Y[r]:Y[r + 1], X[c]:X[c + 1]].copy()
            # sujeira solta (risco no chão, resto do magenta) fora do boneco
            lab, n = ndimage.label(sub)
            if n > 1:
                size = ndimage.sum(sub, lab, range(1, n + 1))
                sub &= np.isin(lab, 1 + np.where(size >= 150)[0])
            yy, xx = np.where(sub.any(1))[0], np.where(sub.any(0))[0]
            cut = img[Y[r] + yy[0]:Y[r] + yy[-1] + 1, X[c] + xx[0]:X[c] + xx[-1] + 1].copy()
            cut[..., 3] *= sub[yy[0]:yy[-1] + 1, xx[0]:xx[-1] + 1]
            out.append(cut)
    return out


def shades(cls, lum):
    """Tom 0..3 por classe, pelos percentis da própria folha."""
    tone = np.zeros(cls.shape, np.uint8)
    for k in (HAIR, TOP, BOTTOM, SKIN, WHITE):
        m = cls == k
        if m.sum() < 10:
            continue
        lo, hi = np.percentile(lum[m], [4, 97])
        t = ((lum[m] - lo) / max(1e-3, hi - lo)).clip(0, 0.999)
        # sombra e brilho estreitos, base larga (como o pixel art faz)
        tone[m] = np.digitize(t, [0.3, 0.55, 0.9])
    return tone


def reduce(frame, cls, tone, scale):
    """Um quadro grande → CELL × CELL_H, pés na linha FEET, tronco no centro."""
    h, w = cls.shape
    opaque = cls > 0
    feet = np.where(opaque.any(1))[0][-1] + 1
    body = np.isin(cls, (TOP, SKIN))
    cx = np.where(body.any(0))[0].mean() if body.any() else w / 2
    out = np.zeros((CELL_H, CELL, 4), np.uint8)
    for oy in range(CELL_H):
        for ox in range(CELL):
            # bloco da folha grande que cai neste pixel
            y1 = feet - (FEET - oy) * scale
            x0 = cx + (ox - CELL / 2) * scale
            ya, yb = int(round(y1)), int(round(y1 + scale))
            xa, xb = int(round(x0)), int(round(x0 + scale))
            ya, xa = max(ya, 0), max(xa, 0)
            yb, xb = min(yb, h), min(xb, w)
            if yb <= ya or xb <= xa:
                continue
            c = cls[ya:yb, xa:xb].ravel()
            n = c.size
            filled = (c > 0).sum()
            if filled < n * 0.42:
                continue
            counts = np.bincount(c, minlength=7)
            counts[0] = 0
            # contorno fino some na média: basta um terço do bloco
            k = OUTLINE if counts[OUTLINE] >= n * 0.33 else int(counts.argmax())
            if k == OUTLINE:
                col = PALETTE[OUTLINE][0]
            else:
                t = tone[ya:yb, xa:xb].ravel()[c == k]
                col = PALETTE[k][int(np.median(t))]
            out[oy, ox] = rgb(col) + [255]
    return out


# poses (docs/PROMPTS-GPT.md §A): mesma paleta e mesmo tamanho de quadro
POSES = {'sentar': (4, 2), 'carregar': (4, 4), 'emotes': (4, 4)}
POSE_SRC = ROOT / 'public/Novos assets/personagem/poses'
POSE_OUT = OUT / 'poses'


def hair_width(cls):
    """Largura do cabelo no quadro (px da folha): serve de régua entre folhas."""
    m = cls == HAIR
    xs = np.where(m.any(0))[0]
    return xs[-1] - xs[0] + 1 if len(xs) else 0


def poses():
    """Folhas de pose: a escala sai da largura do cabelo do quadro de frente
    comparada com a do modelo (o GPT nem sempre desenha do mesmo tamanho)."""
    POSE_OUT.mkdir(parents=True, exist_ok=True)
    done = []
    for f in sorted(POSE_SRC.glob('modelo-*-*.png')):
        modelo, pose = f.stem.rsplit('-', 1)
        if pose not in POSES or not (SRC / f'{modelo}.png').exists():
            continue
        cols, rows = POSES[pose]
        ref = classify(frames(SRC / f'{modelo}.png')[0])[0]
        fr = frames(f, cols, rows)
        data = [classify(x) for x in fr]
        allc = np.concatenate([c.ravel() for c, _ in data])
        alll = np.concatenate([l.ravel() for _, l in data])
        allt = shades(allc, alll)
        tones, i = [], 0
        for c, _ in data:
            tones.append(allt[i:i + c.size].reshape(c.shape))
            i += c.size
        scale = SCALE * max(0.5, min(2.5, hair_width(data[0][0]) / max(1, hair_width(ref))))
        sheet = np.zeros((CELL_H * rows, CELL * cols, 4), np.uint8)
        for k, (x, (c, _), t) in enumerate(zip(fr, data, tones)):
            r, col = divmod(k, cols)
            sheet[r * CELL_H:(r + 1) * CELL_H, col * CELL:(col + 1) * CELL] = reduce(x, c, t, scale)
        Image.fromarray(sheet, 'RGBA').save(POSE_OUT / f.name)
        done.append(f.stem)
    (POSE_OUT / 'manifest.json').write_text(json.dumps(done))
    print('poses:', ', '.join(done) or 'nenhuma')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(SRC.glob('modelo-*.png'))
    sheets = []
    manifest = []
    for f in files:
        fr = frames(f)
        data = [classify(x) for x in fr]
        # tom calculado na folha inteira (todos os quadros juntos)
        allc = np.concatenate([c.ravel() for c, _ in data])
        alll = np.concatenate([l.ravel() for _, l in data])
        allt = shades(allc, alll)
        tones, i = [], 0
        for c, _ in data:
            tones.append(allt[i:i + c.size].reshape(c.shape))
            i += c.size
        scale = SCALE
        sheet = np.zeros((CELL_H * 4, CELL * 4, 4), np.uint8)
        for k, (x, (c, _), t) in enumerate(zip(fr, data, tones)):
            r, col = divmod(k, 4)
            sheet[r * CELL_H:(r + 1) * CELL_H, col * CELL:(col + 1) * CELL] = reduce(x, c, t, scale)
        Image.fromarray(sheet, 'RGBA').save(OUT / f.name)
        sheets.append(sheet)
        manifest.append(f.stem)
    (OUT / 'manifest.json').write_text(json.dumps(manifest))
    poses()
    if '--folha' in sys.argv:
        dest = sys.argv[sys.argv.index('--folha') + 1]
        big = np.concatenate(sheets, axis=1)
        bg = np.zeros_like(big)
        bg[...] = [116, 200, 120, 255]
        a = big[..., 3:4] / 255
        comp = (big[..., :3] * a + bg[..., :3] * (1 - a)).astype(np.uint8)
        Image.fromarray(comp).resize((comp.shape[1] * 4, comp.shape[0] * 4), Image.NEAREST).save(dest)
        print('folha:', dest)


if __name__ == '__main__':
    main()

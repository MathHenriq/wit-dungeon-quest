#!/usr/bin/env python3
"""Cenas e peças das telas (minijogos, forja, abertura do pacote), do GPT em
fundo magenta → public/game/cenas/:

  cena inteira   <nome>.webp            (fundo transparente, até 1024 px)
  folha em grade <nome>-<i>.png         (uma peça por célula, até 160 px)

  python3 scripts/arte/importar-cenas.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/Novos assets'
OUT = ROOT / 'public/game/cenas'

SCENES = {'forja-tela': 'interiores', 'padaria-cena': 'minijogos', 'musica-palco': 'minijogos', 'rasgado': 'pacotes'}
# nome: (pasta, colunas, linhas)
GRIDS = {
    'padaria-massa': ('minijogos', 6, 3),
    'padaria-extras': ('minijogos', 4, 2),
    'musica-instrumentos': ('minijogos', 5, 2),
    'testemunhas': ('minijogos', 4, 2),
}


def rgba(path):
    rgb = np.array(Image.open(path).convert('RGB'))
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    fundo = (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)
    a = ~fundo
    # borda rosada: puxa o tom do magenta para o neutro
    viz = ndimage.binary_dilation(fundo) & a & (r > g + 40) & (b > g + 40)
    rgb = rgb.copy()
    rgb[viz] = (rgb[viz] * 0.5 + np.array([60, 50, 60]) * 0.5).astype(np.uint8)
    return rgb, a


def clean(a):
    lab, n = ndimage.label(a)
    if n > 1:
        size = ndimage.sum(a, lab, range(1, n + 1))
        a = np.isin(lab, 1 + np.where(size >= size.sum() * 0.03)[0])
    return a


def cut(rgb, a, maxw):
    ys, xs = np.where(a)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    im = Image.fromarray(np.dstack([rgb[y0:y1, x0:x1], np.where(a[y0:y1, x0:x1], 255, 0)]).astype(np.uint8), 'RGBA')
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, folder in SCENES.items():
        f = SRC / folder / f'{name}.png'
        if not f.exists():
            print('faltando:', f.name); continue
        rgb, a = rgba(f)
        cut(rgb, a, 1024).save(OUT / f'{name}.webp', 'WEBP', quality=88, method=6)
        print(name)
    for name, (folder, cols, rows) in GRIDS.items():
        f = SRC / folder / f'{name}.png'
        if not f.exists():
            print('faltando:', f.name); continue
        rgb, a = rgba(f)
        ys, xs = np.where(a.any(1))[0], np.where(a.any(0))[0]
        X0, X1, Y0, Y1 = xs[0], xs[-1] + 1, ys[0], ys[-1] + 1
        cw, ch = (X1 - X0) / cols, (Y1 - Y0) / rows
        for i in range(cols * rows):
            r, c = divmod(i, cols)
            ya, yb, xa, xb = int(Y0 + r * ch), int(Y0 + (r + 1) * ch), int(X0 + c * cw), int(X0 + (c + 1) * cw)
            m = clean(a[ya:yb, xa:xb])
            if not m.any():
                continue
            cut(rgb[ya:yb, xa:xb], m, 160).save(OUT / f'{name}-{i}.png')
        print(name, cols * rows)


if __name__ == '__main__':
    main()

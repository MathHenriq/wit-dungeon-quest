#!/usr/bin/env python3
"""Arte da masmorra do GPT (docs/gpt-masmorra.md) → public/game/...

Lê `public/Novos assets/masmorra/<pasta>/*.png` (fundo magenta), recorta a
grade de cada folha, tira o magenta, encaixa cada quadro no tamanho do jogo
(personagens com os pés na mesma linha; efeitos, armas e ícones no meio) e
grava a folha arrumada. A tela da masmorra usa a arte nova assim que o arquivo
existe; sem ele, continua a provisória.

  pasta        grade   quadro   saída
  efeitos/     6 × 1   96       public/game/efeitos/<id>.png
  inimigos/    4 × 4   48       public/game/masmorra/inimigos/<nome>.png   (chefe-*: 4 × 3, 96)
  sombras/     4 × 4   48       public/game/masmorra/sombras/<nome>.png
  armas/       4 × 2   48       public/game/masmorra/armas/<nome>.png      (tiros: 4 × 4, 16)
  lugares/     portal 4 × 1 (96 × 128) · piso-parede-* 4 × 3 (32) · perigos 4 × 2 (32) · salas 4 × 2 (64) · objetos 4 × 4 (64)
  saguao/      4 × 2   128      public/game/masmorra/saguao/<nome>.png
  icones/      4 × 3   32       public/game/icons/itens/<id>.png (um arquivo por ícone)
  personagem/  4 × 4 (combate, esquiva) · 4 × 1 (magia), quadro do modelo → public/game/sprites/poses/

  python3 scripts/arte/importar-masmorra.py [--folha revisao.png]

Público infantil: revisar a folha (--folha) antes de subir.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/Novos assets/masmorra'
GAME = ROOT / 'public/game'

# nomes dos ícones na ordem da folha (docs/gpt-masmorra.md §7)
ICONS = ['minerio_cobre', 'minerio_ferro', 'minerio_ouro', 'erva_cura', 'erva_mana', 'cristal_azul', 'cristal_roxo',
         'cristal_dourado', 'pelo', 'pena', 'pocao_vida', 'pocao_mana']


def alpha_of(rgb):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    fundo = (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)
    return ~fundo


def fit(rgb, a, box, cw, ch, feet):
    """Recorta o conteúdo do quadro e encaixa em cw × ch (pés embaixo ou no meio)."""
    x0, y0, x1, y1 = box
    m = a[y0:y1, x0:x1]
    ys, xs = np.where(m)
    out = np.zeros((ch, cw, 4), np.uint8)
    if not len(xs):
        return out
    bx0, by0, bx1, by1 = x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1
    crop = np.dstack([rgb[by0:by1, bx0:bx1], np.where(a[by0:by1, bx0:bx1], 255, 0).astype(np.uint8)])
    im = Image.fromarray(crop, 'RGBA')
    k = min((cw - 2) / im.width, (ch - 2) / im.height, (cw - 2) / max(1, (x1 - x0) * 0.9), (ch - 2) / max(1, (y1 - y0) * 0.9))
    pre = np.array(im).astype(float)
    pre[..., :3] *= pre[..., 3:4] / 255
    w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
    sm = np.array(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(float)
    al = sm[..., 3] / 255
    col = np.where(al[..., None] > 0.02, sm[..., :3] / np.maximum(al[..., None], 0.02), 0).clip(0, 255)
    px = np.dstack([col, np.where(al >= 0.45, 255, 0)]).astype(np.uint8)
    ox = (cw - w) // 2
    oy = ch - 1 - h if feet else (ch - h) // 2
    out[max(0, oy):max(0, oy) + h, ox:ox + w] = px[:ch, :cw]
    return out


def sheet(path, cols, rows, cw, ch, feet):
    rgb = np.array(Image.open(path).convert('RGB'))
    a = alpha_of(rgb)
    hh, ww = a.shape
    out = np.zeros((ch * rows, cw * cols, 4), np.uint8)
    for r in range(rows):
        for c in range(cols):
            box = (ww * c // cols, hh * r // rows, ww * (c + 1) // cols, hh * (r + 1) // rows)
            out[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] = fit(rgb, a, box, cw, ch, feet)
    return out


def save(arr, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr, 'RGBA').save(dest)


def model_cell():
    """Quadro da folha de andar dos modelos (MODEL_CELL em src/game/world/outfit.ts)."""
    return 64, 80


def main():
    review, done = [], []
    groups = [
        ('efeitos', '*.png', lambda f: (6, 1, 96, 96, False, GAME / 'efeitos' / f.name)),
        ('inimigos', '*.png', lambda f: (4, 3, 96, 96, True, GAME / 'masmorra/inimigos' / f.name) if f.stem.startswith('chefe-') else (4, 4, 48, 48, True, GAME / 'masmorra/inimigos' / f.name)),
        ('sombras', '*.png', lambda f: (4, 4, 48, 48, True, GAME / 'masmorra/sombras' / f.name)),
        ('armas', '*.png', lambda f: (4, 4, 16, 16, False, GAME / 'masmorra/armas' / f.name) if f.stem == 'tiros' else (4, 2, 48, 48, False, GAME / 'masmorra/armas' / f.name)),
        ('lugares', '*.png', lambda f: (4, 1, 96, 128, True, GAME / 'masmorra/lugares' / f.name) if f.stem == 'portal'
            else (4, 3, 32, 32, False, GAME / 'masmorra/lugares' / f.name) if f.stem.startswith('piso-parede')
            else (4, 2, 32, 32, False, GAME / 'masmorra/lugares' / f.name) if f.stem == 'perigos'
            else (4, 2, 64, 64, True, GAME / 'masmorra/lugares' / f.name) if f.stem == 'salas'
            else (4, 4, 64, 64, True, GAME / 'masmorra/lugares' / f.name)),
        ('saguao', '*.png', lambda f: (4, 2, 128, 128, True, GAME / 'masmorra/saguao' / f.name)),
    ]
    for folder, pat, spec in groups:
        for f in sorted((SRC / folder).glob(pat)):
            cols, rows, cw, ch, feet, dest = spec(f)
            arr = sheet(f, cols, rows, cw, ch, feet)
            save(arr, dest)
            review.append(arr)
            done.append(f'{folder}/{f.name}')
    # ícones: um arquivo por ícone
    ico = SRC / 'icones' / 'icones.png'
    if ico.exists():
        arr = sheet(ico, 4, 3, 32, 32, False)
        for i, name in enumerate(ICONS):
            r, c = divmod(i, 4)
            save(arr[r * 32:(r + 1) * 32, c * 32:(c + 1) * 32], GAME / 'icons/itens' / f'{name}.png')
        review.append(arr)
        done.append('icones/icones.png (troque os ícones em src/game/items.ts: minerio:cobre → minerio:cobre etc.)')
    # poses de combate do boneco (mesmo quadro da folha de andar)
    mw, mh = model_cell()
    for f in sorted((SRC / 'personagem').glob('modelo-*-*.png')):
        rows = 1 if f.stem.endswith('-magia') else 4
        arr = sheet(f, 4, rows, mw, mh, True)
        save(arr, GAME / 'sprites/poses' / f.name)
        review.append(arr)
        done.append(f'personagem/{f.name}')
    print('importados:', len(done))
    for d in done:
        print(' ', d)
    if '--folha' in sys.argv and review:
        dest = sys.argv[sys.argv.index('--folha') + 1]
        wmax = max(r.shape[1] for r in review)
        pad = [np.pad(r, ((0, 8), (0, wmax - r.shape[1]), (0, 0))) for r in review]
        big = np.concatenate(pad, 0)
        bg = Image.new('RGBA', (big.shape[1], big.shape[0]), (24, 20, 40, 255))
        bg.alpha_composite(Image.fromarray(big, 'RGBA'))
        bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST).save(dest)
        print('folha:', dest)


if __name__ == '__main__':
    main()

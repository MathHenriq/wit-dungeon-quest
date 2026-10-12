#!/usr/bin/env python3
"""Reações dos desafiantes no duelo (GPT, folha 4 × 2 em fundo magenta) →
public/game/sprites/npcs/reacoes/<id>.png: 8 quadros de 80 × 80 lado a lado,
pés na mesma linha e a mesma escala em todos os quadros da folha.

Ordem dos quadros (a do prompt, docs/PROMPTS-GPT.md §B):
  0 parado com cartas · 1 pensando · 2 jogando a carta · 3 mãos na cabeça (apanhou)
  4 susto · 5 comemorando · 6 triste (perdeu) · 7 sentado

  python3 scripts/arte/importar-reacoes.py [--folha revisao.png]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/Novos assets/npcs/reacoes'
OUT = ROOT / 'public/game/sprites/npcs/reacoes'
W = H = 80
FOOT = 78      # linha dos pés
BODY = 74      # altura do quadro mais alto da folha


def alpha_of(rgb):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    fundo = (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)
    return ~fundo


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    names, review = [], []
    for f in sorted(SRC.glob('npc-desafiante-*-reacoes.png')):
        rgb = np.array(Image.open(f).convert('RGB'))
        a = alpha_of(rgb)
        hh, ww = a.shape
        cells = []
        for k in range(8):
            r, c = divmod(k, 4)
            y0, y1, x0, x1 = hh * r // 2, hh * (r + 1) // 2, ww * c // 4, ww * (c + 1) // 4
            m = a[y0:y1, x0:x1]
            # descarta sujeira solta: só linhas e colunas com conteúdo de verdade
            ys, xs = np.where(m)
            cells.append((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))
        tallest = max(b[3] - b[1] for b in cells)
        k = BODY / tallest
        sheet = np.zeros((H, W * 8, 4), np.uint8)
        for i, (bx0, by0, bx1, by1) in enumerate(cells):
            crop = np.dstack([rgb[by0:by1, bx0:bx1], np.where(a[by0:by1, bx0:bx1], 255, 0).astype(np.uint8)])
            im = Image.fromarray(crop, 'RGBA')
            # pré-multiplica para a borda não puxar o magenta
            pre = np.array(im).astype(float)
            pre[..., :3] *= pre[..., 3:4] / 255
            w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
            sm = np.array(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(float)
            al = sm[..., 3] / 255
            col = np.where(al[..., None] > 0.02, sm[..., :3] / np.maximum(al[..., None], 0.02), 0).clip(0, 255)
            px = np.dstack([col, np.where(al >= 0.45, 255, 0)]).astype(np.uint8)
            w, h = min(w, W), min(h, FOOT)
            ox, oy = i * W + (W - w) // 2, FOOT - h
            sheet[oy:oy + h, ox:ox + w] = px[-h:, :w]
        q = np.array(Image.fromarray(sheet[..., :3], 'RGB').quantize(56, method=Image.Quantize.MEDIANCUT).convert('RGB'))
        sheet[..., :3] = np.where(sheet[..., 3:4] > 0, q, 0)
        name = f.stem.replace('-reacoes', '')
        Image.fromarray(sheet, 'RGBA').save(OUT / f'{name}.png')
        names.append(name)
        review.append(sheet)
    (OUT / 'manifest.json').write_text(json.dumps({'cell': [W, H], 'foot': FOOT, 'frames': 8, 'sprites': names}, indent=1))
    print('reações:', len(names))
    if '--folha' in sys.argv and review:
        dest = sys.argv[sys.argv.index('--folha') + 1]
        big = np.concatenate(review, 0)
        bg = Image.new('RGBA', (big.shape[1], big.shape[0]), (40, 30, 52, 255))
        bg.alpha_composite(Image.fromarray(big, 'RGBA'))
        bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST).save(dest)
        print('folha:', dest)


if __name__ == '__main__':
    main()

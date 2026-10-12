#!/usr/bin/env python3
"""Acessórios do personagem: folhas do GPT → public/game/sprites/acessorios/
atlas.png + manifest.json.

  python3 scripts/arte/importar-acessorios.py [--folha revisao.png]

As folhas acessorios-1..4 têm 5 acessórios por imagem (linhas) em 4 direções
(colunas: frente, olhando para a esquerda, para a direita, costas), em tons
de cinza: o jogo pinta com a cor escolhida pela luminância. A coroa vem da
folha colorida acessorio-coroa (16 quadros; usa o 1º de cada linha).

O encaixe não vem da imagem (o GPT não desenhou no lugar certo): o jogo mede
a cabeça e o tronco de cada quadro do boneco e põe o acessório pelo tipo
(src/game/world/accessories.ts). Aqui só se corta e se acerta o tamanho.
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/Novos assets/personagem/acessorios'
OUT = ROOT / 'public/game/sprites/acessorios'

spec = importlib.util.spec_from_file_location('imp', ROOT / 'scripts/arte/importar-gpt.py')
imp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(imp)
spec2 = importlib.util.spec_from_file_location('ip', ROOT / 'scripts/arte/importar-personagem.py')
ip = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(ip)

# (folha, linha) → id, nome, largura de frente em px hd (a cabeça do boneco tem ~34)
ITEMS = {
    (1, 0): ('bone', 'Boné', 38), (1, 1): ('gorro', 'Gorro', 35), (1, 2): ('oculos', 'Óculos redondos', 26),
    (1, 3): ('mochila', 'Mochila', 23), (1, 4): ('fone', 'Fone', 42),
    (2, 0): ('chapeu', 'Chapéu', 44), (2, 1): ('cachecol', 'Cachecol', 27), (2, 2): ('laco', 'Laço', 17),
    (2, 3): ('viseira', 'Viseira', 36), (2, 4): ('oculos-aviador', 'Óculos de aviador', 32),
    (3, 0): ('pochete', 'Pochete', 22), (3, 2): ('presilha', 'Presilha de estrela', 12),
    (3, 3): ('orelhas-gato', 'Orelhas de gato', 36), (3, 4): ('oculos-sol', 'Óculos de sol', 29),
    (4, 0): ('bandana', 'Bandana', 37), (4, 1): ('coroa-flores', 'Coroa de flores', 38), (4, 2): ('faixa', 'Faixa', 34),
    (4, 3): ('protetor-orelha', 'Protetor de orelha', 42), (4, 4): ('bolsa', 'Bolsa', 26),
}
CROWN = ('coroa', 'Coroa', 22)


def runs(profile, min_gap):
    """Faixas contínuas de um perfil (bool), juntando buracos menores que min_gap."""
    idx = np.where(profile)[0]
    if not len(idx):
        return []
    out, start, prev = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - prev > min_gap:
            out.append((start, prev + 1)); start = i
        prev = i
    out.append((start, prev + 1))
    return out


def merge_to(bands, n):
    """Junta as faixas mais próximas até sobrarem n."""
    bands = list(bands)
    while len(bands) > n:
        gaps = [bands[i + 1][0] - bands[i][1] for i in range(len(bands) - 1)]
        i = int(np.argmin(gaps))
        bands[i:i + 2] = [(bands[i][0], bands[i + 1][1])]
    return bands


def grid(alpha, rows=5, cols=4):
    mask = alpha > 0.5
    rb = merge_to(runs(mask.any(1), 6), rows)
    cells = []
    for y0, y1 in rb:
        cb = merge_to(runs(mask[y0:y1].any(0), 6), cols)
        cells.append([(x0, y0, x1, y1) for x0, x1 in cb])
    return cells


def crop(rgb, alpha, box):
    x0, y0, x1, y1 = box
    a = alpha[y0:y1, x0:x1] > 0.5
    ys, xs = np.where(a)
    return (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)


def gray(px):
    """Tons de cinza (o jogo pinta pela luminância)."""
    lum = (px[..., :3].astype(float) @ [0.3, 0.59, 0.11]).clip(0, 255).astype(np.uint8)
    return np.dstack([lum, lum, lum, px[..., 3]])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pieces = {}   # id → (nome, fixo, [4 arrays])
    for sheet in range(1, 5):
        rgb, alpha = imp.load(str(SRC / f'acessorios-{sheet}.png'))
        cells = grid(alpha)
        if len(cells) != 5 or any(len(r) != 4 for r in cells):
            print(f'acessorios-{sheet}: grade {[len(r) for r in cells]}')
        for r, row in enumerate(cells):
            if (sheet, r) not in ITEMS:
                continue
            iid, nome, width = ITEMS[(sheet, r)]
            boxes = [crop(rgb, alpha, b) for b in row]
            s = (boxes[0][2] - boxes[0][0]) / width   # px da folha por px hd (pela vista de frente)
            dirs = []
            for b in boxes:
                w = max(1, round((b[2] - b[0]) / s))
                dirs.append(gray(imp.shrink(rgb, alpha, b, {'w': w}, 16)))
            pieces[iid] = (nome, False, dirs)
    # coroa: colorida, 16 quadros; o 1º de cada linha
    fr = ip.frames(SRC / 'acessorio-coroa.png')
    dirs, base_w = [], None
    for k in (0, 4, 8, 12):
        f = fr[k]
        a = f[..., 3] > 127
        rgb, alpha = f[..., :3].astype(float), a.astype(float)
        box = (0, 0, f.shape[1], f.shape[0])
        if base_w is None:
            base_w = f.shape[1]
        w = max(1, round(f.shape[1] * CROWN[2] / base_w))
        dirs.append(imp.shrink(rgb, alpha, box, {'w': w}, 24))
    pieces[CROWN[0]] = (CROWN[1], True, dirs)

    # atlas: uma linha por acessório
    pad = 2
    rows_h = [max(d.shape[0] for d in p[2]) for p in pieces.values()]
    W = max(sum(d.shape[1] + pad for d in p[2]) for p in pieces.values())
    H = sum(h + pad for h in rows_h)
    atlas = np.zeros((H, W, 4), np.uint8)
    manifest, y = {}, 0
    for (iid, (nome, fixo, dirs)), h in zip(pieces.items(), rows_h):
        x, boxes = 0, []
        for d in dirs:
            atlas[y:y + d.shape[0], x:x + d.shape[1]] = d
            boxes.append([x, y, d.shape[1], d.shape[0]])
            x += d.shape[1] + pad
        manifest[iid] = {'nome': nome, 'a': boxes, **({'fixo': True} if fixo else {})}
        y += h + pad
    Image.fromarray(atlas, 'RGBA').save(OUT / 'atlas.png')
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(len(manifest), 'acessórios em', OUT.relative_to(ROOT))
    if '--folha' in sys.argv:
        dest = sys.argv[sys.argv.index('--folha') + 1]
        bg = np.zeros_like(atlas); bg[...] = [150, 110, 190, 255]
        a = atlas[..., 3:4] / 255
        comp = (atlas[..., :3] * a + bg[..., :3] * (1 - a)).astype(np.uint8)
        Image.fromarray(comp).resize((W * 3, H * 3), Image.NEAREST).save(dest)
        print('folha:', dest)


if __name__ == '__main__':
    main()

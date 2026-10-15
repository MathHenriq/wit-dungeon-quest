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
  efeitos-elemento/  6 × 4  64  public/game/masmorra/efeitos-elemento/<elemento>.png   (§10.1, visual v2)
  golpes/      golpes-jogador 6 × 6 (64) · projeteis 8 × 6 (32) → public/game/masmorra/golpes/   (§10.2 e §10.3)
  personagem/  pelo importar-personagem.py --so-poses → public/game/sprites/modelos/poses/

  python3 scripts/arte/importar-masmorra.py [--folha revisao.png]

Público infantil: revisar a folha (--folha) antes de subir.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/Novos assets/masmorra'
GAME = ROOT / 'public/game'

# nomes dos ícones na ordem da folha (docs/gpt-masmorra.md §7)
ICONS = ['minerio_cobre', 'minerio_ferro', 'minerio_ouro', 'erva_cura', 'erva_mana', 'cristal_azul', 'cristal_roxo',
         'cristal_dourado', 'pelo', 'pena_goblin', 'pocao_vida', 'pocao_mana']


def alpha_of(rgb):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    fundo = (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)
    return ~fundo


def runs(occ, n, gap=3):
    """Faixas com desenho separadas por vãos vazios; junta os vãos menores até sobrar n.
    None se der menos de n (desenhos encostados): aí vale a grade igual."""
    idx = np.where(occ)[0]
    if not len(idx):
        return None
    rs = [[idx[0], idx[0] + 1]]
    for i in idx[1:]:
        if i - rs[-1][1] < gap:
            rs[-1][1] = i + 1
        else:
            rs.append([i, i + 1])
    while len(rs) > n:
        k = min(range(len(rs) - 1), key=lambda j: rs[j + 1][0] - rs[j][1])
        rs[k][1] = rs[k + 1][1]
        del rs[k + 1]
    return rs if len(rs) == n else None


def cells(a, cols, rows):
    """Quadros da folha: pelas faixas vazias (o GPT não espaça igual); senão, grade igual."""
    hh, ww = a.shape
    band = runs((a.sum(1) > 2), rows) or [[hh * r // rows, hh * (r + 1) // rows] for r in range(rows)]
    out = []
    for y0, y1 in band:
        col = runs((a[y0:y1].sum(0) > 1), cols) or [[ww * c // cols, ww * (c + 1) // cols] for c in range(cols)]
        out += [(x0, y0, x1, y1) for x0, x1 in col]
    return out


def own(a, box):
    """Máscara do quadro sem as lascas do vizinho: pedaço que encosta na borda
    e é estreito (menos de 1/4 do quadro naquele sentido) é do quadro ao lado."""
    x0, y0, x1, y1 = box
    m = a[y0:y1, x0:x1].copy()
    lab, n = ndimage.label(m)
    if n < 2:
        return m
    h, w = m.shape
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        ys, xs = sl
        side = (xs.start == 0 or xs.stop == w) and (xs.stop - xs.start) < w / 4
        top = (ys.start == 0 or ys.stop == h) and (ys.stop - ys.start) < h / 4
        if side or top:
            m[lab == i] = False
    return m


def content(a, box):
    """Caixa do desenho dentro do quadro (sem o magenta), ou None."""
    x0, y0, x1, y1 = box
    ys, xs = np.where(own(a, box))
    if not len(xs):
        return None
    return x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1


def fit(rgb, a, box, cw, ch, feet, k=None):
    """Recorta o conteúdo do quadro e encaixa em cw × ch (pés embaixo ou no meio).
    `k` é a escala (a mesma para a folha inteira); sem ela, o desenho enche o quadro."""
    out = np.zeros((ch, cw, 4), np.uint8)
    bb = content(a, box)
    if bb is None:
        return out
    bx0, by0, bx1, by1 = bb
    mine = np.zeros_like(a)
    mine[box[1]:box[3], box[0]:box[2]] = own(a, box)
    crop = np.dstack([rgb[by0:by1, bx0:bx1], np.where(mine[by0:by1, bx0:bx1], 255, 0).astype(np.uint8)])
    im = Image.fromarray(crop, 'RGBA')
    if k is None:
        k = min((cw - 2) / im.width, (ch - 2) / im.height)
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


def sheet(path, cols, rows, cw, ch, feet, uniform=True):
    """Corta a folha em cols × rows. Com `uniform`, a escala é uma só para a folha
    inteira (a do maior desenho): animação não "pulsa" e o pequeno fica pequeno."""
    rgb = np.array(Image.open(path).convert('RGB'))
    a = alpha_of(rgb)
    hh, ww = a.shape
    boxes = cells(a, cols, rows)
    k = None
    if uniform:
        ks = [min((cw - 2) / (b[2] - b[0]), (ch - 2) / (b[3] - b[1])) for b in (content(a, x) for x in boxes) if b]
        k = min(ks) if ks else None
    out = np.zeros((ch * rows, cw * cols, 4), np.uint8)
    for i, box in enumerate(boxes):
        r, c = divmod(i, cols)
        out[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] = fit(rgb, a, box, cw, ch, feet, k)
    return out


def tiles(path, cols, rows, size, inset=0.06):
    """Azulejos (piso e parede): o desenho ocupa o quadro inteiro, sem margem.
    Corta um pouco da borda (contorno escuro e canto arredondado do GPT) para emendar."""
    im = Image.open(path).convert('RGB')
    a = alpha_of(np.array(im))
    out = np.zeros((size * rows, size * cols, 4), np.uint8)
    for i, box in enumerate(cells(a, cols, rows)):
        r, c = divmod(i, cols)
        x0, y0, x1, y1 = box
        # caixa firme: linhas e colunas com mais da metade de desenho (ignora respingo solto)
        m = a[y0:y1, x0:x1]
        ys, xs = np.where(m.mean(1) > 0.5)[0], np.where(m.mean(0) > 0.5)[0]
        if not len(ys) or not len(xs):
            continue
        x0, x1, y0, y1 = x0 + xs[0], x0 + xs[-1] + 1, y0 + ys[0], y0 + ys[-1] + 1
        dx, dy = round((x1 - x0) * inset), round((y1 - y0) * inset)
        cut = np.array(im.crop((x0 + dx, y0 + dy, x1 - dx, y1 - dy)))
        # resto de magenta dentro do azulejo: troca pela cor média do azulejo
        bad = ~alpha_of(cut)
        if bad.any():
            cut[bad] = cut[~bad].mean(0).astype(np.uint8)
        t = Image.fromarray(cut).resize((size, size), Image.BOX)
        if True:
            out[r * size:(r + 1) * size, c * size:(c + 1) * size, :3] = np.array(t)
            out[r * size:(r + 1) * size, c * size:(c + 1) * size, 3] = 255
    return out


def save(arr, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr, 'RGBA').save(dest)


def main():
    review, done = [], []
    groups = [
        ('efeitos', '*.png', lambda f: (6, 1, 96, 96, False, GAME / 'efeitos' / f.name)),
        ('inimigos', '*.png', lambda f: (4, 3, 96, 96, True, GAME / 'masmorra/inimigos' / f.name) if f.stem.startswith('chefe-') else (4, 4, 48, 48, True, GAME / 'masmorra/inimigos' / f.name)),
        ('sombras', '*.png', lambda f: (4, 4, 48, 48, True, GAME / 'masmorra/sombras' / f.name)),
        ('armas', '*.png', lambda f: (4, 4, 16, 16, False, GAME / 'masmorra/armas' / f.name) if f.stem == 'tiros' else (4, 2, 48, 48, False, GAME / 'masmorra/armas' / f.name)),
        ('lugares', '*.png', lambda f: (4, 1, 96, 128, True, GAME / 'masmorra/lugares' / f.name) if f.stem == 'portal'
            else (4, 3, 32, 32, 'azulejo', GAME / 'masmorra/lugares' / f.name) if f.stem.startswith('piso-parede')
            else (4, 2, 32, 32, False, GAME / 'masmorra/lugares' / f.name) if f.stem == 'perigos'
            else (4, 2, 64, 64, True, GAME / 'masmorra/lugares' / f.name) if f.stem == 'salas'
            else (4, 4, 64, 64, True, GAME / 'masmorra/lugares' / f.name)),
        ('saguao', '*.png', lambda f: (4, 2, 128, 128, True, GAME / 'masmorra/saguao' / f.name)),
        # visual v2 (§10): efeitos por elemento, golpes do caçador e os objetos que as cartas jogam
        ('efeitos-elemento', '*.png', lambda f: (6, 4, 64, 64, False, GAME / 'masmorra/efeitos-elemento' / f.name)),
        ('golpes', '*.png', lambda f: (8, 6, 32, 32, False, GAME / 'masmorra/golpes' / f.name) if f.stem == 'projeteis' else (6, 6, 64, 64, False, GAME / 'masmorra/golpes' / f.name)),
    ]
    for folder, pat, spec in groups:
        for f in sorted((SRC / folder).glob(pat)):
            cols, rows, cw, ch, feet, dest = spec(f)
            arr = tiles(f, cols, rows, cw) if feet == 'azulejo' else sheet(f, cols, rows, cw, ch, feet)
            save(arr, dest)
            review.append(arr)
            done.append(f'{folder}/{f.name}')
    # ícones: um arquivo por ícone
    ico = SRC / 'icones' / 'icones.png'
    if ico.exists():
        arr = sheet(ico, 4, 3, 32, 32, False, uniform=False)
        for i, name in enumerate(ICONS):
            r, c = divmod(i, 4)
            save(arr[r * 32:(r + 1) * 32, c * 32:(c + 1) * 32], GAME / 'icons/itens' / f'{name}.png')
        review.append(arr)
        done.append('icones/icones.png (ligados em src/game/items.ts)')
    # poses do boneco (combate, esquiva, magia): python3 scripts/arte/importar-personagem.py --so-poses
    #   (mesma paleta das cores-molde que o jogo pinta; saída em public/game/sprites/modelos/poses/)
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

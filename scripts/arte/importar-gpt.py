#!/usr/bin/env python3
"""Converte as imagens geradas no GPT (public/Novos assets, fundo magenta) em
sprites do jogo (public/game/world/*.png) + camada da noite (*-noite.png) +
manifest.json com os tamanhos.

  python3 scripts/arte/importar-gpt.py [--folha saida.png]

Passos para cada imagem: tira o fundo magenta (e a franja rosada), corta no
contorno, reduz pela média (caixa) até o tamanho do jogo, deixa a borda
binária (pixel art), reduz a paleta e gera a camada da noite (janelas
amarelas, LEDs lima, telas, fogo). Folhas com vários objetos são separadas
por componentes conexos, na ordem de leitura (linha a linha, da esquerda
para a direita).

Precisa de pillow, numpy e scipy (pip install pillow numpy scipy).
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SRC = os.path.join(ROOT, 'public', 'Novos assets')
OUT = os.path.join(ROOT, 'public', 'game', 'world')

# nome do arquivo → nome(s) do sprite e tamanho no jogo ('w' ou 'h' em px)
SINGLE = {
    'torre': ('torre', {'h': 178}),
    'oficina': ('oficina', {'w': 112}),
    'arena': ('arena', {'w': 128}),
    'castelo': ('castelo', {'w': 112}),
    'palacio-cartas': ('palacio-cartas', {'w': 80}),
    'casa-vermelha-antena': ('casa-vermelha-antena', {'w': 80}),
    'casa-azul': ('casa-azul', {'w': 80}),
    'casa-rosa': ('casa-rosa', {'w': 80}),
    'casa-verde': ('casa-verde', {'w': 80}),
    'casa-roxa': ('casa-roxa', {'w': 80}),
    'casa-laranja': ('casa-laranja', {'w': 80}),
    'casa-chale': ('casa-chale', {'w': 80}),
    'casa-tijolo': ('casa-tijolo', {'w': 80}),
    'casa-moderna': ('casa-moderna', {'w': 80}),
    'casa-futurista': ('casa-futurista', {'w': 80}),
    'casa-arvore': ('casa-arvore', {'w': 80}),
    'casa-gamer': ('casa-gamer', {'w': 80}),
    'casa-japonesa': ('casa-japonesa', {'w': 80}),
    'casa-montanha': ('casa-montanha', {'w': 80}),
    'casa-castelo': ('casa-castelo', {'w': 80}),
    'casa-foguete': ('casa-foguete', {'w': 64}),
    'casa-padaria': ('casa-padaria', {'w': 80}),
    'casa-floricultura': ('casa-floricultura', {'w': 80}),
    'casa-inventor': ('casa-inventor', {'w': 80}),
    'casa-pescador': ('casa-pescador', {'w': 80}),
    'casa-musico': ('casa-musico', {'w': 80}),
    'casa-fazendeiro': ('casa-fazendeiro', {'w': 80}),
    'casa-bibliotecaria': ('casa-bibliotecaria', {'w': 80}),
    'casa-artista': ('casa-artista', {'w': 80}),
}
SHEETS = {
    'arvores': [('pinheiro', {'w': 30}), ('arvore-redonda', {'w': 34}), ('cerejeira', {'w': 34}), ('arbusto', {'w': 18})],
    'folha-a': [('poste', {'h': 32}), ('totem', {'h': 30}), ('maquina', {'h': 32}),
                ('vaso', {'w': 16}), ('correio', {'h': 18}), ('placa', {'w': 16})],
    'folha-b': [('banco', {'w': 32}), ('cerca', {'w': 16}), ('pedra', {'w': 14}), ('lixeira', {'h': 16})],
    'folha-c': [('fonte', {'w': 64}), ('mural', {'w': 48}), ('portal', {'w': 64})],
    'folha-d': [('tulipas', {'w': 16}), ('mato', {'w': 16}), ('arbusto-florido', {'w': 16}),
                ('toco', {'w': 14}), ('cogumelos', {'w': 12}), ('pedrinhas', {'w': 16})],
}


def load(path):
    a = np.array(Image.open(path).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
    alpha = np.clip((d - 70) / 80, 0, 1)
    # tira o rosa da franja (a cor do fundo que vazou na borda)
    spill = np.clip(np.minimum(r, b) - g, 0, None) * (1 - alpha)
    rgb = np.stack([r - spill * 0.9, g, b - spill * 0.9], -1).clip(0, 255)
    return rgb, alpha


def shrink(rgb, alpha, box, size, colors):
    x0, y0, x1, y1 = box
    rgb, alpha = rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
    h0, w0 = alpha.shape
    if 'w' in size:
        w = size['w']; h = max(1, round(h0 * w / w0))
    else:
        h = size['h']; w = max(1, round(w0 * h / h0))
    pre = np.dstack([rgb * alpha[..., None], alpha * 255]).astype(np.uint8)
    small = np.array(Image.fromarray(pre, 'RGBA').resize((w, h), Image.BOX)).astype(float)
    al = small[..., 3] / 255
    col = np.where(al[..., None] > 0.02, small[..., :3] / np.maximum(al[..., None], 0.02), 0).clip(0, 255)
    mask = al > 0.45
    q = Image.fromarray(col.astype(np.uint8), 'RGB').quantize(colors, method=Image.Quantize.MEDIANCUT).convert('RGB')
    out = np.dstack([np.array(q), mask * 255]).astype(np.uint8)
    return out


def night(px):
    """O que acende à noite: janelas amarelas, LEDs lima, telas azuis claras, fogo."""
    r, g, b, a = [px[..., i].astype(int) for i in range(4)]
    on = a > 0
    window = on & (r > 215) & (g > 180) & (b < 175) & (r - b > 70)
    led = on & (g > 170) & (g - r > 25) & (g - b > 60) & (r > 90)
    # LED é ponto ou fita fina; manchas grandes lima são parede ou folhagem
    lab, k = ndimage.label(led)
    if k:
        sizes = ndimage.sum(led, lab, range(1, k + 1))
        led = np.isin(lab, [i + 1 for i in range(k) if sizes[i] <= 10])
    screen = on & (b > 215) & (g > 200) & (r < 190)
    fire = on & (r > 230) & (g > 90) & (g < 200) & (b < 90)
    lit = window | led | screen | fire
    out = np.zeros_like(px)
    boost = np.clip(px[..., :3].astype(int) * 1.12 + 12, 0, 255)
    out[..., :3] = np.where(lit[..., None], boost, 0)
    out[..., 3] = np.where(lit, 255, 0)
    return out.astype(np.uint8), int(lit.sum())


def components(alpha, n):
    mask = alpha > 0.5
    # junta pedacinhos próximos (fumaça, bandeira, pétala) ao objeto
    grown = ndimage.binary_dilation(mask, iterations=14)
    lab, k = ndimage.label(grown)
    objs = ndimage.find_objects(lab)
    areas = ndimage.sum(mask, lab, range(1, k + 1))
    keep = sorted(range(k), key=lambda i: -areas[i])[:n]
    boxes = []
    for i in keep:
        sl = objs[i]
        sub = (lab[sl] == i + 1) & mask[sl]
        ys, xs = np.where(sub)
        boxes.append((sl[1].start + xs.min(), sl[0].start + ys.min(), sl[1].start + xs.max() + 1, sl[0].start + ys.max() + 1))
    # ordem de leitura: agrupa por linha (centro vertical) e ordena por x
    boxes.sort(key=lambda bx: (bx[1] + bx[3]) / 2)
    rows, cur = [], []
    for bx in boxes:
        if cur and (bx[1] + bx[3]) / 2 - (cur[-1][1] + cur[-1][3]) / 2 > (cur[-1][3] - cur[-1][1]) * 0.6:
            rows.append(cur); cur = []
        cur.append(bx)
    rows.append(cur)
    return [bx for row in rows for bx in sorted(row, key=lambda b: b[0])], lab


def bbox(alpha):
    ys, xs = np.where(alpha > 0.5)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


# natureza e objetos sem luz: o detector confundiria folha lima e madeira clara com LED e janela
NO_NIGHT = {'pinheiro', 'arvore-redonda', 'cerejeira', 'arbusto', 'arbusto-florido', 'tulipas', 'mato', 'toco',
            'cogumelos', 'pedrinhas', 'pedra', 'banco', 'cerca', 'placa', 'correio', 'lixeira', 'vaso'}


def save(name, px, manifest):
    Image.fromarray(px, 'RGBA').save(os.path.join(OUT, name + '.png'))
    npath = os.path.join(OUT, name + '-noite.png')
    if os.path.exists(npath):
        os.remove(npath)
    nt, count = night(px)
    if name in NO_NIGHT:
        count = 0
    entry = {'w': int(px.shape[1]), 'h': int(px.shape[0])}
    if count > 0:
        Image.fromarray(nt, 'RGBA').save(os.path.join(OUT, name + '-noite.png'))
        entry['noite'] = True
    manifest[name] = entry


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for src, (name, size) in SINGLE.items():
        path = os.path.join(SRC, src + '.png')
        if not os.path.exists(path):
            print('faltando:', src); continue
        rgb, alpha = load(path)
        # só o maior pedaço (ignora sujeira solta no fundo)
        boxes, _ = components(alpha, 1)
        save(name, shrink(rgb, alpha, boxes[0] if boxes else bbox(alpha), size, 64), manifest)
    for src, items in SHEETS.items():
        path = os.path.join(SRC, src + '.png')
        if not os.path.exists(path):
            print('faltando:', src); continue
        rgb, alpha = load(path)
        boxes, _ = components(alpha, len(items))
        if len(boxes) != len(items):
            print(f'{src}: achei {len(boxes)} objetos, esperava {len(items)}')
        for (name, size), box in zip(items, boxes):
            save(name, shrink(rgb, alpha, box, size, 32), manifest)
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1, sort_keys=True)
    print(len(manifest), 'sprites em', os.path.relpath(OUT, ROOT))

    if '--folha' in sys.argv:
        out = sys.argv[sys.argv.index('--folha') + 1]
        ims = [(n, Image.open(os.path.join(OUT, n + '.png'))) for n in manifest]
        pad, cols = 6, 10
        cw = max(i.width for _, i in ims) + pad
        ch = max(i.height for _, i in ims) + pad
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new('RGBA', (cols * cw, rows * ch * 2), (116, 212, 168, 255))
        for k, (n, im) in enumerate(ims):
            x, y = (k % cols) * cw, (k // cols) * ch * 2
            sheet.alpha_composite(im, (x, y + ch - im.height))
            dark = Image.new('RGBA', im.size, (40, 50, 90, 255))
            base = Image.composite(Image.blend(im.convert('RGB'), dark.convert('RGB'), 0.55).convert('RGBA'), Image.new('RGBA', im.size, (0, 0, 0, 0)), im.split()[3])
            sheet.alpha_composite(base, (x, y + 2 * ch - im.height))
            npath = os.path.join(OUT, n + '-noite.png')
            if os.path.exists(npath):
                sheet.alpha_composite(Image.open(npath), (x, y + 2 * ch - im.height))
        sheet = sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST)
        sheet.save(out)
        print('folha:', out)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Converte as imagens geradas no GPT (public/Novos assets, fundo magenta) em
sprites do jogo (public/game/world/*.png) + camada da noite (*-noite.png) +
manifest.json com os tamanhos.

  python3 scripts/arte/importar-gpt.py [--folha saida.png]

Gera duas resoluções: a normal (1 bloco = 16 px) em public/game/world e a
dobrada (1 bloco = 32 px, mais detalhe) em public/game/world/hd, com os
mesmos nomes. O jogo desenha a hd; a normal fica para os testes e scripts.

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
    'torre': ('torre', {'h': 236}),
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
# mundo grande (Lago, Fazenda, Cidade WIT): a lista completa, com o que cada
# sprite é, fica em src/game/world/art-list.ts (um teste confere que os nomes
# batem). Salve as imagens em public/Novos assets/mundo/<área>/.
SINGLE.update({
    'casa-pesca': ('casa-pesca', {'w': 112}), 'farol': ('farol', {'h': 110}),
    'casa-fazenda': ('casa-fazenda', {'w': 96}), 'celeiro': ('celeiro', {'w': 96}), 'galinheiro': ('galinheiro', {'w': 64}),
    'estufa': ('estufa', {'w': 96}), 'moinho': ('moinho', {'h': 100}), 'moinho-pas': ('moinho-pas', {'w': 90}),
    'nucleo-wit': ('nucleo-wit', {'w': 192}), 'lab-ia': ('lab-ia', {'w': 112}), 'casa-iot': ('casa-iot', {'w': 96}),
    'metaverso': ('metaverso', {'w': 112}), 'estudio-comunicacao': ('estudio-comunicacao', {'w': 96}),
    'oficina-games': ('oficina-games', {'w': 112}), 'mercado-central': ('mercado-central', {'w': 256}),
    'central-entregas': ('central-entregas', {'w': 112}),
})
FISH_IDS = ['lambari', 'tilapia', 'carpa', 'camarao', 'bagre', 'traira', 'piau', 'pacu', 'tucunare', 'dourado',
            'koi', 'pirarucu', 'peixe-cristal', 'koi-dourada', 'bota', 'lata']
CROP_ROWS = ['cenoura', 'milho', 'tomate', 'morango', 'abobora', 'alface', 'girassol']
# texturas de chão: viram quadrados de TILE_PX que se repetem sem emenda
TILE_PX = 128
TILES = {
    'tile-grama': 'chao-grama', 'tile-mato': 'chao-mato', 'tile-areia': 'chao-areia',
    'tile-calcada': 'chao-calcada', 'tile-agua': 'chao-agua', 'tile-flores': 'chao-flores',
    'tile-floresta': 'chao-floresta',
}
SHEETS = {
    'arvores': [('pinheiro', {'w': 30}), ('arvore-redonda', {'w': 34}), ('cerejeira', {'w': 34}), ('arbusto', {'w': 18})],
    'folha-a': [('poste', {'h': 32}), ('totem', {'h': 30}), ('maquina', {'h': 32}),
                ('vaso', {'w': 16}), ('correio', {'h': 18}), ('placa', {'w': 16})],
    'folha-b': [('banco', {'w': 32}), ('cerca', {'w': 16}), ('pedra', {'w': 14}), ('lixeira', {'h': 16})],
    'folha-c': [('fonte', {'w': 64}), ('mural', {'w': 48}), ('portal', {'w': 64})],
    'folha-d': [('tulipas', {'w': 16}), ('mato', {'w': 16}), ('arbusto-florido', {'w': 16}),
                ('toco', {'w': 14}), ('cogumelos', {'w': 12}), ('pedrinhas', {'w': 16})],
    # ── mundo grande ──
    'lago-objetos': [('barco-norte', {'h': 22}), ('barco-leste', {'w': 22}), ('barco-sul', {'h': 22}), ('banca-peixe', {'w': 48}),
                     ('caixotes', {'w': 24}), ('vara-barril', {'w': 16}), ('boia', {'h': 26}), ('vitoria-regia', {'w': 16})],
    'lago-objetos-2': [('pier-vertical', {'w': 16}), ('pier-horizontal', {'w': 32}), ('ponte', {'w': 64}), ('fogueira', {'w': 16}),
                       ('guarda-sol', {'w': 32}), ('castelo-areia', {'w': 16}), ('barraca-camping', {'w': 32}), ('barril', {'w': 14}),
                       ('varal-peixe', {'w': 32}), ('pedras-margem', {'w': 16}), ('pato', {'w': 12})],
    'peixes': [('peixe-' + f, {'w': 24}) for f in FISH_IDS],
    'casinhas-lago': [(n, {'w': 80}) for n in ['loja-iscas', 'casa-nando', 'casa-lucia', 'casa-marinho']],
    'fazenda-objetos': [('silo', {'h': 92}), ('poco', {'w': 32}), ('caixa-envio', {'w': 32}), ('espantalho', {'h': 28}),
                        ('feno', {'w': 16}), ('barraca-sementes', {'w': 48}), ('carrinho', {'w': 16}), ('cocho', {'w': 24}),
                        ('lenha', {'w': 16}), ('porteira', {'w': 32}), ('colmeia', {'w': 16}), ('mesa-piquenique', {'w': 32})],
    'terra': [('terra-seca', {'w': 16}), ('terra-molhada', {'w': 16}), ('cerca-em-pe', {'h': 16})],
    'plantacoes': [(f'planta-{c}-{k}', {'w': 16}) for c in CROP_ROWS for k in range(5)],
    'animais': [('galinha-esq', {'w': 12}), ('galinha-dir', {'w': 12}), ('vaca-esq', {'w': 20}), ('vaca-dir', {'w': 20}),
                ('ovelha-esq', {'w': 16}), ('ovelha-dir', {'w': 16})],
    'wit-objetos': [('telao', {'w': 96}), ('drone', {'w': 14}), ('robo-frente', {'h': 16}), ('robo-costas', {'h': 16}),
                    ('arvore-solar', {'h': 48}), ('poste-inteligente', {'h': 32}), ('semaforo', {'h': 32}), ('patinetes', {'w': 32}),
                    ('fliperama', {'h': 26}), ('totem-holo', {'h': 30}), ('banco-solar', {'w': 32}), ('reciclagem', {'w': 32})],
    'wit-objetos-2': [('quadra', {'w': 144}), ('cesta', {'h': 32}), ('canteiro-iot', {'w': 32}), ('estacao-tempo', {'h': 32})],
    'wit-tech-3': [('data-center', {'w': 64}), ('antena-5g', {'h': 48}), ('turbina', {'h': 48}), ('paineis-solares', {'w': 48}),
                   ('carregador-carro', {'h': 24}), ('robo-entrega', {'w': 16}), ('totem-info', {'h': 36}), ('ponte-luz', {'w': 32}),
                   ('impressora-3d', {'w': 36}), ('ponto-onibus', {'w': 40}), ('base-drone', {'w': 44}), ('braco-robo', {'w': 36}),
                   ('lixeira-smart', {'h': 20}), ('estacao-bike', {'w': 40}), ('estacao-tempo-2', {'h': 32}), ('antena-satelite', {'w': 40})],
    'robo-gari': [('robo-gari', {'h': 18}), ('lixo-lata', {'w': 7}), ('lixo-papel', {'w': 7}), ('lixo-garrafa', {'w': 7})],
    'casinhas-wit': [(n, {'w': 80}) for n in ['casa-coworking', 'estudio-musica', 'atelie', 'moradia-1', 'moradia-2', 'moradia-3', 'moradia-4']],
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
    # borda com meio-tom: o pixel que fica metade dentro, metade fora vira
    # semitransparente (em vez de "tudo ou nada"), o que tira o serrilhado
    # só na borda de FORA: o interior continua opaco (nada de ver a grama pelo telhado)
    base = al >= 0.45
    lab, _ = ndimage.label(~base)
    border_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    exterior = np.isin(lab, list(border_labels))
    touch = ndimage.binary_dilation(base, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]]) & exterior
    alpha = np.where(base, 255, np.where(touch & (al >= 0.18), 110, 0))
    q = Image.fromarray(col.astype(np.uint8), 'RGB').quantize(colors, method=Image.Quantize.MEDIANCUT).convert('RGB')
    out = np.dstack([np.array(q), alpha]).astype(np.uint8)
    return out


def night(px, k=1):
    """O que acende à noite: janelas amarelas, LEDs lima, telas azuis claras, fogo."""
    r, g, b, a = [px[..., i].astype(int) for i in range(4)]
    on = a > 0
    window = on & (r > 215) & (g > 180) & (b < 175) & (r - b > 70)
    led = on & (g > 170) & (g - r > 25) & (g - b > 60) & (r > 90)
    # LED é ponto ou fita fina; manchas grandes lima são parede ou folhagem
    lab, k = ndimage.label(led)
    if k:
        sizes = ndimage.sum(led, lab, range(1, k + 1))
        led = np.isin(lab, [i + 1 for i in range(k) if sizes[i] <= 10 * k * k])
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


# folhas em grade com objetos muito perto (o agrupamento por vizinhança junta
# a semente ao broto): corta a área desenhada em colunas x linhas iguais
GRID = {'peixes': (4, 4), 'plantacoes': (5, 7), 'wit-tech-3': (4, 4)}


def grid_boxes(alpha, cols, rows):
    mask = alpha > 0.5
    x0, y0, x1, y1 = bbox(alpha)
    boxes = []
    for r in range(rows):
        for c in range(cols):
            cx0, cx1 = x0 + (x1 - x0) * c // cols, x0 + (x1 - x0) * (c + 1) // cols
            cy0, cy1 = y0 + (y1 - y0) * r // rows, y0 + (y1 - y0) * (r + 1) // rows
            ys, xs = np.where(mask[cy0:cy1, cx0:cx1])
            if len(xs):
                boxes.append((cx0 + xs.min(), cy0 + ys.min(), cx0 + xs.max() + 1, cy0 + ys.max() + 1))
    return boxes


def bbox(alpha):
    ys, xs = np.where(alpha > 0.5)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


# natureza e objetos sem luz: o detector confundiria folha lima e madeira clara com LED e janela
NO_NIGHT = {'pinheiro', 'arvore-redonda', 'cerejeira', 'arbusto', 'arbusto-florido', 'tulipas', 'mato', 'toco',
            'cogumelos', 'pedrinhas', 'pedra', 'banco', 'cerca', 'placa', 'correio', 'lixeira', 'vaso',
            'vitoria-regia', 'terra-seca', 'terra-molhada', 'cerca-em-pe', 'feno', 'carrinho', 'lenha', 'pato',
            'galinha-esq', 'galinha-dir', 'vaca-esq', 'vaca-dir', 'ovelha-esq', 'ovelha-dir', 'quadra',
            'caixotes', 'barril', 'pedras-margem', 'castelo-areia', 'mesa-piquenique'} | {'peixe-' + f for f in FISH_IDS} \
    | {f'planta-{c}-{k}' for c in CROP_ROWS for k in range(5)}


def save(name, px, manifest, out=OUT, k=1):
    Image.fromarray(px, 'RGBA').save(os.path.join(out, name + '.png'))
    npath = os.path.join(out, name + '-noite.png')
    if os.path.exists(npath):
        os.remove(npath)
    nt, count = night(px, k)
    if name in NO_NIGHT:
        count = 0
    entry = {'w': int(px.shape[1]), 'h': int(px.shape[0])}
    if count > 0:
        Image.fromarray(nt, 'RGBA').save(os.path.join(out, name + '-noite.png'))
        entry['noite'] = True
    manifest[name] = entry


def seamless(a):
    """Tira a emenda: perto da borda usa a textura deslocada meio quadrado (cujas
    bordas são o miolo contínuo da original); no meio fica a original."""
    n = a.shape[0]
    rolled = np.roll(np.roll(a, n // 2, 0), n // 2, 1)
    t = np.minimum(np.arange(n), n - 1 - np.arange(n)) / (n * 0.22)
    w1 = np.clip(t, 0, 1)
    w = np.minimum(w1[:, None], w1[None, :])[..., None]
    w = w * w * (3 - 2 * w)
    return a * w + rolled * (1 - w)


def tile(path, colors=40, px=None):
    px = px or TILE_PX
    im = Image.open(path).convert('RGB')
    s = min(im.size)
    im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width - s) // 2 + s, (im.height - s) // 2 + s))
    small = np.array(im.resize((px, px), Image.BOX)).astype(float)
    small = seamless(small).clip(0, 255).astype(np.uint8)
    q = np.array(Image.fromarray(small, 'RGB').quantize(colors, method=Image.Quantize.MEDIANCUT).convert('RGB'))
    return np.dstack([q, np.full(q.shape[:2], 255, np.uint8)])


def find(name):
    """Acha <name>.png em qualquer subpasta de public/Novos assets."""
    for root, _, files in os.walk(SRC):
        if name + '.png' in files:
            return os.path.join(root, name + '.png')
    return os.path.join(SRC, name + '.png')


def scaled(size, k):
    return {key: v * k for key, v in size.items()}


def build(out, k):
    """Converte tudo na escala k (1 = normal, 2 = hd) para a pasta out."""
    os.makedirs(out, exist_ok=True)
    manifest = {}
    missing = []
    for src, (name, size) in SINGLE.items():
        path = find(src)
        if not os.path.exists(path):
            missing.append(src); continue
        rgb, alpha = load(path)
        # só o maior pedaço (ignora sujeira solta no fundo)
        boxes, _ = components(alpha, 1)
        save(name, shrink(rgb, alpha, boxes[0] if boxes else bbox(alpha), scaled(size, k), 64 * k), manifest, out, k)
    for src, items in SHEETS.items():
        path = find(src)
        if not os.path.exists(path):
            missing.append(src); continue
        rgb, alpha = load(path)
        boxes = grid_boxes(alpha, *GRID[src]) if src in GRID else components(alpha, len(items))[0]
        if len(boxes) != len(items):
            print(f'{src}: achei {len(boxes)} objetos, esperava {len(items)}')
        for (name, size), box in zip(items, boxes):
            save(name, shrink(rgb, alpha, box, scaled(size, k), 32 * k), manifest, out, k)
    for src, name in TILES.items():
        path = find(src)
        if not os.path.exists(path):
            print('faltando:', src); continue
        px = tile(path, 40 * k, TILE_PX * k)
        Image.fromarray(px, 'RGBA').save(os.path.join(out, name + '.png'))
        manifest[name] = {'w': TILE_PX * k, 'h': TILE_PX * k}
    with open(os.path.join(out, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1, sort_keys=True)
    print(len(manifest), 'sprites em', os.path.relpath(out, ROOT))
    if missing and k == 1:
        print(f'ainda sem imagem do GPT ({len(missing)}):', ', '.join(missing))
    return manifest


def main():
    manifest = build(OUT, 1)
    build(os.path.join(OUT, 'hd'), 2)

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

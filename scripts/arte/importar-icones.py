#!/usr/bin/env python3
"""Ícones do GPT (docs/PROMPTS-GPT.md §G, folhas em grade no fundo magenta) →
public/game/icons/itens/<id>.png (32 × 32). O nome de cada ícone é o id que o
jogo já usa (<Icon id>), então a troca é automática; os novos ficam prontos.

  python3 scripts/arte/importar-icones.py [--folha revisao.png]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/Novos assets/icones'
OUT = ROOT / 'public/game/icons/itens'
PX, INNER = 32, 28

SHEETS = {
    'icones-1': (6, 6, [
        'pao', 'pao-bisnaga', 'pao-redondo', 'pao-forma', 'pao-tranca', 'bolo',
        'omelete', 'salada', 'pipoca', 'peixe-assado', 'vitamina', 'bolo-cenoura',
        'torta-abobora', 'suco', 'rosquinha', 'sorvete', 'pirulito', 'picole',
        'chocolate', 'cupcake', 'colheita_cenoura', 'colheita_alface', 'colheita_morango', 'colheita_tomate',
        'colheita_milho', 'colheita_girassol', 'colheita_abobora', 'ovo', 'leite', 'la',
        'fruta_maca', 'fruta_laranja', 'fruta_pessego', 'fruta_limao', 'semente', 'peixe']),
    'icones-2': (6, 6, [
        'disco', 'disco-ouro', 'quadro', 'modelo-ia', 'sensor', 'irrigador',
        'cubo-virtual', 'tiquete', 'jornal', 'camera', 'microfone', 'controle',
        'pacote', 'drone', 'robo-limpeza', 'grafico', 'cesta-pao', 'regador',
        'enxada', 'vara-pesca', 'tinta', 'inst-teclado', 'inst-violao', 'tambor',
        'inst-flauta', 'inst-xilofone', 'chave-fenda', 'lampada', 'notebook', 'oculos-vr',
        'lupa', 'trofeu', 'medalha', 'estrela', 'coracao', 'cadeado']),
    'icones-3': (6, 6, [
        'pacote-comum', 'pacote-incomum', 'pacote-raro', 'pacote-epico', 'pacote-lendario', 'pacote-mitico',
        'pacote-desconhecido', 'carta-verso', 'carta-brilho', 'po', 'bigorna', 'martelo',
        'bau', 'chave', 'mapa', 'bandeira', 'escudo', 'espadas',
        'coroa', 'sino', 'envelope', 'presente', 'balao', 'aceno',
        'coracao-partido', 'joinha', 'nota', 'raio', 'floco', 'chama',
        'folha', 'gota', 'caveira', 'lua', 'fantasma', 'tornado']),
    'icones-4': (5, 4, [
        'isca', 'fome', 'agua', 'moeda', 'po-comum',
        'po-incomum', 'po-raro', 'po-epico', 'po-lendario', 'po-mitico',
        'po-desconhecido', 'camera-foto', 'microfone-reporter', 'foto', 'robo-gari',
        'bloco-andar', 'bloco-virar', 'bloco-pegar', 'bloco-repetir']),
}


def mask(rgb):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    return ~((r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90))


def icon(rgb, m):
    # fiapos da célula vizinha: fica só o que tem pelo menos 4% do desenho
    lab, n = ndimage.label(m)
    if n > 1:
        size = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, 1 + np.where(size >= size.sum() * 0.04)[0])
    ys, xs = np.where(m)
    if not len(xs):
        return None
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    crop = np.dstack([rgb[y0:y1, x0:x1], np.where(m[y0:y1, x0:x1], 255, 0)]).astype(float)
    crop[..., :3] *= crop[..., 3:4] / 255
    k = INNER / max(x1 - x0, y1 - y0)
    w, h = max(1, round((x1 - x0) * k)), max(1, round((y1 - y0) * k))
    sm = np.array(Image.fromarray(crop.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(float)
    al = sm[..., 3] / 255
    col = np.where(al[..., None] > 0.02, sm[..., :3] / np.maximum(al[..., None], 0.02), 0).clip(0, 255)
    out = np.zeros((PX, PX, 4), np.uint8)
    ox, oy = (PX - w) // 2, (PX - h) // 2
    out[oy:oy + h, ox:ox + w] = np.dstack([col, np.where(al >= 0.45, 255, 0)]).astype(np.uint8)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    done = []
    for sheet, (cols, rows, names) in SHEETS.items():
        f = SRC / f'{sheet}.png'
        if not f.exists():
            print('faltando:', f.name); continue
        rgb = np.array(Image.open(f).convert('RGB'))
        m = mask(rgb)
        # a grade vale para a área desenhada (a folha pode ter margem)
        ys, xs = np.where(m.any(1))[0], np.where(m.any(0))[0]
        X0, X1, Y0, Y1 = xs[0], xs[-1] + 1, ys[0], ys[-1] + 1
        cw, ch = (X1 - X0) / cols, (Y1 - Y0) / rows
        for i, name in enumerate(names):
            r, c = divmod(i, cols)
            a, b = int(Y0 + r * ch), int(Y0 + (r + 1) * ch)
            cl, cr = int(X0 + c * cw), int(X0 + (c + 1) * cw)
            px = icon(rgb[a:b, cl:cr], m[a:b, cl:cr])
            if px is None:
                print(f'{sheet}: célula {i} vazia ({name})'); continue
            Image.fromarray(px, 'RGBA').save(OUT / f'{name}.png')
            done.append((name, px))
    print('ícones:', len(done))
    if '--folha' in sys.argv and done:
        dest = sys.argv[sys.argv.index('--folha') + 1]
        n = 16
        g = Image.new('RGBA', (n * 36, ((len(done) + n - 1) // n) * 36), (60, 50, 70, 255))
        for i, (_, px) in enumerate(done):
            g.alpha_composite(Image.fromarray(px, 'RGBA'), ((i % n) * 36 + 2, (i // n) * 36 + 2))
        g.resize((g.width * 2, g.height * 2), Image.NEAREST).save(dest)
        print('folha:', dest)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Carro e moto dos moradores, em pixel art por código (hd: 2 px por pixel do mundo).

Cada veículo vira uma folha de 4 linhas (frente, esquerda, direita, costas) × 2
colunas: o fundo (tudo, com o vidro) e a frente (o que fica na frente do
motorista: lataria do carro sem o vidro, carenagem da moto). O jogo desenha
fundo → motorista da cintura para cima → frente. O banco (onde fica a cintura e
o meio do motorista) vai no manifest.

  python3 scripts/arte/veiculos.py [--folha revisao.png]

Saída: public/game/sprites/veiculos/<id>.png + manifest.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/game/sprites/veiculos'
OUTL = (14, 12, 20, 255)


def hexa(h, a=255):
    n = int(h[1:], 16)
    return ((n >> 16) & 255, (n >> 8) & 255, n & 255, a)


class Tela:
    """Desenho em camadas com máscara de "frente" (o que tapa o motorista)."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.img = Image.new('RGBA', (w, h))
        self.d = ImageDraw.Draw(self.img)
        self.frente = Image.new('L', (w, h))
        self.df = ImageDraw.Draw(self.frente)

    def poly(self, pts, cor, frente=True):
        self.d.polygon(pts, fill=cor)
        self.df.polygon(pts, fill=255 if frente else 0)

    def rect(self, box, cor, frente=True):
        self.d.rectangle(box, fill=cor)
        self.df.rectangle(box, fill=255 if frente else 0)

    def elli(self, box, cor, frente=True):
        self.d.ellipse(box, fill=cor)
        self.df.ellipse(box, fill=255 if frente else 0)

    def line(self, pts, cor, w=1, frente=True):
        self.d.line(pts, fill=cor, width=w)
        self.df.line(pts, fill=255 if frente else 0, width=w)

    def contorno(self):
        """Contorno escuro de 1 px em volta de tudo (como os bonecos)."""
        a = np.array(self.img)
        op = a[..., 3] > 0
        pad = np.pad(op, 1)
        viz = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]
        borda = viz & ~op
        a[borda] = OUTL
        f = np.array(self.frente)
        # o contorno pertence à frente quando encosta na frente
        fp = np.pad(f > 0, 1)
        fviz = fp[:-2, 1:-1] | fp[2:, 1:-1] | fp[1:-1, :-2] | fp[1:-1, 2:]
        f[borda & fviz] = 255
        self.img = Image.fromarray(a, 'RGBA')
        self.frente = Image.fromarray(f, 'L')

    def camadas(self):
        a = np.array(self.img)
        f = np.array(self.frente) > 0
        front = a.copy()
        front[~f] = 0
        return a, front


# ---------------------------------------------------------------- carro (hatch pequeno, tipo March)

def carro(cor):
    body = [hexa(c) for c in cor['lataria']]   # escuro, meio, claro, brilho
    vidro, vidro_c, vidro_e = hexa('#55728c'), hexa('#9cc0d8'), hexa('#3a4e64')
    pneu, aro = hexa('#15151b'), hexa('#8a909c')
    plast = hexa('#121318')
    farol, farol_e = hexa('#fff4c4'), hexa('#d8c88a')
    lanterna, lanterna_c = hexa('#c8282e'), hexa('#ff7070')
    placa = hexa('#e8ecf2')
    out = {}

    # --- de frente (para baixo na tela)
    t = Tela(80, 76)
    t.rect((8, 62, 18, 74), pneu)
    t.rect((61, 62, 71, 74), pneu)
    t.poly([(4, 40), (75, 40), (76, 66), (3, 66)], body[1])           # lataria
    t.poly([(6, 38), (73, 38), (75, 46), (4, 46)], body[2])           # capô
    t.line([(10, 40), (69, 40)], body[3])
    t.poly([(15, 38), (64, 38), (57, 12), (22, 12)], vidro, frente=False)  # para-brisa
    t.poly([(17, 36), (24, 36), (30, 14), (26, 14)], vidro_c, frente=False)
    t.line([(15, 38), (64, 38)], vidro_e, frente=False)
    t.poly([(22, 12), (57, 12), (54, 6), (25, 6)], body[2])            # teto
    t.line([(27, 8), (52, 8)], body[3])
    t.line([(15, 38), (22, 12)], body[1], 2)                            # colunas
    t.line([(64, 38), (57, 12)], body[1], 2)
    t.rect((0, 32, 5, 37), body[1])                                     # retrovisores
    t.rect((74, 32, 79, 37), body[1])
    t.elli((7, 45, 22, 56), farol_e)                                    # faróis redondos
    t.elli((8, 46, 20, 54), farol)
    t.elli((57, 45, 72, 56), farol_e)
    t.elli((59, 46, 71, 54), farol)
    t.rect((28, 52, 51, 57), plast)                                     # grade
    t.rect((38, 53, 41, 56), aro)
    t.rect((6, 60, 73, 67), plast)                                      # para-choque
    t.rect((31, 61, 48, 65), placa)
    t.contorno()
    out['south'] = (t, {'cx': 47, 'cintura': 64})   # motorista do lado esquerdo do carro (direita da tela)

    # --- de costas
    t = Tela(80, 76)
    t.rect((8, 62, 18, 74), pneu)
    t.rect((61, 62, 71, 74), pneu)
    t.poly([(4, 36), (75, 36), (76, 66), (3, 66)], body[1])
    t.poly([(16, 36), (63, 36), (57, 12), (22, 12)], vidro, frente=False)   # vidro de trás
    t.poly([(54, 34), (60, 34), (55, 14), (52, 14)], vidro_c, frente=False)
    t.poly([(22, 12), (57, 12), (54, 6), (25, 6)], body[2])
    t.line([(16, 36), (22, 12)], body[1], 2)
    t.line([(63, 36), (57, 12)], body[1], 2)
    t.rect((5, 40, 15, 50), lanterna)
    t.rect((7, 41, 12, 44), lanterna_c)
    t.rect((64, 40, 74, 50), lanterna)
    t.rect((67, 41, 72, 44), lanterna_c)
    t.line([(8, 38), (71, 38)], body[2])
    t.rect((6, 58, 73, 66), plast)
    t.rect((31, 52, 48, 56), placa)
    t.contorno()
    out['north'] = (t, {'cx': 33, 'cintura': 62})

    # --- de lado, olhando para a direita: hatch curtinho e redondo
    t = Tela(100, 70)
    t.elli((12, 4, 84, 56), body[2])                                    # cabine redonda
    t.elli((19, 10, 76, 52), vidro, frente=False)                       # janelas
    t.poly([(60, 14), (64, 14), (58, 32), (55, 32)], vidro_c, frente=False)
    t.line([(47, 8), (47, 36)], body[1], 3)                             # coluna do meio
    t.line([(30, 6), (66, 6)], body[3])
    t.rect((4, 34, 94, 58), body[1])                                    # lataria
    t.elli((84, 30, 99, 58), body[1])                                   # frente arredondada
    t.elli((0, 30, 12, 58), body[1])                                    # traseira
    t.line([(6, 36), (92, 36)], body[2])
    t.line([(4, 46), (96, 46)], body[0])                                # vinco
    t.rect((88, 38, 97, 44), farol)
    t.rect((1, 38, 5, 44), lanterna)
    t.rect((74, 32, 78, 36), body[1])                                   # retrovisor
    t.elli((12, 46, 32, 66), pneu)
    t.elli((18, 52, 26, 60), aro)
    t.elli((66, 46, 86, 66), pneu)
    t.elli((72, 52, 80, 60), aro)
    t.contorno()
    out['east'] = (t, {'cx': 58, 'cintura': 52})
    return out


# ---------------------------------------------------------------- moto

def moto(cor):
    a, b = hexa(cor['a']), hexa(cor['b'])       # cor principal e segunda cor (faixa)
    a_e = hexa(cor['a_escuro'])
    pneu, aro, metal = hexa('#15151b'), hexa('#9aa0aa'), hexa('#c8ccd4')
    banco = hexa('#1c1c24')
    farol, lanterna = hexa('#fff4c4'), hexa('#e0343a')
    out = {}

    # --- de lado, para a direita
    t = Tela(80, 54)
    t.elli((2, 32, 24, 53), pneu, frente=False)
    t.elli((9, 39, 17, 46), aro, frente=False)
    t.elli((54, 32, 76, 53), pneu, frente=False)
    t.elli((61, 39, 69, 46), aro, frente=False)
    t.line([(13, 42), (34, 36)], metal, 2, frente=False)                 # balança
    t.rect((30, 30, 48, 42), hexa('#4a4e5a'), frente=False)              # motor
    t.line([(32, 44), (8, 40)], metal, 2, frente=False)                  # escapamento
    t.line([(65, 42), (58, 14)], metal, 3, frente=False)                 # garfo
    t.poly([(8, 22), (24, 22), (24, 29), (6, 28)], a_e, frente=False)    # rabeta
    t.rect((6, 23, 9, 26), lanterna, frente=False)
    t.poly([(20, 20), (42, 20), (42, 27), (20, 27)], banco, frente=False)
    t.poly([(40, 16), (58, 16), (61, 30), (38, 30)], a)                  # tanque
    t.line([(41, 22), (59, 22)], b, 3)
    t.rect((61, 16, 67, 23), farol)
    t.line([(55, 12), (62, 12)], banco, 3)                               # guidão
    t.contorno()
    out['east'] = (t, {'cx': 31, 'cintura': 24})

    # --- de frente
    t = Tela(44, 56)
    t.elli((16, 36, 27, 55), pneu)
    t.line([(21, 20), (21, 38)], metal, 2)
    t.poly([(10, 18), (33, 18), (30, 36), (13, 36)], a)                  # carenagem
    t.poly([(19, 18), (24, 18), (24, 36), (19, 36)], b)                  # faixa branca
    t.elli((15, 21, 28, 32), farol)
    t.line([(3, 16), (40, 16)], banco, 3)                                # guidão
    t.rect((5, 11, 7, 15), metal)
    t.rect((36, 11, 38, 15), metal)
    t.contorno()
    out['south'] = (t, {'cx': 22, 'cintura': 30})

    # --- de costas
    t = Tela(44, 56)
    t.elli((16, 36, 27, 55), pneu)
    t.poly([(12, 24), (31, 24), (28, 40), (15, 40)], a_e)                # rabeta
    t.poly([(19, 24), (24, 24), (24, 40), (19, 40)], b)
    t.rect((16, 31, 27, 35), lanterna)
    t.line([(3, 16), (40, 16)], banco, 3, frente=False)
    t.contorno()
    out['north'] = (t, {'cx': 22, 'cintura': 28})
    return out


VEICULOS = {
    'carro-march-preto': (carro, {'lataria': ['#101117', '#22242e', '#3a3e4c', '#7c8498']}),
    'moto-vermelha': (moto, {'a': '#d8283a', 'a_escuro': '#8e1424', 'b': '#f6f8fc'}),
    'moto-preta': (moto, {'a': '#2a2c36', 'a_escuro': '#15161c', 'b': '#c8a040'}),
    'moto-azul': (moto, {'a': '#2c58c0', 'a_escuro': '#18306c', 'b': '#f6f8fc'}),
}
ROWS = ['south', 'west', 'east', 'north']


def montar(fn, cor):
    vistas = fn(cor)
    t_e, m_e = vistas['east']
    # esquerda = direita espelhada
    a, f = t_e.camadas()
    west = (a[:, ::-1].copy(), f[:, ::-1].copy(), {'cx': t_e.w - 1 - m_e['cx'], 'cintura': m_e['cintura']})
    cam = {'south': (*vistas['south'][0].camadas(), vistas['south'][1]),
           'north': (*vistas['north'][0].camadas(), vistas['north'][1]),
           'east': (a, f, m_e), 'west': west}
    cw = max(v[0].shape[1] for v in cam.values())
    ch = max(v[0].shape[0] for v in cam.values())
    sheet = np.zeros((ch * 4, cw * 2, 4), np.uint8)
    meta = {}
    for r, d in enumerate(ROWS):
        base, front, m = cam[d]
        h, w = base.shape[:2]
        ox, oy = (cw - w) // 2, ch - h       # centrado, encostado embaixo (o chão)
        sheet[r * ch + oy:r * ch + oy + h, ox:ox + w] = base
        sheet[r * ch + oy:r * ch + oy + h, cw + ox:cw + ox + w] = front
        meta[d] = {'cx': ox + m['cx'], 'cintura': oy + m['cintura']}
    return sheet, {'cell': [cw, ch], **meta}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    sheets = []
    for vid, (fn, cor) in VEICULOS.items():
        sheet, meta = montar(fn, cor)
        Image.fromarray(sheet, 'RGBA').save(OUT / f'{vid}.png')
        manifest[vid] = meta
        sheets.append(sheet)
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=1))
    print(len(manifest), 'veículos')
    if '--folha' in sys.argv:
        dest = sys.argv[sys.argv.index('--folha') + 1]
        Z = 3
        H = sum(s.shape[0] for s in sheets) * Z
        Wd = max(s.shape[1] for s in sheets) * Z
        img = Image.new('RGBA', (Wd, H), (150, 200, 130, 255))
        y = 0
        for s in sheets:
            im = Image.fromarray(s, 'RGBA').resize((s.shape[1] * Z, s.shape[0] * Z), Image.NEAREST)
            img.alpha_composite(im, (0, y))
            y += s.shape[0] * Z
        img.save(dest)
        print('folha:', dest)


if __name__ == '__main__':
    main()

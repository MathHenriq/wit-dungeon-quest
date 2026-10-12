#!/usr/bin/env python3
"""Pacotinhos do GPT: public/Novos assets/pacotes/ -> public/game/packs/<id>.png.

Aceita os arquivos soltos (comum.png, incomum.png, ...) ou uma folha só
(folha.png, os 7 lado a lado na ordem de IDS). Tira o fundo magenta (com a
borda rosada), corta no pacote, encaixa em 5:7 centrado e salva com 300 px de
altura (o jogo amplia nítido). O selo de cima tem de ficar no 1/7 de cima: é a
tira que sai voando ao abrir (PACK_TEAR/PACK_H em src/game/world/packs-art.ts).
Prompts: docs/PROMPTS-GPT.md §J. Revise a folha antes de subir as imagens.

    python3 scripts/arte/importar-pacotes.py [--folha revisao.png] [ids...]
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path('public/Novos assets/pacotes')
OUT = Path('public/game/packs')
IDS = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'mitico', 'desconhecido']
H = 300
W = round(H * 5 / 7)


def sem_magenta(im: Image.Image) -> Image.Image:
    a = np.array(im.convert('RGBA')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # magenta e quase-magenta (borda misturada): r e b altos, g baixo
    fundo = (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)
    a[..., 3][fundo] = 0
    # pixels da borda puxados para o rosa: tira o tom do magenta
    viz = np.zeros_like(fundo)
    viz[1:, :] |= fundo[:-1, :]; viz[:-1, :] |= fundo[1:, :]; viz[:, 1:] |= fundo[:, :-1]; viz[:, :-1] |= fundo[:, 1:]
    borda = viz & ~fundo & (r > g + 40) & (b > g + 40)
    a[..., 0][borda] = a[..., 1][borda] + (a[..., 0][borda] - a[..., 1][borda]) // 3
    a[..., 2][borda] = a[..., 1][borda] + (a[..., 2][borda] - a[..., 1][borda]) // 3
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def pecas_da_folha(im: Image.Image) -> list[Image.Image]:
    """Separa os pacotes da folha pelas colunas vazias (transparentes)."""
    a = np.array(im)[..., 3] > 0
    cols = a.any(axis=0)
    pecas, x = [], 0
    while x < len(cols):
        if not cols[x]:
            x += 1
            continue
        x0 = x
        while x < len(cols) and cols[x]:
            x += 1
        if x - x0 > im.width * 0.03:  # ignora fiapos
            pecas.append(im.crop((x0, 0, x, im.height)))
    return pecas


def encaixa(im: Image.Image) -> Image.Image:
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    k = min(W / im.width, H / im.height)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.NEAREST if k >= 1 else Image.LANCZOS)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.alpha_composite(im, ((W - im.width) // 2, H - im.height))
    return out


def main() -> None:
    args = sys.argv[1:]
    folha_rev = None
    if '--folha' in args:
        i = args.index('--folha'); folha_rev = args[i + 1]; args = args[:i] + args[i + 2:]
    ids = args or IDS
    OUT.mkdir(parents=True, exist_ok=True)
    feitos: list[tuple[str, Image.Image]] = []
    folha = SRC / 'folha.png'
    if folha.exists():
        pecas = pecas_da_folha(sem_magenta(Image.open(folha)))
        print(f'folha.png: {len(pecas)} pacotes encontrados (esperado {len(IDS)})')
        for pid, p in zip(IDS, pecas):
            if pid in ids:
                feitos.append((pid, encaixa(p)))
    for pid in ids:
        f = SRC / f'{pid}.png'
        if f.exists():  # arquivo solto tem prioridade sobre a folha
            feitos = [x for x in feitos if x[0] != pid] + [(pid, encaixa(sem_magenta(Image.open(f))))]
    for pid, im in feitos:
        im.save(OUT / f'{pid}.png')
        print(f'{pid}: -> {OUT / (pid + ".png")}')
    if folha_rev and feitos:
        rev = Image.new('RGBA', (len(feitos) * (W + 20) + 20, H + 40), (40, 30, 52, 255))
        for k, (_, im) in enumerate(feitos):
            x = 20 + k * (W + 20)
            rev.alpha_composite(im, (x, 20))
            # linha do selo (1/7 de cima): o que fica acima dela sai voando ao abrir
            for xx in range(x, x + W, 4):
                rev.putpixel((xx, 20 + H // 7), (255, 216, 74, 255))
        rev.save(folha_rev)
        print(f'folha de revisão: {folha_rev}')
    if not feitos:
        print(f'nada em {SRC} (salve os pacotes lá: veja docs/PROMPTS-GPT.md §J)')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Tapetes do duelo: public/Novos assets/tapetes/<id>.png -> public/game/tapetes/<id>.webp.

Corta para 5:2 (a faixa que a mesa mostra) a partir do meio, reduz para
1600 px de largura e salva em webp. Depois tire o `emBreve` do tapete em
src/game/playmats.ts.   python3 scripts/arte/importar-tapetes.py [ids...]
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path('public/Novos assets/tapetes')
OUT = Path('public/game/tapetes')
W, RATIO = 1600, 5 / 2

def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ids = sys.argv[1:] or [p.stem for p in sorted(SRC.glob('*.png'))]
    for i in ids:
        im = Image.open(SRC / f'{i}.png').convert('RGB')
        w, h = im.size
        ch = min(h, round(w / RATIO))
        top = (h - ch) // 2
        im = im.crop((0, top, w, top + ch)).resize((W, round(W / RATIO)), Image.LANCZOS)
        im.save(OUT / f'{i}.webp', 'WEBP', quality=82, method=6)
        print(f'{i}: {w}x{h} -> {OUT / (i + ".webp")}')

if __name__ == '__main__':
    main()

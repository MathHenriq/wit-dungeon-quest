#!/usr/bin/env python3
"""Empacota as ilustrações das cartas (public/cards/art/*.webp) em poucas
folhas, para a demo empacotada (o link tem limite de arquivos). O jogo
normal continua usando um arquivo por carta.

  python3 scripts/arte/atlas-cartas.py <pasta-de-saída>   → folha-N.webp + index.json
"""
import json, os, sys
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'cards', 'art')
W, H, COLS, ROWS = 384, 264, 8, 8

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
ids = sorted(f[:-5] for f in os.listdir(SRC) if f.endswith('.webp'))
per = COLS * ROWS
index = {'cols': COLS, 'rows': ROWS, 'w': W, 'h': H, 'cards': {}}
for s in range(0, len(ids), per):
    sheet = Image.new('RGB', (COLS * W, ROWS * H), (20, 16, 28))
    for i, cid in enumerate(ids[s:s + per]):
        im = Image.open(os.path.join(SRC, cid + '.webp')).convert('RGB').resize((W, H), Image.LANCZOS)
        sheet.paste(im, ((i % COLS) * W, (i // COLS) * H))
        index['cards'][cid] = [s // per, i]
    sheet.save(os.path.join(out, f'folha-{s // per}.webp'), quality=80, method=6)
with open(os.path.join(out, 'index.json'), 'w') as f:
    json.dump(index, f)
print(len(ids), 'ilustrações em', (len(ids) + per - 1) // per, 'folhas:', out)

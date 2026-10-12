#!/usr/bin/env python3
"""Converte os personagens prontos (NPCs desafiantes) e os pets do GPT
(folhas 4 × 4 no fundo magenta, cores reais) para o jogo, em hd:

  public/game/sprites/npcs/<id>.png    quadros de 64 × 80 (como os modelos)
  public/game/sprites/bichos/<id>.png  quadros de 48 × 48

Linhas: frente, esquerda, direita, costas; colunas: parado, pé esquerdo,
parado, pé direito. Os pés ficam numa linha fixa e o corpo no centro do
quadro, com uma escala só por tipo (o GPT desenha as folhas do mesmo tamanho).

  python3 scripts/arte/importar-sprites.py [--folha revisao.png]
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('ip', ROOT / 'scripts/arte/importar-personagem.py')
ip = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ip)

KINDS = {
    # pasta de origem, padrão do nome, destino, quadro (w, h), linha dos pés, escala (px da folha por px hd)
    'npcs': (ROOT / 'public/Novos assets/personagem/prontos', 'npc-*.png', ROOT / 'public/game/sprites/npcs', (64, 80), 76, 3.75),
    'bichos': (ROOT / 'public/Novos assets/pets', 'pet-*.png', ROOT / 'public/game/sprites/bichos', (48, 48), 46, 5.2),
}
# parecido demais com personagem conhecido: não entra no jogo (ver docs/fila-imagens.md)
SKIP = {'pet-dragaozinho-brasa'}


def cell(frame, W, H, foot, scale):
    a = frame[..., 3] > 127
    ys, xs = np.where(a)
    feet = ys.max() + 1
    cx = xs.mean()
    # recorte da folha grande que vira o quadro inteiro
    x0, y0 = cx - W / 2 * scale, feet - foot * scale
    x1, y1 = x0 + W * scale, y0 + H * scale
    src = Image.fromarray(frame, 'RGBA')
    pad = int(max(W, H) * scale)
    big = Image.new('RGBA', (src.width + 2 * pad, src.height + 2 * pad))
    big.paste(src, (pad, pad))
    pre = np.array(big).astype(float)
    pre[..., :3] *= pre[..., 3:4] / 255
    crop = Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((W, H), Image.BOX, box=(x0 + pad, y0 + pad, x1 + pad, y1 + pad))
    c = np.array(crop).astype(float)
    al = c[..., 3] / 255
    col = np.where(al[..., None] > 0.02, c[..., :3] / np.maximum(al[..., None], 0.02), 0).clip(0, 255)
    return np.dstack([col, np.where(al >= 0.45, 255, 0)]).astype(np.uint8)


def main():
    review = []
    for kind, (src, pat, out, (W, H), foot, scale) in KINDS.items():
        out.mkdir(parents=True, exist_ok=True)
        names = []
        for f in sorted(src.glob(pat)):
            if f.stem in SKIP:
                continue
            fr = ip.frames(f)
            sheet = np.zeros((H * 4, W * 4, 4), np.uint8)
            for k, x in enumerate(fr):
                r, c = divmod(k, 4)
                sheet[r * H:(r + 1) * H, c * W:(c + 1) * W] = cell(x, W, H, foot, scale)
            # paleta enxuta (pixel art) sem mexer no alfa
            q = np.array(Image.fromarray(sheet[..., :3], 'RGB').quantize(56, method=Image.Quantize.MEDIANCUT).convert('RGB'))
            sheet[..., :3] = np.where(sheet[..., 3:4] > 0, q, 0)
            Image.fromarray(sheet, 'RGBA').save(out / f.name)
            names.append(f.stem)
            review.append(sheet)
        (out / 'manifest.json').write_text(json.dumps({'cell': [W, H], 'foot': foot, 'sprites': names}, indent=1))
        print(kind, len(names))
    if '--folha' in sys.argv:
        dest = sys.argv[sys.argv.index('--folha') + 1]
        # primeira linha (frente) de cada folha, lado a lado
        strips = [s[:s.shape[0] // 4] for s in review]
        H = max(s.shape[0] for s in strips)
        strips = [np.pad(s, ((H - s.shape[0], 0), (0, 4), (0, 0))) for s in strips]
        rows = [np.concatenate(strips[i:i + 6], 1) for i in range(0, len(strips), 6)]
        Wm = max(r.shape[1] for r in rows)
        big = np.concatenate([np.pad(r, ((0, 0), (0, Wm - r.shape[1]), (0, 0))) for r in rows], 0)
        bg = np.zeros_like(big); bg[...] = [150, 200, 130, 255]
        a = big[..., 3:4] / 255
        comp = (big[..., :3] * a + bg[..., :3] * (1 - a)).astype(np.uint8)
        Image.fromarray(comp).resize((comp.shape[1] * 2, comp.shape[0] * 2), Image.NEAREST).save(dest)
        print('folha:', dest)


if __name__ == '__main__':
    main()

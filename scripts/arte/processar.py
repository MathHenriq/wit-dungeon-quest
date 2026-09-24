"""
Converte as artes brutas (arte/bruto) nas versões finais usadas pelo jogo e
monta folhas de contato para revisão.

    python3 scripts/arte/processar.py                # public/cards/art/*.webp
    python3 scripts/arte/processar.py --folha        # + arte/folha-*.jpg para revisar

Tamanhos finais (suficientes para a carta em tela retina, ~60-110 KB cada):
  paisagem (moldura, até Épica): 768 x 528
  retrato (full art, Lendária+):  640 x 936
"""

import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BRUTO = Path("arte/bruto")
FINAL = Path("public/cards/art")
PAISAGEM = (768, 528)
RETRATO = (640, 936)


def cobrir(img: Image.Image, alvo: tuple[int, int]) -> Image.Image:
    """Redimensiona cobrindo o alvo e corta o excesso, puxando o corte para cima
    (rostos costumam ficar no terço superior)."""
    w, h = img.size
    escala = max(alvo[0] / w, alvo[1] / h)
    img = img.resize((math.ceil(w * escala), math.ceil(h * escala)), Image.LANCZOS)
    w, h = img.size
    x = (w - alvo[0]) // 2
    y = int((h - alvo[1]) * 0.3)
    return img.crop((x, y, x + alvo[0], y + alvo[1]))


def processar() -> list[Path]:
    FINAL.mkdir(parents=True, exist_ok=True)
    feitos = []
    for src in sorted(BRUTO.glob("*.webp")):
        img = Image.open(src).convert("RGB")
        alvo = RETRATO if img.height > img.width else PAISAGEM
        out = FINAL / src.name
        cobrir(img, alvo).save(out, "WEBP", quality=82, method=6)
        feitos.append(out)
    return feitos


def folha(arquivos: list[Path], nomes: dict[str, str]) -> None:
    """Grade com nome de cada carta, uma folha por formato."""
    try:
        fonte = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    except OSError:
        fonte = ImageFont.load_default()
    for formato, tam, colunas in (("paisagem", (384, 264), 4), ("retrato", (256, 374), 5)):
        imgs = [p for p in arquivos if (Image.open(p).height > Image.open(p).width) == (formato == "retrato")]
        if not imgs:
            continue
        for pagina in range(0, len(imgs), colunas * 5):
            lote = imgs[pagina:pagina + colunas * 5]
            linhas = math.ceil(len(lote) / colunas)
            cel = (tam[0], tam[1] + 34)
            sheet = Image.new("RGB", (cel[0] * colunas, cel[1] * linhas), (18, 18, 24))
            d = ImageDraw.Draw(sheet)
            for i, p in enumerate(lote):
                x, y = (i % colunas) * cel[0], (i // colunas) * cel[1]
                sheet.paste(Image.open(p).convert("RGB").resize(tam), (x, y))
                d.text((x + 8, y + tam[1] + 5), nomes.get(p.stem, p.stem)[:28], fill=(235, 235, 240), font=fonte)
            n = pagina // (colunas * 5) + 1
            destino = Path(f"arte/folha-{formato}-{n}.jpg")
            sheet.save(destino, "JPEG", quality=85)
            print(destino)


if __name__ == "__main__":
    arquivos = processar()
    total = sum(p.stat().st_size for p in arquivos)
    print(f"{len(arquivos)} artes em {FINAL} ({total / 1e6:.1f} MB)")
    if "--folha" in sys.argv:
        nomes_path = Path("arte/nomes.json")
        nomes = json.loads(nomes_path.read_text()) if nomes_path.exists() else {}
        folha(arquivos, nomes)

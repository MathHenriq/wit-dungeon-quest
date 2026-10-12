#!/usr/bin/env python3
"""Ícones dos itens (no lugar dos emojis), de pacotes pixel art CC0 do OpenGameArt.

  python3 scripts/arte/icones.py <pasta-dos-pacotes>

A pasta precisa ter (baixe e descompacte):
  rpg/        https://opengameart.org/content/496-pixel-art-icons-for-medievalfantasy-rpg  (7Soul, CC0)
  soul/32x32/ https://opengameart.org/sites/default/files/food-7soul1_20201212.zip         (7Soul, CC0)
  food-bluecarrot16_0.png  https://opengameart.org/content/cc0-food-icons                 (bluecarrot16, CC0)
  food-thekingphoenix.png  idem                                                            (thekingphoenix, CC0)
  food/Food Pixel Art/Food Pixel Art.png  https://opengameart.org/content/food-pixel-art-45-icons (CC0)

Saída: public/game/icons/itens/<id>.png (32×32, fundo transparente).
Quando o GPT fizer os ícones do jogo, eles entram no lugar com o mesmo nome.
"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'game', 'icons', 'itens')
os.makedirs(OUT, exist_ok=True)

def cell(sheet, r, c, size=32):
    im = Image.open(os.path.join(SRC, sheet)).convert('RGBA')
    return im.crop((c * size, r * size, c * size + size, r * size + size))

def blob(sheet, k):
    """k-ésimo objeto da folha (ordem de leitura) numa folha sem grade."""
    im = Image.open(os.path.join(SRC, sheet)).convert('RGBA')
    a = np.array(im)[:, :, 3] > 0
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=1))
    boxes = ndimage.find_objects(lab)
    boxes = sorted(boxes, key=lambda b: (round(b[0].start / 20), b[1].start))
    b = boxes[k]
    return im.crop((b[1].start, b[0].start, b[1].stop, b[0].stop))

def file(path):
    return Image.open(os.path.join(SRC, path)).convert('RGBA')

def hue(im, rgb):
    """Pinta mantendo a luz (disco de ouro a partir do disco)."""
    a = np.array(im).astype(float)
    l = a[:, :, :3].mean(axis=2, keepdims=True) / 255
    a[:, :, :3] = np.clip(l * np.array(rgb) * 1.25, 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

BC, TK, F45 = 'food-bluecarrot16_0.png', 'food-thekingphoenix.png', 'food/Food Pixel Art/Food Pixel Art.png'
ICONS = {
    # interface
    'moeda': file('rpg/I_GoldCoin.png'),
    'fome': blob(F45, 9),
    'agua': file('rpg/I_Water.png'),
    'pacote': file('rpg/I_Chest01.png'),
    'jornal': file('rpg/I_Scroll.png'),
    'relogio': file('rpg/I_Clock.png'),
    'chave': file('rpg/I_Key03.png'),
    'bomba': file('rpg/I_IronBall.png'),
    'bug': file('rpg/I_ScorpionClaw.png'),
    # minijogos: legumes, objetos, joias
    'rabanete': file('soul/32x32/radish.png'), 'pimentao': file('soul/32x32/pepper_green.png'),
    'pimenta': file('soul/32x32/pepper_red.png'), 'cogumelo': file('soul/32x32/mushroom.png'),
    'banana': file('soul/32x32/banana.png'), 'uva': file('soul/32x32/grapes_purple.png'),
    'pera': file('soul/32x32/pear.png'), 'abacaxi': file('soul/32x32/pineapple.png'),
    'cereja': file('soul/32x32/cherry.png'), 'melancia': file('soul/32x32/watermelon.png'),
    'livro': file('rpg/I_Book.png'), 'tocha': file('rpg/I_Torch01.png'), 'espelho': file('rpg/I_Mirror.png'),
    'luneta': file('rpg/I_Telescope.png'), 'bau': file('rpg/I_Chest02.png'), 'pena': file('rpg/I_Feather01.png'),
    'mapa': file('rpg/I_Map.png'), 'tinta': file('rpg/I_Ink.png'),
    'rubi': file('rpg/I_Ruby.png'), 'safira': file('rpg/I_Sapphire.png'), 'jade': file('rpg/I_Jade.png'),
    'ametista': file('rpg/I_Amethist.png'), 'diamante': file('rpg/I_Diamond.png'), 'opala': file('rpg/I_Opal.png'),
    'ouro': file('rpg/I_GoldBar.png'), 'cristal': file('rpg/I_Crystal03.png'),
    # comida
    'pao': file('soul/32x32/bread.png'),
    'pao-bisnaga': cell(BC, 0, 1), 'pao-redondo': cell(BC, 0, 3), 'pao-forma': cell(BC, 0, 2), 'pao-tranca': cell(BC, 1, 0),
    'farinha': file('rpg/I_Fabric.png'), 'fermento': file('rpg/I_Bottle04.png'), 'tigela': file('rpg/I_SolidShell.png'),
    'bolo': cell(BC, 1, 2),
    'omelete': cell(BC, 2, 0),
    'salada': cell(BC, 10, 2),
    'pipoca': blob(F45, 24),
    'peixe-assado': file('soul/32x32/fish_cooked.png'),
    'vitamina': file('rpg/I_Bottle03.png'),
    'bolo-cenoura': cell(TK, 4, 0),
    'torta-abobora': file('soul/32x32/pie.png'),
    'suco': file('rpg/I_Bottle01.png'),
    # doces da Dona Ana (Oficina de Cartas)
    'rosquinha': cell(TK, 4, 1), 'sorvete': cell(TK, 4, 2), 'pirulito': cell(TK, 4, 3), 'picole': cell(TK, 4, 4),
    'chocolate': cell(TK, 3, 4), 'cupcake': cell(TK, 4, 0),
    # colheita
    'colheita:cenoura': cell(TK, 1, 2),
    'colheita:alface': cell(BC, 11, 1),
    'colheita:morango': file('soul/32x32/strawberry.png'),
    'colheita:tomate': cell(BC, 5, 4),
    'colheita:milho': blob(F45, 24),
    'colheita:girassol': file('rpg/I_Clover.png'),
    'colheita:abobora': blob(F45, 20),
    'semente': file('soul/32x32/nut.png'),
    # fazenda
    'ovo': cell(BC, 1, 8),
    'leite': cell(TK, 1, 4),
    'la': file('rpg/I_Fabric.png'),
    'fruta:maca': cell(TK, 0, 0),
    'fruta:laranja': cell(TK, 0, 4),
    'fruta:pessego': cell(BC, 4, 2),
    'fruta:limao': file('soul/32x32/lemon.png'),
    # peixe (genérico; cada espécie tem o seu desenho)
    'peixe': file('soul/32x32/fish_raw.png'),
    # o que as profissões fazem (provisórios até o GPT)
    'disco': file('rpg/I_Opal.png'),
    'disco-ouro': hue(file('rpg/I_Opal.png'), (255, 200, 60)),
    'quadro': file('rpg/I_Map.png'),
    'modelo-ia': file('rpg/I_Book.png'),
    'sensor': file('rpg/I_Crystal01.png'),
    'irrigador': file('rpg/I_Water.png'),
    'cubo-virtual': file('rpg/I_Diamond.png'),
    'tiquete': file('rpg/I_Scroll02.png'),
}

for name, im in ICONS.items():
    bb = im.getbbox()
    im = im.crop(bb) if bb else im
    s = 32 / max(im.size)
    if s < 1: im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.NEAREST)
    elif max(im.size) <= 17: im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)   # ícones de 16 px: dobra
    out = Image.new('RGBA', (32, 32))
    out.paste(im, ((32 - im.width) // 2, (32 - im.height) // 2), im)
    out.save(os.path.join(OUT, name.replace(':', '_') + '.png'))
print(len(ICONS), 'ícones em', os.path.normpath(OUT))

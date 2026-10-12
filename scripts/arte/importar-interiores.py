#!/usr/bin/env python3
"""Converte as folhas dos interiores (public/Novos assets/interiores, fundo
magenta) em sprites do jogo: public/game/interior/<id>.png (em hd, 2 pixels
por pixel do mundo) + manifest.json com tamanho, camada, nome e categoria.

  python3 scripts/arte/importar-interiores.py [--folha revisao.png]

Cada folha tem uma escala só (o GPT desenha os objetos da folha na mesma
escala): um objeto de referência ganha a largura dada em pixels do mundo e os
outros acompanham. Pisos viram quadrados que se repetem sem emenda; paredes,
faixas que se repetem na horizontal.

Móveis de tecido (sofás, camas, poltronas, tapetes) vêm pintados em
cores-molde (ciano = cor principal, verde = detalhe). Aqui cada pixel ciano
vira um dos 4 tons de MOLDE.hair e cada verde, um dos 4 de MOLDE.top
(src/game/world/outfit.ts); o jogo troca esses tons pela cor escolhida.
"""
import importlib.util
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SRC = os.path.join(ROOT, 'public', 'Novos assets', 'interiores')
OUT = os.path.join(ROOT, 'public', 'game', 'interior')
K = 2  # hd

spec = importlib.util.spec_from_file_location('imp', os.path.join(os.path.dirname(__file__), 'importar-gpt.py'))
imp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(imp)

# Tons-molde: iguais a MOLDE.hair e MOLDE.top de outfit.ts.
MOLDE_MAIN = ['#0e5a66', '#1a8a9a', '#24b4c8', '#7ae0ee']
MOLDE_DETAIL = ['#1c6a28', '#2c9038', '#3cb44a', '#86dc8e']

# Camadas: m = móvel (ocupa o chão), t = tapete (por baixo, não bloqueia),
# p = parede (pendurado na parede). "pe" = pegada em blocos (largura x fundo);
# sem ela, sai do tamanho. ".lado" = o mesmo móvel virado para a direita.
# Cada item: 'id|Nome|camada|pe'  (camada e pe opcionais).
SHEETS = {
    # ── Torre ──
    'torre-mesas': dict(cat='torre', ref=(0, 46), items=[
        'mesa-duelo-verde|Mesa de duelo verde||3x2', 'mesa-duelo-vermelha|Mesa de duelo vermelha||3x2',
        'mesa-duelo-azul|Mesa de duelo azul||3x2', 'mesa-duelo-roxa|Mesa de duelo roxa||3x2',
        'banco-duelo|Banquinho', 'banco-duelo.costas|Banquinho (costas)', 'suporte-deck|Suporte do deck',
        'marca-chao|Marca no chão|t']),
    'torre-mesas-elementos-1': dict(cat='torre', ref=(0, 48), items=[
        'mesa-fogo|Mesa do Fogo||3x2', 'mesa-agua|Mesa da Água||3x2', 'mesa-eletrico|Mesa Elétrica||3x2',
        'mesa-planta|Mesa da Planta||3x2', 'mesa-gelo|Mesa do Gelo||3x2', 'mesa-terra|Mesa da Terra||3x2']),
    'torre-mesas-elementos-2': dict(cat='torre', ref=(0, 48), items=[
        'mesa-luta|Mesa da Luta||3x2', 'mesa-metal|Mesa do Metal||3x2', 'mesa-veneno|Mesa do Veneno||3x2',
        'mesa-sombrio|Mesa Sombria||3x2', 'mesa-fantasma|Mesa Fantasma||3x2', 'mesa-voador|Mesa do Voo||3x2']),
    'torre-chefe': dict(cat='torre', ref=(1, 56), items=[
        'palco-duelo|Palco de duelo||5x4', 'mesa-chefe|Mesa do chefe||4x2', 'quadro-chaves|Quadro das chaves|p',
        'gongo|Gongo||2x1', 'escada|Escada||3x2', 'placa-andar|Placa do andar||1x1']),
    'torre-chefes-tronos': dict(cat='torre', ref=(0, 24), items=[
        'trono-madeira|Trono de madeira||2x1', 'trono-pedra|Trono de pedra||2x1', 'trono-ouro|Trono de ouro||2x1',
        'trono-dragao|Trono do dragão||2x1', 'trono-cristal|Trono de cristal||2x1', 'trono-nuvem|Trono das nuvens||2x1']),
    'torre-deco': dict(cat='torre', ref=(0, 38), items=[
        'banco-plateia|Banco da plateia||2x1', 'estandarte-espadas|Estandarte de espadas||1x1',
        'estandarte-copas|Estandarte de copas||1x1', 'estandarte-ouros|Estandarte de ouros||1x1',
        'estandarte-paus|Estandarte de paus||1x1', 'estatua-mao-carta|Estátua da carta||2x1',
        'bonsai|Bonsai||1x1', 'lanterna-papel|Lanterna de papel||1x1']),
    'torre-dojo': dict(cat='torre', ref=(3, 34), items=[
        'boneco-treino|Boneco de treino||1x1', 'rack-cartas|Rack de cartas||2x1', 'porta-papel|Porta de papel|p',
        'tatame|Tatame|t', 'santuario|Santuário||2x1', 'barril-agua|Barril de água||1x1',
        'pergaminho|Pergaminho|p', 'almofadas|Almofadas||2x1']),
    'torre-pedra': dict(cat='torre', ref=(5, 34), items=[
        'pilar-carta|Pilar da carta||1x1', 'tocha|Tocha||1x1', 'coluna-quebrada|Coluna quebrada||1x1',
        'braseiro|Braseiro||2x1', 'tabua-pedra|Tábua de pedra||2x1', 'banco-pedra|Banco de pedra||2x1',
        'estatua-campeao|Estátua do campeão||1x1', 'arco-pedra|Arco de pedra||3x1']),
    'torre-real': dict(cat='torre', ref=(7, 38), items=[
        'pilar-ouro|Pilar de ouro||1x1', 'cordao-veludo|Cordão de veludo||2x1', 'lustre-cristal|Lustre de cristal|p',
        'vitrine-trofeus|Vitrine de troféus||2x1', 'estandarte-real|Estandarte real||1x1',
        'estatua-carta-alada|Carta alada||2x1', 'gongo-ouro|Gongo de ouro||2x1', 'banco-veludo|Banco de veludo||2x1']),
    # ── Casa ──
    'casa-sofas': dict(cat='sofa', ref=(0, 34), tecido=True, items=[
        'sofa-classico|Sofá clássico||2x1', 'sofa-classico.lado', 'sofa-moderno|Sofá moderno||3x1', 'sofa-moderno.lado',
        'sofa-nuvem|Sofá nuvem||2x1', 'sofa-nuvem.lado', 'sofa-canto|Sofá de canto||3x2', 'sofa-canto.lado',
        'sofa-retro|Sofá retrô||2x1', 'sofa-retro.lado', 'namoradeira|Namoradeira||2x1', 'namoradeira.lado']),
    'casa-sofas-2': dict(cat='sofa', ref=(0, 36), tecido=True, items=[
        'sofa-chesterfield|Sofá chesterfield||2x1', 'sofa-chesterfield.lado', 'sofa-modular|Sofá modular||3x1',
        'sofa-modular.lado', 'sofa-cama|Sofá-cama||2x1', 'sofa-cama.lado', 'sofa-redondo|Sofá redondo||2x1',
        'sofa-redondo.lado', 'sofa-banco|Sofá banco||2x1', 'sofa-banco.lado', 'sofa-carro|Sofá carrinho||2x1',
        'sofa-carro.lado']),
    'casa-camas': dict(cat='cama', ref=(0, 22), tecido=True, items=[
        'cama-solteiro|Cama de solteiro||1x2', 'cama-solteiro.lado', 'cama-casal|Cama de casal||2x2', 'cama-casal.lado',
        'beliche|Beliche||1x2', 'beliche.lado', 'futon|Futon||2x2', 'futon.lado',
        'cama-dossel|Cama com dossel||2x2', 'cama-dossel.lado', 'cama-carro|Cama carrinho||2x2', 'cama-carro.lado']),
    'casa-camas-2': dict(cat='cama', ref=(0, 26), tecido=True, items=[
        'cama-alta|Cama alta com mesa||2x2', 'cama-alta.lado', 'cama-redonda|Cama redonda||2x2', 'cama-redonda.lado',
        'cama-rede|Cama de rede||2x2', 'cama-rede.lado', 'cama-princesa|Cama de princesa||2x2', 'cama-princesa.lado',
        'cama-foguete|Cama foguete||2x2', 'cama-foguete.lado', 'cama-estante|Cama com estante||2x2',
        'cama-estante.lado']),
    'casa-poltronas': dict(dil=3, cat='poltrona', ref=(0, 22), tecido=True, items=[
        'poltrona|Poltrona fofa||1x1', 'poltrona.lado', 'cadeira-balanco|Cadeira de balanço||1x1',
        'cadeira-balanco.lado', 'pufe|Pufe||1x1', 'pufe.lado', 'cadeira-gamer|Cadeira gamer||1x1',
        'cadeira-gamer.lado', 'cadeira|Cadeira||1x1', 'cadeira.lado', 'cadeira-ovo|Cadeira ovo||1x1',
        'cadeira-ovo.lado']),
    'casa-tapetes-1': dict(cat='tapete', ref=(0, 44), tecido=True, items=[
        'tapete-tranca|Tapete trançado|t', 'tapete-geometrico|Tapete geométrico|t', 'tapete-oval|Tapete oval|t',
        'passadeira|Passadeira|t', 'tapete-xadrez|Tapete xadrez|t']),
    'casa-tapetes-2': dict(cat='tapete', ref=(0, 44), tecido=True, items=[
        'tapete-estrela|Tapete estrela|t', 'tapete-nuvem|Tapete nuvem|t', 'tapete-carta|Tapete carta|t',
        'tapete-espiral|Tapete espiral|t', 'tapete-felpudo|Tapete felpudo|t']),
    'casa-tapetes-3': dict(cat='tapete', ref=(0, 36), tecido=True, items=[
        'tapete-pacotinho|Tapete pacotinho|t', 'tapete-folha|Tapete folha|t', 'tapete-patinha|Tapete patinha|t',
        'tapete-sol|Tapete sol|t', 'tapete-coracao|Tapete coração|t']),
    'casa-tapetes-4': dict(dil=3, cat='tapete', ref=(0, 44), tecido=True, items=[
        'tapete-controle|Tapete controle|t', 'tapete-listras|Tapete listrado|t', 'tapete-arco-iris|Tapete arco-íris|t',
        'tapete-hexagono|Tapete hexágono|t', 'tapete-lua|Tapete lua|t']),
    'casa-mesas': dict(cat='mesa', ref=(0, 24), items=[
        'mesa-centro|Mesa de centro||2x1', 'mesa-quadrada|Mesa quadrada||2x2', 'mesa-jantar|Mesa de jantar||2x3',
        'mesa-cha|Mesa de chá||3x2', 'mesa-vidro|Mesa de vidro||2x1', 'mesinha-abajur|Mesinha com abajur||1x1',
        'ilha-cozinha|Ilha da cozinha||3x2', 'escrivaninha|Escrivaninha||3x1']),
    'casa-armarios': dict(cat='armario', ref=(0, 30), items=[
        'guarda-roupa|Guarda-roupa||2x1', 'estante|Estante de livros||2x1', 'comoda|Cômoda||2x1',
        'pia-bancada|Pia com bancada||2x1', 'geladeira-mini|Geladeirinha||1x1', 'fogao|Fogão||1x1',
        'cristaleira|Cristaleira de cartas||2x1', 'bau-brinquedos|Baú de brinquedos||2x1']),
    'casa-plantas': dict(cat='planta', ref=(0, 24), items=[
        'costela-adao|Costela-de-adão||1x1', 'cacto|Cacto||1x1', 'planta-pendurada|Planta pendurada|p',
        'palmeira|Palmeira||1x1', 'vaso-tulipas|Vaso de tulipas||1x1', 'bonsai-mesa|Bonsai na mesinha||1x1',
        'suculentas|Suculentas||2x1', 'limoeiro|Limoeiro||1x1']),
    'casa-luz': dict(cat='luz', ref=(0, 16), items=[
        'luminaria-chao|Luminária de chão||1x1', 'abajur-cogumelo|Abajur cogumelo||1x1', 'lampada-lava|Lâmpada de lava||1x1',
        'pisca-pisca|Pisca-pisca|p', 'lanterna-redonda|Lanterna redonda|p', 'luminaria-mesa|Luminária de mesa||1x1',
        'candelabro|Candelabro||1x1', 'luz-estrela|Luz de estrela||1x1']),
    'casa-eletronicos': dict(cat='eletronico', ref=(0, 38), items=[
        'tv-rack|TV com rack||2x1', 'pc-gamer|PC gamer||3x1', 'fliperama|Fliperama||1x1', 'caixa-som|Caixa de som||1x1',
        'toca-discos|Toca-discos||1x1', 'robo-aspirador|Robô aspirador||1x1', 'aquario|Aquário||2x1',
        'telescopio|Telescópio||1x1']),
    'casa-parede-deco': dict(cat='parede', ref=(0, 32), items=[
        'janela-cortina|Janela com cortina|p', 'janela-redonda|Janela redonda|p', 'quadro-criatura|Quadro da criatura|p',
        'relogio-parede|Relógio de parede|p', 'prateleira-trofeus|Prateleira de troféus|p',
        'quadro-familia|Quadro da família|p', 'mural-cortica|Mural de cortiça|p', 'lareira|Lareira||2x1']),
    'casa-extras': dict(cat='extra', ref=(0, 22), items=[
        'caminha-pet|Caminha do pet||1x1', 'potes-pet|Potes do pet||1x1', 'pelucias|Pelúcias||2x1', 'violao|Violão||1x1',
        'cavalete|Cavalete||1x1', 'escadinha-livros|Escadinha de livros||1x1', 'cesto-roupa|Cesto de roupa||1x1',
        'capacho|Capacho|t']),
    'casa-cozinha': dict(cat='cozinha', ref=(0, 20), items=[
        'geladeira|Geladeira||1x1', 'fogao-panela|Fogão||2x1', 'pia|Pia||2x1', 'prateleira-potes|Prateleira de potes||2x1',
        'micro-ondas|Micro-ondas||2x1', 'mesa-dois|Mesa para dois||2x2', 'fruteira|Fruteira||2x1', 'lixeira|Lixeira||1x1']),
    'casa-banheiro': dict(cat='banheiro', ref=(0, 38), items=[
        'banheira|Banheira||2x1', 'chuveiro|Chuveiro||2x1', 'vaso-sanitario|Vaso sanitário||1x1', 'pia-espelho|Pia com espelho||2x1',
        'toalheiro|Toalheiro||2x1', 'maquina-lavar|Máquina de lavar||1x1', 'tapete-banheiro|Tapete do banheiro|t',
        'planta-banquinho|Planta no banquinho||1x1']),
    'casa-quarto-gamer': dict(cat='gamer', ref=(0, 30), items=[
        'cama-gamer|Cama gamer||2x2', 'mesa-streamer|Mesa de streamer||3x1', 'estante-jogos|Estante de jogos||2x1',
        'painel-led|Painel de LED|p', 'cadeira-gamer-2|Cadeira gamer vermelha||1x1', 'frigobar|Frigobar||1x1',
        'quadro-heroi|Quadro do herói|p', 'pufe-azul|Pufe azul||1x1']),
    'casa-jardim': dict(dil=3, cat='jardim', ref=(1, 34), items=[
        'horta|Horta||2x1', 'banco-jardim|Banco de jardim||2x1', 'casinha-passaro|Casinha de passarinho||1x1',
        'fonte-jardim|Fonte||2x2', 'arco-flores|Arco de flores||2x1', 'churrasqueira|Churrasqueira||1x1',
        'rede|Rede||3x1', 'casinha-cachorro|Casinha do cachorro||2x2']),
    # ── Arena ──
    'arena-saguao': dict(cat='arena', ref=(0, 46), items=[
        'mesa-espera-acesa|Mesa de espera (livre)||3x2', 'mesa-espera-apagada|Mesa de espera||3x2',
        'cadeira-saguao|Cadeira do saguão||1x1', 'cadeira-saguao.costas|Cadeira do saguão (costas)||1x1',
        'placar-ranking|Placar do ranking||3x1', 'recepcao|Recepção||3x1', 'trofeu-pedestal|Troféu||1x1',
        'refletor|Refletor||1x1']),
    'arena-saguao-2': dict(cat='arena', ref=(0, 38), items=[
        'sofa-saguao|Sofá do saguão||2x1', 'sofa-saguao.costas|Sofá do saguão (costas)||2x1', 'maquina-bebidas|Máquina de bebidas||1x1',
        'telao|Telão||3x1', 'planta-saguao|Planta||1x1', 'bebedouro|Bebedouro||1x1', 'banco-espera|Banco de espera||2x1',
        'estante-trofeus|Estante de troféus||3x1']),
    'arena-mesas-desafio': dict(cat='arena', ref=(0, 46), items=[
        'mesa-desafio-livre|Mesa de desafio (livre)||3x2', 'mesa-desafio-ocupada|Mesa de desafio (em duelo)||3x2',
        'mesa-desafio-prata|Mesa prata (livre)||3x2', 'mesa-desafio-prata-ocupada|Mesa prata (em duelo)||3x2',
        'mesa-vip|Mesa VIP||3x2', 'mesa-treino|Mesa de treino||3x2']),
    'arena-treino': dict(cat='arena', ref=(0, 52), items=[
        'portal-azul|Portal||3x2', 'plataforma-runas|Plataforma de runas||3x2', 'mesa-runas|Mesa de runas||3x2',
        'pilar-cristal|Pilar de cristal||1x1', 'boneco-cristal|Boneco de cristal||2x1', 'braseiro-azul|Braseiro azul||1x1',
        'quadro-rank|Quadro de rank||3x1', 'rack-capas|Rack de capas||3x1']),
    'arena-treino-2': dict(cat='arena', ref=(0, 20), items=[
        'boneco-cristal-azul|Boneco de cristal azul||1x1', 'boneco-cristal-roxo|Boneco de cristal roxo||1x1',
        'tapete-runas|Tapete de runas||2x2', 'orbe-luz|Orbe de luz||1x1', 'parede-placas|Parede de placas||3x1',
        'banco-escuro|Banco escuro||2x1', 'cabide-capa|Cabide da capa||1x1', 'estandarte-escuro|Estandarte escuro||1x1']),
    'arena-portoes-rank': dict(cat='arena', ref=(0, 44), items=[
        'portao-e|Portão rank E||3x2', 'portao-d|Portão rank D||3x2', 'portao-c|Portão rank C||3x2',
        'portao-b|Portão rank B||3x2', 'portao-a|Portão rank A||3x2', 'portao-s|Portão rank S||3x2',
        'cristal-rank|Cristal de rank||2x1', 'portao-selado|Portão selado||3x2']),
    # ── Loja ──
    'loja-lojas-1': dict(cat='loja', ref=(0, 100), items=[
        'loja-pacotinhos-antiga|Loja de pacotinhos (antiga)||6x3', 'loja-pets|Pet shop||6x3', 'loja-roupas|Boutique||6x3',
        'loja-moveis|Loja de móveis||6x3']),
    # 07/10: a loja de pacotinhos refeita e o elevador da Torre (fechado e aberto)
    'loja-pacotinhos': dict(cat='loja', ref=(0, 100), items=['loja-pacotinhos|Loja de pacotinhos||6x3']),
    'torre-elevador': dict(cat='torre', ref=(0, 48), items=['elevador|Elevador|p|3x1', 'elevador-aberto|Elevador aberto|p|3x1']),
    'loja-lojas-2': dict(cat='loja', ref=(0, 100), items=[
        'loja-acessorios|Loja de acessórios||6x3', 'loja-eventos|Loja de eventos||6x3', 'loja-premios|Troca de prêmios||6x3',
        'loja-informacoes|Informações||6x3']),
    'loja-moveis': dict(cat='loja', ref=(3, 36), items=[
        'torre-pacotinhos|Torre de pacotinhos||1x1', 'pacotinho-gigante|Pacotinho gigante||2x1', 'fonte-loja|Fonte||2x2',
        'banco-loja|Banco||2x1', 'baloes|Balões||1x1', 'palmeira-loja|Palmeira||1x1', 'mapa-loja|Mapa||1x1',
        'vitrine-rara|Vitrine da carta rara||1x1']),
    'loja-prateleiras': dict(cat='loja', ref=(0, 30), items=[
        'prateleira-comum|Prateleira comum||2x1', 'prateleira-rara|Prateleira rara||2x1', 'prateleira-epica|Prateleira épica||2x1',
        'vitrine-lendaria|Vitrine lendária||2x1', 'prateleira-ovos|Prateleira de ovos||2x1', 'prateleira-roupas|Prateleira de roupas||2x1',
        'catalogo-moveis|Catálogo de móveis||2x1', 'cesto-pacotinhos|Cesto de pacotinhos||2x1']),
    'loja-vitrines': dict(cat='loja', ref=(0, 34), items=[
        'arara-camisas|Arara de camisas||2x1', 'arara-jaquetas|Arara de jaquetas||2x1', 'manequim|Manequim||1x1',
        'expositor-bones|Expositor de bonés||1x1', 'chocadeira|Chocadeira||1x1', 'sofa-mostruario|Sofá do mostruário||2x1',
        'luminaria-mostruario|Luminária||1x1', 'vitrine-cartas|Vitrine de cartas||2x1']),
    # ── Oficina ──
    'oficina-trocas': dict(cat='oficina', ref=(0, 40), items=[
        'mesa-troca-redonda|Mesa de troca redonda||3x2', 'mesa-troca-quadrada|Mesa de troca quadrada||3x2',
        'poltrona-oficina|Poltrona||1x1', 'poltrona-oficina.costas|Poltrona (costas)||1x1', 'balcao-troca|Balcão de trocas||3x1',
        'mural-ofertas|Mural de ofertas||2x1', 'sofa-oficina|Sofá de canto||3x2', 'vitrine-doces|Vitrine de doces||2x1']),
    'oficina-mesas-troca': dict(cat='oficina', ref=(0, 42), items=[
        'mesa-feltro-verde|Mesa de feltro verde||3x2', 'mesa-feltro-vermelho|Mesa de feltro vermelho||3x2',
        'mesa-troca-longa|Mesa longa de troca||4x2', 'mesa-sofa-baixa|Mesa baixa com sofás||4x2',
        'mesa-cabine|Cabine||4x2', 'balcao-janela|Balcão da janela||3x2']),
    'oficina-aconchego': dict(cat='oficina', ref=(0, 26), items=[
        'estante-albuns|Estante de álbuns||2x1', 'lareira-oficina|Lareira||2x1', 'planta-pendurada-oficina|Planta pendurada|p',
        'luminaria-oficina|Luminária||1x1', 'balcao-cafe|Balcão do café||3x1', 'moldura-rara|Moldura da carta rara||2x1',
        'arranhador|Arranhador||1x1', 'vitrola|Vitrola||1x1']),
    'oficina-forja': dict(cat='oficina', ref=(0, 30), items=[
        'forja|Forja||2x1', 'bigorna|Bigorna||2x1', 'bancada|Bancada||2x1', 'estante-albuns-alta|Estante de álbuns||2x1',
        'atril|Atril do álbum||2x1', 'potes-po|Potes de pó de carta||2x1', 'moldura-brilhante|Moldura brilhante||1x1',
        'gato-almofada|Gato dormindo||1x1']),
    # ── Castelo ──
    'castelo-moveis-1': dict(cat='castelo', ref=(0, 40), items=[
        'mesa-banquete|Mesa de banquete||2x3', 'mesa-redonda-mapa|Mesa redonda||3x2', 'quadro-missoes|Quadro de missões|p',
        'lareira-pedra|Lareira de pedra||3x1', 'trono-guilda|Trono||2x1', 'estante-medalhas|Estante de medalhas||3x1',
        'armadura|Armadura||1x1', 'lustre-ferro|Lustre de ferro|p']),
    'castelo-moveis-2': dict(cat='castelo', ref=(0, 18), items=[
        'estandarte-azul|Estandarte azul||1x1', 'estandarte-vermelho|Estandarte vermelho||1x1',
        'estandarte-verde|Estandarte verde||1x1', 'estandarte-roxo|Estandarte roxo||1x1', 'estante-pergaminhos|Estante||2x1',
        'barris|Barris||2x1', 'vaso-flores|Vaso de flores||1x1', 'bau-tesouro|Baú do tesouro||2x1']),
    'castelo-guildas': dict(cat='castelo', ref=(0, 42), items=[
        'mesa-guilda-azul|Mesa da guilda azul||3x2', 'mesa-guilda-vermelha|Mesa da guilda vermelha||3x2',
        'mesa-guilda-verde|Mesa da guilda verde||3x2', 'mesa-guilda-roxa|Mesa da guilda roxa||3x2',
        'ranking-guildas|Ranking das guildas||3x1', 'pulpito|Púlpito do líder||3x1', 'bau-pacotinhos|Baú de pacotinhos||3x1',
        'mapa-suporte|Mapa||3x1']),
    'castelo-quartos': dict(cat='castelo', ref=(0, 26), items=[
        'beliche-madeira|Beliche de madeira||2x2', 'cama-medieval|Cama medieval||2x2', 'armario-madeira|Armário||2x1',
        'lavatorio|Lavatório||1x1', 'tapete-escudo|Tapete do escudo|t', 'tocha-parede|Tocha de parede|p',
        'estante-rolos|Estante de pergaminhos||2x1', 'escudo-treino|Escudo de treino||1x1']),
}

# Pisos: tamanho do quadrado que se repete, em pixels do mundo.
FLOORS = {
    'torre-piso-1': 96, 'torre-piso-2': 96, 'torre-piso-3': 96,
    'casa-piso': 64, 'casa-piso-2': 128, 'casa-piso-3': 64, 'casa-piso-4': 128,
    'arena-piso-1': 96, 'arena-piso-2': 96, 'loja-piso': 128, 'oficina-piso': 96,
    'castelo-piso': 128, 'castelo-tapete': 96,
}
# Paredes: altura em pixels do mundo (a largura acompanha).
WALL_H = 48
WALLS = ['torre-parede', 'casa-parede', 'casa-parede-2', 'casa-parede-3', 'casa-parede-4',
         'arena-parede-1', 'arena-parede-2', 'loja-parede', 'oficina-parede', 'castelo-parede']


def find(name):
    for root, _, files in os.walk(SRC):
        if name + '.png' in files:
            return os.path.join(root, name + '.png')
    return None


def hsv(px):
    a = px[..., :3].astype(float) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, d / (mx + 1e-6), mx


def rgb(hx):
    return [int(hx[i:i + 2], 16) for i in (1, 3, 5)]


def fabric(px):
    """Pinta os pixels ciano e verde nos 4 tons-molde (pela luminância)."""
    h, s, v = hsv(px)
    on = px[..., 3] > 0
    lum = px[..., :3].astype(float) @ [0.3, 0.59, 0.11]
    out = px.copy()
    for m, ramp in (
        (on & (s > 0.3) & (v > 0.25) & (h > 168) & (h < 210), MOLDE_MAIN),
        (on & (s > 0.3) & (v > 0.3) & (h > 80) & (h <= 160), MOLDE_DETAIL),
    ):
        if m.sum() < 4:
            continue
        lo, hi = np.percentile(lum[m], [3, 97])
        t = ((lum[m] - lo) / max(1.0, hi - lo)).clip(0, 0.999)
        tone = np.digitize(t, [0.25, 0.5, 0.82])
        cols = np.array([rgb(c) for c in ramp], np.uint8)
        out[..., :3][m] = cols[tone]
    return out


def seamless_x(a):
    """Emenda da parede: perto das bordas usa a faixa deslocada meia volta."""
    n = a.shape[1]
    rolled = np.roll(a, n // 2, 1)
    t = np.minimum(np.arange(n), n - 1 - np.arange(n)) / (n * 0.12)
    w = np.clip(t, 0, 1)
    w = (w * w * (3 - 2 * w))[None, :, None]
    return a * w + rolled * (1 - w)


def wall(path):
    im = Image.open(path).convert('RGB')
    h = WALL_H * K
    w = round(im.width * h / im.height)
    small = np.array(im.resize((w, h), Image.BOX)).astype(float)
    small = seamless_x(small).clip(0, 255).astype(np.uint8)
    q = np.array(Image.fromarray(small, 'RGB').quantize(64, method=Image.Quantize.MEDIANCUT).convert('RGB'))
    return np.dstack([q, np.full(q.shape[:2], 255, np.uint8)])


def components(alpha, n, dil=14):
    """Como imp.components, mas com a dilatação ajustável (folhas apertadas grudam)."""
    from scipy import ndimage
    mask = alpha > 0.5
    grown = ndimage.binary_dilation(mask, iterations=dil) if dil else mask
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
    boxes.sort(key=lambda bx: (bx[1] + bx[3]) / 2)
    rows, cur = [], []
    for bx in boxes:
        if cur and (bx[1] + bx[3]) / 2 - (cur[-1][1] + cur[-1][3]) / 2 > (cur[-1][3] - cur[-1][1]) * 0.6:
            rows.append(cur); cur = []
        cur.append(bx)
    rows.append(cur)
    return [bx for row in rows for bx in sorted(row, key=lambda b: b[0])]


def parse(item):
    parts = (item.split('|') + ['', '', ''])[:4]
    return parts[0], parts[1], parts[2] or 'm', parts[3]


def pack(sprites, width=2048, pad=2):
    """Empacota em prateleiras (mais altos primeiro). Devolve o atlas e [x, y, w, h] de cada um."""
    order = sorted(sprites, key=lambda k: (-sprites[k].shape[0], -sprites[k].shape[1]))
    where, x, y, shelf = {}, 0, 0, 0
    for k in order:
        h, w = sprites[k].shape[:2]
        if x + w > width:
            x, y, shelf = 0, y + shelf + pad, 0
        where[k] = [x, y, w, h]
        x += w + pad
        shelf = max(shelf, h)
    atlas = np.zeros((y + shelf, width, 4), np.uint8)
    for k, (x, y, w, h) in where.items():
        atlas[y:y + h, x:x + w] = sprites[k]
    return atlas, where


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.png'):
            os.remove(os.path.join(OUT, f))
    manifest, review, sprites = {}, [], {}
    for sheet, spec_ in SHEETS.items():
        path = find(sheet)
        if not path:
            print('faltando:', sheet); continue
        rgb_, alpha = imp.load(path)
        items = spec_['items']
        boxes = components(alpha, len(items), spec_.get('dil', 14))
        if len(boxes) != len(items):
            print(f'{sheet}: achei {len(boxes)} objetos, esperava {len(items)}')
        ri, rw = spec_['ref']
        # escala da folha: px da imagem por px do mundo
        s = (boxes[ri][2] - boxes[ri][0]) / rw
        row = []
        for item, box in zip(items, boxes):
            iid, nome, layer, pe = parse(item)
            base = iid.split('.')[0]
            w = max(1, round((box[2] - box[0]) / s))
            px = imp.shrink(rgb_, alpha, box, {'w': w * K}, 48)
            if spec_.get('tecido'):
                px = fabric(px)
            sprites[iid] = px
            e = {'w': px.shape[1] / K, 'h': px.shape[0] / K, 'cat': spec_['cat']}
            if '.' in iid:
                e['de'] = base
                e['vista'] = iid.split('.')[1]
            else:
                e['nome'] = nome
                e['camada'] = layer
                if pe:
                    e['pe'] = [int(v) for v in pe.split('x')]
            if spec_.get('tecido'):
                e['tecido'] = True
            manifest[iid] = e
            row.append((iid, px))
        review.append((sheet, row))
    for name, px_ in FLOORS.items():
        path = find(name)
        if not path:
            print('faltando:', name); continue
        px = imp.tile(path, 48, px_ * K)
        iid = 'piso-' + name.split('-', 1)[1] if not name.startswith('castelo-tapete') else 'piso-castelo-tapete'
        iid = 'piso-' + name
        sprites[iid] = px
        manifest[iid] = {'w': px_, 'h': px_, 'cat': 'piso'}
    for name in WALLS:
        path = find(name)
        if not path:
            print('faltando:', name); continue
        px = wall(path)
        iid = 'parede-' + name
        sprites[iid] = px
        manifest[iid] = {'w': px.shape[1] / K, 'h': WALL_H, 'cat': 'parede-fundo'}
    # tudo numa folha só (atlas): um download em vez de centenas
    atlas, where = pack(sprites)
    Image.fromarray(atlas, 'RGBA').save(os.path.join(OUT, 'atlas.png'), optimize=True)
    for iid, box in where.items():
        manifest[iid]['a'] = box
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1, sort_keys=True, ensure_ascii=False)
    print(len(manifest), 'sprites em', os.path.relpath(OUT, ROOT))

    if '--folha' in sys.argv:
        dest = sys.argv[sys.argv.index('--folha') + 1]
        # uma linha por folha, com um boneco de 28 px de altura (em hd: 56) para comparar a escala
        pad = 8
        rows = []
        for sheet, row in review:
            h = max(p.shape[0] for _, p in row) + pad
            w = sum(p.shape[1] + pad for _, p in row) + 40
            canvas = np.zeros((h, w, 4), np.uint8)
            canvas[...] = [206, 190, 150, 255]
            canvas[h - 56 - pad // 2:h - pad // 2, 8:28] = [60, 60, 200, 255]  # régua: altura do boneco
            x = 40
            for _, p in row:
                y = h - p.shape[0] - pad // 2
                a = p[..., 3:4] / 255
                canvas[y:y + p.shape[0], x:x + p.shape[1], :3] = (p[..., :3] * a + canvas[y:y + p.shape[0], x:x + p.shape[1], :3] * (1 - a)).astype(np.uint8)
                x += p.shape[1] + pad
            rows.append(canvas)
        W = max(r.shape[1] for r in rows)
        big = np.concatenate([np.pad(r, ((0, 0), (0, W - r.shape[1]), (0, 0)), constant_values=40) for r in rows], 0)
        Image.fromarray(big, 'RGBA').save(dest)
        print('folha:', dest)


if __name__ == '__main__':
    main()

// Textos da cidade: o que cada prédio vai ter e o que os moradores dizem.
import type { Dir } from './movement';
import type { Outfit } from './recolor';

export const BUILDING_INFO: Record<string, { title: string; text: string }> = {
  torre: { title: 'Torre dos 100 Andares', text: 'A dungeon. Cada andar é um duelo de cartas; a cada 10 andares, um chefe que pode te dar uma carta do deck dele.' },
  centro: { title: 'Oficina de Cartas', text: 'Aqui não se compra nada: monte seu deck, complete o álbum, forje a carta que falta e troque duplicatas com os colegas.' },
  loja: { title: 'Loja de Pacotinhos', text: 'O único lugar que vende: pacotinhos de cartas, roupas, móveis e as Recompensas da Sala (tablet, VR, música na Alexa).' },
  arena: { title: 'Arena', text: 'Duelos PvP: contra a IA jogando com o deck de um colega, ou ao vivo.' },
  guildas: { title: 'Castelo das Guildas', text: 'Sua equipe, a meta de presença da semana e o chefe da guilda.' },
  'sua-casa': { title: 'Sua Casa', text: 'Personalize seu personagem e decore sua casa com móveis.' },
};

/** Modelos de casa (sprites em public/game/world). As 3 iniciais e as 7 que se compram. */
export const HOUSE_MODELS: { id: string; sprite: string; title: string; inicial: boolean; tilesW?: number }[] = [
  { id: 'modelo-chale', sprite: 'casa-chale', title: 'Chalé de Madeira', inicial: true },
  { id: 'modelo-tijolo', sprite: 'casa-tijolo', title: 'Casinha de Tijolo', inicial: true },
  { id: 'modelo-moderna', sprite: 'casa-moderna', title: 'Casa Moderna', inicial: true },
  { id: 'modelo-futurista', sprite: 'casa-futurista', title: 'Casa Futurista', inicial: false },
  { id: 'modelo-arvore', sprite: 'casa-arvore', title: 'Casa na Árvore', inicial: false },
  { id: 'modelo-gamer', sprite: 'casa-gamer', title: 'Casa Gamer', inicial: false },
  { id: 'modelo-japonesa', sprite: 'casa-japonesa', title: 'Casa Japonesa', inicial: false },
  { id: 'modelo-montanha', sprite: 'casa-montanha', title: 'Chalé de Montanha', inicial: false },
  { id: 'modelo-castelo', sprite: 'casa-castelo', title: 'Mini Castelo', inicial: false },
  { id: 'modelo-foguete', sprite: 'casa-foguete', title: 'Casa Foguete', inicial: false, tilesW: 4 },
];

export function houseInfo(id: string, name: string): { title: string; text: string } {
  const m = HOUSE_MODELS.find(h => h.id === id);
  if (!m) return { title: name, text: HOUSE_INFO.text };
  return m.inicial
    ? { title: m.title, text: 'Casa inicial: um dos modelos que o aluno pode escolher ao começar.' }
    : { title: m.title, text: 'Modelo à venda: comprando na Loja, a sua casa vira esta.' };
}

export const HOUSE_INFO = { title: 'Casa de um morador', text: 'No futuro, a casa dos seus amigos: visite, veja a decoração e deixe um recado.' };

export interface NpcDef {
  id: string;
  tx: number;
  ty: number;
  dir: Dir;
  outfit: Outfit;
  lines: string[];
}

export const NPCS: NpcDef[] = [
  { id: 'guia', tx: 17, ty: 16, dir: 'south', outfit: { hair: 'loiro', top: 'verde', bottom: 'jeans' },
    lines: ['Bem-vindo à Cidade WIT!', 'Aqui tudo gira em torno das cartas. Explore os prédios!'] },
  { id: 'torre', tx: 22, ty: 11, dir: 'west', outfit: { hair: 'preto', top: 'marinho', bottom: 'preto' },
    lines: ['Dizem que no andar 100 mora um chefe que ninguém venceu...', 'Será que você consegue?'] },
  { id: 'loja', tx: 31, ty: 15, dir: 'south', outfit: { hair: 'rosa', top: 'amarelo', bottom: 'jeans' },
    lines: ['Chegaram pacotinhos novos na Loja!', 'Mas os melhores você ganha indo bem na aula.'] },
  { id: 'arena', tx: 30, ty: 27, dir: 'north', outfit: { hair: 'ruivo', top: 'vermelho', bottom: 'caqui' },
    lines: ['Quer duelar? A Arena abre em breve.', 'Treine seu deck na Torre enquanto isso!'] },
  { id: 'guildas', tx: 9, ty: 27, dir: 'north', outfit: { hair: 'azul', top: 'roxo', bottom: 'preto' },
    lines: ['Na guilda, cada presença conta para a meta da equipe.', 'Faltou? A equipe inteira sente!'] },
  { id: 'mural', tx: 17, ty: 12, dir: 'west', outfit: { hair: 'lilas', top: 'rosa', bottom: 'jeans' },
    lines: ['O mural mostra os avisos do professor e as missões da semana.'] },
];

export const MURAL_TEXT = ['MURAL DA CIDADE', 'Avisos do professor e missões da semana aparecem aqui.'];

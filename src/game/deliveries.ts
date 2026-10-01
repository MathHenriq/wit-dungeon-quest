// Central de Entregas (Cidade WIT): pega uma encomenda, leva até a porta
// certa (em qualquer área) antes do tempo acabar. Atrasou, ganha metade.
// O entregador tem mais tempo e ganha mais. Funções puras.
import type { Progress } from './progress';
import { doWork } from './life';
import { perkLevel } from './professions';

export interface Destino { zona: 'cidade' | 'lago' | 'fazenda' | 'wit'; porta: string; nome: string }

/** Portas que recebem encomenda (um teste confere que existem no mapa). */
export const DESTINOS: Destino[] = [
  { zona: 'cidade', porta: 'casa-azul', nome: 'Casa Azul (Centro)' },
  { zona: 'cidade', porta: 'npc-bibliotecaria', nome: 'Casa da Bibliotecária' },
  { zona: 'cidade', porta: 'npc-inventor', nome: 'Oficina do Inventor' },
  { zona: 'cidade', porta: 'casa-rosa', nome: 'Casa Rosa (Centro)' },
  { zona: 'cidade', porta: 'npc-padaria', nome: 'Padaria da Dona Rosa' },
  { zona: 'cidade', porta: 'npc-floricultura', nome: 'Floricultura' },
  { zona: 'cidade', porta: 'npc-pescador', nome: 'Casa do Pescador' },
  { zona: 'cidade', porta: 'casa-laranja', nome: 'Casa Laranja (Centro)' },
  { zona: 'cidade', porta: 'npc-fazendeiro', nome: 'Casa do Fazendeiro' },
  { zona: 'lago', porta: 'loja-iscas', nome: 'Loja de Iscas (Lago)' },
  { zona: 'lago', porta: 'casa-nando', nome: 'Casa do Nando (Lago)' },
  { zona: 'lago', porta: 'casa-lucia', nome: 'Casa da Lúcia (Lago)' },
  { zona: 'lago', porta: 'casa-marinho', nome: 'Casa do Marinho (Lago)' },
  { zona: 'fazenda', porta: 'galinheiro', nome: 'Galinheiro (Fazenda)' },
  { zona: 'fazenda', porta: 'estufa', nome: 'Estufa (Fazenda)' },
  { zona: 'fazenda', porta: 'moinho', nome: 'Moinho (Fazenda)' },
  { zona: 'wit', porta: 'casa-coworking', nome: 'Coworking WIT' },
  { zona: 'wit', porta: 'moradia-1', nome: 'Moradia 1 (Cidade WIT)' },
  { zona: 'wit', porta: 'moradia-3', nome: 'Moradia 3 (Cidade WIT)' },
  { zona: 'wit', porta: 'moradia-4', nome: 'Moradia 4 (Cidade WIT)' },
];

const PACOTES = ['uma caixa', 'uma carta', 'um presente', 'uns livros', 'um quebra-cabeça', 'uma plantinha'];

/** Tempo (ms) e pagamento: entregar em outra área dá mais tempo e mais moedas. */
export function deliveryTerms(p: Progress, sameZone: boolean): { ms: number; coins: number; xp: number } {
  const perk = perkLevel(p.profissao, 'entregador', p.xp.entregador ?? 0);
  return {
    ms: Math.round((sameZone ? 150_000 : 300_000) * (1 + perk * 0.2)),
    coins: Math.round((sameZone ? 12 : 22) * (1 + perk * 0.3)),
    xp: sameZone ? 15 : 25,
  };
}

/** Pega uma encomenda nova (a Central fica na Cidade WIT). */
export function takeDelivery(p: Progress, r: number, now: number): { progress: Progress; what: string; dest: Destino } {
  const dest = DESTINOS[Math.floor(r * DESTINOS.length) % DESTINOS.length];
  const what = PACOTES[Math.floor(r * 997) % PACOTES.length];
  const t = deliveryTerms(p, dest.zona === 'wit');
  return { progress: { ...p, entrega: { zona: dest.zona, porta: dest.porta, nome: dest.nome, ate: now + t.ms } }, what, dest };
}

/** Chegou na porta: paga (metade se atrasou) e conta para as missões. */
export function finishDelivery(p: Progress, now: number): { progress: Progress; coins: number; late: boolean; levelUp?: number } | null {
  const e = p.entrega;
  if (!e) return null;
  const t = deliveryTerms(p, e.zona === 'wit');
  const late = now > e.ate;
  const coins = late ? Math.round(t.coins / 2) : t.coins;
  const w = doWork({ ...p, entrega: undefined, coins: p.coins + coins }, 'entregador', 'entregas', late ? Math.round(t.xp / 2) : t.xp);
  return { progress: w.progress, coins, late, levelUp: w.levelUp };
}

export const cancelDelivery = (p: Progress): Progress => ({ ...p, entrega: undefined });

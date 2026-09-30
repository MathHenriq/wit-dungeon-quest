// Tapetes do duelo (cosméticos): o aluno compra com moedas e escolhe qual usa.
// Não mudam nada nas regras. Os feitos em código são só CSS; os de imagem
// (anime, cartas, monstrinhos) usam uma arte em public/game/tapetes/<id>.webp,
// gerada pelo GPT com os prompts de docs/prompts-tapetes.md e revisada antes.
import type { CSSProperties } from 'react';

export type MatTheme = 'Básico' | 'WIT' | 'Natureza' | 'Elementos' | 'Anime' | 'Cartas' | 'Monstrinhos';

export interface Playmat {
  id: string;
  nome: string;
  tema: MatTheme;
  preco: number;
  descricao: string;
  /** Fundo em CSS. `var(--el)`/`var(--el2)` = cores do elemento do desafiante. */
  fundo?: string;
  borda: string;
  /** Arte em imagem (public/game/tapetes/<id>.webp). */
  arte?: boolean;
  /** Ainda sem arte: aparece na loja, mas não dá para comprar. */
  emBreve?: boolean;
}

export const DEFAULT_MAT = 'classico';

export const PLAYMATS: Playmat[] = [
  {
    id: 'classico', nome: 'Clássico', tema: 'Básico', preco: 0, borda: 'var(--el)',
    descricao: 'Muda de cor com o elemento de cada desafiante.',
    fundo: `radial-gradient(ellipse at center, color-mix(in srgb, var(--el) 22%, transparent), transparent 62%),
      repeating-linear-gradient(45deg, color-mix(in srgb, var(--el2) 38%, transparent) 0 .8cqw, transparent .8cqw 1.6cqw), #150e14`,
  },
  {
    id: 'circuito', nome: 'Circuito WIT', tema: 'WIT', preco: 600, borda: '#8cc63f',
    descricao: 'Placa de circuito no verde da WIT, com trilhas acesas.',
    fundo: `radial-gradient(circle at 20% 30%, #8cc63f 0 .25cqw, transparent .3cqw), radial-gradient(circle at 70% 60%, #8cc63f 0 .25cqw, transparent .3cqw),
      radial-gradient(circle at 45% 80%, #b8f080 0 .2cqw, transparent .25cqw),
      linear-gradient(90deg, transparent 49.6%, rgba(140,198,63,.35) 49.6% 50.4%, transparent 50.4%) 0 0 / 6cqw 6cqw,
      linear-gradient(0deg, transparent 49.6%, rgba(140,198,63,.22) 49.6% 50.4%, transparent 50.4%) 0 0 / 3cqw 3cqw,
      radial-gradient(ellipse at center, #16301a, #0a140c 75%)`,
  },
  {
    id: 'dojo', nome: 'Tatame do Dojo', tema: 'Natureza', preco: 600, borda: '#b3261e',
    descricao: 'Tatame trançado com faixa vermelha, como nos torneios.',
    fundo: `repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 .15cqw, transparent .15cqw .6cqw),
      linear-gradient(90deg, transparent 49.7%, rgba(60,40,10,.5) 49.7% 50.3%, transparent 50.3%),
      radial-gradient(ellipse at center, #d9c48a, #a8904f 80%)`,
  },
  {
    id: 'noite', nome: 'Noite Estrelada', tema: 'Natureza', preco: 800, borda: '#c7b8ff',
    descricao: 'Céu de noite com estrelas e uma lua grande no canto.',
    fundo: `radial-gradient(circle at 86% 22%, #fff7d6 0 2.2cqw, rgba(255,247,214,.25) 2.4cqw 4cqw, transparent 4.2cqw),
      radial-gradient(circle at 12% 18%, #fff 0 .12cqw, transparent .16cqw), radial-gradient(circle at 34% 64%, #fff 0 .1cqw, transparent .14cqw),
      radial-gradient(circle at 58% 28%, #fff 0 .14cqw, transparent .18cqw), radial-gradient(circle at 72% 78%, #fff 0 .1cqw, transparent .14cqw),
      radial-gradient(circle at 24% 86%, #fff 0 .12cqw, transparent .16cqw), radial-gradient(circle at 46% 12%, #fff 0 .1cqw, transparent .14cqw),
      radial-gradient(1px 1px at 20% 40%, #fff, transparent) 0 0 / 3cqw 3cqw,
      linear-gradient(#1c1a4a, #0b0a24 70%)`,
  },
  {
    id: 'sakura', nome: 'Chuva de Sakura', tema: 'Natureza', preco: 800, borda: '#ff9ac6',
    descricao: 'Pétalas de cerejeira caindo num fundo rosado.',
    fundo: `radial-gradient(ellipse .6cqw .35cqw at 30% 30%, #ffd1e6 60%, transparent 62%) 0 0 / 5cqw 4cqw,
      radial-gradient(ellipse .5cqw .3cqw at 70% 70%, #ffb3d4 60%, transparent 62%) 1cqw 1cqw / 6cqw 5cqw,
      radial-gradient(ellipse at center, #7a2c55, #3d1430 80%)`,
  },
  {
    id: 'oceano', nome: 'Fundo do Mar', tema: 'Elementos', preco: 1000, borda: '#38bdf8',
    descricao: 'Ondas em camadas e bolhas subindo.',
    fundo: `radial-gradient(circle at 20% 70%, rgba(255,255,255,.5) 0 .2cqw, transparent .25cqw) 0 0 / 4cqw 5cqw,
      repeating-radial-gradient(circle at 50% 110%, rgba(56,189,248,.28) 0 .4cqw, transparent .4cqw 1.6cqw),
      linear-gradient(#0d4f7a, #082a47 75%)`,
  },
  {
    id: 'vulcao', nome: 'Coração do Vulcão', tema: 'Elementos', preco: 1200, borda: '#ff7a1a',
    descricao: 'Rachaduras de lava brilhando na pedra escura.',
    fundo: `radial-gradient(ellipse at 50% 120%, rgba(255,120,30,.55), transparent 60%),
      repeating-linear-gradient(115deg, transparent 0 2.5cqw, rgba(255,110,20,.55) 2.5cqw 2.65cqw, transparent 2.65cqw 5cqw),
      repeating-linear-gradient(35deg, transparent 0 3.5cqw, rgba(255,160,40,.35) 3.5cqw 3.6cqw, transparent 3.6cqw 7cqw),
      radial-gradient(ellipse at center, #3a1510, #160806 80%)`,
  },
  // arte em imagem (prompts em docs/prompts-tapetes.md): entram quando a arte for aprovada
  { id: 'arena-heroi', nome: 'Arena dos Heróis', tema: 'Anime', preco: 1500, borda: '#ffd45c', arte: true, emBreve: true, descricao: 'Estádio de torneio shōnen com a plateia em volta.' },
  { id: 'espiritos', nome: 'Floresta dos Espíritos', tema: 'Anime', preco: 1500, borda: '#7ee06a', arte: true, emBreve: true, descricao: 'Floresta mágica com espíritos brilhando, estilo filme de anime.' },
  { id: 'cidade-neon', nome: 'Cidade Neon', tema: 'Anime', preco: 1500, borda: '#ff4fd8', arte: true, emBreve: true, descricao: 'Telhados de uma cidade futurista à noite.' },
  { id: 'cartas-lendarias', nome: 'Cartas Lendárias', tema: 'Cartas', preco: 2000, borda: '#ffd45c', arte: true, emBreve: true, descricao: 'Cartas douradas em leque e runas brilhando.' },
  { id: 'monstrinhos', nome: 'Campo dos Monstrinhos', tema: 'Monstrinhos', preco: 2000, borda: '#ff5a5a', arte: true, emBreve: true, descricao: 'Campo de batalha de monstrinhos, com grama, pedras e o círculo no meio.' },
];

export const MAT_BY_ID = new Map(PLAYMATS.map(m => [m.id, m]));
export const matOf = (id: string | undefined) => MAT_BY_ID.get(id ?? '') ?? MAT_BY_ID.get(DEFAULT_MAT)!;

/** O estilo do tapete (fundo e borda). `base` = onde fica public/ (import.meta.env.BASE_URL). */
export function matStyle(m: Playmat, base = '/'): CSSProperties {
  if (m.arte && !m.emBreve) {
    return {
      background: `linear-gradient(rgba(10,6,14,.25), rgba(10,6,14,.25)), url(${base}game/tapetes/${m.id}.webp) center / cover`,
      borderColor: m.borda,
    };
  }
  return { background: m.fundo, borderColor: m.borda };
}

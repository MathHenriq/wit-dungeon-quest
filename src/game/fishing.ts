// Pesca: os peixes do Lago Azul, a chance de cada um (raridade, água funda,
// noite) e o minijogo de apertar na hora certa. Funções puras (testadas);
// o desenho do ícone de cada peixe fica em world/fish-art.ts.

export type FishRarity = 'lixo' | 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';

export interface Fish {
  id: string;
  name: string;
  rarity: FishRarity;
  /** Tamanho (cm), mínimo e máximo. */
  cm: [number, number];
  /** Moedas por peixe vendido na Casa de Pesca. */
  price: number;
  /** Só (ou mais) em água funda, longe da margem. */
  deep?: boolean;
  /** Só à noite (`only`) ou mais à noite. */
  night?: 'only' | 'more';
  /** Cores do desenho: costas, barriga, detalhe (listras, pintas). */
  colors: [string, string, string];
  pattern?: 'listras' | 'pintas' | 'brilho' | 'escamas';
  /** Formato do corpo. */
  shape?: 'fino' | 'redondo' | 'longo' | 'bota' | 'lata' | 'camarao';
  about: string;
}

export const FISH: Fish[] = [
  { id: 'lambari', name: 'Lambari', rarity: 'comum', cm: [6, 14], price: 1, colors: ['#9ab8cc', '#e8f0f4', '#f0c040'], shape: 'fino', about: 'Pequeno e rapidinho, vive em cardume perto da margem.' },
  { id: 'tilapia', name: 'Tilápia', rarity: 'comum', cm: [18, 38], price: 1, colors: ['#8a9a7a', '#d8d8c0', '#5a6a4a'], pattern: 'listras', shape: 'redondo', about: 'O peixe mais comum do lago. Todo pescador já pegou uma.' },
  { id: 'carpa', name: 'Carpa', rarity: 'comum', cm: [30, 60], price: 1, colors: ['#b08a4a', '#f0d8a0', '#8a6a3a'], pattern: 'escamas', about: 'Grandona e calma, gosta do fundo lamacento.' },
  { id: 'camarao', name: 'Camarão de Água Doce', rarity: 'comum', cm: [4, 9], price: 1, colors: ['#e8a080', '#f8d0c0', '#c86a50'], shape: 'camarao', about: 'Fica escondido entre as pedras da margem.' },
  { id: 'bagre', name: 'Bagre', rarity: 'incomum', cm: [30, 70], price: 2, night: 'more', colors: ['#6a6a7a', '#c8c8d0', '#3a3a4a'], pattern: 'pintas', shape: 'longo', about: 'Tem bigodes compridos e sai para comer à noite.' },
  { id: 'traira', name: 'Traíra', rarity: 'incomum', cm: [25, 50], price: 2, colors: ['#5a7a4a', '#c8d0a0', '#2a4a2a'], pattern: 'pintas', shape: 'longo', about: 'Esperta: fica paradinha esperando a comida passar.' },
  { id: 'piau', name: 'Piau', rarity: 'incomum', cm: [20, 35], price: 2, colors: ['#c8a040', '#f8e8b0', '#3a3a3a'], pattern: 'listras', about: 'Tem três pintas pretas de cada lado.' },
  { id: 'pacu', name: 'Pacu', rarity: 'raro', cm: [30, 60], price: 5, colors: ['#5a6a8a', '#e89a50', '#3a4a6a'], shape: 'redondo', about: 'Redondo como um prato e adora frutinhas que caem na água.' },
  { id: 'tucunare', name: 'Tucunaré', rarity: 'raro', cm: [30, 70], price: 5, deep: true, colors: ['#8ab83a', '#f0e070', '#2a3a1a'], pattern: 'listras', about: 'Tem uma pinta que parece um olho no rabo. Briga muito!' },
  { id: 'dourado', name: 'Dourado', rarity: 'raro', cm: [40, 90], price: 6, deep: true, colors: ['#e8b030', '#fff0a0', '#c07820'], pattern: 'escamas', about: 'O rei do rio: brilha como ouro quando pula.' },
  { id: 'koi', name: 'Carpa Koi', rarity: 'epico', cm: [40, 80], price: 12, colors: ['#f8f4ec', '#f8f4ec', '#e84a2a'], pattern: 'pintas', about: 'Branca com manchas vermelhas. Dizem que traz sorte.' },
  { id: 'pirarucu', name: 'Pirarucu', rarity: 'epico', cm: [120, 260], price: 15, deep: true, colors: ['#4a5a4a', '#c85a3a', '#2a3a2a'], pattern: 'escamas', shape: 'longo', about: 'Um dos maiores peixes de água doce do mundo. Sobe para respirar!' },
  { id: 'peixe-cristal', name: 'Peixe-Cristal', rarity: 'lendario', cm: [20, 32], price: 40, night: 'only', colors: ['#a8e8ff', '#f0fcff', '#ffffff'], pattern: 'brilho', about: 'Só aparece à noite. Brilha como uma lâmpada de LED.' },
  { id: 'koi-dourada', name: 'Koi Dourada', rarity: 'lendario', cm: [50, 90], price: 50, deep: true, colors: ['#ffd84a', '#fff4b0', '#ffae20'], pattern: 'brilho', about: 'A lenda do Lago Azul. Poucos pescadores já viram uma.' },
  { id: 'bota', name: 'Bota Velha', rarity: 'lixo', cm: [25, 30], price: 0, colors: ['#6a4a2a', '#8a6a4a', '#3a2a1a'], shape: 'bota', about: 'Alguém perdeu a bota no lago... Jogue no lixo!' },
  { id: 'lata', name: 'Lata', rarity: 'lixo', cm: [10, 12], price: 0, colors: ['#b8c0c8', '#e8ecf0', '#e84a4a'], shape: 'lata', about: 'Lixo no lago faz mal aos peixes. Que bom que você tirou!' },
];

export const FISH_BY_ID = new Map(FISH.map(f => [f.id, f]));

export const RARITY_LABEL: Record<FishRarity, string> = {
  lixo: 'Lixo', comum: 'Comum', incomum: 'Incomum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário',
};
export const RARITY_COLOR: Record<FishRarity, string> = {
  lixo: '#8a8a94', comum: '#9aa8b4', incomum: '#5ac46a', raro: '#4a9ae8', epico: '#b06ae8', lendario: '#f0b030',
};

const WEIGHT: Record<FishRarity, number> = { lixo: 10, comum: 56, incomum: 22, raro: 8.5, epico: 2.8, lendario: 0.7 };

export interface FishingContext {
  /** Longe da margem (3+ blocos de água em volta). */
  deep: boolean;
  night: boolean;
  /** Pescando do barco (água funda conta mais). */
  boat?: boolean;
}

/** Peso de cada peixe no lugar e na hora (0 = não aparece). */
export function fishWeight(f: Fish, c: FishingContext): number {
  if (f.night === 'only' && !c.night) return 0;
  let w = WEIGHT[f.rarity];
  if (f.deep) w = c.deep ? w * (c.boat ? 2.2 : 1.6) : w * 0.15;
  if (f.night === 'more' && c.night) w *= 2.5;
  if (f.shape === 'camarao' && c.deep) w *= 0.2;
  if (f.rarity === 'lixo' && c.deep) w *= 0.5;
  return w;
}

/** Sorteia o peixe e o tamanho. `r1`, `r2` em [0, 1). */
export function rollFish(c: FishingContext, r1: number, r2: number): { fish: Fish; cm: number } {
  const ws = FISH.map(f => fishWeight(f, c));
  const total = ws.reduce((a, b) => a + b, 0);
  let x = r1 * total, i = 0;
  while (i < FISH.length - 1 && x >= ws[i]) { x -= ws[i]; i++; }
  const fish = FISH[i];
  // tamanho: mais perto do meio (a média de dois sorteios)
  const t = (r2 + ((r2 * 7919) % 1)) / 2;
  const cm = Math.round(fish.cm[0] + (fish.cm[1] - fish.cm[0]) * t);
  return { fish, cm };
}

/**
 * Minijogo: a agulha vai e volta na barra; acertar a faixa verde pega o
 * peixe. Peixe mais raro = faixa menor e agulha mais rápida.
 */
export interface Meter { period: number; zone: [number, number] }

export function meterFor(f: Fish, r: number): Meter {
  const width = { lixo: 0.42, comum: 0.36, incomum: 0.28, raro: 0.22, epico: 0.17, lendario: 0.13 }[f.rarity];
  const period = { lixo: 1700, comum: 1500, incomum: 1300, raro: 1100, epico: 950, lendario: 820 }[f.rarity];
  const start = 0.08 + r * (0.84 - width);
  return { period, zone: [start, start + width] };
}

/** Posição da agulha (0–1) depois de `ms`: vai e volta. */
export function needleAt(m: Meter, ms: number): number {
  const t = (ms % m.period) / m.period;
  return t < 0.5 ? t * 2 : 2 - t * 2;
}

export function meterHit(m: Meter, ms: number): boolean {
  const p = needleAt(m, ms);
  return p >= m.zone[0] && p <= m.zone[1];
}

/** Quanto tempo até o peixe morder (ms). */
export function biteDelay(r: number, c: FishingContext): number {
  return Math.round((c.night ? 2200 : 2600) + r * 5200);
}

/**
 * Quadro de peixes da Casa de Pesca: o que os pescadores pegaram hoje
 * (sai da data, igual para todo mundo no mesmo dia).
 */
export function boardOfDay(day: number): { who: string; fish: Fish; cm: number }[] {
  const who = ['Nando', 'Lúcia', 'Seu Tião', 'Marinho', 'Bia', 'Seu Zé'];
  const rnd = (k: number) => { const x = Math.sin(day * 97.13 + k * 12.9898) * 43758.5453; return x - Math.floor(x); };
  return who.slice(0, 5).map((w, k) => {
    const { fish, cm } = rollFish({ deep: k % 2 === 0, night: k === 3, boat: k === 0 }, rnd(k), rnd(k + 20));
    return { who: w, fish, cm };
  }).filter(e => e.fish.rarity !== 'lixo');
}

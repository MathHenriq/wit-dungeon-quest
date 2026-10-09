// O caçador (Solo Leveling): rank E…S e nível pela experiência da masmorra,
// pontos de status (1 por nível), portais que abrem SÓ vencendo o chefe do
// anterior, missão diária do SISTEMA, prêmio do portal (com a nota das salas),
// maestria das cartas, ferreiro de armas, boticária, Arise (chefe vencido 3
// vezes vira sombra que acompanha), Modo Pesadelo (depois do S) e o Portal da
// Semana (mesma semente para a turma inteira).
//
// Regras de valor (iguais às do resto do jogo):
//  - carta: só do chefe do portal (do deck dele), nas 3 masmorras pagas do dia;
//  - moedas: as que pegou no caminho × nota, com teto pelo rank (perdeu: metade);
//  - itens do pet vão para a mochila (perdeu: metade).
import { addItem, type Progress } from './progress';
import { playsLeft, spendPlay, today } from './life';
import { dungeonCard, FLOORS, gradeMult, petItems, RANKS, type Run, type RunOptions } from './dungeon';
import { forgeCost, upgradeCost, weapon, MAX_WEAPON_LEVEL, type WeaponId } from './dungeon-weapons';
import { masteryLevel, skillOf, skillSlots, type Skill } from './dungeon-skills';
import { NO_STATS, SOMBRAS, type HunterState, type SombraKind, type StatPts } from './hunter-state';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import type { Rarity } from '@/lib/tcg/types';

/** Portais que pagam (moedas e carta) por dia; os outros valem XP e itens. */
export const DUNGEON_PAID = 3;
/** XP para chegar em cada rank (E, D, C, B, A, S). O rank mostra o caçador; quem abre portal é o chefe vencido. */
export const RANK_XP = [0, 900, 2700, 6000, 12000, 21000];

export function hunterRank(xp: number): number {
  let r = 0;
  for (let k = 0; k < RANK_XP.length; k++) if (xp >= RANK_XP[k]) r = k;
  return r;
}
export const rankName = (r: number) => RANKS[Math.max(0, Math.min(5, r))];
/** Quanto falta para o próximo rank (null no S). */
export function nextRank(xp: number): { rank: number; falta: number; pct: number } | null {
  const r = hunterRank(xp);
  if (r >= 5) return null;
  const a = RANK_XP[r], b = RANK_XP[r + 1];
  return { rank: r + 1, falta: b - xp, pct: (xp - a) / (b - a) };
}
/** Nível do caçador (1 ponto de status por nível). */
export const hunterLevel = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 30)) + 1;
export const levelXp = (lvl: number) => 30 * (lvl - 1) ** 2;
export const STAT_MAX = 10;
export const STAT_INFO: Record<keyof StatPts, { nome: string; about: string }> = {
  forca: { nome: 'Força', about: '+4% de dano da arma curta por ponto.' },
  agilidade: { nome: 'Agilidade', about: '+2% de velocidade e esquiva 3% mais rápida por ponto.' },
  vitalidade: { nome: 'Vitalidade', about: '+1 coração a cada 3 pontos.' },
  inteligencia: { nome: 'Inteligência', about: '+4% de dano das cartas e recarga 2% menor por ponto.' },
  percepcao: { nome: 'Percepção', about: '+1,5% de crítico por ponto; o pet enxerga mais longe.' },
};
export const pointsFree = (h: HunterState) => hunterLevel(h.xp) - 1 - Object.values(h.pontos).reduce((a, b) => a + b, 0);
export function spendPoint(p: Progress, stat: keyof StatPts): Progress {
  const h = p.masmorra;
  if (pointsFree(h) <= 0 || h.pontos[stat] >= STAT_MAX) return p;
  return { ...p, masmorra: { ...h, pontos: { ...h.pontos, [stat]: h.pontos[stat] + 1 } } };
}
export const resetPoints = (p: Progress): Progress => ({ ...p, masmorra: { ...p.masmorra, pontos: { ...NO_STATS } } });

/** O portal abre vencendo o chefe do portal anterior (o E está sempre aberto). */
export function portalOpen(p: Progress, rank: number): { ok: boolean; why?: string } {
  if (rank <= 0 || (p.masmorra.vitorias[rank - 1] ?? 0) > 0) return { ok: true };
  return { ok: false, why: `Vença o chefe do portal ${rankName(rank - 1)} antes.` };
}
/** Modo Pesadelo: depois de vencer o chefe do portal S. */
export const nightmareOpen = (p: Progress) => (p.masmorra.vitorias[5] ?? 0) > 0;

/** Vida, escudo e mana pelo rank do caçador (e a Vitalidade). */
export const hunterStats = (r: number, pts: StatPts = NO_STATS) => ({ hearts: 6 + Math.floor(r / 2) + Math.floor(pts.vitalidade / 3), armor: 2 + Math.floor(r / 2), mana: 120 + 20 * r, slots: skillSlots(r) });

const masteryOf = (p: Progress, id: string) => masteryLevel(p.masmorra.maestria[id.replace(/\+$/, '')] ?? 0);
/** As habilidades que o aluno leva: cartas escolhidas que ele tem e que são de Ataque. */
export function chosenSkills(p: Progress): Skill[] {
  const slots = hunterStats(hunterRank(p.masmorra.xp)).slots;
  return p.masmorra.cartas.filter(id => (p.collection[id] ?? 0) > 0)
    .map(id => CARD_BY_ID.get(id)).filter(Boolean).map(c => skillOf(c!, masteryOf(p, c!.id))).filter((s): s is Skill => !!s).slice(0, slots);
}
/** Cartas da coleção que podem virar habilidade (as de Ataque com dano), mais fortes primeiro. */
export function skillChoices(p: Progress): Skill[] {
  return Object.keys(p.collection).filter(id => (p.collection[id] ?? 0) > 0)
    .map(id => CARD_BY_ID.get(id)).filter(Boolean).map(c => skillOf(c!, masteryOf(p, c!.id))).filter((s): s is Skill => !!s)
    .sort((a, b) => b.dmg - a.dmg);
}
export function setSkills(p: Progress, ids: string[]): Progress {
  const slots = hunterStats(hunterRank(p.masmorra.xp)).slots;
  const ok = [...new Set(ids)].filter(id => (p.collection[id] ?? 0) > 0 && CARD_BY_ID.get(id) && skillOf(CARD_BY_ID.get(id)!)).slice(0, slots);
  return { ...p, masmorra: { ...p.masmorra, cartas: ok } };
}

/** Poções que entram no portal (até 2 de cada; saem da mochila e as que sobram voltam). */
export const MAX_POTIONS = 2;

/** Semente do Portal da Semana (a mesma para a turma inteira) e o número da semana. */
export const weekOf = (now = Date.now()) => Math.floor((today(now) + 3) / 7);
export const weekSeed = (rank: number, now = Date.now()) => (weekOf(now) * 7919 + rank * 104729) % 1e9;

export interface PortalMode { pesadelo?: boolean; semana?: boolean }
/** Monta a partida de um portal para o aluno. Tira da mochila as poções levadas. */
export function portalRun(p: Progress, rank: number, seed: number, pet: string, mode: PortalMode = {}): { options: RunOptions; progress: Progress } {
  const h = p.masmorra, st = hunterStats(hunterRank(h.xp), h.pontos);
  const vida = Math.min(MAX_POTIONS, p.itens['pocao:vida'] ?? 0), mana = Math.min(MAX_POTIONS, p.itens['pocao:mana'] ?? 0);
  const progress = addItem(addItem(p, 'pocao:vida', -vida), 'pocao:mana', -mana);
  return {
    progress,
    options: {
      seed: mode.semana ? weekSeed(rank) : seed, rank,
      arms: [{ id: h.curta, lvl: h.armas[h.curta] ?? 0 }, { id: h.longa, lvl: h.armas[h.longa] ?? 0 }],
      skills: chosenSkills(p), pet, sombra: h.sombra,
      hearts: st.hearts, armor: st.armor, mana: st.mana, potions: { vida, mana },
      classe: p.caminho ?? 'desafiante', stats: h.pontos, pesadelo: mode.pesadelo, semana: mode.semana,
    },
  };
}

// ─── missão diária do SISTEMA ───────────────────────────────────────────────

export interface Mission { id: string; label: string; alvo: number; conta: (run: Run, items: Record<string, number>) => number }
export const MISSIONS: Mission[] = [
  { id: 'goblins', label: 'Derrote 10 goblins', alvo: 10, conta: r => (r.killsBy.goblin ?? 0) + (r.killsBy.arqueiro ?? 0) + (r.killsBy.xama ?? 0) + (r.killsBy.escudeiro ?? 0) + (r.killsBy.bombardeiro ?? 0) + (r.killsBy.mago ?? 0) },
  { id: 'cristais', label: 'Colete 5 cristais de mana', alvo: 5, conta: (_r, it) => Object.entries(it).filter(([k]) => k.startsWith('cristal:')).reduce((a, [, n]) => a + n, 0) },
  { id: 'minerio', label: 'Colete 8 minérios', alvo: 8, conta: (_r, it) => Object.entries(it).filter(([k]) => k.startsWith('minerio:')).reduce((a, [, n]) => a + n, 0) },
  { id: 'monstros', label: 'Derrote 30 monstros', alvo: 30, conta: r => r.kills },
  { id: 'elites', label: 'Derrote 2 elites', alvo: 2, conta: r => r.elites },
  { id: 'nota', label: 'Tire nota A ou S em 3 salas', alvo: 3, conta: r => r.grades.filter(g => g === 'A' || g === 'S').length },
  { id: 'andar', label: 'Chegue no andar 3 de um portal', alvo: 1, conta: r => (r.floor >= 3 ? 1 : 0) },
  { id: 'ervas', label: 'Colete 6 ervas', alvo: 6, conta: (_r, it) => Object.entries(it).filter(([k]) => k.startsWith('erva:')).reduce((a, [, n]) => a + n, 0) },
];
export const missionOf = (day = today()) => MISSIONS[day % MISSIONS.length];
export const MISSION_PRIZE = { moedas: 40, xp: 120 };
/** Como está a missão de hoje. */
export function missionNow(h: HunterState, day = today()): { m: Mission; feito: number; pago: boolean } {
  const m = missionOf(day);
  return h.missao.dia === day ? { m, feito: Math.min(m.alvo, h.missao.feito), pago: h.missao.pago } : { m, feito: 0, pago: false };
}

// ─── fim do portal ──────────────────────────────────────────────────────────

/** Moedas máximas por portal pelo rank. */
export const coinCap = (rank: number) => 60 + 30 * rank;
/** XP do portal (multiplicada pela nota das salas). */
export const runXp = (run: Run) => Math.round((run.kills * 2 + run.elites * 6 + (run.floor - 1) * 20 + (run.result === 'win' ? 120 + run.rank * 30 : 0)) * gradeMult(run.grades) * (run.pesadelo ? 1.5 : 1));
/** A sombra que cada rank dá na Arise. */
export const sombraOfRank = (rank: number): SombraKind => (rank <= 1 ? 'soldado' : rank <= 3 ? 'arqueira' : 'tanque');
export const ARISE_WINS = 3;

export interface PortalPrize {
  progress: Progress; paid: boolean; coins: number; card?: string; xp: number; grade: number;
  rankUp?: number; levelUp?: number; items: Record<string, number>; sombra?: SombraKind; missao?: { label: string; feito: number; alvo: number; completou: boolean };
  maestria: { card: string; antes: number; depois: number }[]; abriu?: number; semana?: { andar: number; tempo: number; recorde: boolean };
}

export function finishPortal(p: Progress, run: Run, now = Date.now()): PortalPrize {
  const day = today(now), paid = playsLeft(p, 'masmorra', day, DUNGEON_PAID) > 0, win = run.result === 'win';
  const raw = petItems(run);
  const items: Record<string, number> = {};
  for (const [k, n] of Object.entries(raw)) { const keep = win ? n : Math.floor(n / 2); if (keep > 0) items[k] = keep; }
  let next = p;
  for (const [k, n] of Object.entries(items)) next = addItem(next, k, n);
  // poções que sobraram voltam para a mochila
  next = addItem(addItem(next, 'pocao:vida', run.p.potions.vida), 'pocao:mana', run.p.potions.mana);

  const gm = gradeMult(run.grades);
  const coins = paid ? Math.min(coinCap(run.rank), Math.round((win ? run.gold : Math.floor(run.gold / 2)) * gm)) : 0;
  let card: string | undefined;
  if (paid) {
    next = spendPlay({ ...next, coins: next.coins + coins }, 'masmorra', day);
    if (win) { card = dungeonCard(run.rank, run.seed); next = { ...next, collection: { ...next.collection, [card]: (next.collection[card] ?? 0) + 1 } }; }
  }
  // caçador: XP, vitórias, Arise, maestria, Portal da Semana e missão
  const h0 = next.masmorra, xp = runXp(run), before = hunterRank(h0.xp), lvl0 = hunterLevel(h0.xp);
  const vitorias = [...h0.vitorias];
  let sombra: SombraKind | undefined, abriu: number | undefined;
  let sombras = h0.sombras;
  if (win && !run.pesadelo) {
    if (!vitorias[run.rank] && run.rank < 5) abriu = run.rank + 1;
    vitorias[run.rank] = (vitorias[run.rank] ?? 0) + 1;
    const s = sombraOfRank(run.rank);
    if (vitorias[run.rank] >= ARISE_WINS && !sombras.includes(s)) { sombras = [...sombras, s]; sombra = s; }
  }
  const maestria = { ...h0.maestria }, mastery: PortalPrize['maestria'] = [];
  for (const c of new Set([...Object.keys(run.cardUse), ...Object.keys(run.cardKills)])) {
    const id = c.replace(/\+$/, ''), a = maestria[id] ?? 0, b = a + (run.cardKills[c] ?? 0);
    maestria[id] = b;
    if (masteryLevel(b) > masteryLevel(a)) mastery.push({ card: id, antes: masteryLevel(a), depois: masteryLevel(b) });
  }
  let semana = h0.semana, sem: PortalPrize['semana'];
  if (run.semana) {
    const wk = weekOf(now), old = h0.semana.semana === wk ? h0.semana : { semana: wk, andar: 0, tempo: 0 };
    const tempo = Math.round(run.t), andar = win ? FLOORS + 1 : run.floor;
    const recorde = andar > old.andar || (andar === old.andar && (old.tempo === 0 || tempo < old.tempo));
    semana = recorde ? { semana: wk, andar, tempo } : old;
    sem = { andar, tempo, recorde };
  }
  const mm = missionNow(h0, day);
  const feito = Math.min(mm.m.alvo, mm.feito + mm.m.conta(run, items));
  const completou = !mm.pago && feito >= mm.m.alvo;
  let h: HunterState = {
    ...h0, xp: h0.xp + xp + (completou ? MISSION_PRIZE.xp : 0), vitorias, sombras, maestria, semana,
    pesadelo: h0.pesadelo + (win && run.pesadelo ? 1 : 0),
    missao: { dia: day, feito, pago: mm.pago || completou }, portais: h0.portais + 1,
  };
  if (sombra && !h.sombra) h = { ...h, sombra };
  next = { ...next, masmorra: h, coins: next.coins + (completou ? MISSION_PRIZE.moedas : 0), stats: { ...next.stats, portais: (next.stats.portais ?? 0) + 1 } };
  const after = hunterRank(h.xp), lvl1 = hunterLevel(h.xp);
  return {
    progress: next, paid, coins: coins + (completou ? MISSION_PRIZE.moedas : 0), card, xp, items, sombra, grade: gm,
    rankUp: after > before ? after : undefined, levelUp: lvl1 > lvl0 ? lvl1 : undefined, maestria: mastery, abriu, semana: sem,
    missao: { label: mm.m.label, feito, alvo: mm.m.alvo, completou },
  };
}

// ─── Associação: ferreiro e boticária ───────────────────────────────────────

type Fail = { ok: false; reason: string };
const hasAll = (p: Progress, need: Record<string, number>) => Object.entries(need).every(([k, n]) => (p.itens[k] ?? 0) >= n);
const spendAll = (p: Progress, need: Record<string, number>) => Object.entries(need).reduce((q, [k, n]) => addItem(q, k, -n), p);

/** Forja uma arma nova (fica do aluno para sempre). */
export function forgeWeapon(p: Progress, id: WeaponId): { ok: true; progress: Progress } | Fail {
  if (p.masmorra.armas[id] !== undefined) return { ok: false, reason: 'Você já tem esta arma.' };
  const c = forgeCost(weapon(id));
  if (p.coins < c.moedas) return { ok: false, reason: `Faltam moedas (${c.moedas}).` };
  if (!hasAll(p, c.minerio)) return { ok: false, reason: 'Falta minério. O pet cata nas pedras da masmorra.' };
  const q = spendAll({ ...p, coins: p.coins - c.moedas }, c.minerio);
  return { ok: true, progress: { ...q, masmorra: { ...q.masmorra, armas: { ...q.masmorra.armas, [id]: 0 } } } };
}
/** Sobe o nível de uma arma (+15% de dano, até 5). */
export function upgradeWeapon(p: Progress, id: WeaponId): { ok: true; progress: Progress } | Fail {
  const lvl = p.masmorra.armas[id];
  if (lvl === undefined) return { ok: false, reason: 'Forje a arma primeiro.' };
  if (lvl >= MAX_WEAPON_LEVEL) return { ok: false, reason: 'Já está no nível máximo.' };
  const c = upgradeCost(weapon(id), lvl);
  if (p.coins < c.moedas) return { ok: false, reason: `Faltam moedas (${c.moedas}).` };
  if (!hasAll(p, c.minerio)) return { ok: false, reason: 'Falta minério.' };
  const q = spendAll({ ...p, coins: p.coins - c.moedas }, c.minerio);
  return { ok: true, progress: { ...q, masmorra: { ...q.masmorra, armas: { ...q.masmorra.armas, [id]: lvl + 1 } } } };
}
/** Escolhe a arma que leva (só as que tem). */
export function equipWeapon(p: Progress, id: WeaponId): Progress {
  if (p.masmorra.armas[id] === undefined) return p;
  return { ...p, masmorra: { ...p.masmorra, [weapon(id).kind]: id } };
}

/** Boticária: 3 ervas viram uma poção (vida ou mana). */
export const BREW = { vida: { erva: 'erva:cura', n: 3, item: 'pocao:vida' }, mana: { erva: 'erva:mana', n: 3, item: 'pocao:mana' } } as const;
export function brew(p: Progress, what: 'vida' | 'mana'): { ok: true; progress: Progress } | Fail {
  const b = BREW[what];
  if ((p.itens[b.erva] ?? 0) < b.n) return { ok: false, reason: `Precisa de ${b.n} ${what === 'vida' ? 'ervas de cura' : 'ervas de mana'}.` };
  return { ok: true, progress: addItem(addItem(p, b.erva, -b.n), b.item, 1) };
}

/** Cristais de mana viram pó da forja de cartas (a cor diz a raridade do pó). */
export const CRYSTAL_DUST: Record<string, { rarity: Rarity; po: number }> = {
  'cristal:azul': { rarity: 'common', po: 4 }, 'cristal:roxo': { rarity: 'rare', po: 4 }, 'cristal:dourado': { rarity: 'epic', po: 6 },
};
export function crystalsToDust(p: Progress, item: string): { ok: true; progress: Progress; po: number; rarity: Rarity } | Fail {
  const c = CRYSTAL_DUST[item], n = p.itens[item] ?? 0;
  if (!c || n <= 0) return { ok: false, reason: 'Nenhum cristal desse.' };
  const q = addItem(p, item, -n);
  return { ok: true, progress: { ...q, po: { ...q.po, [c.rarity]: (q.po[c.rarity] ?? 0) + c.po * n } }, po: c.po * n, rarity: c.rarity };
}

/** Escolhe a sombra que acompanha (só as ganhas). */
export function chooseSombra(p: Progress, s: SombraKind | undefined): Progress {
  if (s && !p.masmorra.sombras.includes(s)) return p;
  return { ...p, masmorra: { ...p.masmorra, sombra: s } };
}
export { SOMBRAS };

// O que o progresso guarda da masmorra (separado de hunter.ts para o
// progress.ts poder conferir o salvo sem importar as regras).
import { WEAPON_BY_ID, START_CURTA, START_LONGA, type WeaponId } from './dungeon-weapons';

export type SombraKind = 'soldado' | 'arqueira' | 'tanque';
export const SOMBRAS: SombraKind[] = ['soldado', 'arqueira', 'tanque'];

export interface HunterState {
  /** Experiência de caçador (o rank sai dela: hunter.ts). */
  xp: number;
  /** Armas que o aluno tem (forjadas no ferreiro) e o nível de cada uma. */
  armas: Partial<Record<WeaponId, number>>;
  /** Armas que leva para o portal. */
  curta: WeaponId;
  longa: WeaponId;
  /** Cartas de Ataque escolhidas como habilidade (até 4). */
  cartas: string[];
  /** Sombras ganhas no Arise e a escolhida. */
  sombras: SombraKind[];
  sombra?: SombraKind;
  /** Chefes de portal vencidos por rank (E…S). */
  vitorias: number[];
  /** Missão diária do SISTEMA: dia, quanto já fez, se já recebeu. */
  missao: { dia: number; feito: number; pago: boolean };
  /** Portais jogados (para estatística). */
  portais: number;
}

export function newHunter(): HunterState {
  return { xp: 0, armas: { [START_CURTA]: 0, [START_LONGA]: 0 }, curta: START_CURTA, longa: START_LONGA, cartas: [], sombras: [], vitorias: [0, 0, 0, 0, 0, 0], missao: { dia: 0, feito: 0, pago: false }, portais: 0 };
}

const int = (v: unknown, min: number, max: number, dflt = min) => (Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v as number))) : dflt);

export function sanitizeHunter(raw: unknown): HunterState {
  const b = newHunter();
  if (!raw || typeof raw !== 'object') return b;
  const r = raw as Record<string, unknown>;
  const armas: Partial<Record<WeaponId, number>> = { ...b.armas };
  for (const [k, v] of Object.entries((r.armas ?? {}) as Record<string, unknown>)) if (WEAPON_BY_ID.has(k as WeaponId)) armas[k as WeaponId] = int(v, 0, 5);
  const own = (id: unknown, kind: 'curta' | 'longa', dflt: WeaponId): WeaponId =>
    typeof id === 'string' && WEAPON_BY_ID.get(id as WeaponId)?.kind === kind && armas[id as WeaponId] !== undefined ? (id as WeaponId) : dflt;
  const sombras = Array.isArray(r.sombras) ? [...new Set((r.sombras as unknown[]).filter((x): x is SombraKind => SOMBRAS.includes(x as SombraKind)))] : [];
  const m = (r.missao ?? {}) as Record<string, unknown>;
  return {
    xp: int(r.xp, 0, 1e7),
    armas,
    curta: own(r.curta, 'curta', START_CURTA),
    longa: own(r.longa, 'longa', START_LONGA),
    cartas: Array.isArray(r.cartas) ? [...new Set((r.cartas as unknown[]).filter((x): x is string => typeof x === 'string' && /^[a-z0-9-]{1,60}\+?$/.test(x)))].slice(0, 4) : [],
    sombras,
    sombra: sombras.includes(r.sombra as SombraKind) ? (r.sombra as SombraKind) : undefined,
    vitorias: Array.from({ length: 6 }, (_, i) => int((r.vitorias as unknown[] | undefined)?.[i], 0, 1e5)),
    missao: { dia: int(m.dia, 0, 1e7), feito: int(m.feito, 0, 1e4), pago: m.pago === true },
    portais: int(r.portais, 0, 1e6),
  };
}

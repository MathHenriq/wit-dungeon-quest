// ============================================================
// Onda 11.5 — helpers da árvore de skills.
// Funções puras; sem efeitos colaterais ou hooks de React.
// ============================================================

import type { FC, SVGProps } from 'react';
import type { ClassType, ElementType, Skill, TierLevel, MechanicType } from './skillsRegistry';
import { SKILLS_REGISTRY } from './skillsRegistry';

// ─── Tipos compostos ──────────────────────────────────────────────────────────

export interface SkillView extends Skill {
  /** Variante específica da classe do aluno (já resolvida). */
  variantName:        string;
  variantDescription: string;
  variantPrimaryAttr: string;
  variantDamageType:  'physical' | 'magical' | 'true';
}

export type SkillState = 'locked' | 'available' | 'unlocked';

// ─── Buscas/filtros ────────────────────────────────────────────────────────

/**
 * Retorna as 13 skills de um elemento, já com a variante da classe resolvida.
 * Ordenadas por slot crescente (1..13). Mesma ordem do registro = tier
 * crescente, slot crescente dentro do tier.
 */
export function getElementSkills(element: ElementType, classType: ClassType): SkillView[] {
  return SKILLS_REGISTRY
    .filter(s => s.element === element)
    .sort((a, b) => a.slot - b.slot)
    .map(s => {
      const v = s.variants[classType];
      return {
        ...s,
        variantName:        v.name,
        variantDescription: v.description,
        variantPrimaryAttr: v.primaryAttribute,
        variantDamageType:  v.damageType,
      };
    });
}

/** Agrupa por tier (1..5). Retorna array indexado para iterar com tier garantido. */
export function groupByTier(skills: SkillView[]): Array<{ tier: TierLevel; skills: SkillView[] }> {
  const map = new Map<TierLevel, SkillView[]>();
  for (const s of skills) {
    const arr = map.get(s.tier) ?? [];
    arr.push(s);
    map.set(s.tier, arr);
  }
  return ([1, 2, 3, 4, 5] as TierLevel[])
    .filter(t => map.has(t))
    .map(t => ({ tier: t, skills: map.get(t)! }));
}

// ─── Estado de cada slot ───────────────────────────────────────────────────

export function getSkillState(
  skill: SkillView,
  unlocked: Set<string>,
  availablePoints: number,
): SkillState {
  if (unlocked.has(skill.id)) return 'unlocked';
  const prereqsOk = skill.prerequisites.every(p => unlocked.has(p));
  if (!prereqsOk) return 'locked';
  if (availablePoints < skill.cost) return 'available'; // mostra como disponível mas sem grana
  return 'available';
}

export function canUnlock(
  skill: SkillView,
  unlocked: Set<string>,
  availablePoints: number,
): { ok: boolean; reason?: 'already_unlocked' | 'prereq_missing' | 'not_enough_points' } {
  if (unlocked.has(skill.id)) return { ok: false, reason: 'already_unlocked' };
  if (!skill.prerequisites.every(p => unlocked.has(p))) return { ok: false, reason: 'prereq_missing' };
  if (availablePoints < skill.cost) return { ok: false, reason: 'not_enough_points' };
  return { ok: true };
}

/** Soma exata de custos das skills desbloqueadas em um elemento — usado no refund. */
export function sumElementSpent(
  element: ElementType,
  classType: ClassType,
  unlocked: Set<string>,
): number {
  return getElementSkills(element, classType)
    .filter(s => unlocked.has(s.id))
    .reduce((acc, s) => acc + s.cost, 0);
}

/** True se aluno desbloqueou todos os 13 slots do elemento. */
export function isElementMastered(
  element: ElementType,
  unlocked: Set<string>,
): boolean {
  let count = 0;
  for (const id of unlocked) if (id.startsWith(`${element}_slot`)) count++;
  return count >= 13;
}

// ─── Ícones por mechanicType ───────────────────────────────────────────────

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size?: number): SVGProps<SVGSVGElement> => ({
  width: size ?? 28, height: size ?? 28, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round', strokeLinejoin: 'round',
});

const Damage: FC<IconProps>   = ({ size, ...r }) => <svg {...base(size)} {...r}><path d="M12 2l3 6 6 1-4.5 4 1 6L12 16l-5.5 3 1-6L3 9l6-1z" /></svg>;
const Heal: FC<IconProps>     = ({ size, ...r }) => <svg {...base(size)} {...r}><path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" /></svg>;
const Buff: FC<IconProps>     = ({ size, ...r }) => <svg {...base(size)} {...r}><path d="M12 4l5 6h-3v8h-4v-8H7z" /></svg>;
const Debuff: FC<IconProps>   = ({ size, ...r }) => <svg {...base(size)} {...r}><path d="M12 20l-5-6h3V6h4v8h3z" /></svg>;
const Status: FC<IconProps>   = ({ size, ...r }) => <svg {...base(size)} {...r}><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></svg>;
const Control: FC<IconProps>  = ({ size, ...r }) => <svg {...base(size)} {...r}><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>;
const Aoe: FC<IconProps>      = ({ size, ...r }) => <svg {...base(size)} {...r}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" strokeDasharray="2 2" /><circle cx="12" cy="12" r="11" strokeDasharray="1 3" /></svg>;
const Combo: FC<IconProps>    = ({ size, ...r }) => <svg {...base(size)} {...r}><path d="M5 7l4 4-4 4M11 7l4 4-4 4M17 7l4 4-4 4" /></svg>;
const Ultimate: FC<IconProps> = ({ size, ...r }) => <svg {...base(size)} {...r}><path d="M12 2l2.5 6 6.5.6-5 4.6 1.5 6.4L12 16.5 6.5 19.6 8 13.2 3 8.6 9.5 8z" fill="currentColor" stroke="currentColor" /></svg>;
const Passive: FC<IconProps>  = ({ size, ...r }) => <svg {...base(size)} {...r}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>;

export const MECHANIC_ICONS: Record<MechanicType, FC<IconProps>> = {
  damage: Damage, heal: Heal, buff: Buff, debuff: Debuff, status: Status,
  control: Control, aoe: Aoe, combo: Combo, ultimate: Ultimate, passive: Passive,
};

export const MECHANIC_LABELS: Record<MechanicType, string> = {
  damage: 'Dano', heal: 'Cura', buff: 'Buff', debuff: 'Debuff', status: 'Status',
  control: 'Controle', aoe: 'Área', combo: 'Combo', ultimate: 'Ultimate', passive: 'Passiva',
};

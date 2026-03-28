// ─── Status effect types ──────────────────────────────────────────────────────

export type StatusEffect =
  | 'burn'      // 5% maxHP per turn (ignores def)
  | 'poison'    // 8% maxHP per turn (ignores def)
  | 'freeze'    // 50% chance to be unable to act
  | 'paralyze'  // speed halved; 25% chance to be unable to act
  | 'sleep'     // unable to act for N turns
  | 'confuse'   // 33% chance to deal 10% currentHP to self
  | 'blind'     // accuracy -30%
  | 'stun'      // skip next turn (1 turn)
  | 'bleed'     // 4% maxHP per turn (physical, ignores def)
  | 'curse'     // 6% maxHP per turn
  | 'wet'       // doubles Electric damage taken
  | 'fear'      // attack -20%
  | 'atk_up'   | 'def_up'   | 'speed_up'
  | 'atk_down' | 'def_down' | 'speed_down'
  | 'accuracy_down' | 'evasion_up'
  | 'heal'      // recover HP (used via Grass abilities)
  | 'drain'     // attacker recovers HP equal to damage
  | 'recoil';   // attacker takes 25% of dealt damage

// ─── Stat modifier effects (handled by engine, not tick) ─────────────────────

export const STAT_MODIFIERS: Set<StatusEffect> = new Set([
  'atk_up','def_up','speed_up',
  'atk_down','def_down','speed_down',
  'accuracy_down','evasion_up',
  'wet','fear',
  'drain','heal','recoil',
]);

// ─── Active status on a combatant ────────────────────────────────────────────

export interface ActiveStatus {
  type:           StatusEffect;
  turnsRemaining: number;
  /** For stacking DoT, or modifier value (e.g. -0.2 atk) */
  value?:         number;
}

// ─── Default durations ────────────────────────────────────────────────────────

export function defaultDuration(effect: StatusEffect): number {
  switch (effect) {
    case 'stun':    return 1;
    case 'sleep':   return Math.floor(Math.random() * 3) + 1; // 1–3
    case 'burn':
    case 'poison':
    case 'bleed':
    case 'curse':   return 3;
    case 'freeze':
    case 'paralyze':
    case 'confuse':
    case 'fear':
    case 'blind':   return 2;
    default:        return 2;
  }
}

// ─── Tick result (applied each turn start) ───────────────────────────────────

export interface StatusTickResult {
  damage:  number;
  message: string;
  blocked: boolean; // true = target cannot act this turn
}

export function tickStatus(
  status:    ActiveStatus,
  currentHp: number,
  maxHp:     number,
): StatusTickResult {
  switch (status.type) {
    // ── DoT effects ──────────────────────────────────────────────────────────
    case 'burn': {
      const dmg = Math.max(1, Math.floor(maxHp * 0.05));
      return { damage: dmg, message: `🔥 Queimadura: −${dmg} HP`, blocked: false };
    }
    case 'poison': {
      const dmg = Math.max(1, Math.floor(maxHp * 0.08));
      return { damage: dmg, message: `☠️ Veneno: −${dmg} HP`, blocked: false };
    }
    case 'bleed': {
      const dmg = Math.max(1, Math.floor(maxHp * 0.04));
      return { damage: dmg, message: `🩸 Sangramento: −${dmg} HP`, blocked: false };
    }
    case 'curse': {
      const dmg = Math.max(1, Math.floor(maxHp * 0.06));
      return { damage: dmg, message: `💀 Maldição: −${dmg} HP`, blocked: false };
    }

    // ── Action-blocking effects ───────────────────────────────────────────────
    case 'freeze': {
      const blocked = Math.random() < 0.5;
      return {
        damage: 0,
        message: blocked ? '❄️ Congelado — não pode agir!' : '❄️ Descongelou!',
        blocked,
      };
    }
    case 'paralyze': {
      const blocked = Math.random() < 0.25;
      return {
        damage: 0,
        message: blocked ? '⚡ Paralisado — não pode agir!' : '⚡ Está paralisado.',
        blocked,
      };
    }
    case 'sleep': {
      return { damage: 0, message: '💤 Está dormindo...', blocked: true };
    }
    case 'stun': {
      return { damage: 0, message: '💫 Atordoado — turno perdido!', blocked: true };
    }

    // ── Conditional self-damage ───────────────────────────────────────────────
    case 'confuse': {
      if (Math.random() < 0.33) {
        const dmg = Math.max(1, Math.floor(currentHp * 0.10));
        return { damage: dmg, message: `😵 Confuso — atacou a si mesmo! −${dmg} HP`, blocked: false };
      }
      return { damage: 0, message: '😵 Está confuso...', blocked: false };
    }

    // ── Stat debuffs — no tick damage, just informational ────────────────────
    case 'blind':
      return { damage: 0, message: '🙈 Está cego (precisão −30%)', blocked: false };
    case 'fear':
      return { damage: 0, message: '😨 Com medo (ataque −20%)', blocked: false };

    default:
      return { damage: 0, message: '', blocked: false };
  }
}

// ─── Can the combatant act this turn? ────────────────────────────────────────

export function canAct(status: ActiveStatus | null): boolean {
  if (!status) return true;
  const result = tickStatus(status, 100, 100); // hp values unused for block-only check
  return !result.blocked;
}

// ─── Accuracy modifier from status ───────────────────────────────────────────

export function getAccuracyModifier(status: ActiveStatus | null): number {
  if (!status) return 1.0;
  if (status.type === 'blind')    return 0.70;
  if (status.type === 'paralyze') return 0.90;
  return 1.0;
}

// ─── Attack modifier from status ─────────────────────────────────────────────

export function getAttackModifier(status: ActiveStatus | null): number {
  if (!status) return 1.0;
  if (status.type === 'fear')    return 0.80;
  if (status.type === 'burn')    return 0.85; // burn weakens physical attack
  return 1.0;
}

// ─── Damage-taken modifier from status ───────────────────────────────────────

export function getDefenseModifier(status: ActiveStatus | null, incomingType?: string): number {
  if (!status) return 1.0;
  if (status.type === 'wet' && incomingType === 'Electric') return 2.0;
  return 1.0;
}

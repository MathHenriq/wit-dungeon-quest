// ============================================================
// Attribute modifiers — Patch 2.1 infrastructure
//
// Pure function that converts a character's 6 base attributes
// into runtime modifiers consumed by the BattleEngine and the
// damage calculator. No randomness here — all RNG happens in
// the call sites.
//
// Order of application (important for card stacking):
//   1. Raw forca/inteligencia feed calculateDamage as before.
//   2. calculateDamage applies physicalDmgMult / magicalDmgMult
//      and the destreza-derived critBonus / agilidade-derived
//      evadeBonus to its internal RNG checks.
//   3. The result is returned to BattleEngine.
//   4. BattleEngine applies the defender's damageTakenMult
//      (resistencia-derived) AFTER calculateDamage.
//   5. THEN equipment / card amplifiers (applyEquipStatusAmp,
//      lifesteal, drain, recoil) run on top — so cards always
//      stack ON TOP OF attribute modifiers, never under them.
// ============================================================

export interface AttributeBundle {
  forca:        number;
  destreza:     number;
  inteligencia: number;
  carisma:      number;
  agilidade:    number;
  resistencia:  number;
}

export interface AttributeModifiers {
  /** Final multiplier on physical damage dealt.  1.0 = neutral, +0.01 per Força point. */
  physicalDmgMult: number;
  /** Final multiplier on magical damage dealt.   1.0 = neutral, +0.01 per Inteligência point. */
  magicalDmgMult:  number;
  /** Additive crit-chance bonus on top of the 5% base.  +0.01 per Destreza point, capped at +0.50. */
  critBonus:       number;
  /** Multiplier applied to an ability's effectChance (status proc).  +0.01 per Carisma point, capped at +0.75 (so a 25% proc + 50 Carisma = 25% × 1.50 = 37.5%). */
  procMult:        number;
  /** Additive evade chance.  +0.01 per Agilidade point, capped at +0.35. */
  evadeBonus:      number;
  /** Multiplier on damage received.  1.0 = neutral, −0.01 per Resistência point, capped at 0.30 (70% mitigation max). */
  damageTakenMult: number;
}

/** Hard caps to avoid late-game runaway invincibility / one-shots. */
const CAPS = {
  crit:    0.50,
  evade:   0.35,
  proc:    0.75,
  defense: 0.70,
} as const;

const IDENTITY: AttributeModifiers = {
  physicalDmgMult: 1,
  magicalDmgMult:  1,
  critBonus:       0,
  procMult:        1,
  evadeBonus:      0,
  damageTakenMult: 1,
};

/** Identity-only modifier set, useful for enemies (no per-point scaling yet — Patch 2.2). */
export function identityModifiers(): AttributeModifiers {
  return { ...IDENTITY };
}

/**
 * Convert raw attribute points → multiplicative/additive modifiers.
 * Missing or negative attributes are clamped to 0 so a freshly-created
 * character with all zeroes still gets the neutral baseline.
 */
export function applyAttributeModifiers(attrs: Partial<AttributeBundle> | null | undefined): AttributeModifiers {
  if (!attrs) return identityModifiers();
  const forca        = Math.max(0, attrs.forca        ?? 0);
  const destreza     = Math.max(0, attrs.destreza     ?? 0);
  const inteligencia = Math.max(0, attrs.inteligencia ?? 0);
  const carisma      = Math.max(0, attrs.carisma      ?? 0);
  const agilidade    = Math.max(0, attrs.agilidade    ?? 0);
  const resistencia  = Math.max(0, attrs.resistencia  ?? 0);

  return {
    physicalDmgMult: 1 + forca        / 100,
    magicalDmgMult:  1 + inteligencia / 100,
    critBonus:       Math.min(CAPS.crit,    destreza   / 100),
    procMult:        1 + Math.min(CAPS.proc, carisma   / 100),
    evadeBonus:      Math.min(CAPS.evade,   agilidade  / 100),
    damageTakenMult: Math.max(1 - CAPS.defense, 1 - resistencia / 100),
  };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface AttributeEffectRow {
  key:    keyof AttributeBundle;
  label:  string;
  /** Color hint for the UI; CSS color string. */
  color:  string;
  /** Raw points the student has. */
  value:  number;
  /** Human-readable description of the current effect. */
  effect: string;
  /** True when the cap has been reached for that stat. */
  capped: boolean;
}

const META: Record<keyof AttributeBundle, { label: string; color: string }> = {
  forca:        { label: 'Força',        color: '#f87171' },
  destreza:     { label: 'Destreza',     color: '#fbbf24' },
  inteligencia: { label: 'Inteligência', color: '#60a5fa' },
  carisma:      { label: 'Carisma',      color: '#c084fc' },
  agilidade:    { label: 'Agilidade',    color: '#4ade80' },
  resistencia:  { label: 'Resistência',  color: '#94a3b8' },
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/**
 * Build a structured description of how the current attributes translate to
 * battle effects. The UI (AttributePanel) renders this directly.
 */
export function describeAttributeEffects(attrs: Partial<AttributeBundle> | null | undefined): AttributeEffectRow[] {
  const m = applyAttributeModifiers(attrs);
  const a = attrs ?? {};
  return [
    {
      key: 'forca',
      ...META.forca,
      value: a.forca ?? 0,
      effect: `+${pct(m.physicalDmgMult - 1)} dano físico`,
      capped: false, // physical dmg has no hard cap
    },
    {
      key: 'destreza',
      ...META.destreza,
      value: a.destreza ?? 0,
      effect: `+${pct(m.critBonus)} chance de crítico`,
      capped: m.critBonus >= CAPS.crit,
    },
    {
      key: 'inteligencia',
      ...META.inteligencia,
      value: a.inteligencia ?? 0,
      effect: `+${pct(m.magicalDmgMult - 1)} dano mágico`,
      capped: false,
    },
    {
      key: 'carisma',
      ...META.carisma,
      value: a.carisma ?? 0,
      effect: `+${pct(m.procMult - 1)} chance de efeito`,
      capped: (m.procMult - 1) >= CAPS.proc,
    },
    {
      key: 'agilidade',
      ...META.agilidade,
      value: a.agilidade ?? 0,
      effect: `+${pct(m.evadeBonus)} chance de esquiva`,
      capped: m.evadeBonus >= CAPS.evade,
    },
    {
      key: 'resistencia',
      ...META.resistencia,
      value: a.resistencia ?? 0,
      effect: `−${pct(1 - m.damageTakenMult)} dano recebido`,
      capped: (1 - m.damageTakenMult) >= CAPS.defense,
    },
  ];
}

export const ATTRIBUTE_CAPS = CAPS;

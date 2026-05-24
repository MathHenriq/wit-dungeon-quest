// Patch 6.3 — HUD lateral de modificadores ativos em batalha.
//
// Lê do BattleContext (já reativo) dois feeds de status:
//   • ActiveStatus    — sistema legado (1 efeito principal por combatente)
//   • EquipStatus[]   — sistema do equipamento (buffs/debuffs múltiplos)
// e renderiza painéis separados pra jogador e inimigo. Tooltip ao hover
// dá descrição completa.

import { useMemo, useState } from "react";
import type { ActiveStatus } from "@/lib/battle/statusEffects";
import type { EquipStatus } from "@/lib/battle/statusEffects";

interface Props {
  playerName:       string;
  enemyName:        string;
  playerStatus:     ActiveStatus | null;
  enemyStatus:      ActiveStatus | null;
  playerStatuses:   EquipStatus[];
  enemyStatuses:    EquipStatus[];
  /** Guild raid phase (1–4). Drives synthetic CURSED/ENRAGE chips. */
  raidPhase?:       number;
}

interface DisplayItem {
  key:        string;
  icon:       string;
  label:      string;
  detail:     string;        // intensidade + duração curtos
  tooltip:    string;        // descrição completa
  polarity:   "positive" | "negative" | "neutral";
}

// ── Status → icon + label + polarity ────────────────────────────────────────
// "polarity" is from the carrier's perspective. A burn on the enemy is still
// "negative" for the enemy (red), but it's *good* for the player to see — the
// HUD groups it visually under the enemy's panel.

const META: Record<string, { icon: string; label: string; polarity: DisplayItem["polarity"]; desc: string }> = {
  // ActiveStatus (legacy)
  burn:          { icon: "🔥", label: "Queimadura",     polarity: "negative", desc: "5% do HP máximo por turno. Reduz ataque físico em 15%." },
  poison:        { icon: "☠️", label: "Veneno",         polarity: "negative", desc: "8% do HP máximo por turno." },
  freeze:        { icon: "❄️", label: "Congelado",      polarity: "negative", desc: "50% de chance de perder o turno." },
  paralyze:      { icon: "⚡", label: "Paralisia",       polarity: "negative", desc: "Precisão −10% e 25% de chance de perder o turno." },
  sleep:         { icon: "💤", label: "Dormindo",       polarity: "negative", desc: "Pula turnos até despertar." },
  confuse:       { icon: "😵", label: "Confuso",        polarity: "negative", desc: "33% de chance de causar 10% do HP atual em si mesmo." },
  blind:         { icon: "🙈", label: "Cego",           polarity: "negative", desc: "Precisão reduzida em 30%." },
  stun:          { icon: "💫", label: "Atordoado",      polarity: "negative", desc: "Perde o próximo turno." },
  bleed:         { icon: "🩸", label: "Sangramento",    polarity: "negative", desc: "4% do HP máximo por turno (ignora defesa)." },
  curse:         { icon: "💀", label: "Maldição",       polarity: "negative", desc: "6% do HP máximo por turno." },
  wet:           { icon: "💧", label: "Encharcado",     polarity: "negative", desc: "Dano elétrico recebido em dobro." },
  fear:          { icon: "😨", label: "Medo",           polarity: "negative", desc: "Ataque reduzido em 20%." },
  atk_up:        { icon: "💪", label: "Ataque ↑",       polarity: "positive", desc: "Ataque amplificado." },
  def_up:        { icon: "🛡️", label: "Defesa ↑",       polarity: "positive", desc: "Defesa amplificada." },
  speed_up:      { icon: "💨", label: "Velocidade ↑",   polarity: "positive", desc: "Velocidade amplificada." },
  atk_down:      { icon: "⬇️", label: "Ataque ↓",       polarity: "negative", desc: "Ataque reduzido." },
  def_down:      { icon: "🛡️", label: "Defesa ↓",       polarity: "negative", desc: "Defesa reduzida." },
  speed_down:    { icon: "🐌", label: "Velocidade ↓",   polarity: "negative", desc: "Velocidade reduzida." },
  accuracy_down: { icon: "🎯", label: "Precisão ↓",     polarity: "negative", desc: "Precisão reduzida." },
  evasion_up:    { icon: "🌫️", label: "Esquiva ↑",      polarity: "positive", desc: "Chance de esquiva amplificada." },
  heal:          { icon: "💚", label: "Regeneração",    polarity: "positive", desc: "Recuperando HP a cada turno." },
  drain:         { icon: "🩸", label: "Drenar",         polarity: "positive", desc: "Cura igual ao dano causado." },
  recoil:        { icon: "↩️", label: "Recuo",          polarity: "negative", desc: "Sofre 25% do dano causado." },

  // EquipStatus
  defense_down:  { icon: "🛡️", label: "Defesa ↓",       polarity: "negative", desc: "Defesa física e mágica reduzidas pelo valor indicado." },
  death_curse:   { icon: "🪦", label: "Maldição Mortal",polarity: "negative", desc: "Veneno intenso permanente." },
  evasion:       { icon: "🌪️", label: "Esquiva Auto.",  polarity: "positive", desc: "Esquiva automaticamente os próximos ataques." },
  magic_immune:  { icon: "🔮", label: "Imune a Magia",  polarity: "positive", desc: "Imune a dano mágico pelos turnos restantes." },
  physical_amp:  { icon: "⚔️", label: "Físico ×",       polarity: "positive", desc: "Próximos ataques físicos multiplicados." },
  magic_amp:     { icon: "✨", label: "Mágico ×",       polarity: "positive", desc: "Próximos ataques mágicos multiplicados." },
  counter:       { icon: "🪞", label: "Contra-ataque",  polarity: "positive", desc: "Reflete uma parte do dano recebido." },
  lifesteal:     { icon: "❤️‍🔥", label: "Roubo de Vida", polarity: "positive", desc: "Cura percentual do dano causado nos próximos ataques." },
  shield:        { icon: "🪨", label: "Escudo",         polarity: "positive", desc: "Absorve HP de dano recebido." },
  invincible:    { icon: "💎", label: "Invencível",     polarity: "positive", desc: "Nega o próximo hit recebido." },
  vulnerable:    { icon: "💢", label: "Vulnerável",     polarity: "negative", desc: "Recebe mais dano por percentual indicado." },
  vampiric:      { icon: "🦇", label: "Vampírico",      polarity: "positive", desc: "Roubo de vida automático em cada ataque." },
};

function fmtDetail(s: EquipStatus): string {
  const parts: string[] = [];
  if (s.value     != null) parts.push(`${s.value}/turno`);
  if (s.multiplier!= null) parts.push(`×${s.multiplier}`);
  if (s.percent   != null) parts.push(`${Math.round(s.percent * 100)}%`);
  if (s.charges   != null) parts.push(`${s.charges}× restante(s)`);
  if (s.turnsLeft != null) {
    if (s.turnsLeft < 0) parts.push("permanente");
    else                 parts.push(`${s.turnsLeft}t restante(s)`);
  }
  if (s.cooldownRounds != null && s.cooldownRounds > 0 && s.cooldownRounds < 999) {
    parts.push(`recarga ${s.cooldownRounds}`);
  }
  return parts.join(" · ");
}

function activeStatusToItem(s: ActiveStatus, side: "player" | "enemy"): DisplayItem {
  const meta = META[s.type] ?? { icon: "✦", label: s.type, polarity: "neutral" as const, desc: "" };
  return {
    key:      `${side}-active-${s.type}`,
    icon:     meta.icon,
    label:    meta.label,
    detail:   `${s.turnsRemaining}t restante(s)${s.value != null ? ` · ${s.value}` : ""}`,
    tooltip:  meta.desc,
    polarity: meta.polarity,
  };
}

function equipStatusToItem(s: EquipStatus, side: "player" | "enemy", idx: number): DisplayItem {
  const meta = META[s.type] ?? { icon: "✦", label: s.type, polarity: "neutral" as const, desc: "" };
  return {
    key:      `${side}-equip-${s.type}-${idx}`,
    icon:     meta.icon,
    label:    meta.label,
    detail:   fmtDetail(s),
    tooltip:  meta.desc,
    polarity: meta.polarity,
  };
}

export function ActiveModifiersHUD({
  playerName, enemyName,
  playerStatus, enemyStatus,
  playerStatuses, enemyStatuses,
  raidPhase,
}: Props) {

  const playerItems = useMemo<DisplayItem[]>(() => {
    const out: DisplayItem[] = [];
    if (raidPhase === 2) {
      out.push({
        key:      "player-raid-cursed",
        icon:     "💀",
        label:    "CURSED",
        detail:   "−5% HP máx / turno",
        tooltip:  "Maldição da Guilda: o boss drena 5% do seu HP máximo a cada turno (dano puro, ignora defesas).",
        polarity: "negative",
      });
    }
    if (playerStatus) out.push(activeStatusToItem(playerStatus, "player"));
    playerStatuses.forEach((s, i) => out.push(equipStatusToItem(s, "player", i)));
    return out;
  }, [playerStatus, playerStatuses, raidPhase]);

  const enemyItems = useMemo<DisplayItem[]>(() => {
    const out: DisplayItem[] = [];
    if (raidPhase === 4) {
      out.push({
        key:      "enemy-raid-enrage",
        icon:     "🔥",
        label:    "ENRAGE",
        detail:   "dano ×2",
        tooltip:  "Boss enfurecido: todo dano do boss é dobrado nesta fase.",
        polarity: "negative",
      });
    }
    if (enemyStatus) out.push(activeStatusToItem(enemyStatus, "enemy"));
    enemyStatuses.forEach((s, i) => out.push(equipStatusToItem(s, "enemy", i)));
    return out;
  }, [enemyStatus, enemyStatuses, raidPhase]);

  if (playerItems.length === 0 && enemyItems.length === 0) return null;

  return (
    <aside className="amh-root" aria-label="Modificadores ativos">
      <style>{CSS}</style>

      <Panel title={playerName} subtitle="Você" side="player" items={playerItems} />
      <Panel title={enemyName}  subtitle="Inimigo" side="enemy"  items={enemyItems} />
    </aside>
  );
}

function Panel({
  title, subtitle, side, items,
}: {
  title: string; subtitle: string;
  side: "player" | "enemy";
  items: DisplayItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div className={`amh-panel amh-${side}`}>
      <div className="amh-head">
        <span className="amh-side">{subtitle}</span>
        <span className="amh-name">{title}</span>
      </div>
      <div className="amh-list">
        {items.map(it => <Chip key={it.key} item={it} />)}
      </div>
    </div>
  );
}

function Chip({ item }: { item: DisplayItem }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className={`amh-chip amh-${item.polarity}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      tabIndex={0}
      role="tooltip"
      aria-label={`${item.label}: ${item.tooltip}`}
    >
      <span className="amh-icon" aria-hidden>{item.icon}</span>
      <span className="amh-text">
        <span className="amh-label">{item.label}</span>
        <span className="amh-detail">{item.detail}</span>
      </span>
      {hover && item.tooltip && (
        <span className="amh-tooltip" role="presentation">{item.tooltip}</span>
      )}
    </div>
  );
}

const CSS = `
.amh-root {
  position: fixed;
  top: 96px;
  right: 12px;
  z-index: 30;
  width: min(280px, calc(100vw - 24px));
  display: flex; flex-direction: column; gap: 10px;
  pointer-events: auto;
  font-family: 'Exo 2', sans-serif;
  color: #e6f0ff;
}
@media (max-width: 768px) {
  .amh-root {
    width: 200px;
    top: 70px;
    font-size: 11px;
  }
}

.amh-panel {
  position: relative;
  padding: 10px 12px 11px;
  border-radius: 12px;
  background: rgba(10,14,26,0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 12px 30px rgba(0,0,0,0.45);
}
.amh-player::before, .amh-enemy::before {
  content: ""; position: absolute; left: -1px; top: 8px; bottom: 8px;
  width: 3px; border-radius: 999px;
}
.amh-player::before { background: linear-gradient(180deg, #4ade80, #22d3ee); }
.amh-enemy::before  { background: linear-gradient(180deg, #f05050, #f59e0b); }

.amh-head {
  display: flex; align-items: baseline; gap: 6px;
  margin-bottom: 8px;
}
.amh-side {
  font-family: 'Cinzel', serif;
  font-size: 9px; font-weight: 800;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
.amh-name {
  font-size: 12.5px; font-weight: 700; color: #fff;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 180px;
}

.amh-list {
  display: flex; flex-direction: column; gap: 5px;
}

.amh-chip {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 11.5px;
  transition: all 0.15s ease;
  cursor: help;
}
.amh-chip:hover, .amh-chip:focus { background: rgba(255,255,255,0.07); }
.amh-positive {
  background: rgba(74,222,128,0.10);
  border-color: rgba(74,222,128,0.35);
}
.amh-negative {
  background: rgba(240,80,80,0.10);
  border-color: rgba(240,80,80,0.35);
}
.amh-icon { font-size: 14px; line-height: 1; flex-shrink: 0; }
.amh-text { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; flex: 1; }
.amh-label {
  font-weight: 700; color: #fff;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.amh-positive .amh-label { color: #86efac; }
.amh-negative .amh-label { color: #fda4a4; }
.amh-detail {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9.5px; color: rgba(255,255,255,0.55);
  letter-spacing: 0.04em;
}

.amh-tooltip {
  position: absolute;
  right: calc(100% + 8px); top: 50%;
  transform: translateY(-50%);
  width: 220px;
  padding: 8px 10px;
  background: rgba(2,4,10,0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  font-size: 11px;
  color: rgba(255,255,255,0.85);
  box-shadow: 0 10px 24px rgba(0,0,0,0.6);
  pointer-events: none;
  z-index: 100;
  white-space: normal;
  line-height: 1.4;
}
@media (max-width: 768px) {
  .amh-tooltip {
    right: auto; left: 0; top: calc(100% + 6px);
    transform: none; width: 200px;
  }
}
`;

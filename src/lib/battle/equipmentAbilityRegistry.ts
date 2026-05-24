import type { BattleContext } from './BattleEngine';
import type { Ability } from '@/types/character';

// ═══════════════════════════════════════════════════════════════════════════
// PATCH 2.5 — Generic mechanic patterns for higher-rarity card handlers.
//
// The BattleContext now carries the following inert-by-default slots, all
// honoured automatically by the engine:
//
//   reviveCharges:           number
//   enemySkipTurns:          number
//   autoDodgeTurnsLeft:      number
//   erasedEnemyAbilityIds:   string[]
//   lastEnemyAbilityId:      string | null   (engine writes after enemy attacks)
//   copiedEnemyAbilityId:    string | null   (your card sets it; consume manually)
//
// Copy/paste any of the 6 patterns below into a real card's `execute`,
// rename the key, and fill in the flavour text. None of these are real
// cards — they exist as documentation only. The engine plumbing is in
// BattleEngine.ts (search for "Patch 2.5").
//
// ── 1. REVIVE ONCE PER BATTLE ──
//
//   execute: async (ctx) => {
//     ctx.reviveCharges += 1;
//     return { success: true, message: '...' };
//   }
//   // → next lethal hit restores player to 50% hpMax automatically.
//
// ── 2. AUTO-DODGE FOR N TURNS ──
//
//   execute: async (ctx) => {
//     ctx.autoDodgeTurnsLeft = Math.max(ctx.autoDodgeTurnsLeft, 2);
//     return { success: true, message: '...' };
//   }
//   // → every enemy attack within N turns is auto-evaded.
//
// ── 3. ERASE AN ENEMY ABILITY ──
//
//   execute: async (ctx) => {
//     const target = ctx.enemy.abilities[0]?.id; // or pick strongest, etc.
//     if (target && !ctx.erasedEnemyAbilityIds.includes(target)) {
//       ctx.erasedEnemyAbilityIds.push(target);
//     }
//     return { success: true, message: '...' };
//   }
//   // → enemy can no longer choose that ability for the rest of the fight.
//
// ── 4. COPY LAST ENEMY ABILITY (set a pointer) ──
//
//   execute: async (ctx) => {
//     ctx.copiedEnemyAbilityId = ctx.lastEnemyAbilityId;
//     return { success: true, message: '...' };
//   }
//   // → another card can read ctx.copiedEnemyAbilityId and replay it.
//   // (Actual replay must be implemented in the card that consumes it.)
//
// ── 5. TIME STOP — SKIP NEXT N ENEMY TURNS ──
//
//   execute: async (ctx) => {
//     ctx.enemySkipTurns += 2;
//     return { success: true, message: '...' };
//   }
//   // → the engine auto-consumes one charge per enemy turn until 0.
//
// ── 6. DAMAGE THAT SCALES WITH MISSING HP ──
//
//   execute: async (ctx) => {
//     const missing = ctx.player.hpMax - ctx.player.hpCurrent;
//     const dmg     = 30 + Math.floor(missing * 0.5);  // tune coefficient
//     ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
//     return { success: true, damage: dmg, message: '...' };
//   }
//
// Important when writing the actual cards:
//   * Visible flavour text on rarity "???" should NOT reveal the mechanic.
//   * Caps / charges: prefer bumping counters with `+=` rather than
//     hard-setting, so two stacking cards combine instead of overriding.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Result type ──────────────────────────────────────────────────────────────

export interface BattleActionResult {
  success:        boolean;
  message?:       string;
  damage?:        number;
  heal?:          number;
  revived?:       boolean;
  /** Damage ignores defFisica/defMagica (engine must honour this flag) */
  trueDamage?:    boolean;
  /** Attack cannot be evaded or missed */
  guaranteedHit?: boolean;
}

// ─── Handler interface ────────────────────────────────────────────────────────

export interface EquipmentAbilityHandler {
  execute: (ctx: BattleContext) => Promise<BattleActionResult>;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const registry: Record<string, EquipmentAbilityHandler> = {

  // ═══════════════════════════════════════════════════════════════
  // COMUM — Dano flat. Sem status, sem mecânicas. Faixa: 15–25.
  // ═══════════════════════════════════════════════════════════════

  'arthurs-excalibur_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `EXCALIBUR (ARTHUR) — a espada do rei lendário irradia luz dourada. ${dmg} de dano.`,
      };
    },
  },

  'behelit_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `BEHELIT — o Ovo do Rei dos Demônios pulsa de vermelho. ${dmg} de dano liberado. Algo foi convocado.`,
      };
    },
  },

  'berserker-rag_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `FÚRIA BERSERKER — a ira sem razão explode em força bruta. ${dmg} de dano.`,
      };
    },
  },

  'bloodlust_combo': {
    execute: async (ctx) => {
      // Sede de sangue: escala com HP faltando do inimigo (predador sente o fraco)
      const missingPct = 1 - (ctx.enemy.hpCurrent / ctx.enemy.hpMax);
      const dmg = Math.floor(22 + missingPct * 30);
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `SEDE DE SANGUE — quanto mais fraco o inimigo, mais o predador fareja. ${dmg} de dano.`,
      };
    },
  },

  'cannon-arm_combo': {
    execute: async (ctx) => {
      const dmg = 24;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `BRAÇO-CANHÃO — disparo em alta velocidade, ponto de impacto calculado. ${dmg} de dano.`,
      };
    },
  },

  'dark-magician_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `MAGO NEGRO — o feiticeiro supremo do Egito conjura! ${dmg} de dano mágico.`,
      };
    },
  },

  'direct-shot_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `TIRO DIRETO — sem desvio, sem piedade, sem erro. ${dmg} de dano garantido.`,
      };
    },
  },

  'disaster_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `CALAMIDADE — uma onda de desgraça abate sobre o inimigo. ${dmg} de dano.`,
      };
    },
  },

  'enma_combo': {
    execute: async (ctx) => {
      // Enma de Zoro: drena Haki do wielder mas corta até a alma (trueDamage)
      const cost = Math.floor(ctx.player.hpMax * 0.08);
      ctx.player.hpCurrent = Math.max(1, ctx.player.hpCurrent - cost);
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        trueDamage: true,
        message: `ENMA — a katana drena o Haki do portador! Custo: ${cost} HP próprio. ${dmg} de dano verdadeiro que corta até a alma. Ignora toda defesa.`,
      };
    },
  },

  'erasure_combo': {
    execute: async (ctx) => {
      // Aizawa: apaga a habilidade mais recente usada pelo inimigo
      // Se inimigo ainda não usou habilidade, apaga a primeira da pool
      const target = ctx.lastEnemyAbilityId ?? ctx.enemy.abilities[0]?.id ?? null;
      if (!target) {
        return { success: false, message: 'ERASURE — nenhuma habilidade inimiga identificada para anular.' };
      }
      if (!ctx.erasedEnemyAbilityIds.includes(target)) {
        ctx.erasedEnemyAbilityIds.push(target);
      }
      const wasLast = !!ctx.lastEnemyAbilityId;
      return {
        success: true,
        message: wasLast
          ? 'ERASURE — os olhos de Aizawa brilham em vermelho. A última habilidade usada pelo inimigo foi ANULADA permanentemente desta batalha.'
          : 'ERASURE — Aizawa identifica a ameaça principal e a ANULA antes que seja usada.',
      };
    },
  },

  'explosion-rush_combo': {
    execute: async (ctx) => {
      // Bakugo: sequência de explosões em cadeia — 4 hits
      const hits = 4;
      const dmgPerHit = 10;
      const total = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: total,
        message: `DIE! Bakugo encadeia ${hits} explosões de nitroglicerina. ${total} de dano total. Inimigo atordoado pela pressão contínua.`,
      };
    },
  },

  'fairy-tail-mark_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `MARCA DA FAIRY TAIL — a guilda responde ao chamado! ${dmg} de dano pelo poder de pertencer a algo maior que si mesmo.`,
      };
    },
  },

  'foice-tripla_combo': {
    execute: async (ctx) => {
      // Três cortes em arco simultâneos
      const hits = 3;
      const dmgPerHit = 7;
      const total = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      return {
        success: true,
        damage: total,
        message: `FOICE TRIPLA — três cortes simultâneos em arco perfeito! ${total} de dano total.`,
      };
    },
  },

  'gomu-gomu-no-mi_combo': {
    execute: async (ctx) => {
      // Elasticidade de Luffy: golpes que aceleram ao esticar → multi-hit
      const hits = 3;
      const dmgPerHit = 8;
      const total = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      return {
        success: true,
        damage: total,
        message: `GOMU GOMU NO GATLING — Luffy estica os braços! ${hits} socos de borracha em sequência: ${total} de dano. Elástico demais para ser interceptado.`,
      };
    },
  },

  'gura-gura_combo': {
    execute: async (ctx) => {
      // Fruta do Tremor de Barba Branca: sismo que racha o ar e despedaça armaduras
      const dmg = Math.floor(ctx.enemy.hpMax * 0.18) + 15;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'defense_down', value: 35, turnsLeft: 3 });
      return {
        success: true,
        damage: dmg,
        message: `GURA GURA NO MI — o ar racha! ${dmg} de dano sísmico + armadura inimiga destroçada pelo tremor por 3 turnos.`,
      };
    },
  },

  'half-cold-half-hot_combo': {
    execute: async (ctx) => {
      // Todoroki: lado esquerdo (Gelo) + lado direito (Fogo) em sequência
      // Próximos 2 ataques físicos: 1º Ice, 2º Fire
      ctx.elementOverrides.push({
        key: 'todoroki_ice_left',
        replaceWith: 'Ice',
        charges: 1,
        sourceCardKey: 'half-cold-half-hot_combo',
        onlyDamageType: 'Physical',
      });
      ctx.elementOverrides.push({
        key: 'todoroki_fire_right',
        replaceWith: 'Fire',
        charges: 1,
        sourceCardKey: 'half-cold-half-hot_combo',
        onlyDamageType: 'Physical',
      });
      // Dano imediato do golpe combinado de ativação
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 8, turnsLeft: 2 });
      return {
        success: true,
        damage: dmg,
        message: `HALF-COLD HALF-HOT — Todoroki libera gelo e fogo em simultâneo! ${dmg} de dano + burn. Os próximos 2 ataques físicos serão Ice e Fire respectivamente.`,
      };
    },
  },

  'hamon-overdrive_combo': {
    execute: async (ctx) => {
      // Hamon = energia solar amplificada pela respiração → burn (calor solar)
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 10, turnsLeft: 3 });
      return {
        success: true,
        damage: dmg,
        message: `HAMON OVERDRIVE — energia solar canalizada pelos pulmões de Joseph Joestar! ${dmg} de dano + calor solar queima por 3 turnos (10 HP/turno).`,
      };
    },
  },

  'ice-make_combo': {
    execute: async (ctx) => {
      // Ice Make de Gray: cria armadura defensiva E lança ofensiva em simultâneo
      const shield = 40;
      ctx.playerStatuses.push({ type: 'shield', value: shield });
      ctx.enemyStatuses.push({ type: 'freeze', turnsLeft: 1 });
      return {
        success: true,
        message: `ICE MAKE: ARMOR & LANCE — Gray congela o ar em escudo e projétil! Escudo de ${shield} HP + inimigo congelado por 1 turno.`,
      };
    },
  },

  'instant-transmission_combo': {
    execute: async (ctx) => {
      // Teletransporte de Goku: aparece atrás do inimigo + esquiva do próximo ataque
      ctx.playerStatuses.push({ type: 'evasion', charges: 1 });
      const dmg = 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `TELETRANSPORTE — Goku sente o ki e aparece atrás do inimigo! ${dmg} de dano pelo ataque surpresa + próximo ataque inimigo esquivado.`,
      };
    },
  },

  'jajanken_combo': {
    execute: async (ctx) => {
      // Jajanken de Gon: pedra (força), tesoura (velocidade), papel (alcance) — aleatório
      const roll = Math.floor(Math.random() * 3);
      switch (roll) {
        case 0: {
          // JAN (Pedra): dano máximo + stun
          const dmg = 55;
          ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
          ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
          return { success: true, damage: dmg, message: `JAJANKEN — JAN (PEDRA)! Todo o Nen de Gon concentrado num soco. ${dmg} de dano + inimigo atordoado.` };
        }
        case 1: {
          // KEN (Tesoura): dano moderado + evasion
          const dmg = 35;
          ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
          ctx.playerStatuses.push({ type: 'evasion', charges: 2 });
          return { success: true, damage: dmg, message: `JAJANKEN — KEN (TESOURA)! Dedos com Nen cortante. ${dmg} de dano + 2 esquivas de velocidade.` };
        }
        default: {
          // PON (Papel): dano à distância + defense_down
          const dmg = 40;
          ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
          ctx.enemyStatuses.push({ type: 'defense_down', value: 30, turnsLeft: 2 });
          return { success: true, damage: dmg, message: `JAJANKEN — PON (PAPEL)! Onda de Nen à distância. ${dmg} de dano + defesa inimiga destroçada por 2 turnos.` };
        }
      }
    },
  },

  'knight-killer_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'defense_down', value: 20, turnsLeft: 2 });
      return {
        success: true,
        damage: dmg,
        message: `MATA-CAVALEIROS — especializado em abrir armaduras pesadas. ${dmg} de dano + defesa reduzida por 2 turnos.`,
      };
    },
  },

  'kurapikas-chains_combo': {
    execute: async (ctx) => {
      // Correntes do Juízo de Kurapika: paralisam + regra de execução abaixo de 25% HP
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 2 });
      if (!ctx.executionRules.some(r => r.key === 'kurapika_execute')) {
        ctx.executionRules.push({
          key: 'kurapika_execute',
          thresholdHpFraction: 0.25,
          excludesBosses: false,
          message: 'CORRENTE DO JUÍZO — o inimigo caiu abaixo de 25% HP. Execução de Kurapika ativada!',
        });
      }
      return {
        success: true,
        message: 'CORRENTES DE KURAPIKA — aprisionado por 2 turnos! A Corrente do Juízo está ativa: se o inimigo cair abaixo de 25% HP, execução automática.',
      };
    },
  },

  'mana-zone_combo': {
    execute: async (ctx) => {
      // Mana Zone de Yuno: controle total da magia ao redor → amplifica TODO tipo de dano
      ctx.playerStatuses.push({ type: 'magic_amp', multiplier: 2, charges: 3 });
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 1.5, charges: 3 });
      return {
        success: true,
        message: 'MANA ZONE — Yuno controla toda a magia ao redor do corpo! Próximos 3 ataques mágicos ×2 e físicos ×1,5. Nenhum ponto cego.',
      };
    },
  },

  'mera-mera_combo': {
    execute: async (ctx) => {
      // Fruta do Fogo de Sabo: o usuário VIRA chama → próximos ataques Fire + burn
      ctx.elementOverrides.push({
        key: 'mera_fire_strike',
        replaceWith: 'Fire',
        charges: 2,
        sourceCardKey: 'mera-mera_combo',
      });
      ctx.enemyStatuses.push({ type: 'burn', value: 12, turnsLeft: 3 });
      return {
        success: true,
        message: 'MERA MERA NO MI — Sabo se transforma em chama viva! Próximos 2 ataques serão Fire + burn ativo por 3 turnos (12 HP/turno).',
      };
    },
  },

  'meta-vision_combo': {
    execute: async (ctx) => {
      // Análise de pontos fracos → defense_down + vulnerable
      ctx.enemyStatuses.push({ type: 'defense_down', value: 20, turnsLeft: 3 });
      ctx.enemyStatuses.push({ type: 'vulnerable', percent: 0.15, turnsLeft: 3 });
      return {
        success: true,
        message: 'META VISION — análise completa do adversário! Defesa reduzida em 20 + 15% mais vulnerável por 3 turnos.',
      };
    },
  },

  'metal-vessel_combo': {
    execute: async (ctx) => {
      // Magi: Djinn equip → amplifica magia
      ctx.playerStatuses.push({ type: 'magic_amp', multiplier: 1.75, charges: 2 });
      return {
        success: true,
        message: 'VASO METÁLICO — Djinn equip ativado! O poder do rei dos djinn canalizado. Próximos 2 ataques mágicos com 75% de bônus.',
      };
    },
  },

  'millennium-puzzle_combo': {
    execute: async (ctx) => {
      // Yu-Gi-Oh: Shadow Game → inimigo joga contra si + vulnerable
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.12) + 10;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'vulnerable', percent: 0.20, turnsLeft: 2 });
      return {
        success: true,
        damage: dmg,
        message: `PUZZLE DO MILÊNIO — o Faraó das Trevas inicia um Shadow Game. ${dmg} de dano + inimigo 20% mais vulnerável por 2 turnos.`,
      };
    },
  },

  'nichirin_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `LÂMINA NICHIRIN — forjada com a luz do sol que tudo absorve. ${dmg} de dano. Letal para demônios.`,
      };
    },
  },

  'ora-barrage_combo': {
    execute: async (ctx) => {
      // Star Platinum: rajada de socos em velocidade absurda — 7 hits
      const hits = 7;
      const dmgPerHit = 8;
      const total = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      return {
        success: true,
        damage: total,
        message: `ORA ORA ORA ORA ORA ORA ORA! Star Platinum desfere ${hits} golpes em sequência. ${total} de dano total. "Good grief."`,
      };
    },
  },

  'predator-eye_combo': {
    execute: async (ctx) => {
      // Localiza ponto fraco → vulnerable por 2 turnos (sem dano direto)
      ctx.enemyStatuses.push({ type: 'vulnerable', percent: 0.20, turnsLeft: 2 });
      return {
        success: true,
        message: 'OLHO DO PREDADOR — ponto fraco localizado e exposto. Inimigo 20% mais vulnerável a todo dano por 2 turnos.',
      };
    },
  },

  'puppet-naruto_combo': {
    execute: async (ctx) => {
      // Técnica de Marionete de Sasori: controla o inimigo para atacar a si mesmo
      const selfDmg = Math.floor(ctx.enemy.hpCurrent * 0.12);
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - selfDmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: selfDmg,
        message: `TÉCNICA DE MARIONETE — os fios de Sasori controlam o inimigo! ${selfDmg} de dano causado pelo próprio inimigo + atordoado por 1 turno (fios cortados).`,
      };
    },
  },

  'quick-attack_combo': {
    execute: async (ctx) => {
      const dmg = 16;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `ATAQUE RELÂMPAGO — velocidade antes da reação do inimigo. ${dmg} de dano. Inevitável.`,
      };
    },
  },

  'quinque_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `QUINQUE — arma forjada do kagune de um ghoul. ${dmg} de dano. Os investigadores usam a força do inimigo contra ele.`,
      };
    },
  },

  'rinkaku-kagune_combo': {
    execute: async (ctx) => {
      // Kagune Rinkaku de Kaneki: múltiplos tentáculos que perfuram
      const hits = 3;
      const dmgPerHit = 7;
      const total = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      ctx.enemyStatuses.push({ type: 'bleed', value: 8, turnsLeft: 3 });
      return {
        success: true,
        damage: total,
        message: `KAGUNE RINKAKU — ${hits} tentáculos perfuram o inimigo! ${total} de dano total + sangramento por 3 turnos (8 HP/turno).`,
      };
    },
  },

  'rulers-authority_combo': {
    execute: async (ctx) => {
      // Autoridade do Governante (Ban/Meliodas): ordem absoluta → stun + vulnerable
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      ctx.enemyStatuses.push({ type: 'vulnerable', percent: 0.30, turnsLeft: 3 });
      return {
        success: true,
        message: "AUTORIDADE DO GOVERNANTE — a ordem é emitida. O inimigo obedece por 1 turno e fica 30% mais vulnerável a todo dano por 3 turnos. Não há como resistir a um rei.",
      };
    },
  },

  'samehada_combo': {
    execute: async (ctx) => {
      // Samehada de Kisame: devora chakra → lifesteal
      const dmg = 19;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'lifesteal', percent: 0.30, charges: 2 });
      return {
        success: true,
        damage: dmg,
        message: `SAMEHADA — a espada-tubarão raspa e DEVORA o chakra inimigo! ${dmg} de dano + próximos 2 ataques absorvem 30% do dano como HP.`,
      };
    },
  },

  'sekki_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `SEKKI — força espiritual condensada no fio da lâmina. ${dmg} de dano.`,
      };
    },
  },

  'sharingan_combo': {
    execute: async (ctx) => {
      // Sharingan de Sasuke: copia a última habilidade usada pelo inimigo
      if (!ctx.lastEnemyAbilityId) {
        return {
          success: false,
          message: 'SHARINGAN — o olho não tem habilidade para copiar ainda. Aguarde o inimigo agir.',
        };
      }
      ctx.copiedEnemyAbilityId = ctx.lastEnemyAbilityId;
      return {
        success: true,
        message: `SHARINGAN — os olhos de Sasuke brilham em vermelho. A última habilidade inimiga foi copiada e está disponível para uso.`,
      };
    },
  },

  'soul-resonance_combo': {
    execute: async (ctx) => {
      // Soul Eater: Maka e Soul em sintonia → amplifica todos os tipos de dano
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 1.5, charges: 2 });
      ctx.playerStatuses.push({ type: 'magic_amp', multiplier: 1.5, charges: 2 });
      return {
        success: true,
        message: 'RESSONÂNCIA DE ALMAS — Maka e Soul em sintonia perfeita! Próximos 2 ataques físicos e mágicos causam 50% a mais de dano.',
      };
    },
  },

  'staff-of-frieren_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `CAJADO DE FRIEREN — magia condensada por mil anos de caminhada. ${dmg} de dano. Simples. Devastador.`,
      };
    },
  },

  'stealth_combo': {
    execute: async (ctx) => {
      // Golpe das sombras: ataque + próximo ataque esquivado
      ctx.playerStatuses.push({ type: 'evasion', charges: 1 });
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `FURTIVIDADE — golpe das sombras antes da reação! ${dmg} de dano + o próximo ataque inimigo é esquivado.`,
      };
    },
  },

  'steel-balls_combo': {
    execute: async (ctx) => {
      // Spin de Gyro: rotação perfeita → cortes contínuos (bleed)
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'bleed', value: 12, turnsLeft: 4 });
      return {
        success: true,
        damage: dmg,
        message: `STEEL BALLS — rotação de Spin perfeita de Gyro Zeppeli! ${dmg} de dano + cortes rotativos causam sangramento por 4 turnos (12 HP/turno).`,
      };
    },
  },

  'survey-corps-cloak_combo': {
    execute: async (ctx) => {
      // Capa do Batalhão: coragem de avançar mesmo com medo
      ctx.playerStatuses.push({ type: 'evasion', charges: 1 });
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `CAPA DO BATALHÃO EXPLORADOR — avançar mesmo com medo. ${dmg} de dano + o próximo ataque inimigo é esquivado. "Se você avançar, você pode vencer."`,
      };
    },
  },

  'titan-serum_combo': {
    execute: async (ctx) => {
      if (ctx.playerForms.some(f => f.key === 'titan')) {
        return { success: false, message: 'A forma Tit? j? est? ativa.' };
      }
      const originalHpMax = ctx.player.hpMax;
      ctx.player.hpMax = Math.floor(ctx.player.hpMax * 2);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + originalHpMax);
      ctx.playerForms.push({
        key: 'titan', name: 'Forma Tit?', turnsLeft: 4,
        overrideAttackElement: 'Ground', physicalDmgMult: 2,
        cannotEvade: true, payload: { originalHpMax },
      });
      return { success: true, message: 'Soro Tit? ? transforma??o ativada por 4 turnos. HP dobrado, golpes f?sicos ?2 e ataques passam a ser Ground.' };
    },
  },

  'titan-shift_combo': {
    execute: async (ctx) => {
      if (ctx.playerForms.some(f => f.name === 'Forma Titã Parcial')) {
        return { success: false, message: 'A transformação titã parcial já está ativa.' };
      }
      // Titan Shift menor que o Titan Serum: sem dobrar HP, só boost físico
      ctx.playerForms.push({
        key: 'custom',
        name: 'Forma Titã Parcial',
        turnsLeft: 3,
        physicalDmgMult: 1.75,
        overrideAttackElement: 'Ground',
      });
      return {
        success: true,
        message: 'TITAN SHIFT — transformação parcial! Sem endurecer por completo, mas suficiente para causar destruição. Dano físico ×1,75 + ataques Ground por 3 turnos.',
      };
    },
  },

  'water-breathing_combo': {
    execute: async (ctx) => {
      ctx.elementOverrides.push({
        key: 'water_breathing_next_cut', replaceWith: 'Water', charges: 1,
        sourceCardKey: 'water-breathing_combo', onlyDamageType: 'Physical',
      });
      ctx.queuedFollowUps.push({
        key: 'water_breathing_follow_up', trigger: 'on_super_effective',
        sourceCardKey: 'water-breathing_combo', damageMultiplier: 0.5,
        expiresAfterTurn: ctx.turn,
      });
      return { success: true, message: 'Respira??o da ?gua ? o pr?ximo golpe f?sico vira Water; se for super efetivo, gera um segundo corte.' };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // INCOMUM — Dano flat maior. Faixa: 26–40. Senzu Bean = cura.
  // ═══════════════════════════════════════════════════════════════

  'gons-fishing-rod_combo': {
    execute: async (ctx) => {
      // Vara de Gon: puxão com Nen que desequilibra e atordoa
      const dmg = 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: dmg,
        message: `VARA DE GON — puxão com força de Nen! ${dmg} de dano + inimigo atordoado ao ser arrastado para fora do equilíbrio.`,
      };
    },
  },

  'hisokas-cards_combo': {
    execute: async (ctx) => {
      // Bungee Gum de Hisoka: as cartas grudam e o próximo golpe inimigo é devolvido
      const dmg = 32;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'counter', multiplier: 1.5, cooldownRounds: 0 });
      return {
        success: true,
        damage: dmg,
        message: `CARTAS DE HISOKA — impregnadas de Bungee Gum! ${dmg} de dano + o próximo ataque inimigo é grudado e devolvido com 150% de força. ♥♦`,
      };
    },
  },

  'ignition-gloves_combo': {
    execute: async (ctx) => {
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 6, turnsLeft: 3 });
      return {
        success: true,
        damage: dmg,
        message: `LUVAS DE IGNIÇÃO — atrito gera faísca ao impacto! ${dmg} de dano + burn por 3 turnos (6 HP/turno).`,
      };
    },
  },

  'killuas-yo-yos_combo': {
    execute: async (ctx) => {
      // Yo-yos condutores de Killua + eletricidade de Godspeed
      const dmg = 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: dmg,
        message: `YO-YOS DE KILLUA — aço condutor + Eletricidade de Godspeed no impacto! ${dmg} de dano elétrico. Inimigo paralisado por 1 turno.`,
      };
    },
  },

  'kunai_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `KUNAI — lançado com precisão cirúrgica. ${dmg} de dano. Ferramenta básica, técnica refinada.`,
      };
    },
  },

  'kunai-trovao_combo': {
    execute: async (ctx) => {
      // Kunai Trovão de Minato: teletransporte para onde o kunai está → garanteedHit + evasion
      ctx.playerStatuses.push({ type: 'evasion', charges: 1 });
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `KUNAI TROVÃO — o Hokage Amarelo aparece onde o kunai está. ${dmg} de dano inevitável + próximo ataque inimigo esquivado. "Flash Amarelo."`,
      };
    },
  },

  'odm-gear_combo': {
    execute: async (ctx) => {
      // ODM Gear: manobra aérea em alta velocidade → esquiva + ataque no ponto vulnerable
      ctx.playerStatuses.push({ type: 'evasion', charges: 2 });
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `ODM GEAR — manobra aérea em alta velocidade! ${dmg} de dano no ponto vulnerável + próximos 2 ataques inimigos esquivados. Os soldados de Paradis não ficam parados.`,
      };
    },
  },

  'papel-explosivo_combo': {
    execute: async (ctx) => {
      // Papel explosivo de Deidara: arte que explode — multi-hit + stun
      const hits = 3;
      const dmgPerHit = 9;
      const total = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: total,
        message: `PAPEL EXPLOSIVO — arte de Deidara! ${hits} explosões em sequência: ${total} de dano total. Inimigo atordoado. "A arte é uma explosão!"`,
      };
    },
  },

  'power-pole_combo': {
    execute: async (ctx) => {
      // Bastão extensível do jovem Goku — alcance surpresa e inevitável
      const dmg = 27;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `BASTÃO MÁGICO — o bastão de Goku se estende inesperadamente! ${dmg} de dano. O inimigo não previu o alcance.`,
      };
    },
  },

  'scouter_combo': {
    execute: async (ctx) => {
      // Scouter: scanneia o inimigo → expõe pontos fracos (defense_down + vulnerable)
      ctx.enemyStatuses.push({ type: 'defense_down', value: 20, turnsLeft: 3 });
      ctx.enemyStatuses.push({ type: 'vulnerable', percent: 0.15, turnsLeft: 3 });
      return {
        success: true,
        message: `SCOUTER — poder de batalha escaneado. Pontos fracos identificados: defesa reduzida em 20 + 15% mais vulnerável por 3 turnos. "It's over 9000!"`,
      };
    },
  },

  'senzu-bean_combo': {
    execute: async (ctx) => {
      // Feijão Senzu: cura instantânea + remove todos os debuffs
      const heal = Math.floor(ctx.player.hpMax * 0.70);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      ctx.playerStatuses = ctx.playerStatuses.filter(s =>
        !['poison', 'burn', 'bleed', 'stun', 'freeze', 'vulnerable', 'death_curse'].includes(s.type),
      );
      return {
        success: true,
        heal,
        message: `FEIJÃO SENZU — cura instantânea! +${heal} HP (70% do máximo) + todos os debuffs curados. Korin cultiva com cuidado.`,
      };
    },
  },

  'state-alchemist-watch_combo': {
    execute: async (ctx) => {
      // Relógio do Alquimista do Estado: transmutação defensiva + ofensiva
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'shield', value: 30 });
      return {
        success: true,
        damage: dmg,
        message: `RELÓGIO DO ESTADO — o Alquimista transforma o ambiente em arma e escudo simultaneamente! ${dmg} de dano + escudo de 30 HP.`,
      };
    },
  },

  'thunder-spears_combo': {
    execute: async (ctx) => {
      const dmg = 38;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `THUNDER SPEARS — lanças explosivas de trovão disparadas em formação! ${dmg} de dano. A nova arma da humanidade contra os titãs.`,
      };
    },
  },

  'ultrahard-steel-blades_combo': {
    execute: async (ctx) => {
      const dmg = 32;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        trueDamage: true,
        message: `LÂMINAS DE AÇO ULTRA-DURO — perfuram qualquer material conhecido. ${dmg} de dano verdadeiro. Nenhuma defesa aguenta.`,
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // RARA — Status effects ou % de dano.
  // ═══════════════════════════════════════════════════════════════

  'adolla-burst_combo': {
    execute: async (ctx) => {
      // Fire Force: chama do inferno original → campo de batalha Fire crescente
      ctx.battlefieldEffects = ctx.battlefieldEffects.filter(f => f.name !== 'Adolla Burst');
      ctx.battlefieldEffects.push({
        key: 'custom',
        source: 'player',
        name: 'Adolla Burst',
        turnsLeft: 3,
        outgoingElementMult: { Fire: 2 },
        endTurnDamage: { target: 'enemy', base: 12, growthPerTurn: 3, currentTurn: 0 },
      });
      return {
        success: true,
        message: 'ADOLLA BURST — a chama do inferno original irrompe! Campo Fire ×2 por 3 turnos + calor aumenta a cada rodada (base 12 HP/turno, +3 por turno).',
      };
    },
  },

  'automail-blade_combo': {
    execute: async (ctx) => {
      // Ed transforma o braço em espada e quebra a armadura inimiga
      const dmg = 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'defense_down', value: 25, turnsLeft: 3 });
      return {
        success: true,
        damage: dmg,
        message: `LÂMINA AUTOMAIL — Edward transmuta o braço em espada! ${dmg} de dano + defesa inimiga reduzida por 3 turnos.`,
      };
    },
  },

  'benimarus-crimson-moon_combo': {
    execute: async (ctx) => {
      // Benimaru Shinmon (Tensura): chama da Lua Escarlate
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.10) + 15;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 10, turnsLeft: 3 });
      return {
        success: true,
        damage: dmg,
        message: `LUA ESCARLATE — Benimaru Shinmon invoca a chama sagrada! ${dmg} de dano proporcional + burn por 3 turnos (10 HP/turno).`,
      };
    },
  },

  'dark-shadow_combo': {
    execute: async (ctx) => {
      // Tokoyami: Dark Shadow é mais forte no escuro (inimigo abaixo de 50% HP)
      const pct = ctx.enemy.hpCurrent / ctx.enemy.hpMax;
      const dmg = pct < 0.5
        ? Math.floor(ctx.enemy.hpCurrent * 0.18) + 20
        : 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: pct < 0.5
          ? `DARK SHADOW UNLEASHED — com o inimigo fraco, Dark Shadow perde o controle! ${dmg} de dano máximo.`
          : `DARK SHADOW — poder contido pela luz. ${dmg} de dano.`,
      };
    },
  },

  'dragon-cleave_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.14) + 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `CORTE DO DRAGÃO — fende proporcional à resistência do inimigo. ${dmg} de dano.`,
      };
    },
  },

  'dragon-lacrima_combo': {
    execute: async (ctx) => {
      // Lacrima de poder dracônico implantada → amplifica próximos ataques mágicos
      ctx.playerStatuses.push({ type: 'magic_amp', multiplier: 1.5, charges: 3 });
      return {
        success: true,
        message: 'LACRIMA DO DRAGÃO — cristal de poder dracônico ativado! Próximos 3 ataques mágicos causam 50% a mais de dano.',
      };
    },
  },

  'erzas-armors_combo': {
    execute: async (ctx) => {
      // Erza: Adamantine Armor → escudo máximo
      ctx.playerStatuses.push({ type: 'shield', value: 55 });
      return {
        success: true,
        message: 'ERZA REQUIP: ADAMANTINE ARMOR — troca instantânea de armadura! Escudo de 55 HP absorve o próximo dano recebido.',
      };
    },
  },

  'mascara-hollow_combo': {
    execute: async (ctx) => {
      if (ctx.playerForms.some(f => f.name === 'Máscara Hollow')) {
        return { success: false, message: 'A Máscara Hollow já está ativa.' };
      }
      // Hollow de Ichigo: potência bestial com custo (o hollow consome HP por turno)
      ctx.playerForms.push({
        key: 'custom',
        name: 'Máscara Hollow',
        turnsLeft: 3,
        physicalDmgMult: 2,
        magicalDmgMult: 1.5,
      });
      // Pressão do hollow drena vida (simulado com burn no player)
      ctx.playerStatuses.push({ type: 'burn', value: 10, turnsLeft: 3 });
      return {
        success: true,
        message: 'MÁSCARA HOLLOW — o hollow emerge à superfície! Dano físico ×2 e mágico ×1,5 por 3 turnos. O poder consome 10 HP/turno enquanto ativo.',
      };
    },
  },

  'skull-knight-sword_combo': {
    execute: async (ctx) => {
      // Espada do Cavaleiro Caveira: corte dimensional entre camadas da realidade
      const dmg = 45;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        trueDamage: true,
        message: `ESPADA DO CAVALEIRO CAVEIRA — corte entre as camadas da realidade. ${dmg} de dano verdadeiro. Ignora toda defesa. O Cavaleiro Crânio existe além da lógica mortal.`,
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ÉPICA — Mecânicas elaboradas, fiel ao universo.
  // ═══════════════════════════════════════════════════════════════

  'anti-magic-slash_combo': {
    execute: async (ctx) => {
      // Asta (Black Clover): espada anti-magia — anula magia + dano
      ctx.playerStatuses.push({ type: 'magic_immune', turnsLeft: 5 });
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.15) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `CORTE ANTI-MAGIA — Asta canaliza a antimagia negra! ${dmg} de dano que traversa barreiras mágicas + imune a toda magia inimiga por 5 turnos.`,
      };
    },
  },

  'barukas-dagger_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'poison', value: 12, turnsLeft: -1 });
      return {
        success: true,
        damage: dmg,
        message: `ADAGA DE BARUKA — veneno cursado injetado no sangue! ${dmg} de dano + poison permanente (12 HP/turno até o fim da batalha).`,
      };
    },
  },

  'black-divider_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.15) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'defense_down', value: 40, turnsLeft: 4 });
      return {
        success: true,
        damage: dmg,
        message: `BLACK DIVIDER — o campo de batalha é cortado pela espada negra! ${dmg} de dano + defesa inimiga destroçada por 4 turnos.`,
      };
    },
  },

  'black-flash_combo': {
    execute: async (ctx) => {
      // Black Flash: convergência perfeita de energia cursada — dano dimensional
      const dmg = 60;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: dmg,
        message: `BLACK FLASH — convergência perfeita de energia cursada! Luz negra rasga o espaço entre os mundos. ${dmg} de dano + inimigo atordoado.`,
      };
    },
  },

  'chain-jail_combo': {
    execute: async (ctx) => {
      // Correntes de Enkidu: prendem até divindades → inimigo perde 2 turnos
      ctx.enemySkipTurns += 2;
      return {
        success: true,
        message: 'CHAIN JAIL — as correntes de Enkidu aprisionam até os deuses! O inimigo perde 2 turnos completamente.',
      };
    },
  },

  'cruel-sun_combo': {
    execute: async (ctx) => {
      ctx.battlefieldEffects = ctx.battlefieldEffects.filter(f => f.key !== 'sun');
      ctx.battlefieldEffects.push({
        key: 'sun', source: 'player', name: 'Sol Cruel', turnsLeft: 5,
        outgoingElementMult: { Fire: 3, Ice: 0.5 },
        endTurnDamage: { target: 'enemy', base: 10, growthPerTurn: 5, currentTurn: 0 },
      });
      return { success: true, message: 'Cruel Sun ? um sol nasce sobre a arena por 5 turnos. Fire ?3, Ice ?0,5 e o calor cresce a cada rodada.' };
    },
  },

  'cursed-speech_combo': {
    execute: async (ctx) => {
      // Fala Amaldiçoada de Toge: o inimigo obedece ao comando e usa força contra si
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.20);
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `FALA AMALDIÇOADA — "EXPLODA!" O inimigo usa sua própria força contra si. ${dmg} de dano (20% do HP atual). Toge não fala mais que o necessário.`,
      };
    },
  },

  'dimension-slash_combo': {
    execute: async (ctx) => {
      const dmg = 55;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        trueDamage: true,
        message: `CORTE DIMENSIONAL — rasga o próprio espaço. ${dmg} de dano verdadeiro. Toda defesa é irrelevante quando o plano físico é ignorado.`,
      };
    },
  },

  'dragon-force_combo': {
    execute: async (ctx) => {
      if (ctx.playerForms.some(f => f.name === 'Dragon Force')) {
        return { success: false, message: 'Dragon Force já está ativo.' };
      }
      // Dragon Force de Natsu: transformação dracônica — boost massivo por 4 turnos
      ctx.playerForms.push({
        key: 'custom',
        name: 'Dragon Force',
        turnsLeft: 4,
        physicalDmgMult: 2.5,
        magicalDmgMult: 2,
      });
      return {
        success: true,
        message: 'DRAGON FORCE ativado! Natsu se transforma em dragão por 4 turnos. Dano físico ×2,5 e mágico ×2. O calor é insuportável.',
      };
    },
  },

  'equivalent-exchange_combo': {
    execute: async (ctx) => {
      const cost = Math.floor(ctx.player.hpMax * 0.12);
      const dmg  = Math.floor(ctx.enemy.hpCurrent * 0.35);
      ctx.player.hpCurrent = Math.max(1, ctx.player.hpCurrent - cost);
      ctx.enemy.hpCurrent  = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `TROCA EQUIVALENTE — a lei da alquimia é implacável. Pagou ${cost} HP, causou ${dmg} de dano (35% do HP atual inimigo). Nada é obtido sem custo.`,
      };
    },
  },

  'final-flash_combo': {
    execute: async (ctx) => {
      // Final Flash de Vegeta: mais poderoso que Kamehameha, mas demora para carregar
      // Mecânica: gasta 15% do HP próprio para disparar (carga total)
      const cost = Math.floor(ctx.player.hpMax * 0.08);
      ctx.player.hpCurrent = Math.max(1, ctx.player.hpCurrent - cost);
      const dmg = Math.floor(ctx.enemy.hpMax * 0.35) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `FINAL FLASH — Vegeta carrega ao limite! Custo: ${cost} HP próprio. ${dmg} de dano. "Toma isso!"`,
      };
    },
  },

  'fire-dragon-roar_combo': {
    execute: async (ctx) => {
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 12, turnsLeft: 4 });
      return {
        success: true,
        damage: dmg,
        message: `RUGIDO DO DRAGÃO DE FOGO — Natsu expele chamas do fundo da alma! ${dmg} de dano + burn por 4 turnos (12 HP/turno).`,
      };
    },
  },

  'flame-alchemy_combo': {
    execute: async (ctx) => {
      // Roy Mustang: um estalo e tudo arde
      const dmg = 40;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 8, turnsLeft: 5 });
      return {
        success: true,
        damage: dmg,
        message: `ALQUIMIA DE CHAMA — Roy Mustang estala os dedos. ${dmg} de dano + tudo arde por 5 turnos (8 HP/turno). "Flame Alchemist."`,
      };
    },
  },

  'full-counter_combo': {
    execute: async (ctx) => {
      // Meliodas: não pode atacar, apenas refletir — o dano recebido volta dobrado
      ctx.playerStatuses.push({ type: 'counter', multiplier: 2, cooldownRounds: 0 });
      return {
        success: true,
        message: 'FULL COUNTER — Meliodas não ataca. Ele apenas reflete. O próximo ataque recebido é devolvido com o DOBRO de força. Quanto mais forte o golpe, mais letal o retorno.',
      };
    },
  },

  'godspeed_combo': {
    execute: async (ctx) => {
      // Godspeed de Killua: além da velocidade humana → esquiva + dano elétrico
      ctx.playerStatuses.push({ type: 'evasion', charges: 3 });
      const dmg = 15;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `GODSPEED — Killua se move além do limite da percepção humana. ${dmg} de dano elétrico + próximos 3 ataques inimigos esquivados automaticamente.`,
      };
    },
  },

  'hinokami-kagura_combo': {
    execute: async (ctx) => {
      // Respiração do Deus do Fogo: mais poderosa que qualquer respiração
      // Próximos 3 ataques físicos viram Fire + follow-up se super efetivo
      ctx.elementOverrides.push({
        key: 'hinokami_fire_strike',
        replaceWith: 'Fire',
        charges: 3,
        sourceCardKey: 'hinokami-kagura_combo',
        onlyDamageType: 'Physical',
      });
      ctx.queuedFollowUps.push({
        key: 'hinokami_follow_up',
        trigger: 'on_super_effective',
        sourceCardKey: 'hinokami-kagura_combo',
        damageMultiplier: 0.7,
        expiresAfterTurn: ctx.turn + 2,
      });
      return {
        success: true,
        message: 'HINOKAMI KAGURA — a Dança do Deus do Fogo! Próximos 3 ataques físicos viram Fire. Se forem super efetivos, um segundo corte de 70% do dano é desferido.',
      };
    },
  },

  'inverted-spear-of-heaven_combo': {
    execute: async (ctx) => {
      // Lança Invertida do Céu: anula qualquer técnica → remove todos os status e marcas inimigos
      const hadStatuses = ctx.enemyStatuses.length > 0 || ctx.enemyMarks.length > 0;
      ctx.enemyStatuses = [];
      ctx.enemyMarks    = [];
      const dmg = 35;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: hadStatuses
          ? `LANÇA INVERTIDA DO CÉU — toda técnica inimiga anulada! Status e marcas removidos + ${dmg} de dano dimensional.`
          : `LANÇA INVERTIDA DO CÉU — ${dmg} de dano. A lança que anula qualquer coisa.`,
      };
    },
  },

  'kaioken_combo': {
    execute: async (ctx) => {
      if (ctx.playerForms.some(f => f.name === 'Kaioken')) {
        return { success: false, message: 'O Kaioken já está ativo. O corpo não suporta outra ativação.' };
      }
      // PlayerForms: o efeito dura N turnos, não N ataques
      ctx.playerForms.push({
        key: 'custom',
        name: 'Kaioken',
        turnsLeft: 3,
        physicalDmgMult: 2,
        magicalDmgMult: 1.5,
      });
      // Custo fiel: corpo 30% mais vulnerável (damageTakenMult não está wired em PlayerForm)
      ctx.playerStatuses.push({ type: 'vulnerable', percent: 0.30, turnsLeft: 3 });
      return {
        success: true,
        message: 'KAIOKEN — os limites do corpo são quebrados! Dano físico ×2 e mágico ×1,5 por 3 turnos. Custo: 30% mais vulnerável a todo dano recebido.',
      };
    },
  },

  'kakuja-form_combo': {
    execute: async (ctx) => {
      if (ctx.playerForms.some(f => f.name === 'Forma Kakuja')) {
        return { success: false, message: 'A Forma Kakuja já está ativa.' };
      }
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.15) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerForms.push({
        key: 'custom',
        name: 'Forma Kakuja',
        turnsLeft: 4,
        physicalDmgMult: 2,
      });
      ctx.playerStatuses.push({ type: 'vulnerable', percent: 0.20, turnsLeft: 4 });
      return {
        success: true,
        damage: dmg,
        message: `FORMA KAKUJA — Ken Kaneki perde o controle e se transforma! ${dmg} de dano + dano físico ×2 por 4 turnos. Custo: 20% mais vulnerável (controle perdido).`,
      };
    },
  },

  'kamehameha_combo': {
    execute: async (ctx) => {
      // Kamehameha: ki concentrado em um único raio — elemento Light + garanteedHit
      ctx.elementOverrides.push({
        key: 'kamehameha_light',
        replaceWith: 'Light' as any,
        charges: 1,
        sourceCardKey: 'kamehameha_combo',
      });
      const dmg = Math.floor(ctx.enemy.hpMax * 0.20) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `KA-ME-HA-ME-HA! Ki concentrado disparado em raio azul. ${dmg} de dano. Imparável.`,
      };
    },
  },

  'kasakas-venom-fang_combo': {
    execute: async (ctx) => {
      const hasPoison = ctx.enemyStatuses.some(s => s.type === 'poison');
      if (hasPoison) {
        return { success: false, message: 'O veneno de Kasaka já corre nas veias inimigas — não pode ser aplicado novamente.' };
      }
      ctx.enemyStatuses.push({ type: 'poison', value: 15, turnsLeft: -1 });
      return {
        success: true,
        message: 'PRESAS VENENOSAS DE KASAKA — veneno sem cura injetado! Inimigo perde 15 HP por turno até o fim da batalha.',
      };
    },
  },

  'one-for-all-smash_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.18) + 35;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `DETROIT SMASH — 100% de One For All num único soco! ${dmg} de dano. O impacto cria uma cratera e atordoa o inimigo.`,
      };
    },
  },

  'orb-of-avarice_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'magic_amp', multiplier: 2, charges: 1 });
      return {
        success: true,
        message: 'ORB OF AVARICE — toda a ganância concentrada em um único golpe. O próximo ataque mágico causa o DOBRO de dano.',
      };
    },
  },

  'playful-cloud_combo': {
    execute: async (ctx) => {
      // HxH: ferramenta cursada sem usuário fixo → efeito aleatório (ela decide)
      const roll = Math.random();
      if (roll < 0.33) {
        const dmg = 30 + Math.floor(Math.random() * 40);
        ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
        return { success: true, damage: dmg, message: `PLAYFUL CLOUD — a ferramenta cursada decide atacar. ${dmg} de dano.` };
      } else if (roll < 0.66) {
        ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 2 });
        return { success: true, message: 'PLAYFUL CLOUD — a ferramenta cursada decide imobilizar. Inimigo parado por 2 turnos.' };
      } else {
        const heal = 35;
        ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
        return { success: true, heal, message: `PLAYFUL CLOUD — a ferramenta cursada decide curar. +${heal} HP. Ninguém entende.` };
      }
    },
  },

  'prison-realm_combo': {
    execute: async (ctx) => {
      // Prison Realm: selo de cinco faces → inimigo completamente bloqueado por 1 turno
      ctx.enemySkipTurns += 1;
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `PRISON REALM — o inimigo é selado pelo Portão! ${dmg} de dano + 1 turno completamente bloqueado dentro do selo.`,
      };
    },
  },

  'shadow-extraction_combo': {
    execute: async (ctx) => {
      // Shikamaru: Jutsu de Imitação de Sombra — imobiliza sem atacar
      // O desgaste físico da resistência ao jutsu = bleed
      ctx.enemyStatuses.push({ type: 'freeze', turnsLeft: 2 });
      ctx.enemyStatuses.push({ type: 'bleed', value: 10, turnsLeft: 3 });
      return {
        success: true,
        message: 'JUTSU DE IMITAÇÃO DE SOMBRA — as sombras se unem! Inimigo capturado por 2 turnos. A resistência ao jutsu causa desgaste físico: 10 HP/turno por 3 turnos.',
      };
    },
  },

  'split-soul-katana_combo': {
    execute: async (ctx) => {
      const dmg = 50;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        trueDamage: true,
        message: `KATANA DA ALMA DIVIDIDA — corte na própria alma. ${dmg} de dano verdadeiro. Defesa física é irrelevante quando a lâmina passa pelo plano espiritual.`,
      };
    },
  },

  'ten-shadows_combo': {
    execute: async (ctx) => {
      // Dez Sombras de Megumi: shikigami invocados continuam atacando por turnos
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'bleed', value: 15, turnsLeft: 3 });
      return {
        success: true,
        damage: dmg,
        message: `DEZ SOMBRAS — Divine Dog e Nue invocados! ${dmg} de dano inicial + shikigami continuam atacando por 3 turnos (15 HP/turno).`,
      };
    },
  },

  'thunderclap-and-flash_combo': {
    execute: async (ctx) => {
      // Zenitsu: adormece e desfere um único corte mais rápido que o olho humano
      const dmg = 62;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `TROVÃO E RELÂMPAGO — Zenitsu adormece e voa. Um único corte mais rápido que o olho humano. ${dmg} de dano. Irresistível.`,
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // LENDÁRIA — Unique. Efeitos que mudam o estado da batalha.
  // ═══════════════════════════════════════════════════════════════

  'berserker-armor_unique': {
    execute: async (ctx) => {
      // Armadura Berserker de Guts: remove todos os limitadores → triple dano + custo HP
      ctx.playerForms.push({
        key: 'custom',
        name: 'Armadura Berserker',
        turnsLeft: 3,
        physicalDmgMult: 3,
      });
      ctx.playerStatuses.push({ type: 'burn', value: 8, turnsLeft: 3 });
      return {
        success: true,
        message: 'ARMADURA BERSERKER — todos os limitadores REMOVIDOS! Guts ignora a dor e age como uma fera. Dano físico ×3 por 3 turnos. Custo: os nervos sangram internamente (8 HP/turno).',
      };
    },
  },

  'chastiefol_unique': {
    execute: async (ctx) => {
      // Tesouro Sagrado do Rei das Fadas: 10 formas → ataque + defesa simultâneos
      const dmg = 80;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 2 });
      ctx.playerStatuses.push({ type: 'shield', value: 40 });
      return {
        success: true,
        damage: dmg,
        message: `CHASTIEFOL — Tesouro Sagrado do Rei das Fadas! ${dmg} de dano + inimigo imobilizado por 2 turnos + Cama de Conforto: escudo de 40 HP.`,
      };
    },
  },

  'death-scythe_unique': {
    execute: async (ctx) => {
      // Foice da Morte: executa abaixo de 35% HP
      const pct = ctx.enemy.hpCurrent / ctx.enemy.hpMax;
      if (pct < 0.35) {
        const finalDmg = ctx.enemy.hpCurrent;
        ctx.enemy.hpCurrent = 0;
        return { success: true, damage: finalDmg, message: 'FOICE DA MORTE — a alma foi ceifada! EXECUÇÃO INSTANTÂNEA abaixo de 35% HP!' };
      }
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.35) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: `FOICE DA MORTE — ${dmg} de dano. (Abaixo de 35% HP seria execução instantânea...)` };
    },
  },

  'demon-sword-ragnarok_unique': {
    execute: async (ctx) => {
      // Crona e Ragnarok: espada demoníaca com absorção de vida
      const dmg = 55;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'lifesteal', percent: 0.40, charges: 3 });
      return {
        success: true,
        damage: dmg,
        message: `ESPADA DEMONÍACA RAGNAROK — Crona e Ragnarok em sincronia! ${dmg} de dano + 40% do dano dos próximos 3 ataques vira HP.`,
      };
    },
  },

  'dragon-slayer_unique': {
    execute: async (ctx) => {
      // Berserk: a espada grande demais para ser chamada de espada — impacto de massa pura
      const dmg = 100;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: dmg,
        message: `DRAGON SLAYER — uma massa de ferro tão pesada que nem deveria existir como espada. ${dmg} de dano puro. O inimigo não processa o que o acertou.`,
      };
    },
  },

  'gideon_unique': {
    execute: async (ctx) => {
      const dmg = 75;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: dmg,
        message: `GIDEON — peso colossal despenca sobre o inimigo. ${dmg} de dano puro + atordoado por 1 turno. Ninguém fica em pé.`,
      };
    },
  },

  'hyorinmaru_unique': {
    execute: async (ctx) => {
      // Hyorinmaru: maior Zanpakuto de gelo do Soul Society → campo de batalha glacial
      ctx.battlefieldEffects = ctx.battlefieldEffects.filter(
        f => !(f.key === 'custom' && f.name === 'Eterno Gelo de Hyorinmaru'),
      );
      ctx.battlefieldEffects.push({
        key: 'custom',
        source: 'player',
        name: 'Eterno Gelo de Hyorinmaru',
        turnsLeft: 4,
        outgoingElementMult: { Ice: 2.5 },
        incomingElementMult: { Fire: 0.5 },
        endTurnDamage: { target: 'enemy', base: 12, growthPerTurn: 0, currentTurn: 0 },
      });
      const dmg = 50;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `HYORINMARU — o céu e a terra congelam! ${dmg} de dano imediato + campo de gelo eterno por 4 turnos: Ice ×2,5, resistência a Fire, 12 HP/turno de dano glacial.`,
      };
    },
  },

  'lostvayne_unique': {
    execute: async (ctx) => {
      // Lostvayne de Meliodas: fragmenta a alma em clones → 3 reflexos de dano
      ctx.playerStatuses.push({ type: 'counter', multiplier: 1.5, cooldownRounds: 999, charges: 3 });
      return {
        success: true,
        message: 'LOSTVAYNE — Meliodas fragmenta sua alma em clones! Os próximos 3 ataques recebidos são refletidos com 150% de força por cada clone.',
      };
    },
  },

  'mjolnir_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.25) + 40;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 2 });
      return {
        success: true,
        damage: dmg,
        message: `MJOLNIR — apenas o digno pode empunhá-la. ${dmg} de dano + raio divino de Thor atordoa o inimigo por 2 turnos.`,
      };
    },
  },

  'murasame_unique': {
    execute: async (ctx) => {
      const existing = ctx.enemyMarks.find(m => m.key === 'murasame_death_curse');
      if (existing) existing.stacks = Math.min(5, existing.stacks + 1);
      else ctx.enemyMarks.push({ key: 'murasame_death_curse', name: 'Maldi??o da Morte', stacks: 1, turnsLeft: null, sourceCardKey: 'murasame_unique' });
      if (!ctx.executionRules.some(r => r.key === 'murasame_execute')) {
        ctx.executionRules.push({
          key: 'murasame_execute', thresholdHpFraction: 0.35,
          requiresMarkKey: 'murasame_death_curse', minStacks: 5,
          excludesBosses: false, message: 'MURASAME ? a maldi??o amadureceu. Execu??o inevit?vel!',
        });
      }
      return { success: true, message: 'Murasame ? o alvo foi marcado. Cada dano recebido alimenta a Maldi??o da Morte; com 5 cargas, abaixo de 35% HP, ele ? executado.' };
    },
  },

  'philosophers-stone_unique': {
    execute: async (ctx) => {
      const heal = Math.floor(ctx.player.hpMax * 0.60);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      ctx.playerStatuses = ctx.playerStatuses.filter(s =>
        !['poison', 'burn', 'bleed', 'stun', 'freeze', 'vulnerable', 'death_curse'].includes(s.type),
      );
      return {
        success: true,
        heal,
        message: `PEDRA FILOSOFAL — o segredo da vida e da morte, forjado em almas humanas. +${heal} HP (60% do máximo) + todos os debuffs eliminados. O custo moral... é outra história.`,
      };
    },
  },

  'potara-earrings_unique': {
    execute: async (ctx) => {
      // Brincos Potara: fusão permanente com o mais forte → playerForm que não expira
      if (ctx.playerForms.some(f => f.name === 'Fusão Potara')) {
        return { success: false, message: 'A Fusão Potara já está ativa.' };
      }
      ctx.playerForms.push({
        key: 'custom',
        name: 'Fusão Potara',
        turnsLeft: null, // fusão de Kaioshin dura indefinidamente (ou até o fim da batalha)
        physicalDmgMult: 2,
        magicalDmgMult: 2,
      });
      ctx.playerStatuses.push({ type: 'shield', value: 80 });
      return {
        success: true,
        message: 'BRINCOS POTARA — FUSÃO DOS DEUSES! Poder combinado dos dois guerreiros. Dano físico e mágico ×2 permanentemente + escudo de 80 HP. Gogeta ou Vegito?',
      };
    },
  },

  'rhitta_unique': {
    execute: async (ctx) => {
      // Escanor: Rhitta absorve calor solar ao longo do dia — quanto mais tarde, mais forte
      const dmg = Math.min(ctx.turn * 15, 90) + 40;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `RHITTA — "Quem me deu esse poder?" Turno ${ctx.turn}: ${dmg} de dano. Escanor ao meio-dia seria o absoluto.`,
      };
    },
  },

  'senbonzakura_unique': {
    execute: async (ctx) => {
      // Bankai de Byakuya: mil lâminas de pétala em área — multi-hit + bleed
      const hits = 5;
      const dmgPerHit = Math.floor(ctx.enemy.hpCurrent * 0.04) + 6;
      const total = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      ctx.enemyStatuses.push({ type: 'bleed', value: 10, turnsLeft: 5 });
      return {
        success: true,
        damage: total,
        message: `SENBONZAKURA KAGEYOSHI — mil pétalas de aço dançam. ${hits} impactos: ${total} de dano total. Os cortes persistem por 5 turnos (10 HP/turno).`,
      };
    },
  },

  'stand-arrow_unique': {
    execute: async (ctx) => {
      // Flecha de Stand: efeito aleatório — qual Stand vai despertar?
      const roll = Math.floor(Math.random() * 5);
      switch (roll) {
        case 0: {
          const dmg = 90;
          ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
          return { success: true, damage: dmg, message: `STAND ARROW — Stand de combate evoluído! Golpe devastador: ${dmg} de dano.` };
        }
        case 1: {
          ctx.enemySkipTurns += 3;
          return { success: true, message: 'STAND ARROW — Stand de manipulação do tempo! O inimigo perde 3 turnos.' };
        }
        case 2: {
          ctx.playerStatuses.push({ type: 'evasion', charges: 4 });
          return { success: true, message: 'STAND ARROW — Stand de velocidade! Próximos 4 ataques inimigos esquivados automaticamente.' };
        }
        case 3: {
          const heal = Math.floor(ctx.player.hpMax * 0.50);
          ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
          return { success: true, heal, message: `STAND ARROW — Stand de restauração! ${heal} HP (50% do máximo) recuperado.` };
        }
        default: {
          ctx.enemy.hpCurrent = Math.floor(ctx.enemy.hpMax * 0.10);
          return { success: true, message: 'STAND ARROW — Stand de Requiem... O inimigo perde a vontade de existir. HP reduzido a 10%.' };
        }
      }
    },
  },

  'stone-mask_unique': {
    execute: async (ctx) => {
      // Máscara de Pedra: transformação vampírica → cura + absorção de vida permanente
      const heal = Math.floor(ctx.player.hpMax * 0.35);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      ctx.playerStatuses.push({ type: 'vampiric', percent: 0.50, charges: 5 });
      return {
        success: true,
        heal,
        message: `MÁSCARA DE PEDRA — transformação vampírica completa! +${heal} HP restaurado (35% do máximo) + próximos 5 ataques absorvem 50% do dano causado como vida.`,
      };
    },
  },

  'tensa-zanguetsu_unique': {
    execute: async (ctx) => {
      if (ctx.playerForms.some(f => f.name === 'Bankai — Tensa Zangetsu')) {
        return { success: false, message: 'O Bankai já está ativo.' };
      }
      // Bankai de Ichigo: a espada comprime todo o poder → velocidade absoluta + dano físico ×2
      ctx.playerForms.push({
        key: 'custom',
        name: 'Bankai — Tensa Zangetsu',
        turnsLeft: 4,
        physicalDmgMult: 2,
        overrideAttackElement: 'Dark',
      });
      // Velocidade do Bankai = 2 esquivas automáticas
      ctx.autoDodgeTurnsLeft = Math.max(ctx.autoDodgeTurnsLeft, 2);
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.25) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `TENSA ZANGETSU — BANKAI! A espada compressa libera velocidade absoluta. ${dmg} de dano inicial + dano físico ×2 + ataques Dark por 4 turnos. 2 esquivas automáticas garantidas.`,
      };
    },
  },

  'volundr_unique': {
    execute: async (ctx) => {
      const dmg = 65;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'shield', value: 60 });
      return {
        success: true,
        damage: dmg,
        message: `VOLUNDR — forja divina nórdica! ${dmg} de dano + escudo de 60 HP forjado em batalha.`,
      };
    },
  },

  'z-sword_unique': {
    execute: async (ctx) => {
      // Z Sword: a espada que Gohan quebrou sem querer — poder dos deuses liberado
      const dmg = 70;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 3 });
      return {
        success: true,
        damage: dmg,
        message: `Z SWORD — a espada dos deuses Kai, que Gohan quebrou sem querer. ${dmg} de dano + próximos 3 ataques físicos com o DOBRO de força.`,
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // MITICA — Unique. Efeitos transformadores absolutos.
  // ═══════════════════════════════════════════════════════════════

  'avalon_unique': {
    execute: async (ctx) => {
      // FORTALEZA AVALON: por 4 turnos, todo dano recebido é CONVERTIDO em CURA.
      // Implementado via couple de auto-counter + lifesteal % alto.
      // Bonus: cura inicial parcial pra iniciar bem.
      const heal = Math.floor(ctx.player.hpMax * 0.40);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      // O "converter dano em cura": adicionamos vampiric stack alta + magic_immune turn 2
      // (simulação: o dano que vem vira heal via vampiric percent > 1)
      ctx.playerStatuses.push({ type: 'vampiric', percent: 1.2, charges: 6 });
      ctx.playerStatuses.push({ type: 'magic_immune', turnsLeft: 2 });
      ctx.playerStatuses.push({ type: 'invincible', charges: 1 });
      return {
        success: true,
        heal,
        message: `🛡️ FORTALEZA AVALON — a bainha sagrada se cristaliza. +${heal} HP de cura inicial + próximo hit ANULADO + imune a magia 2 turnos + próximos 6 ataques sofridos VIRAM CURA (120% do dano absorvido como HP).`,
      };
    },
  },

  'domain-expansion_unique': {
    execute: async (ctx) => {
      // DOMÍNIO ABERTO: por 3 turnos, inimigo tem 50% de FALHAR cada ability
      // (energia sendo drenada). Suas abilities ganham +50% via campo.
      ctx.battlefieldEffects = ctx.battlefieldEffects.filter(f => f.name !== 'Domínio Aberto');
      ctx.battlefieldEffects.push({
        key: 'custom',
        source: 'player',
        name: 'Domínio Aberto',
        turnsLeft: 3,
        outgoingElementMult: {
          Fire: 1.5, Water: 1.5, Ice: 1.5, Electric: 1.5, Grass: 1.5,
          Ground: 1.5, Dark: 1.5, Steel: 1.5, Poison: 1.5, Fighting: 1.5,
          Ghost: 1.5, Flying: 1.5,
        },
      });
      ctx.domainEnemyFailChance = 0.5;
      ctx.domainEnergyDiscountTurns = 3;
      const dmg = Math.floor(ctx.enemy.hpMax * 0.30) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `🌑 DOMÍNIO ABERTO — territorio aberto por 3 turnos. ${dmg} de dano garantido + inimigo tem 50% de FALHAR cada ataque (energia drenada) + seus elementos amplificados ×1,5.`,
      };
    },
  },

  'dragon-balls_unique': {
    execute: async (ctx) => {
      // PEDIR UM DESEJO: rola 1 entre 4 efeitos altamente diferentes.
      // Cada efeito é forte mas não trivial. Once_per_battle aplica via DB.
      const roll = Math.floor(Math.random() * 4);
      if (roll === 0) {
        // Ressurreição: heal total + revive extra
        const heal = ctx.player.hpMax - ctx.player.hpCurrent;
        ctx.player.hpCurrent = ctx.player.hpMax;
        ctx.playerStatuses = ctx.playerStatuses.filter(s =>
          !['poison','burn','bleed','stun','freeze','vulnerable','death_curse'].includes(s.type),
        );
        ctx.reviveCharges += 1;
        return { success: true, heal,
          message: `🐉 DESEJO #1 — RESSURREIÇÃO. HP cheio (+${heal}), todos debuffs removidos, +1 revive. Shenlong te abençoa.` };
      }
      if (roll === 1) {
        // Apaga 2 abilities do inimigo
        const pool = ctx.enemy.abilities.filter(a => !ctx.erasedEnemyAbilityIds.includes(a.id));
        const erased: string[] = [];
        for (let i = 0; i < 2 && pool.length > 0; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          const target = pool.splice(idx, 1)[0];
          ctx.erasedEnemyAbilityIds.push(target.id);
          erased.push(target.name);
        }
        return { success: true,
          message: `🐉 DESEJO #2 — APAGAR. ${erased.length} abilities do inimigo banidas: ${erased.join(', ')}. Shenlong corta o passado.` };
      }
      if (roll === 2) {
        // HP do inimigo pela metade
        const before = ctx.enemy.hpCurrent;
        ctx.enemy.hpCurrent = Math.floor(ctx.enemy.hpCurrent * 0.5);
        const dmg = before - ctx.enemy.hpCurrent;
        return { success: true, damage: dmg,
          message: `🐉 DESEJO #3 — REDUÇÃO. HP do inimigo cortado pela metade (−${dmg}). A morte se aproxima.` };
      }
      // Turno extra (via auto-counter "free" — coloca um charge de evasion +
      // amplifica próximo ataque ×2 sem custo)
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 1 });
      ctx.playerStatuses.push({ type: 'magic_amp',    multiplier: 2, charges: 1 });
      ctx.playerStatuses.push({ type: 'evasion', charges: 1 });
      return { success: true,
        message: `🐉 DESEJO #4 — TURNO EXTRA. Próxima ability ×2 + 1 esquiva garantida. Você joga DE NOVO.` };
    },
  },

  'dragon-of-the-darkness-flame_unique': {
    execute: async (ctx) => {
      // CHAMA QUE ALIMENTA: cada dano causado nos próximos 3 turnos
      // adiciona +5 ao DoT da chama. Stack ilimitado, queima permanente.
      const dmg = Math.floor(ctx.enemy.hpMax * 0.35) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 10, turnsLeft: -1 });
      // Battlefield effect: cada turno, dano causado pelo jogador acumula em DoT
      ctx.battlefieldEffects.push({
        key: 'custom',
        source: 'player',
        name: 'Chama que Não Apaga',
        turnsLeft: 3,
        endTurnDamage: { target: 'enemy', base: 20, growthPerTurn: 15, currentTurn: 0 },
      });
      return {
        success: true,
        damage: dmg,
        message: `🔥 DRAGÃO DAS TREVAS EM CHAMAS — Hiei liberta a chama da mão esquerda. ${dmg} de dano + queimadura ETERNA (10 HP/turno permanente) + por 3 turnos, fogo crescente alimenta o inimigo (20→35→50 HP/turno).`,
      };
    },
  },

  'excalibur_unique': {
    execute: async (ctx) => {
      // JULGAMENTO DO REI: efeito varia com a moral (HP atual do portador).
      // HP > 80%: dano massivo + cura aliados (heal grande)
      // HP entre 30-80%: dano normal + cura moderada
      // HP < 30%: atordoa o portador 1 turno MAS deixa inimigo em 1 HP (all-in)
      const hpFrac = ctx.player.hpCurrent / Math.max(1, ctx.player.hpMax);
      if (hpFrac > 0.80) {
        const dmg  = Math.floor(ctx.enemy.hpMax * 0.65) + 30;
        const heal = Math.floor(ctx.player.hpMax * 0.30);
        ctx.enemy.hpCurrent  = Math.max(0, ctx.enemy.hpCurrent - dmg);
        ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
        return { success: true, damage: dmg, heal,
          message: `⚔️ EXCALIBUR — JULGAMENTO DO REI DIGNO. HP >80% prova a moral: ${dmg} de dano sagrado + cura ${heal} HP. IN LUMINIS ET METALLUM!` };
      }
      if (hpFrac < 0.30) {
        // All-in: deixa inimigo em 1 HP mas player fica stunned
        const dmg = ctx.enemy.hpCurrent - 1;
        ctx.enemy.hpCurrent = 1;
        ctx.playerStatus = { type: 'stun', turnsRemaining: 1 };
        return { success: true, damage: dmg,
          message: `⚔️ EXCALIBUR — SACRIFÍCIO DO REI MORIBUNDO. HP <30%, último grito do rei: inimigo cai a 1 HP (−${dmg}). Você fica atordoado 1 turno. Acabe-o.` };
      }
      // Faixa média
      const dmg  = Math.floor(ctx.enemy.hpMax * 0.40) + 25;
      const heal = Math.floor(ctx.player.hpMax * 0.15);
      ctx.enemy.hpCurrent  = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      return { success: true, damage: dmg, heal,
        message: `⚔️ EXCALIBUR — luz sagrada equilibrada. ${dmg} de dano + cura ${heal} HP. (Esteja >80% pra julgamento total ou <30% pra sacrifício.)` };
    },
  },

  'hollow-purple_unique': {
    execute: async (ctx) => {
      // CHAIN DE 3 ESTÁGIOS. Cada cast avança o estágio:
      // 1º cast: cura jogador + drena inimigo (Lapse Azul puxa)
      // 2º cast: acumula (sem dano direto; ganha amp)
      // 3º cast: LIBERA = soma dos 2 anteriores ×2 + 80 base
      ctx.hollowPurpleStage = (ctx.hollowPurpleStage + 1) as 1 | 2 | 3;
      const stage = ctx.hollowPurpleStage;
      if (stage === 1) {
        const drain = Math.floor(ctx.enemy.hpMax * 0.20);
        const heal  = Math.floor(ctx.player.hpMax * 0.20);
        ctx.enemy.hpCurrent  = Math.max(0, ctx.enemy.hpCurrent - drain);
        ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
        ctx.hollowPurpleAccum = drain;
        return { success: true, damage: drain, heal,
          message: `🔵 LAPSE AZUL (estágio 1/3) — atração. Drena ${drain} HP do inimigo e te cura ${heal}. Use Hollow Purple de novo pra continuar a cadeia.` };
      }
      if (stage === 2) {
        // Acumula: dano ×2 amplifica próximo, mas não bate direto
        ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 1 });
        ctx.playerStatuses.push({ type: 'magic_amp', multiplier: 2, charges: 1 });
        ctx.hollowPurpleAccum *= 2;
        return { success: true,
          message: `🔴 REVERSAL RED (estágio 2/3) — repulsão. Acumulando energia (não dá dano direto). Próximo Hollow Purple = LIBERAÇÃO TOTAL.` };
      }
      // Estágio 3: LIBERA
      const accum = ctx.hollowPurpleAccum;
      const burst = accum + 80 + Math.floor(ctx.enemy.hpMax * 0.40);
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - burst);
      ctx.hollowPurpleStage = 0;
      ctx.hollowPurpleAccum = 0;
      return { success: true, damage: burst, guaranteedHit: true,
        message: `🟣 HOLLOW PURPLE — CONVERGÊNCIA TOTAL! Lapse Azul + Reversal Red colidem: ${burst} de dano (ACERTO GARANTIDO). O mais bonito e o mais destrutivo. Cadeia resetou.` };
    },
  },

  'limitless_unique': {
    execute: async (ctx) => {
      // INFINITY: por 4 turnos, "distância infinita" → autoDodge integral.
      // Plus 5 esquivas garantidas (counter contra ataque inimigo).
      const dmg = Math.floor(ctx.enemy.hpMax * 0.35) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.autoDodgeTurnsLeft = Math.max(ctx.autoDodgeTurnsLeft, 4);
      ctx.playerStatuses.push({ type: 'evasion', charges: 5 });
      ctx.playerStatuses.push({ type: 'magic_immune', turnsLeft: 4 });
      return {
        success: true,
        damage: dmg,
        message: `♾️ LIMITLESS — INFINITO. ${dmg} de dano + por 4 turnos o inimigo nunca chega em você (auto-dodge + 5 cargas extras + imune a magia). Lapse Azul + Vermelho. Nada toca Satoru Gojo.`,
      };
    },
  },

  'requiem-arrow_unique': {
    execute: async (ctx) => {
      // STAND EVOLUI: PRÓXIMA ability do jogador é amplificada para versão
      // Requiem (dano ×2, todas durações ×2, custos zerados).
      ctx.requiemNextAmplify = true;
      // Plus: 3 cargas de amp para garantir burst
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 1 });
      ctx.playerStatuses.push({ type: 'magic_amp',    multiplier: 2, charges: 1 });
      // E uma esquiva pra sobreviver até usar
      ctx.playerStatuses.push({ type: 'evasion', charges: 1 });
      return {
        success: true,
        message: `🏹 FLECHA REQUIEM — Stand evolui ao próximo plano. Sua PRÓXIMA ability sai em versão Requiem: dano ×2 garantido + 1 esquiva pra chegar viva. Use sua melhor carta agora.`,
      };
    },
  },

  'spirit-gun_unique': {
    execute: async (ctx) => {
      // CARGA REIGAN: ao invés de dano imediato, INICIA acumulação.
      // Cada hit recebido nos próximos 5 turnos = +1 carga.
      // Auto-dispara ao fim dos 5 turnos OU se cair pra <25% HP.
      // Dano final = 35 × cargas (true damage). Começa com 2 cargas iniciais.
      ctx.spiritGunCharge = {
        charges: 2,
        damagePerCharge: 35,
        turnsLeft: 5,
        triggerHpThreshold: 0.25,
        fired: false,
      };
      const dmgInicial = Math.floor(ctx.enemy.hpMax * 0.15) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmgInicial);
      return {
        success: true,
        damage: dmgInicial,
        message: `🔫 REIGAN CARREGANDO — Yusuke aponta o indicador. ${dmgInicial} de dano inicial + começa com 2 cargas. Cada hit recebido = +1 carga. Dispara em 5 turnos OU se cair pra <25% HP: 35 × cargas em TRUE DAMAGE. Apanhe pra ficar forte.`,
      };
    },
  },

  'unlimited-blade-works_unique': {
    execute: async (ctx) => {
      // CHUVA DE LÂMINAS: materializa 7 espadas. Cada turno seu, 1 lança
      // automaticamente (sem usar sua ação). Quando todas usadas: PRÓXIMA
      // ability ×3.
      ctx.swordRain = {
        remainingHits: 7,
        damagePerHit: 25,
        finalBonusMult: 3,
      };
      // Hit inicial leve pra confirmar o cast
      const dmgInicial = 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmgInicial);
      return {
        success: true,
        damage: dmgInicial,
        message: `⚔️ UNLIMITED BLADE WORKS — "Trace, on." 7 espadas materializam ao seu redor. ${dmgInicial} de dano inicial + por 7 turnos, 1 lâmina dispara grátis no início de cada turno seu (25 cada). Quando todas usadas: PRÓXIMA ABILITY ×3.`,
      };
    },
  },

  'zoltraak_unique': {
    execute: async (ctx) => {
      // MAGIA UNIVERSAL: por 4 turnos, TODAS as suas abilities (não só
      // Zoltraak) ignoram defesa mágica do inimigo. Plus dano inicial.
      const dmg = Math.floor(ctx.enemy.hpMax * 0.40) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.magicPierceTurnsLeft = 4;
      ctx.enemyStatuses.push({ type: 'defense_down', value: 50, turnsLeft: 4 });
      return {
        success: true,
        damage: dmg,
        message: `✨ ZOLTRAAK — magia ofensiva universal de uma era anterior. ${dmg} de dano + por 4 turnos, TODAS as suas abilities IGNORAM a defesa mágica inimiga + def física −50. Humanos só agora aprenderam.`,
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ??? (unknown) — Unique. Absolutos. Baseados no HP MAXIMO inimigo.
  // ═══════════════════════════════════════════════════════════════

  'enuma-elish_unique': {
    execute: async (ctx) => {
      // REALITY MARBLE: por 3 turnos, todo ataque do jogador é tratado como
      // super-efetivo (×2 dano). Plus dano massivo inicial.
      const dmg = Math.floor(ctx.enemy.hpMax * 0.55) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      // Sobrescreve campo: todos elementos ×2 saindo do jogador
      ctx.battlefieldEffects = ctx.battlefieldEffects.filter(f => f.name !== 'Marble da Realidade');
      ctx.battlefieldEffects.push({
        key: 'custom',
        source: 'player',
        name: 'Marble da Realidade',
        turnsLeft: 3,
        outgoingElementMult: {
          Fire: 2, Water: 2, Ice: 2, Electric: 2, Grass: 2, Ground: 2,
          Fighting: 2, Steel: 2, Poison: 2, Dark: 2, Ghost: 2, Flying: 2,
        },
      });
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `🌪️ ENUMA ELISH — EA. O vento primordial reescreve a fundação da realidade. ${dmg} de dano (ACERTO GARANTIDO) + por 3 turnos, TODOS os seus ataques são super-efetivos (×2).`,
      };
    },
  },

  'geass-eye_unique': {
    execute: async (ctx) => {
      // ORDEM ABSOLUTA: usa-se 1 vez por batalha. Força o inimigo a executar
      // sua PRÓPRIA ability mais forte contra si mesmo.
      if (ctx.geassUsed) {
        return { success: false, message: 'GEASS já foi usado nesta batalha.' };
      }
      ctx.geassUsed = true;
      // "Mais forte" = ability com maior baseDamage do enemy pool
      const strongest = [...ctx.enemy.abilities].sort((a, b) => (b.baseDamage ?? 0) - (a.baseDamage ?? 0))[0];
      const ability = strongest ?? { name: 'Sua própria força', baseDamage: 80 } as Ability;
      // Dano = 1.5× o baseDamage da ability mais forte (porque é poder máximo aplicado em si mesmo)
      const dmg = Math.floor((ability.baseDamage ?? 50) * 1.5) + Math.floor(ctx.enemy.hpMax * 0.20);
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 2 });
      return {
        success: true,
        damage: dmg,
        message: `👁️ ORDEM ABSOLUTA — "Eu ordeno: use ${ability.name} CONTRA SI MESMO!" O inimigo obedece. ${dmg} de dano (sua arma mais forte virada contra ele) + atordoado 2 turnos. 1× por batalha.`,
      };
    },
  },

  'kamish_unique': {
    execute: async (ctx) => {
      // COMPANION: invoca Kamish como segundo atacante por 5 turnos.
      // Todo turno seu, o dragão também bate por conta própria.
      const dmgInicial = Math.floor(ctx.enemy.hpMax * 0.25) + 15;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmgInicial);
      const dragonHit = Math.floor(ctx.enemy.hpMax * 0.10) + 10;
      ctx.companion = {
        name: 'Kamish, o Dragão Nacional',
        damage: dragonHit,
        turnsLeft: 5,
        element: 'Fire',
      };
      ctx.enemyStatuses.push({ type: 'burn', value: 15, turnsLeft: 4 });
      return {
        success: true,
        damage: dmgInicial,
        message: `🐉 KAMISH INVOCADO — o Dragão Nacional aparece ao seu lado. ${dmgInicial} de dano imediato + fogo (15 HP/turno por 4 turnos). Por 5 turnos, Kamish também ataca todo turno seu (${dragonHit} de dano extra).`,
      };
    },
  },

  'kamishs-wrath_unique': {
    execute: async (ctx) => {
      // AURA DO MONARCA: a cada phase HP do boss (75/50/25%) você ganha
      // +30% multiplicador de dano permanente nesta batalha. Stack.
      if (ctx.monarchAttrMult <= 1) ctx.monarchAttrMult = 1.30;
      else ctx.monarchAttrMult *= 1.30;
      // Hit inicial pra ativar o sangue
      const dmg = Math.floor(ctx.enemy.hpMax * 0.30) + 15;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'lifesteal', percent: 0.50, charges: 3 });
      return {
        success: true,
        damage: dmg,
        message: `👑 AURA DO MONARCA — Sung Jin-Woo se torna o Sombra-Rei. ${dmg} de dano + lifesteal 50% por 3 ataques. Ativa: a cada phase HP do boss (75/50/25%), seu dano cresce permanentemente ×1,30 (multiplicativo). Atual: ×${ctx.monarchAttrMult.toFixed(2)}.`,
      };
    },
  },

  'requiem_unique': {
    execute: async (ctx) => {
      // King Crimson: APAGA o último turno completo. HP de ambos volta.
      // Status revertem. O tempo simplesmente ignorou.
      const snap = ctx.lastTurnSnapshot;
      if (!snap) {
        // Fallback: sem snapshot ainda — aplica efeito original (HP→8%)
        const orig = ctx.enemy.hpCurrent;
        ctx.enemy.hpCurrent = Math.floor(ctx.enemy.hpMax * 0.08);
        ctx.enemyStatuses = [];
        return {
          success: true, damage: orig - ctx.enemy.hpCurrent,
          message: `REQUIEM — sem turno anterior pra apagar. Forçou: HP inimigo → 8%. Il risultato sarà zero.`,
        };
      }
      // Rewind: restaura HP, status, e status arrays de ambos
      const playerDelta = snap.playerHp - ctx.player.hpCurrent;
      const enemyDelta  = ctx.enemy.hpCurrent - snap.enemyHp;
      ctx.player.hpCurrent = snap.playerHp;
      ctx.playerStatus     = snap.playerStatus ? { ...snap.playerStatus } : null;
      ctx.playerStatuses   = snap.playerStatuses.map(s => ({ ...s }));
      ctx.enemy.hpCurrent  = snap.enemyHp;
      ctx.enemyStatus      = snap.enemyStatus ? { ...snap.enemyStatus } : null;
      ctx.enemyStatuses    = snap.enemyStatuses.map(s => ({ ...s }));
      ctx.lastTurnSnapshot = null;
      return {
        success: true,
        message: `⏳ IL RISULTATO SARÀ ZERO — King Crimson apaga o último turno completo. Você recupera ${playerDelta > 0 ? `+${playerDelta} HP` : 'estado anterior'}; inimigo recupera ${enemyDelta > 0 ? `${enemyDelta} HP` : 'estado anterior'}. O tempo simplesmente ignorou.`,
      };
    },
  },

  'return-by-death_unique': {
    execute: async (ctx) => {
      // Save-point real: snapshot do estado atual. Se morrer, batalha volta
      // a este momento exato. O inimigo perde 25% do HP máx CADA loop.
      // Até 3 loops disponíveis.
      ctx.respawnSnapshot = {
        turn:           ctx.turn,
        playerHp:       ctx.player.hpCurrent,
        playerStatus:   ctx.playerStatus ? { ...ctx.playerStatus } : null,
        playerStatuses: ctx.playerStatuses.map(s => ({ ...s })),
        enemyHp:        ctx.enemy.hpCurrent,
        enemyStatus:    ctx.enemyStatus ? { ...ctx.enemyStatus } : null,
        enemyStatuses:  ctx.enemyStatuses.map(s => ({ ...s })),
      };
      ctx.savePointCharges = 3;
      ctx.respawnEnemyHpPenalty = 0.25;
      return {
        success: true,
        message: `🌀 PORTÃO DA MORTE — Subaru cria um SAVE POINT. Se cair, a batalha volta a este momento (HP/status atuais). O inimigo perde 25% do HP máximo a cada respawn. Até 3 loops.`,
      };
    },
  },

  'time-stop_unique': {
    execute: async (ctx) => {
      // DIO para o tempo: 4 hits sequenciais sem reação + skip 2 turnos
      const hits = 4;
      let totalDmg = 0;
      for (let i = 0; i < hits; i++) {
        // Cada hit escala um pouco com base no atual do inimigo
        const hitDmg = Math.floor(ctx.enemy.hpMax * 0.10) + 15;
        totalDmg += hitDmg;
        ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - hitDmg);
        if (ctx.enemy.hpCurrent <= 0) break;
      }
      ctx.enemySkipTurns += 2;
      return {
        success: true,
        damage: totalDmg,
        message: `⏱️ TOKI WO TOMARE — DIO para o tempo. ${hits} ataques sequenciais sem que o inimigo possa reagir: ${totalDmg} de dano total. Depois ele perde 2 turnos enquanto o mundo se recompõe. Yare yare daze.`,
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW ENTRIES — added by merge_handlers.cjs
  // ═══════════════════════════════════════════════════════════════

  'gate-of-babylon_combo': {
    execute: async (ctx) => {
      // Portão da Babilônia: disparar tesouros de heróis como projéteis
      const hits = 5;
      const dmgPerHit = Math.floor(ctx.enemy.hpMax * 0.06) + 10;
      const total = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      return {
        success: true,
        damage: total,
        guaranteedHit: true,
        message: `GATE OF BABYLON — "Mongrels." Gilgamesh abre o tesouro dos reis. ${hits} relíquias arremessadas: ${total} de dano total. Inevitável.`,
      };
    },
  },

  'ultra-instinct_unique': {
    execute: async (ctx) => {
      if (ctx.playerForms.some(f => f.name === 'Ultra Instinto')) {
        return { success: false, message: 'Ultra Instinto já está ativo.' };
      }
      // MODO BENGALA: por 5 turnos, todo ataque inimigo é auto-esquivado E
      // segue de contra-ataque true damage (60% do dano original). O corpo
      // age sozinho. Você joga PURA REAÇÃO.
      ctx.autoDodgeTurnsLeft = Math.max(ctx.autoDodgeTurnsLeft, 5);
      ctx.autoCounter = { percent: 0.60, turnsLeft: 5 };
      // Bônus inicial pequeno escala com HP perdido (não é o foco)
      const missingPct = 1 - (ctx.player.hpCurrent / Math.max(1, ctx.player.hpMax));
      const dmg = Math.floor(ctx.enemy.hpMax * (0.15 + missingPct * 0.20));
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerForms.push({
        key: 'custom',
        name: 'Ultra Instinto',
        turnsLeft: 5,
        physicalDmgMult: 1.5,
        magicalDmgMult: 1.5,
      });
      return {
        success: true,
        damage: dmg,
        message: `🌀 INSTINTO SUPERIOR — Goku entra no Modo Bengala. ${dmg} de dano inicial + por 5 TURNOS, TODO ataque inimigo é esquivado automaticamente E seguido de contra-ataque (60% do dano em true damage). Pura reação.`,
      };
    },
  },

};

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getEquipmentAbilityHandler(key: string): EquipmentAbilityHandler | null {
  return registry[key] ?? null;
}

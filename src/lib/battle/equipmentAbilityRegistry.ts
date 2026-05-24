import type { BattleContext } from './BattleEngine';

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
      // Bainha de Excalibur: separa o portador da realidade → cura total + invulnerabilidade
      const healed = ctx.player.hpMax - ctx.player.hpCurrent;
      ctx.player.hpCurrent = ctx.player.hpMax;
      ctx.playerStatuses.push({ type: 'invincible', charges: 1 });
      ctx.playerStatuses.push({ type: 'magic_immune', turnsLeft: 2 });
      return {
        success: true,
        heal: healed,
        message: `AVALON — a bainha sagrada de Excalibur, separada do mundo dos mortais. HP completamente restaurado (+${healed}) + próximo hit anulado + imune a magia por 2 turnos.`,
      };
    },
  },

  'domain-expansion_unique': {
    execute: async (ctx) => {
      // Expansão do Território: dentro do domínio todos os ataques acertam obrigatoriamente
      ctx.battlefieldEffects = ctx.battlefieldEffects.filter(f => f.name !== 'Expansão do Território');
      ctx.battlefieldEffects.push({
        key: 'custom',
        source: 'player',
        name: 'Expansão do Território',
        turnsLeft: 2,
        outgoingElementMult: {
          Fire: 1.5, Water: 1.5, Ice: 1.5, Electric: 1.5,
          Ground: 1.5, Dark: 1.5, Steel: 1.5, Normal: 1.5,
        },
      });
      const dmg = Math.floor(ctx.enemy.hpMax * 0.45) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `EXPANSÃO DO TERRITÓRIO — dentro do domínio, todo ataque acerta obrigatoriamente! ${dmg} de dano + campo ativo por 2 turnos com todos os elementos amplificados ×1,5.`,
      };
    },
  },

  'dragon-balls_unique': {
    // NOTA: este item deve ter once_per_battle: true no ability_config do banco.
    // O engine setará equipmentUsed = true após uso, impedindo reutilização.
    execute: async (ctx) => {
      const heal = ctx.player.hpMax - ctx.player.hpCurrent;
      ctx.player.hpCurrent = ctx.player.hpMax;
      ctx.playerStatuses = ctx.playerStatuses.filter(s =>
        !['poison', 'burn', 'bleed', 'stun', 'freeze', 'vulnerable', 'death_curse'].includes(s.type),
      );
      ctx.reviveCharges += 1;
      return {
        success: true,
        heal,
        message: `ESFERAS DO DRAGÃO — Shenlong atende o chamado! HP completamente restaurado (+${heal}), todos os debuffs removidos e uma revive extra garantida. O desejo foi concedido.`,
      };
    },
  },

  'dragon-of-the-darkness-flame_unique': {
    execute: async (ctx) => {
      // Hiei (YuYu Hakusho): chama negra do inferno convocada da mão esquerda
      const dmg = Math.floor(ctx.enemy.hpMax * 0.45) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 18, turnsLeft: -1 });
      return {
        success: true,
        damage: dmg,
        message: `DRAGÃO DAS TREVAS EM CHAMAS — Hiei invoca o dragão do inferno da mão esquerda! ${dmg} de dano + chama negra queima permanentemente (18 HP/turno). O que o dragão queima, não se apaga.`,
      };
    },
  },

  'excalibur_unique': {
    execute: async (ctx) => {
      const dmg  = Math.floor(ctx.enemy.hpMax * 0.50) + 30;
      const heal = Math.floor(ctx.player.hpMax * 0.20);
      ctx.enemy.hpCurrent  = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      return {
        success: true,
        damage: dmg,
        heal,
        message: `EXCALIBUR — IN LUMINIS ET METALLUM! ${dmg} de dano sagrado (50% do HP máximo inimigo) + luz sagrada cura ${heal} HP de quem a empunha.`,
      };
    },
  },

  'hollow-purple_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.55) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        guaranteedHit: true,
        message: `HOLLOW PURPLE — a convergência perfeita de Lapse Azul e Vermelho de Gojo Satoru. O mais bonito e o mais destrutivo. ${dmg} de dano. Inevitável.`,
      };
    },
  },

  'limitless_unique': {
    execute: async (ctx) => {
      // Infinito de Gojo: barreira entre si e tudo → esquivas + dano Lapse Azul/Vermelho
      const dmg = Math.floor(ctx.enemy.hpMax * 0.45) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'evasion', charges: 3 });
      return {
        success: true,
        damage: dmg,
        message: `LIMITLESS — o Infinito de Satoru Gojo. Nada pode tocá-lo. ${dmg} de dano (Lapse Azul + Vermelho combinados) + 3 ataques inimigos passam pelo Infinito sem atingir.`,
      };
    },
  },

  'requiem-arrow_unique': {
    execute: async (ctx) => {
      const roll = Math.random();
      if (roll < 0.25) {
        const finalDmg = ctx.enemy.hpCurrent;
        ctx.enemy.hpCurrent = 0;
        return { success: true, damage: finalDmg, message: 'REQUIEM ARROW — o Stand além do Stand. O inimigo simplesmente... deixa de ser.' };
      } else if (roll < 0.50) {
        const dmg = Math.floor(ctx.enemy.hpMax * 0.70);
        ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
        return { success: true, damage: dmg, message: `REQUIEM ARROW — realidade reescrita. ${dmg} de dano ao inimigo.` };
      } else if (roll < 0.75) {
        const healed = ctx.player.hpMax - ctx.player.hpCurrent;
        ctx.player.hpCurrent = ctx.player.hpMax;
        ctx.playerStatuses.push({ type: 'invincible', charges: 1 });
        return { success: true, heal: healed, message: 'REQUIEM ARROW — o Stand escolheu a sobrevivência. HP restaurado + próximo hit anulado.' };
      } else {
        ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 3, charges: 5 });
        ctx.playerStatuses.push({ type: 'magic_amp',    multiplier: 3, charges: 5 });
        return { success: true, message: 'REQUIEM ARROW — poder além da compreensão. TODO dano triplicado por 5 ataques!' };
      }
    },
  },

  'spirit-gun_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.48) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        trueDamage: true,
        message: `SPIRIT GUN — energia espiritual pura de Yusuke Urameshi concentrada no dedo indicador. ${dmg} de dano verdadeiro. Ignora toda defesa.`,
      };
    },
  },

  'unlimited-blade-works_unique': {
    execute: async (ctx) => {
      const hits      = 7;
      const dmgPerHit = 16;
      const total     = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 2 });
      return {
        success: true,
        damage: total,
        message: `UNLIMITED BLADE WORKS — "Trace, on." ${hits} espadas de heróis do passado materializam. ${total} de dano total + próximos 2 ataques físicos com o dobro de força.`,
      };
    },
  },

  'zoltraak_unique': {
    execute: async (ctx) => {
      // Frieren: magia ofensiva padrão de uma era anterior, devastadora e esquecida
      const dmg = Math.floor(ctx.enemy.hpMax * 0.47) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'defense_down', value: 999, turnsLeft: -1 });
      return {
        success: true,
        damage: dmg,
        message: `ZOLTRAAK — magia ofensiva padrão de uma era anterior, que humanos só agora aprenderam. ${dmg} de dano + defesa mágica inimiga ZERADA permanentemente.`,
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ??? (unknown) — Unique. Absolutos. Baseados no HP MAXIMO inimigo.
  // ═══════════════════════════════════════════════════════════════

  'enuma-elish_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.70) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `ENUMA ELISH — EA! O vento primordial que rasgou o caos e criou o mundo. ${dmg} de dano. Herói ou monstro, irrelevante.`,
      };
    },
  },

  'geass-eye_unique': {
    execute: async (ctx) => {
      // Geass de Lelouch: ordem absoluta → inimigo usa força contra si + stun
      const dmg = Math.floor(ctx.enemy.hpMax * 0.40);
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return {
        success: true,
        damage: dmg,
        message: `GEASS — "Eu ordeno: AUTODESTRUA-SE!" O inimigo obedece à ordem absoluta. ${dmg} de dano (40% do HP máximo) + não age no próximo turno.`,
      };
    },
  },

  'kamish_unique': {
    execute: async (ctx) => {
      // Solo Leveling: dragão nacional que destruiu a Coreia do Sul
      const dmg = Math.floor(ctx.enemy.hpMax * 0.60) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 25, turnsLeft: 4 });
      return {
        success: true,
        damage: dmg,
        message: `KAMISH — o Dragão Nacional que destruiu a Coreia do Sul. Sung Jin-Woo herda o poder. ${dmg} de dano + fogo eterno por 4 turnos (25 HP/turno).`,
      };
    },
  },

  'kamishs-wrath_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.60) + 15;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'lifesteal', percent: 0.50, charges: 3 });
      return {
        success: true,
        damage: dmg,
        message: `FÚRIA DE KAMISH — Sung Jin-Woo empunha o poder do dragão. ${dmg} de dano + 50% do dano dos próximos 3 ataques vira HP.`,
      };
    },
  },

  'requiem_unique': {
    execute: async (ctx) => {
      // King Crimson + Requiem de Giorno: "o resultado será zero"
      const originalHp    = ctx.enemy.hpCurrent;
      ctx.enemy.hpCurrent = Math.floor(ctx.enemy.hpMax * 0.08);
      ctx.enemyStatuses   = [];
      const dmg           = Math.max(0, originalHp - ctx.enemy.hpCurrent);
      return {
        success: true,
        damage: dmg,
        message: `REQUIEM — "o resultado será... zero." HP inimigo reduzido a 8% do máximo. Todos os status apagados. Giorno Giovanna non si fermerà.`,
      };
    },
  },

  'return-by-death_unique': {
    execute: async (ctx) => {
      // Subaru não ataca — a carta ativa a mecânica de retorno (revive)
      ctx.reviveCharges += 1;
      return {
        success: true,
        message: 'RETORNO PELA MORTE — o Portão da Morte foi aberto. Na próxima vez que cair, Subaru retorna com 50% do HP. O custo é apenas a memória de tudo que perdeu.',
      };
    },
  },

  'time-stop_unique': {
    execute: async (ctx) => {
      // DIO para o tempo → inimigo perde 3 turnos inteiros
      ctx.enemySkipTurns += 3;
      // Durante a pausa, DIO ataca livremente
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.25) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true,
        damage: dmg,
        message: `ZA WARUDO — O TEMPO PARA! O inimigo perde 3 turnos enquanto o mundo está congelado. ${dmg} de dano durante a pausa temporal. Yare yare daze.`,
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
      // Dano escala com HP perdido: Goku ativou UI quando estava à beira da morte
      const missingPct = 1 - (ctx.player.hpCurrent / Math.max(1, ctx.player.hpMax));
      const dmg = Math.floor(ctx.enemy.hpMax * (0.30 + missingPct * 0.30));
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      // O corpo reage antes da mente → autoDodge por 4 turnos
      ctx.autoDodgeTurnsLeft = Math.max(ctx.autoDodgeTurnsLeft, 4);
      ctx.playerForms.push({
        key: 'custom',
        name: 'Ultra Instinto',
        turnsLeft: 4,
        physicalDmgMult: 1.75,
        magicalDmgMult: 1.75,
      });
      const hpLostPct = Math.floor(missingPct * 100);
      return {
        success: true,
        damage: dmg,
        message: `ULTRA INSTINTO — o corpo age antes do pensamento. ${hpLostPct}% de HP perdido amplifica o golpe: ${dmg} de dano. Todos os ataques inimigos esquivados por 4 turnos. Dano ×1,75 enquanto durar.`,
      };
    },
  },

};

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getEquipmentAbilityHandler(key: string): EquipmentAbilityHandler | null {
  return registry[key] ?? null;
}

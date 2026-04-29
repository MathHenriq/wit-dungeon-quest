import type { BattleContext } from './BattleEngine';

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
      return { success: true, damage: dmg, message: 'Excalibur irradia luz dourada e corta o inimigo!' };
    },
  },

  'behelit_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'O Behelit pulsa — energia sombria liberada!' };
    },
  },

  'berserker-rag_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'A fúria berserker explode em um golpe bruto!' };
    },
  },

  'bloodlust_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Sede de sangue desferida — golpe implacável!' };
    },
  },

  'cannon-arm_combo': {
    execute: async (ctx) => {
      const dmg = 24;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'DISPARO — braço canhão em alta velocidade!' };
    },
  },

  'dark-magician_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Feitiço das trevas conjurado pelo Mago Negro!' };
    },
  },

  'direct-shot_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Tiro direto — sem desvio, sem piedade.' };
    },
  },

  'disaster_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Uma onda de calamidade abate sobre o inimigo!' };
    },
  },

  'enma_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Enma — a katana que corta até a alma do inimigo!' };
    },
  },

  'erasure_combo': {
    execute: async (ctx) => {
      const dmg = 16;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Habilidade apagada — o inimigo hesita e leva o golpe!' };
    },
  },

  'explosion-rush_combo': {
    execute: async (ctx) => {
      const dmg = 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'EXPLOOOOSÃO! Megumin aprovaria.' };
    },
  },

  'fairy-tail-mark_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'A marca da Fairy Tail canaliza poder mágico em ataque!' };
    },
  },

  'foice-tripla_combo': {
    execute: async (ctx) => {
      const dmg = 21;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Três cortes simultâneos em arco perfeito!' };
    },
  },

  'gomu-gomu-no-mi_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'GOMU GOMU NO PISTOL!' };
    },
  },

  'gura-gura_combo': {
    execute: async (ctx) => {
      const dmg = 23;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Tremor sísmico — o próprio ar racha!' };
    },
  },

  'half-cold-half-hot_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Gelo e fogo — ataque duplo-elemental de Todoroki!' };
    },
  },

  'hamon-overdrive_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'HAMON OVERDRIVE — energia solar amplificada!' };
    },
  },

  'ice-make_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Ice Make: Lance — lança de gelo disparada!' };
    },
  },

  'instant-transmission_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Teletransporte instantâneo — golpe surpresa antes da reação!' };
    },
  },

  'jajanken_combo': {
    execute: async (ctx) => {
      const opts = [15, 20, 25];
      const dmg  = opts[Math.floor(Math.random() * opts.length)];
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: `JAN KEN PON! (${dmg} de dano — resultado sempre imprevisível)` };
    },
  },

  'knight-killer_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Mata-cavaleiros — especializado em abrir armaduras!' };
    },
  },

  'kurapikas-chains_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'As correntes de Kurapika prendem e golpeiam!' };
    },
  },

  'mana-zone_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Zona de mana — ataque de qualquer ângulo sem ponto cego!' };
    },
  },

  'mera-mera_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Mera Mera no Mi — chamas de Sabo irrompem!' };
    },
  },

  'meta-vision_combo': {
    execute: async (ctx) => {
      const dmg = 16;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Meta Vision — ponto fraco localizado e explorado!' };
    },
  },

  'metal-vessel_combo': {
    execute: async (ctx) => {
      const dmg = 19;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Djinn canalizado pelo vaso metálico — golpe de Magi!' };
    },
  },

  'millennium-puzzle_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'O Puzzle do Milênio ativa seu poder misterioso!' };
    },
  },

  'nichirin_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Lâmina Nichirin — forjada com luz solar, letal para demônios!' };
    },
  },

  'ora-barrage_combo': {
    execute: async (ctx) => {
      const dmg = 21;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'ORA ORA ORA! Rajada de golpes do Stand!' };
    },
  },

  'predator-eye_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Olho do Predador mira o ponto fatal — sem escapatória!' };
    },
  },

  'puppet-naruto_combo': {
    execute: async (ctx) => {
      const dmg = 17;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Marionete de Naruto atacou antes do inimigo perceber!' };
    },
  },

  'quick-attack_combo': {
    execute: async (ctx) => {
      const dmg = 16;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Ataque relâmpago — antes do inimigo ter tempo de reagir!' };
    },
  },

  'quinque_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Quinque de investigador — arma forjada de kagune!' };
    },
  },

  'rinkaku-kagune_combo': {
    execute: async (ctx) => {
      const dmg = 21;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Tentáculos Rinkaku perfuram o inimigo!' };
    },
  },

  'rulers-authority_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'A Autoridade do Governante é imposta pela força!' };
    },
  },

  'samehada_combo': {
    execute: async (ctx) => {
      const dmg = 19;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Samehada raspa e devora o chakra inimigo!' };
    },
  },

  'sekki_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Sekki canaliza força espiritual em cada corte!' };
    },
  },

  'sharingan_combo': {
    execute: async (ctx) => {
      const dmg = 19;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Sharingan — o golpe foi copiado e devolvido antes do original!' };
    },
  },

  'soul-resonance_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Ressonância de almas amplifica o golpe além do normal!' };
    },
  },

  'staff-of-frieren_combo': {
    execute: async (ctx) => {
      const dmg = 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Cajado de Frieren — magia ancestral de uma era esquecida!' };
    },
  },

  'stealth_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Ataque furtivo disparado das sombras — o inimigo nem viu!' };
    },
  },

  'steel-balls_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Esferas de aço em rotação de spin perfeito — Gyro Zeppeli!' };
    },
  },

  'survey-corps-cloak_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Capa do Batalhão Explorador — coragem de atacar mesmo com medo!' };
    },
  },

  'titan-serum_combo': {
    execute: async (ctx) => {
      const dmg = 22;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Soro Titã injetado — força colossal liberada no golpe!' };
    },
  },

  'titan-shift_combo': {
    execute: async (ctx) => {
      const dmg = 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Mudança Titã — forma colossal esmaga o inimigo!' };
    },
  },

  'water-breathing_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Respiração da Água — Primeira Forma: Dança da Superfície!' };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // INCOMUM — Dano flat maior. Faixa: 26–40. Senzu Bean = cura.
  // ═══════════════════════════════════════════════════════════════

  'gons-fishing-rod_combo': {
    execute: async (ctx) => {
      const dmg = 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'A vara de pescaria de Gon chicoteia com força absurda!' };
    },
  },

  'hisokas-cards_combo': {
    execute: async (ctx) => {
      const dmg = 32;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Cartas de Hisoka — impregnadas de Nen, cortam como navalha!' };
    },
  },

  'ignition-gloves_combo': {
    execute: async (ctx) => {
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Luvas de ignição — chamas ao impacto!' };
    },
  },

  'killuas-yo-yos_combo': {
    execute: async (ctx) => {
      const dmg = 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Yo-yos de aço condutores — eletricidade de Killua no impacto!' };
    },
  },

  'kunai_combo': {
    execute: async (ctx) => {
      const dmg = 26;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Kunai arremessado com precisão ninja!' };
    },
  },

  'kunai-trovao_combo': {
    execute: async (ctx) => {
      const dmg = 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Kunai do Trovão — raio e aço rasgam o campo!' };
    },
  },

  'odm-gear_combo': {
    execute: async (ctx) => {
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'ODM Gear — manobra aérea em alta velocidade, corte preciso!' };
    },
  },

  'papel-explosivo_combo': {
    execute: async (ctx) => {
      const dmg = 35;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Papel explosivo selado com chakra — DETONA no contato!' };
    },
  },

  'power-pole_combo': {
    execute: async (ctx) => {
      const dmg = 27;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Bastão de Goku se estende e golpeia à distância!' };
    },
  },

  'scouter_combo': {
    execute: async (ctx) => {
      const dmg = 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Scouter detecta o ponto fraco — ataque cirúrgico!' };
    },
  },

  'senzu-bean_combo': {
    execute: async (ctx) => {
      const heal = 40;
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      return { success: true, heal, message: 'Feijão Senzu engolido — energia restaurada instantaneamente!' };
    },
  },

  'state-alchemist-watch_combo': {
    execute: async (ctx) => {
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Alquimista de Estado — transmutação converte o ar em golpe!' };
    },
  },

  'thunder-spears_combo': {
    execute: async (ctx) => {
      const dmg = 38;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Thunder Spears — explosão de trovão no alvo!' };
    },
  },

  'ultrahard-steel-blades_combo': {
    execute: async (ctx) => {
      const dmg = 32;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Lâminas de aço ultraduro — perfuram qualquer coisa!' };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // RARA — Status effects ou % de dano.
  // ═══════════════════════════════════════════════════════════════

  'adolla-burst_combo': {
    execute: async (ctx) => {
      ctx.enemyStatuses.push({ type: 'burn', value: 12, turnsLeft: 4 });
      return { success: true, message: 'ADOLLA BURST — chama do inferno queimando por 4 turnos! (12 HP/turno)' };
    },
  },

  'automail-blade_combo': {
    execute: async (ctx) => {
      const dmg = 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'defense_down', value: 25, turnsLeft: 3 });
      return { success: true, damage: dmg, message: 'Lâmina Automail rasga a armadura! Defesa inimiga reduzida por 3 turnos.' };
    },
  },

  'benimarus-crimson-moon_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.10) + 15;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 10, turnsLeft: 3 });
      return { success: true, damage: dmg, message: 'LUA ESCARLATE — queima proporcional + burn por 3 turnos! (10 HP/turno)' };
    },
  },

  'dark-shadow_combo': {
    execute: async (ctx) => {
      const pct = ctx.enemy.hpCurrent / ctx.enemy.hpMax;
      const dmg = pct < 0.5
        ? Math.floor(ctx.enemy.hpCurrent * 0.18) + 20
        : 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true, damage: dmg,
        message: pct < 0.5
          ? 'Dark Shadow UNLEASHED — inimigo fraco, sombra descontrolada! Dano máximo!'
          : 'Dark Shadow ataca — poder contido pela luz.',
      };
    },
  },

  'dragon-cleave_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.14) + 18;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'Corte do Dragão — fende proporcional à resistência inimiga!' };
    },
  },

  'dragon-lacrima_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'magic_amp', multiplier: 1.5, charges: 3 });
      return { success: true, message: 'Lacrima do Dragão ativa! Próximos 3 ataques mágicos causam 50% a mais de dano.' };
    },
  },

  'erzas-armors_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'shield', value: 55 });
      return { success: true, message: 'Erza troca de armadura! Escudo de 55 HP absorve o próximo dano recebido.' };
    },
  },

  'mascara-hollow_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 1.5, charges: 3 });
      return { success: true, message: 'MASCARA HOLLOW ativada! Próximos 3 ataques físicos causam 50% a mais de dano.' };
    },
  },

  'skull-knight-sword_combo': {
    execute: async (ctx) => {
      const dmg = 45;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, trueDamage: true, message: 'Espada do Cavaleiro Caveira — corte dimensional ignora toda defesa!' };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ÉPICA — Mecânicas elaboradas, fiel ao universo.
  // ═══════════════════════════════════════════════════════════════

  'anti-magic-slash_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'magic_immune', turnsLeft: 5 });
      return { success: true, message: 'CORTE ANTI-MAGIA! Toda magia inimiga é anulada por 5 turnos.' };
    },
  },

  'barukas-dagger_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'poison', value: 12, turnsLeft: -1 });
      return { success: true, damage: dmg, message: 'Adaga de Baruka — VENENO CURSADO aplicado permanentemente! (12 HP/turno)' };
    },
  },

  'black-divider_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.15) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'defense_down', value: 40, turnsLeft: 4 });
      return { success: true, damage: dmg, message: 'BLACK DIVIDER — o campo é cortado! Defesa inimiga destroçada por 4 turnos.' };
    },
  },

  'black-flash_combo': {
    execute: async (ctx) => {
      const dmg = 60;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return { success: true, damage: dmg, message: 'BLACK FLASH — convergência perfeita de energia cursada! Inimigo atordoado!' };
    },
  },

  'chain-jail_combo': {
    execute: async (ctx) => {
      const dmg = 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'freeze', turnsLeft: 2 });
      return { success: true, damage: dmg, message: 'CHAIN JAIL — correntes aprisionam o inimigo! Não age por 2 turnos.' };
    },
  },

  'cruel-sun_combo': {
    execute: async (ctx) => {
      const dmg = 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 15, turnsLeft: 5 });
      return { success: true, damage: dmg, message: 'SOL CRUEL — queima e continua queimando por 5 turnos! (15 HP/turno)' };
    },
  },

  'cursed-speech_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.20);
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'FALA AMALDICOADAA — "exploda!" O inimigo usa a própria força contra si!' };
    },
  },

  'dimension-slash_combo': {
    execute: async (ctx) => {
      const dmg = 55;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, trueDamage: true, message: 'CORTE DIMENSIONAL — rasga o espaço! Toda defesa é irrelevante.' };
    },
  },

  'dragon-force_combo': {
    execute: async (ctx) => {
      const dmg = 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 3 });
      return { success: true, damage: dmg, message: 'DRAGON FORCE ativado! Próximos 3 ataques físicos causam o DOBRO de dano.' };
    },
  },

  'equivalent-exchange_combo': {
    execute: async (ctx) => {
      const cost = Math.floor(ctx.player.hpMax * 0.12);
      const dmg  = Math.floor(ctx.enemy.hpCurrent * 0.35);
      ctx.player.hpCurrent = Math.max(1, ctx.player.hpCurrent - cost);
      ctx.enemy.hpCurrent  = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: `TROCA EQUIVALENTE — pagou ${cost} HP, causou ${dmg} de dano! A lei é implacável.` };
    },
  },

  'final-flash_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.22) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'FINAL FLASH — todo o ki de Vegeta liberado em um único disparo!' };
    },
  },

  'fire-dragon-roar_combo': {
    execute: async (ctx) => {
      const dmg = 28;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 12, turnsLeft: 4 });
      return { success: true, damage: dmg, message: 'RUGIDO DO DRAGAO DE FOGO! Chamas ardem por 4 turnos. (12 HP/turno)' };
    },
  },

  'flame-alchemy_combo': {
    execute: async (ctx) => {
      const dmg = 40;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 8, turnsLeft: 5 });
      return { success: true, damage: dmg, message: 'ALQUIMIA DE CHAMA — um estalo e tudo vira cinzas. Burn por 5 turnos.' };
    },
  },

  'full-counter_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'counter', multiplier: 2, cooldownRounds: 0 });
      return { success: true, message: 'FULL COUNTER ativado! O próximo ataque recebido será devolvido com o DOBRO de força. Cooldown: 5 rounds.' };
    },
  },

  'godspeed_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'evasion', charges: 3 });
      return { success: true, message: 'GODSPEED ativado! Killua se move além do limite — próximos 3 ataques serão esquivados automaticamente.' };
    },
  },

  'hinokami-kagura_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 5 });
      return { success: true, message: 'HINOKAMI KAGURA — Dança do Deus do Fogo! Próximos 5 ataques físicos causam o DOBRO de dano.' };
    },
  },

  'inverted-spear-of-heaven_combo': {
    execute: async (ctx) => {
      const hadStatuses = ctx.enemyStatuses.length > 0;
      ctx.enemyStatuses  = [];
      const dmg = 35;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return {
        success: true, damage: dmg,
        message: hadStatuses
          ? `LANCA INVERTIDA DO CEU — anula toda técnica inimiga! Todos os status removidos + ${dmg} de dano.`
          : `LANCA INVERTIDA DO CEU — ${dmg} de dano puro!`,
      };
    },
  },

  'kaioken_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 3 });
      ctx.playerStatuses.push({ type: 'vulnerable',   percent: 0.30, turnsLeft: 3 });
      return { success: true, message: 'KAIOKEN — poder físico DOBRADO por 3 ataques! Corpo 30% mais vulnerável durante o efeito.' };
    },
  },

  'kakuja-form_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.15) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 4 });
      ctx.playerStatuses.push({ type: 'vulnerable',   percent: 0.20, turnsLeft: 4 });
      return { success: true, damage: dmg, message: 'FORMA KAKUJA — controle perdido! Poder duplicado, defesas comprometidas.' };
    },
  },

  'kamehameha_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.18) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'KA-ME-HA-ME-HA!' };
    },
  },

  'kasakas-venom-fang_combo': {
    execute: async (ctx) => {
      const hasPoison = ctx.enemyStatuses.some(s => s.type === 'poison');
      if (hasPoison) {
        return { success: false, message: 'O veneno de Kasaka já corre nas veias inimigas — não pode ser aplicado novamente.' };
      }
      ctx.enemyStatuses.push({ type: 'poison', value: 15, turnsLeft: -1 });
      return { success: true, message: 'PRESAS VENENOSAS DE KASAKA — veneno sem cura injetado! Inimigo perde 15 HP POR TURNO até o fim da batalha.' };
    },
  },

  'one-for-all-smash_combo': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.16) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return { success: true, damage: dmg, message: 'DETROIT SMASH — 100% One For All! Inimigo atordoado pelo impacto!' };
    },
  },

  'orb-of-avarice_combo': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'magic_amp', multiplier: 2, charges: 1 });
      return { success: true, message: 'ORB OF AVARICE — energia mágica concentrada! Próximo ataque mágico causa o DOBRO de dano.' };
    },
  },

  'playful-cloud_combo': {
    execute: async (ctx) => {
      const roll = Math.random();
      if (roll < 0.33) {
        const dmg = 30 + Math.floor(Math.random() * 40);
        ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
        return { success: true, damage: dmg, message: `PLAYFUL CLOUD — golpe selvagem! ${dmg} de dano.` };
      } else if (roll < 0.66) {
        ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 2 });
        return { success: true, message: 'PLAYFUL CLOUD — inimigo completamente imobilizado por 2 turnos!' };
      } else {
        const heal = 35;
        ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
        return { success: true, heal, message: 'PLAYFUL CLOUD — a ferramenta cursada decidiu curar! (+35 HP)' };
      }
    },
  },

  'prison-realm_combo': {
    execute: async (ctx) => {
      const dmg = 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'freeze', turnsLeft: 1 });
      return { success: true, damage: dmg, message: 'PRISON REALM — inimigo selado na barreira! Não age no próximo turno.' };
    },
  },

  'shadow-extraction_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'freeze', turnsLeft: 2 });
      return { success: true, damage: dmg, message: 'SHADOW EXTRACTION — sombra inimiga extraída! Não age por 2 turnos.' };
    },
  },

  'split-soul-katana_combo': {
    execute: async (ctx) => {
      const dmg = 50;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, trueDamage: true, message: 'KATANA DA ALMA DIVIDIDA — corte na alma, defesa física completamente ignorada.' };
    },
  },

  'ten-shadows_combo': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'bleed', value: 15, turnsLeft: 3 });
      return { success: true, damage: dmg, message: 'DEZ SOMBRAS — shikigami invocados! Atacam por 3 turnos. (15 HP/turno)' };
    },
  },

  'thunderclap-and-flash_combo': {
    execute: async (ctx) => {
      const dmg = 62;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, guaranteedHit: true, message: 'TROVAO E RELAMPAGO — Zenitsu dorme e voa. Um corte. Irresistível.' };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // LENDÁRIA — Unique. Efeitos que mudam o estado da batalha.
  // ═══════════════════════════════════════════════════════════════

  'berserker-armor_unique': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 3, charges: 3 });
      ctx.playerStatuses.push({ type: 'burn', value: 8, turnsLeft: 3 });
      return { success: true, message: 'ARMADURA BERSERKER — todos os limitadores REMOVIDOS! Próximos 3 ataques físicos: TRIPLO de dano. Custo: 8 HP/turno.' };
    },
  },

  'chastiefol_unique': {
    execute: async (ctx) => {
      const dmg = 80;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 2 });
      return { success: true, damage: dmg, message: 'CHASTIEFOL — Tesouro Sagrado do Rei das Fadas! 80 de dano + inimigo imobilizado por 2 turnos.' };
    },
  },

  'death-scythe_unique': {
    execute: async (ctx) => {
      const pct = ctx.enemy.hpCurrent / ctx.enemy.hpMax;
      if (pct < 0.35) {
        const finalDmg = ctx.enemy.hpCurrent;
        ctx.enemy.hpCurrent = 0;
        return { success: true, damage: finalDmg, message: 'FOICE DA MORTE — a alma foi ceifada! EXECUCAO INSTANTANEA abaixo de 35% HP!' };
      }
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.35) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: `FOICE DA MORTE — ${dmg} de dano. (Abaixo de 35% HP seria execução instantânea...)` };
    },
  },

  'demon-sword-ragnarok_unique': {
    execute: async (ctx) => {
      const dmg = 55;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'lifesteal', percent: 0.40, charges: 3 });
      return { success: true, damage: dmg, message: 'ESPADA DEMONIACA RAGNAROK — 55 de dano + absorcao de vida: 40% do dano dos próximos 3 ataques vira HP.' };
    },
  },

  'dragon-slayer_unique': {
    execute: async (ctx) => {
      const dmg = 100;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'DRAGON SLAYER — uma espada idiota demais para existir. 100 de dano puro.' };
    },
  },

  'gideon_unique': {
    execute: async (ctx) => {
      const dmg = 75;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return { success: true, damage: dmg, message: 'GIDEON — peso colossal esmaga o inimigo! 75 de dano + atordoado por 1 turno.' };
    },
  },

  'hyorinmaru_unique': {
    execute: async (ctx) => {
      const dmg = 50;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'freeze', turnsLeft: 3 });
      return { success: true, damage: dmg, message: 'HYORINMARU — o céu congela! 50 de dano + inimigo CONGELADO por 3 turnos.' };
    },
  },

  'lostvayne_unique': {
    execute: async (ctx) => {
      ctx.playerStatuses.push({ type: 'counter', multiplier: 1.5, cooldownRounds: 999, charges: 3 });
      return { success: true, message: 'LOSTVAYNE — reflexo criado! Os próximos 3 ataques recebidos são refletidos com 150% de força.' };
    },
  },

  'mjolnir_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.25) + 40;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 2 });
      return { success: true, damage: dmg, message: 'MJOLNIR — raio divino! Inimigo atordoado por 2 turnos pelo poder de Thor.' };
    },
  },

  'murasame_unique': {
    execute: async (ctx) => {
      const dmg = 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'death_curse', value: 25, turnsLeft: -1 });
      return { success: true, damage: dmg, message: 'MURASAME — apenas um toque. A MALDICAO DA MORTE ativa. 25 HP/turno para sempre. Não tem cura.' };
    },
  },

  'philosophers-stone_unique': {
    execute: async (ctx) => {
      const heal = Math.floor(ctx.player.hpMax * 0.60);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      ctx.playerStatuses = ctx.playerStatuses.filter(s =>
        !['poison','burn','bleed','stun','freeze','vulnerable','death_curse'].includes(s.type),
      );
      return { success: true, heal, message: `PEDRA FILOSOFAL — energia de almas! +${heal} HP (60% do máximo) + todos os debuffs removidos.` };
    },
  },

  'potara-earrings_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.player.forca * 3.5) + 40;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'BRINCOS POTARA — poder da fusão permanente! Dano calculado com toda a sua Força.' };
    },
  },

  'rhitta_unique': {
    execute: async (ctx) => {
      const dmg = Math.min(ctx.turn * 15, 90) + 40;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: `RHITTA — "Quem me deu esse poder?" Turno ${ctx.turn}: ${dmg} de dano. Quanto mais tarde usada, mais devastadora.` };
    },
  },

  'senbonzakura_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.20) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'bleed', value: 8, turnsLeft: 5 });
      return { success: true, damage: dmg, message: 'SENBONZAKURA KAGEYOSHI — mil pétalas de aço! Cortes persistem por 5 turnos. (8 HP/turno)' };
    },
  },

  'stand-arrow_unique': {
    execute: async (ctx) => {
      const roll = Math.floor(Math.random() * 5);
      switch (roll) {
        case 0: {
          const dmg = 90;
          ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
          return { success: true, damage: dmg, message: 'STAND ARROW — Stand de combate! Golpe devastador: 90 de dano!' };
        }
        case 1: {
          ctx.enemyStatuses.push({ type: 'freeze', turnsLeft: 3 });
          return { success: true, message: 'STAND ARROW — Stand de tempo! Inimigo paralisado por 3 turnos!' };
        }
        case 2: {
          ctx.playerStatuses.push({ type: 'evasion', charges: 4 });
          return { success: true, message: 'STAND ARROW — Stand de velocidade! Próximos 4 ataques garantidamente esquivados!' };
        }
        case 3: {
          const heal = Math.floor(ctx.player.hpMax * 0.50);
          ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
          return { success: true, heal, message: 'STAND ARROW — Stand de cura! 50% do HP máximo restaurado!' };
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
      const heal = Math.floor(ctx.player.hpMax * 0.35);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      ctx.playerStatuses.push({ type: 'vampiric', percent: 0.50, charges: 5 });
      return { success: true, heal, message: 'MASCARA DE PEDRA — transformacao vampirica! +35% HP + absorve 50% do dano como vida por 5 ataques.' };
    },
  },

  'tensa-zanguetsu_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpCurrent * 0.30) + 35;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'evasion', charges: 2 });
      return { success: true, damage: dmg, message: 'TENSA ZANGETSU — BANKAI! Velocidade máxima. Próximos 2 ataques esquivados automaticamente.' };
    },
  },

  'volundr_unique': {
    execute: async (ctx) => {
      const dmg = 65;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'shield', value: 60 });
      return { success: true, damage: dmg, message: 'VOLUNDR — forja divina! 65 de dano + escudo de 60 HP ativado simultaneamente.' };
    },
  },

  'z-sword_unique': {
    execute: async (ctx) => {
      const dmg = 70;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 3 });
      return { success: true, damage: dmg, message: 'Z SWORD — poder dos deuses liberado! 70 de dano + próximos 3 ataques físicos com o DOBRO.' };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // MITICA — Unique. Efeitos transformadores absolutos.
  // ═══════════════════════════════════════════════════════════════

  'avalon_unique': {
    execute: async (ctx) => {
      const healed = ctx.player.hpMax - ctx.player.hpCurrent;
      ctx.player.hpCurrent = ctx.player.hpMax;
      ctx.playerStatuses.push({ type: 'invincible', charges: 1 });
      return { success: true, heal: healed, message: 'AVALON — a bainha sagrada! HP COMPLETAMENTE RESTAURADO + próximo ataque recebido ANULADO.' };
    },
  },

  'domain-expansion_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.45) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return { success: true, damage: dmg, guaranteedHit: true, message: 'EXPANSAO DE DOMINIO — acerto garantido dentro do domínio! O inimigo não tem para onde correr.' };
    },
  },

  'dragon-balls_unique': {
    execute: async (ctx) => {
      const healed = ctx.player.hpMax - ctx.player.hpCurrent;
      ctx.player.hpCurrent = ctx.player.hpMax;
      ctx.playerStatuses = ctx.playerStatuses.filter(s =>
        !['poison','burn','bleed','stun','freeze','vulnerable','death_curse'].includes(s.type),
      );
      return { success: true, heal: healed, message: 'AS 7 ESFERAS DO DRAGAO reunidas! Shenlong concede UM DESEJO: HP PLENO + todos debuffs removidos!' };
    },
  },

  'dragon-of-the-darkness-flame_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.40) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 20, turnsLeft: 5 });
      return { success: true, damage: dmg, message: 'DRAGAO DA CHAMA DAS TREVAS — o dragão devora e continua queimando! 5 turnos de inferno. (20 HP/turno)' };
    },
  },

  'excalibur_unique': {
    execute: async (ctx) => {
      const dmg   = Math.floor(ctx.enemy.hpMax * 0.50) + 30;
      const heal  = Math.floor(ctx.player.hpMax * 0.20);
      ctx.enemy.hpCurrent  = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      return { success: true, damage: dmg, heal, message: 'EXCALIBUR — IM LUMINIS ET METALLUM! A espada do rei dos reis. Luz sagrada cura quem a empunha.' };
    },
  },

  'hollow-purple_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.55) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, guaranteedHit: true, message: 'HOLLOW PURPLE — convergência total de Gojo Satoru. O mais bonito e o mais destrutivo.' };
    },
  },

  'limitless_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.45) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'evasion', charges: 3 });
      return { success: true, damage: dmg, message: 'LIMITLESS — o Infinito de Gojo. Próximos 3 ataques esquivados + dano devastador simultâneo.' };
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
      return { success: true, damage: dmg, trueDamage: true, message: 'SPIRIT GUN — energia espiritual pura de Yusuke! Ignora toda defesa.' };
    },
  },

  'unlimited-blade-works_unique': {
    execute: async (ctx) => {
      const hits      = 7;
      const dmgPerHit = 16;
      const total     = hits * dmgPerHit;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - total);
      ctx.playerStatuses.push({ type: 'physical_amp', multiplier: 2, charges: 2 });
      return { success: true, damage: total, message: `UNLIMITED BLADE WORKS — Trace on. ${hits} espadas lendárias. ${total} de dano total + próximos 2 ataques dobrados.` };
    },
  },

  'zoltraak_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.47) + 30;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'defense_down', value: 999, turnsLeft: -1 });
      return { success: true, damage: dmg, message: 'ZOLTRAAK — magia de uma era anterior. Defesa magica inimiga ZERADA permanentemente.' };
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ??? (unknown) — Unique. Absolutos. Baseados no HP MAXIMO inimigo.
  // ═══════════════════════════════════════════════════════════════

  'enuma-elish_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.70) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, damage: dmg, message: 'ENUMA ELISH — EA! O VENTO PRIMORDIAL RASGA A REALIDADE!' };
    },
  },

  'geass-eye_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.40);
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'stun', turnsLeft: 1 });
      return { success: true, damage: dmg, message: 'GEASS — eu ordeno: AUTODESTRUA-SE! O inimigo usa sua própria força contra si e não age no próximo turno.' };
    },
  },

  'kamish_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.60) + 20;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'burn', value: 25, turnsLeft: 4 });
      return { success: true, damage: dmg, message: 'KAMISH — o dragão que destruiu a Coreia sopra fogo eterno! Burn devastador por 4 turnos. (25 HP/turno)' };
    },
  },

  'kamishs-wrath_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.60) + 15;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.playerStatuses.push({ type: 'lifesteal', percent: 0.50, charges: 3 });
      return { success: true, damage: dmg, message: 'FURIA DE KAMISH — Sung Jin-Woo com o poder do dragão! 50% do dano dos próximos 3 ataques vira HP.' };
    },
  },

  'requiem_unique': {
    execute: async (ctx) => {
      const originalHp    = ctx.enemy.hpCurrent;
      ctx.enemy.hpCurrent = Math.floor(ctx.enemy.hpMax * 0.08);
      ctx.enemyStatuses   = [];
      const dmg           = Math.max(0, originalHp - ctx.enemy.hpCurrent);
      return { success: true, damage: dmg, message: 'REQUIEM — "o resultado será... zero." HP inimigo reduzido a 8% do total. Todos os status removidos.' };
    },
  },

  'return-by-death_unique': {
    execute: async (ctx) => {
      const healed = ctx.player.hpMax - ctx.player.hpCurrent;
      ctx.player.hpCurrent = ctx.player.hpMax;
      ctx.playerStatuses = ctx.playerStatuses.filter(s =>
        !['poison','burn','bleed','stun','freeze','vulnerable','death_curse'].includes(s.type),
      );
      const dmg = 40;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      return { success: true, heal: healed, damage: dmg, message: 'RETORNO PELA MORTE — Subaru recomeça com tudo! HP PLENO, debuffs removidos + 40 de dano.' };
    },
  },

  'time-stop_unique': {
    execute: async (ctx) => {
      const dmg = Math.floor(ctx.enemy.hpMax * 0.55) + 25;
      ctx.enemy.hpCurrent = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.enemyStatuses.push({ type: 'freeze', turnsLeft: 3 });
      return { success: true, damage: dmg, message: 'ZA WARUDO — O TEMPO PARA! Inimigo congelado por 3 turnos. Não pode processar o que aconteceu.' };
    },
  },

  'ultra-instinct_unique': {
    execute: async (ctx) => {
      const dmg  = Math.floor(ctx.enemy.hpMax * 0.55) + 20;
      const heal = Math.floor(ctx.player.hpMax * 0.30);
      ctx.enemy.hpCurrent  = Math.max(0, ctx.enemy.hpCurrent - dmg);
      ctx.player.hpCurrent = Math.min(ctx.player.hpMax, ctx.player.hpCurrent + heal);
      ctx.playerStatuses.push({ type: 'evasion', charges: 3 });
      return { success: true, damage: dmg, heal, message: 'ULTRA INSTINCT — o corpo age antes do pensamento. Dano + cura + 3 esquivas garantidas. O pico absoluto.' };
    },
  },

};

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getEquipmentAbilityHandler(key: string): EquipmentAbilityHandler | null {
  return registry[key] ?? null;
}

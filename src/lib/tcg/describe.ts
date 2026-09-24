/**
 * Gera o texto de uma carta a partir da definição dela.
 *
 * Com 500 cartas, texto escrito à mão e efeito programado à parte vão
 * divergir — é só questão de tempo até uma carta dizer "+10" e fazer +15.
 * Aqui o texto é DERIVADO do efeito: se a regra muda, o texto muda junto.
 */

import { ELEMENT_PT, STATUS_PT } from './labels';
import type { Amount, CardDef, CardFilter, CardType, Condition, Cost, Effect, Passive, Side } from './types';

// ─── Gramática ───────────────────────────────────────────────────────────────

/** Nome do tipo no singular e no plural, com o gênero para "um/uma", "outro/outra". */
const TIPO: Record<CardType, { sing: string; plur: string; fem: boolean }> = {
  attack: { sing: 'Ataque', plur: 'Ataques', fem: false },
  challenger: { sing: 'carta de Desafiante', plur: 'cartas de Desafiante', fem: true },
  equipment: { sing: 'Equipamento', plur: 'Equipamentos', fem: false },
  trap: { sing: 'Armadilha', plur: 'Armadilhas', fem: true },
  field: { sing: 'carta de Campo', plur: 'cartas de Campo', fem: true },
};

/** "carta de Fogo", "Ataques de Água", "Equipamento". */
function filtro(f?: CardFilter, plural = false): string {
  const t = f?.type ? TIPO[f.type] : { sing: 'carta', plur: 'cartas', fem: true };
  const nome = plural ? t.plur : t.sing;
  return f?.element ? `${nome} de ${ELEMENT_PT[f.element]}` : nome;
}

function feminino(f?: CardFilter): boolean {
  return f?.type ? TIPO[f.type].fem : true;
}

/** 1.5 → "1,5". */
const num = (n: number) => String(n).replace('.', ',');

function multiplicador(m: number): string {
  if (m === 2) return 'o dobro de dano';
  if (m === 3) return 'o triplo de dano';
  if (m === 0.5) return 'metade do dano';
  return `×${num(m)} de dano`;
}

const minuscula = (s: string) => s.replace(/^./, c => c.toLowerCase());
const semPonto = (s: string) => s.replace(/\.$/, '');

/** ["Compre 1 carta.", "Cause 6 de dano."] → "compre 1 carta e cause 6 de dano." */
function juntar(frases: string[]): string {
  const f = frases.map(x => minuscula(semPonto(x)));
  if (f.length <= 1) return `${f[0] ?? ''}.`;
  return `${f.slice(0, -1).join(', ')} e ${f[f.length - 1]}.`;
}

/**
 * Uma quantidade com a unidade: "12 de dano", "2 de dano para cada carta de
 * Aço no seu cemitério", "vida igual ao dano que você recebeu…".
 */
function quantia(a: Amount, unidade: 'dano' | 'vida'): string {
  if (typeof a === 'number') return `${a} de ${unidade}`;
  const inimigo = a.owner === 'opponent';
  const base = a.base ? `${a.base} de ${unidade} + ` : '';
  const teto = a.max !== undefined ? ` (máximo ${a.max})` : '';
  const igual = (oque: string) =>
    a.each === 1 ? `${unidade} igual a ${oque}`
      : a.each === 0.5 ? `${unidade} igual à metade d${oque}`
      : `${unidade} igual a ${num(a.each)}× ${oque}`;
  switch (a.per) {
    case 'round':
      return `${base}${a.each} de ${unidade} por rodada da partida${teto}`;
    case 'lifeLost':
      return `${base}${igual(inimigo ? 'a vida que o inimigo já perdeu' : 'a vida que você já perdeu')}${teto}`
        .replace('igual a a ', 'igual à ');
    case 'damageTaken':
      return `${base}${igual(inimigo ? 'o dano que o inimigo recebeu desde o último turno dele' : 'o dano que você recebeu desde o seu último turno')}${teto}`
        .replace('igual a o ', 'igual ao ');
    default: {
      const onde = a.per === 'graveyard' ? (inimigo ? 'no cemitério do inimigo' : 'no seu cemitério')
        : a.per === 'banished' ? (inimigo ? 'banida pelo inimigo' : 'banida por você')
        : (inimigo ? 'na mão do inimigo' : 'na sua mão');
      return `${base}${a.each} de ${unidade} para cada ${filtro(a.filter)} ${onde}${teto}`;
    }
  }
}

function condicao(c: Condition): string {
  switch (c.kind) {
    case 'playedThisTurn':
      return (c.min ?? 1) > 1
        ? `você jogou ${c.min} ou mais ${filtro(c.filter, true)} neste turno`
        : `você jogou ${feminino(c.filter) ? 'outra' : 'outro'} ${filtro(c.filter)} neste turno`;
    case 'graveyardCount':
      return `${c.owner === 'opponent' ? 'o cemitério do inimigo' : 'seu cemitério'} tiver ${c.min} ou mais ${filtro(c.filter, true)}`;
    case 'lifeAtMost':
      return `${c.owner === 'opponent' ? 'o inimigo' : 'você'} tiver ${c.amount} de vida ou menos`;
    case 'lifeAtLeast':
      return `${c.owner === 'opponent' ? 'o inimigo' : 'você'} tiver ${c.amount} de vida ou mais`;
    case 'hasStatus':
      return `${c.owner === 'self' ? 'você' : 'o inimigo'} estiver com ${STATUS_PT[c.status]}`;
  }
}

function quem(side: Side | undefined, fallback: Side): 'você' | 'o inimigo' {
  return (side ?? fallback) === 'self' ? 'você' : 'o inimigo';
}

// ─── Custos e efeitos ────────────────────────────────────────────────────────

export function describeCost(c: Cost): string {
  switch (c.kind) {
    case 'discard': return `Descarte ${c.count} ${filtro(c.filter, c.count > 1)}`;
    case 'mill': return `Mande ${c.count} carta${c.count > 1 ? 's' : ''} do topo do seu deck ao cemitério`;
    case 'payLife': return `Pague ${c.amount} de vida`;
    case 'banish': return `Bana ${c.count} ${filtro(c.filter, c.count > 1)} do seu cemitério`;
    case 'skipDraw': return 'Não compre carta no próximo turno';
  }
}

export function describeEffect(e: Effect): string {
  switch (e.kind) {
    case 'damage':
      return `Cause ${quantia(e.amount, 'dano')}${e.target === 'self' ? ' a você' : ''}.`;
    case 'heal':
      return e.target === 'opponent'
        ? `O inimigo recupera ${quantia(e.amount, 'vida')}.`
        : `Recupere ${quantia(e.amount, 'vida')}.`;
    case 'draw':
      return `${e.target === 'opponent' ? 'O inimigo compra' : 'Compre'} ${e.count} carta${e.count > 1 ? 's' : ''}.`;
    case 'discardRandom': {
      const n = `${e.count} carta${e.count > 1 ? 's' : ''} aleatória${e.count > 1 ? 's' : ''}`;
      return quem(e.target, 'opponent') === 'você' ? `Descarte ${n} da sua mão.` : `O inimigo descarta ${n} da mão.`;
    }
    case 'mill':
      return `Mande ${e.count} carta${e.count > 1 ? 's' : ''} do topo do deck ${e.target === 'self' ? 'seu' : 'do inimigo'} ao cemitério.`;
    case 'addModifier': {
      const s = e.spec;
      const varios = (s.uses ?? 1) > 1;
      const sujeito = varios
        ? `${e.target === 'opponent' ? 'Os próximos' : 'Seus próximos'} ${s.uses} ${filtro(s.match, true)}`
        : `${e.target === 'opponent' ? 'O próximo' : 'Seu próximo'} ${filtro(s.match)}`;
      const dono = e.target === 'opponent' ? ' do inimigo' : '';
      const partes: string[] = [];
      if (s.add) partes.push(`${s.add > 0 ? '+' : ''}${s.add} de dano`);
      if (s.mult) partes.push(multiplicador(s.mult));
      const dur = s.turns ? ` (expira em ${s.turns} turno${s.turns > 1 ? 's' : ''})` : '';
      return `${sujeito}${dono} ${varios ? 'causam' : 'causa'} ${partes.join(' e ')}${dur}.`;
    }
    case 'status': {
      const alvo = quem(e.target, 'opponent');
      const turnos = `${e.turns} turno${e.turns > 1 ? 's' : ''}`;
      if (e.status === 'freeze') {
        return alvo === 'você'
          ? `Você fica Congelado (não pode atacar) por ${turnos}.`
          : `O inimigo fica Congelado (não pode atacar) por ${turnos}.`;
      }
      const v = e.value ? ` (${e.value} de dano por turno)` : '';
      return `${alvo === 'você' ? 'Você recebe' : 'O inimigo recebe'} ${STATUS_PT[e.status]}${v} por ${turnos}.`;
    }
    case 'lock':
      return `${quem(e.target, 'opponent') === 'você' ? 'Você não pode' : 'O inimigo não pode'} jogar ${TIPO[e.cardType].plur} ${e.turns === 1 ? 'no próximo turno' : `nos próximos ${e.turns} turnos`}.`;
    case 'shield':
      return e.count === 1 ? 'Anule o próximo dano que você receber.' : `Anule os próximos ${e.count} danos que você receber.`;
    case 'destroy': {
      const o = { weapon: 'a Arma do inimigo', armor: 'a Armadura do inimigo', field: 'o Campo em jogo', trap: 'uma Armadilha do inimigo' }[e.what];
      return `Destrua ${o}.`;
    }
    case 'recover':
      return `Devolva ${e.count} ${filtro(e.filter, e.count > 1)} do seu cemitério para a mão.`;
    case 'bonus': {
      const partes: string[] = [];
      if (e.add !== undefined) {
        const q = quantia(e.add, 'dano');
        partes.push(/^\d/.test(q) ? `+${q}` : `${q.replace(/^dano/, 'dano extra')}`);
      }
      if (e.mult) partes.push(multiplicador(e.mult));
      return `Este ataque causa ${partes.join(' e ')}.`;
    }
    case 'conditional': {
      const senao = e.else ? ` Se não, ${juntar(e.else.map(describeEffect))}` : '';
      return `Se ${condicao(e.if)}: ${juntar(e.then.map(describeEffect))}${senao}`;
    }
    case 'aura':
      return `${e.label}: no início dos seus próximos ${e.turns} turnos, ${juntar(e.effects.map(describeEffect))}`;
    case 'swapLife':
      return 'Troque a sua vida atual com a do inimigo.';
    case 'lifesteal':
      return e.ratio === 1 ? 'Recupere vida igual ao dano causado.'
        : e.ratio === 0.5 ? 'Recupere vida igual à metade do dano causado.'
        : `Recupere vida igual a ${Math.round(e.ratio * 100)}% do dano causado.`;
    case 'purge': {
      const oque = e.what === 'statuses' ? 'todos os status e travas' : e.what === 'modifiers' ? 'todos os bônus guardados' : 'todos os status, travas e bônus guardados';
      return e.target === 'opponent' ? `O inimigo perde ${oque}.` : `Remova ${oque} de você.`;
    }
    case 'pierce':
      return 'Inevitável: não ativa Armadilhas e ignora redução de dano e escudo.';
  }
}

/** Efeitos em sequência, juntando repetições: "Cause 10 de dano 4 vezes." */
function describeEffects(effects: Effect[]): string[] {
  const out: { text: string; n: number }[] = [];
  for (const e of effects) {
    const text = describeEffect(e);
    const last = out[out.length - 1];
    if (last?.text === text) last.n++;
    else out.push({ text, n: 1 });
  }
  return out.map(({ text, n }) => (n > 1 ? `${semPonto(text)} ${n} vezes.` : text));
}

function describePassive(p: Passive, campo: boolean): string {
  switch (p.kind) {
    case 'attackBonus': {
      const sujeito = campo ? 'Ataques' : 'Seus Ataques';
      const alvo = p.match.element ? `${sujeito} de ${ELEMENT_PT[p.match.element]}` : sujeito;
      const partes: string[] = [];
      if (p.add) partes.push(`+${p.add} de dano`);
      if (p.mult) partes.push(multiplicador(p.mult));
      return `${alvo} causam ${partes.join(' e ')}.`;
    }
    case 'damageReduction':
      return `${campo ? 'Todo dano recebido' : 'Dano que você recebe'} é reduzido em ${p.amount}.`;
    case 'onTurnStart':
      return `No início ${campo ? 'do turno de cada jogador' : 'do seu turno'}: ${juntar(p.effects.map(describeEffect))}`;
  }
}

/** O texto completo da caixa de efeito da carta. */
export function describeCard(def: CardDef): { cost: string | null; text: string } {
  const custos = (def.cost ?? []).map(describeCost);
  const cost = custos.length ? `${semPonto(juntar(custos)).replace(/^./, c => c.toUpperCase())}.` : null;

  const linhas: string[] = [];
  if (def.trap) {
    const t = def.trap;
    const gatilho = t.trigger === 'opponentAttack'
      ? `Quando o inimigo jogar um ${filtro({ ...t.filter, type: 'attack' })}`
      : t.filter
        ? `Quando o inimigo jogar ${feminino(t.filter) ? 'uma' : 'um'} ${filtro(t.filter)}`
        : 'Quando o inimigo jogar qualquer carta';
    const se = t.condition ? ` e ${condicao(t.condition)}` : '';
    const acoes: string[] = [];
    if (t.reflect) acoes.push('O ataque acerta quem atacou, com todos os bônus dele.');
    else if (t.negate) acoes.push('Anule essa carta.');
    acoes.push(...describeEffects(t.effects ?? []));
    linhas.push(`${gatilho}${se}: ${juntar(acoes)}`);
  }
  for (const p of def.passives ?? []) linhas.push(describePassive(p, def.type === 'field'));

  const efeitos = describeEffects(def.effects ?? []);
  if (efeitos.length) {
    // Em Equipamento e Campo, os efeitos acontecem uma vez, ao entrar em jogo.
    const aoEntrar = def.type === 'equipment' ? 'Ao equipar' : def.type === 'field' ? 'Ao entrar em jogo' : null;
    if (aoEntrar) linhas.push(`${aoEntrar}: ${juntar(efeitos)}`);
    else linhas.push(...efeitos);
  }
  return { cost, text: linhas.join(' ') };
}

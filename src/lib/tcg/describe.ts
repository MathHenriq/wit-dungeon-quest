/**
 * Gera o texto de uma carta a partir da definição dela.
 *
 * Com 500 cartas, texto escrito à mão e efeito programado à parte vão
 * divergir — é só questão de tempo até uma carta dizer "+10" e fazer +15.
 * Aqui o texto é DERIVADO do efeito: se a regra muda, o texto muda junto.
 */

import { ELEMENT_PT, STATUS_PT, TYPE_PT, TYPE_PT_PLURAL } from './labels';
import type { Amount, CardDef, CardFilter, Condition, Cost, Effect, Passive, Side } from './types';

function filtro(f?: CardFilter, plural = false): string {
  if (!f || (!f.type && !f.element)) return plural ? 'cartas' : 'carta';
  const tipo = f.type ? (plural ? TYPE_PT_PLURAL[f.type] : TYPE_PT[f.type]) : (plural ? 'cartas' : 'carta');
  return f.element ? `${tipo} de ${ELEMENT_PT[f.element]}` : tipo;
}

function quantia(a: Amount): string {
  if (typeof a === 'number') return String(a);
  const onde = a.per === 'graveyard' ? 'no cemitério' : a.per === 'banished' ? 'banida' : 'na mão';
  const dono = a.owner === 'opponent' ? ' do inimigo' : '';
  const base = a.base ? `${a.base} + ` : '';
  return `${base}${a.each} para cada ${filtro(a.filter)} ${onde}${dono}`;
}

function alvo(side: Side | undefined, fallback: Side): string {
  return (side ?? fallback) === 'self' ? 'você' : 'o inimigo';
}

function condicao(c: Condition): string {
  switch (c.kind) {
    case 'playedThisTurn':
      return (c.min ?? 1) > 1
        ? `você jogou ${c.min} ou mais ${filtro(c.filter, true)} neste turno`
        : `você jogou outra ${filtro(c.filter)} neste turno`;
    case 'graveyardCount':
      return `${c.owner === 'opponent' ? 'o cemitério do inimigo' : 'seu cemitério'} tiver ${c.min}+ ${filtro(c.filter, true)}`;
    case 'lifeAtMost':
      return `${c.owner === 'opponent' ? 'o inimigo' : 'você'} tiver ${c.amount} de vida ou menos`;
    case 'hasStatus':
      return `${c.owner === 'self' ? 'você' : 'o inimigo'} estiver com ${STATUS_PT[c.status]}`;
  }
}

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
      return `Cause ${quantia(e.amount)} de dano${e.target === 'self' ? ' a você' : ''}.`;
    case 'heal':
      return `${e.target === 'opponent' ? 'O inimigo recupera' : 'Recupere'} ${quantia(e.amount)} de vida.`;
    case 'draw':
      return `${e.target === 'opponent' ? 'O inimigo compra' : 'Compre'} ${e.count} carta${e.count > 1 ? 's' : ''}.`;
    case 'discardRandom':
      return `${alvo(e.target, 'opponent') === 'você' ? 'Você descarta' : 'O inimigo descarta'} ${e.count} carta${e.count > 1 ? 's' : ''} aleatória${e.count > 1 ? 's' : ''} da mão.`;
    case 'mill':
      return `Mande ${e.count} carta${e.count > 1 ? 's' : ''} do topo do deck ${e.target === 'self' ? 'seu' : 'do inimigo'} ao cemitério.`;
    case 'addModifier': {
      const s = e.spec;
      const quem = e.target === 'opponent' ? 'O próximo' : 'Seu próximo';
      const qtd = s.uses && s.uses > 1 ? `Seus próximos ${s.uses}` : quem;
      const alvoTxt = filtro(s.match, s.uses !== undefined && s.uses > 1);
      const parts: string[] = [];
      if (s.mult) parts.push(s.mult === 2 ? 'causa o dobro de dano' : s.mult === 3 ? 'causa o triplo de dano' : `causa ×${s.mult} de dano`);
      if (s.add) parts.push(`${s.add > 0 ? '+' : ''}${s.add} de dano`);
      const dur = s.turns ? ` (expira em ${s.turns} turno${s.turns > 1 ? 's' : ''})` : '';
      return `${qtd} ${alvoTxt}${e.target === 'opponent' ? ' do inimigo' : ''} ${parts.join(' e ')}${dur}.`;
    }
    case 'status': {
      const quem = alvo(e.target, 'opponent') === 'você' ? 'Você recebe' : 'O inimigo recebe';
      const v = e.value ? ` (${e.value} de dano por turno)` : '';
      return `${quem} ${STATUS_PT[e.status]}${v} por ${e.turns} turno${e.turns > 1 ? 's' : ''}.`;
    }
    case 'lock':
      return `${alvo(e.target, 'opponent') === 'você' ? 'Você não pode' : 'O inimigo não pode'} jogar ${TYPE_PT_PLURAL[e.cardType]} ${e.turns === 1 ? 'no próximo turno' : `nos próximos ${e.turns} turnos`}.`;
    case 'shield':
      return e.count === 1 ? 'Anule o próximo dano que você receber.' : `Anule os próximos ${e.count} danos que você receber.`;
    case 'destroy': {
      const o = { weapon: 'a Arma', armor: 'a Armadura', field: 'o Campo em jogo', trap: 'uma Armadilha' }[e.what];
      return `Destrua ${o}${e.what === 'field' ? '' : ' do inimigo'}.`;
    }
    case 'recover':
      return `Devolva ${e.count} ${filtro(e.filter, e.count > 1)} do seu cemitério para a mão.`;
    case 'bonus': {
      const parts: string[] = [];
      if (e.add !== undefined) parts.push(`+${quantia(e.add)} de dano`);
      if (e.mult) parts.push(`×${e.mult} de dano`);
      return `Este ataque causa ${parts.join(' e ')}.`;
    }
    case 'conditional': {
      const entao = e.then.map(describeEffect).join(' ');
      const senao = e.else ? ` Se não, ${e.else.map(describeEffect).join(' ').replace(/^./, c => c.toLowerCase())}` : '';
      return `Se ${condicao(e.if)}: ${entao.replace(/^./, c => c.toLowerCase())}${senao}`;
    }
  }
}

function describePassive(p: Passive, campo: boolean): string {
  switch (p.kind) {
    case 'attackBonus': {
      const quem = campo ? 'Ataques' : 'Seus ataques';
      const alvoTxt = p.match.element ? `${quem} de ${ELEMENT_PT[p.match.element]}` : quem;
      const parts: string[] = [];
      if (p.add) parts.push(`+${p.add} de dano`);
      if (p.mult) parts.push(`×${p.mult} de dano`);
      return `${alvoTxt} causam ${parts.join(' e ')}.`;
    }
    case 'damageReduction':
      return `${campo ? 'Todo dano recebido' : 'Dano que você recebe'} é reduzido em ${p.amount}.`;
    case 'onTurnStart':
      return `No início ${campo ? 'de cada turno' : 'do seu turno'}: ${p.effects.map(describeEffect).join(' ').replace(/^./, c => c.toLowerCase())}`;
  }
}

/** O texto completo da caixa de efeito da carta. */
export function describeCard(def: CardDef): { cost: string | null; text: string } {
  const cost = def.cost?.length ? def.cost.map(describeCost).join(' e ') + '.' : null;
  const linhas: string[] = [];
  if (def.trap) {
    const gatilho = def.trap.trigger === 'opponentAttack'
      ? `Quando o inimigo jogar um ${filtro({ ...def.trap.filter, type: 'attack' })}`
      : `Quando o inimigo jogar ${def.trap.filter ? `uma ${filtro(def.trap.filter)}` : 'qualquer carta'}`;
    const acoes: string[] = [];
    if (def.trap.negate) acoes.push('Anule essa carta.');
    for (const e of def.trap.effects ?? []) acoes.push(describeEffect(e));
    linhas.push(`${gatilho}: ${acoes.join(' ').replace(/^./, c => c.toLowerCase())}`);
  }
  for (const p of def.passives ?? []) linhas.push(describePassive(p, def.type === 'field'));
  for (const e of def.effects ?? []) linhas.push(describeEffect(e));
  return { cost, text: linhas.join(' ') };
}

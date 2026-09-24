import { memo, type ReactNode } from 'react';
import { describeCard } from '@/lib/tcg/describe';
import { ELEMENT_PT, FULL_ART_RARITIES, RARITY_PT, TYPE_PT } from '@/lib/tcg/labels';
import type { CardDef, Element, Rarity } from '@/lib/tcg/types';
import './TcgCard.css';

/** Cor principal, cor escura e emblema de cada elemento (a moldura segue o elemento). */
export const ELEMENT_STYLE: Record<Element, { el: string; el2: string; icon: string }> = {
  Fire: { el: '#f97316', el2: '#7c2d12', icon: '🔥' },
  Water: { el: '#38bdf8', el2: '#1e3a8a', icon: '💧' },
  Electric: { el: '#facc15', el2: '#854d0e', icon: '⚡' },
  Grass: { el: '#22c55e', el2: '#14532d', icon: '🌿' },
  Ice: { el: '#67e8f9', el2: '#155e75', icon: '❄️' },
  Ground: { el: '#d97706', el2: '#451a03', icon: '⛰️' },
  Fighting: { el: '#dc2626', el2: '#450a0a', icon: '👊' },
  Steel: { el: '#94a3b8', el2: '#1e293b', icon: '⚙️' },
  Poison: { el: '#a855f7', el2: '#3b0764', icon: '☠️' },
  Dark: { el: '#7e22ce', el2: '#1c0a2e', icon: '🌙' },
  Ghost: { el: '#818cf8', el2: '#1e1b4b', icon: '👻' },
  Flying: { el: '#7dd3fc', el2: '#312e81', icon: '🌪️' },
};

const RARITY_GEMS: Record<Rarity, string> = {
  common: '◆', uncommon: '◆◆', rare: '◆◆◆', epic: '◆◆◆◆',
  legendary: '◆◆◆◆◆', mythic: '✦✦✦✦✦', unknown: '???',
};

/** Onde fica a ilustração de cada carta (gerada por scripts/arte). */
export const cardArtUrl = (id: string) => `/cards/art/${id}.webp`;

// Números com unidade, multiplicadores e nomes de elemento ficam em destaque.
const DESTAQUE = new RegExp(
  `([+×]?\\d+(?:,\\d+)?(?: de (?:dano|vida))?|o dobro de dano|o triplo de dano|metade do dano|Inevitável|${Object.values(ELEMENT_PT).join('|')})`,
  'g',
);

function destacar(texto: string): ReactNode[] {
  return texto.split(DESTAQUE).map((parte, i) => (i % 2 === 1 ? <b key={i}>{parte}</b> : parte));
}

function tamanhoTexto(chars: number): string {
  if (chars > 190) return 'tcg-card__text tcg-card__text--tiny';
  if (chars > 130) return 'tcg-card__text tcg-card__text--small';
  return 'tcg-card__text';
}

interface Props {
  card: CardDef;
  /** Número de coleção ("WIT · 012/174"). */
  number?: number;
  total?: number;
  className?: string;
}

/**
 * A carta completa. A largura vem do container; a altura segue a proporção
 * 5:7. Comum até Épica usam moldura normal, Lendária para cima são full art.
 */
export const TcgCard = memo(function TcgCard({ card, number, total, className = '' }: Props) {
  const { cost, text } = describeCard(card);
  const style = ELEMENT_STYLE[card.element];
  const full = FULL_ART_RARITIES.has(card.rarity);
  const art = `url(${cardArtUrl(card.id)})`;
  const tipo = card.type === 'equipment' ? (card.slot === 'armor' ? 'Armadura' : 'Arma') : TYPE_PT[card.type];
  const colecao = number ? `WIT · ${String(number).padStart(3, '0')}${total ? `/${total}` : ''}` : 'WIT';

  const head = (
    <div className="tcg-card__head">
      <span className="tcg-card__type">{tipo}</span>
      <span className="tcg-card__name" title={card.name}>{card.name}</span>
      <span className="tcg-card__emblem" title={ELEMENT_PT[card.element]}>{style.icon}</span>
    </div>
  );
  const custo = (
    <span className={`tcg-card__cost${cost ? '' : ' tcg-card__cost--free'}`}>
      {cost ? `CUSTO · ${cost}` : 'SEM CUSTO'}
    </span>
  );
  const corpo = text
    ? <div className={tamanhoTexto(text.length + (cost?.length ?? 0))}>{destacar(text)}</div>
    : <div className="tcg-card__text tcg-card__text--plain">Ataque direto, sem efeito extra.</div>;
  const rodape = (
    <div className="tcg-card__foot">
      <span className="tcg-card__rarity">{RARITY_GEMS[card.rarity]} {RARITY_PT[card.rarity].toUpperCase()}</span>
      <span>{colecao}</span>
    </div>
  );
  const dano = card.type === 'attack' ? <div className="tcg-card__damage">{card.damage}</div> : null;
  const vars = { '--el': style.el, '--el2': style.el2 } as React.CSSProperties;

  if (full) {
    return (
      <div className={`tcg ${className}`}>
      <div className={`tcg-card tcg-card--full tcg-card--${card.rarity}`} style={vars}>
        <div className="tcg-card__art" style={{ backgroundImage: art }} />
        <div className="tcg-card__fade" />
        {head}
        {dano}
        <div className="tcg-card__panel">{custo}{corpo}</div>
        {rodape}
        <div className="tcg-card__foil" />
      </div>
      </div>
    );
  }

  return (
    <div className={`tcg ${className}`}>
    <div className="tcg-card tcg-card--normal" style={vars}>
      {head}
      <div className="tcg-card__window" style={{ backgroundImage: art }} />
      <div className="tcg-card__strip">{card.anime ?? ELEMENT_PT[card.element]}</div>
      {dano}
      <div className="tcg-card__box">{custo}{corpo}</div>
      {rodape}
    </div>
    </div>
  );
});

/** Verso da carta (mão do inimigo, deck). */
export function TcgCardBack({ className = '' }: { className?: string }) {
  return (
    <div className={`tcg ${className}`}>
      <div className="tcg-card tcg-card--back">
        <div className="tcg-card__back-mark">WIT</div>
      </div>
    </div>
  );
}

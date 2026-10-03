// Abrir pacotinho: o pacote treme, rasga no alto (o clarão já tem a cor da
// melhor carta), as 5 cartas sobem viradas e abrem em leque; cada uma vira com
// um toque, com brilho da raridade (Épica para cima: tremida, raios e som).
// A destaque (a última) pulsa antes de virar. Cartas que o aluno ainda não
// tinha ganham o selo NOVA.
import { useEffect, useMemo, useRef, useState } from 'react';
import { TcgCard, TcgCardBack } from '@/components/tcg/TcgCard';
import { RARITY_PT } from '@/lib/tcg/labels';
import type { CardDef, Rarity } from '@/lib/tcg/types';
import { rarityRank, type PackDef } from '@/game/packs';
import { play } from '@/game/sfx';
import { drawPack, PACK_H, PACK_TEAR } from '@/game/world/packs-art';
import { toCanvas } from '@/game/world/sprites';
import './packs.css';

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#a8b0bc', uncommon: '#46c86e', rare: '#3a9ae8', epic: '#b46aee',
  legendary: '#f2b632', mythic: '#ff6ad5', unknown: '#7c5cff',
};

/** Pacote desenhado em pixel art (uma vez por raridade), como imagem. */
const packUrls = new Map<string, string>();
function packUrl(pack: PackDef): string {
  let u = packUrls.get(pack.id);
  if (!u) { u = toCanvas(drawPack(pack.rarity, RARITY_PT[pack.rarity].toUpperCase())).toDataURL(); packUrls.set(pack.id, u); }
  return u;
}

/**
 * O pacote: a imagem do GPT (public/game/packs/<id>.png) quando existir; até
 * lá, o pacote em pixel art. Duas camadas da mesma imagem: a tira de cima
 * (sai voando ao rasgar) e o resto.
 */
export function PackArt({ pack, className = '' }: { pack: PackDef; className?: string }) {
  const [gpt, setGpt] = useState(true);
  const c = RARITY_COLOR[pack.rarity];
  const src = gpt ? `${import.meta.env.BASE_URL}game/packs/${pack.id}.png` : packUrl(pack);
  const cut = `${(PACK_TEAR / PACK_H) * 100}%`;
  return (
    <div className={`pk-pack ${className}`} style={{ ['--pc' as string]: c, ['--cut' as string]: cut }}>
      <img className="pk-body" src={src} alt="" draggable={false} onError={() => setGpt(false)} />
      <img className="pk-strip" src={src} alt="" draggable={false} onError={() => setGpt(false)} />
      <div className="pk-shine" />
    </div>
  );
}

export function PackOpening({ pack, cards, fresh, onAgain, onClose, canAgain }: {
  pack: PackDef; cards: CardDef[]; fresh: Set<string>; onAgain: () => void; onClose: () => void; canAgain: boolean;
}) {
  const [stage, setStage] = useState<'idle' | 'tear' | 'cards'>('idle');
  const [open, setOpen] = useState<boolean[]>(() => cards.map(() => false));
  const best = useMemo(() => cards.reduce((b, c) => (rarityRank(c.rarity) > rarityRank(b.rarity) ? c : b), cards[0]), [cards]);
  const stageRef = useRef<HTMLDivElement>(null);
  /** Tremida da tela quando sai Épica ou melhor. */
  const setShake = (_: number) => stageRef.current?.animate([
    { transform: 'translate(0,0)' }, { transform: 'translate(-8px,4px)' }, { transform: 'translate(7px,-5px)' },
    { transform: 'translate(-4px,2px)' }, { transform: 'translate(0,0)' },
  ], { duration: 420, easing: 'ease-out' });

  useEffect(() => { setStage('idle'); setOpen(cards.map(() => false)); }, [cards]);
  const tear = () => {
    if (stage !== 'idle') return;
    setStage('tear'); play('flip');
    window.setTimeout(() => { setStage('cards'); play('draw'); }, 900);
  };
  const flip = (i: number) => {
    if (open[i]) return;
    // a destaque só depois das outras (suspense)
    if (i === cards.length - 1 && open.slice(0, -1).some(x => !x)) return;
    const r = rarityRank(cards[i].rarity);
    setOpen(o => o.map((x, k) => (k === i ? true : x)));
    play(r >= rarityRank('legendary') ? 'win' : r >= rarityRank('epic') ? 'super' : r >= rarityRank('rare') ? 'coin' : 'flip');
    if (r >= rarityRank('epic')) setShake(Date.now());
  };
  const flipAll = () => {
    cards.forEach((_, i) => window.setTimeout(() => setOpen(o => {
      if (o[i]) return o;
      const n = [...o]; n[i] = true;
      const r = rarityRank(cards[i].rarity);
      play(r >= rarityRank('legendary') ? 'win' : r >= rarityRank('epic') ? 'super' : 'flip');
      if (r >= rarityRank('epic')) setShake(Date.now());
      return n;
    }), i * 380));
  };
  const allOpen = open.every(Boolean);
  const font = "font-['Press_Start_2P',monospace]";

  return (
    <div className={`pk-stage ${font}`} ref={stageRef}>
      <div className="pk-bg" style={{ ['--bc' as string]: RARITY_COLOR[stage === 'idle' ? pack.rarity : best.rarity] }} />
      {stage !== 'cards' && (
        <div className={`pk-center ${stage}`} onClick={tear}>
          <PackArt pack={pack} className={stage === 'tear' ? 'tearing' : 'floating'} />
          {stage === 'tear' && <div className="pk-burst" style={{ ['--bc' as string]: RARITY_COLOR[best.rarity] }} />}
          {stage === 'idle' && <div className="pk-hint">TOQUE PARA ABRIR</div>}
        </div>
      )}
      {stage === 'cards' && (
        <>
          <div className="pk-row">
            {cards.map((c, i) => {
              const hl = i === cards.length - 1, r = rarityRank(c.rarity);
              const ready = !hl || open.slice(0, -1).every(Boolean);
              return (
                <div key={i} className={`pk-slot ${open[i] ? 'open' : ''} ${hl ? 'hl' : ''} ${hl && ready && !open[i] ? 'ready' : ''} ${r >= rarityRank('epic') ? 'big' : ''}`}
                  style={{ ['--rc' as string]: RARITY_COLOR[c.rarity], animationDelay: `${i * 90}ms` }} onClick={() => flip(i)}>
                  <div className="pk-flip">
                    <div className="pk-face back"><TcgCardBack /></div>
                    <div className="pk-face front"><TcgCard card={c} /></div>
                  </div>
                  {open[i] && <div className="pk-rar" style={{ color: RARITY_COLOR[c.rarity] }}>{RARITY_PT[c.rarity].toUpperCase()}</div>}
                  {open[i] && fresh.has(c.id) && <div className="pk-new">NOVA!</div>}
                  {open[i] && r >= rarityRank('epic') && <div className="pk-rays" />}
                </div>
              );
            })}
          </div>
          <div className="pk-actions">
            {!allOpen && <button onClick={flipAll} className="pk-btn">VIRAR TODAS</button>}
            {allOpen && canAgain && <button onClick={onAgain} className="pk-btn gold">ABRIR OUTRO · {pack.price}</button>}
            {allOpen && <button onClick={onClose} className="pk-btn">FECHAR</button>}
          </div>
          {!allOpen && <div className="pk-tip">Toque nas cartas para virar. A última é a destaque!</div>}
        </>
      )}
    </div>
  );
}

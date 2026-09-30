import { useEffect, useState } from 'react';
import { TcgCard, TcgCardBack } from '@/components/tcg/TcgCard';
import type { DuelResult as Result } from '@/game/progress';
import { play } from '@/game/sfx';

/**
 * Resultado do duelo da Torre: as moedas ganhas contando (com o som da
 * moeda), a carta do chefe chegando virada e virando, e o andar liberado.
 */
const pixel = "font-['Press_Start_2P',monospace]";

export function DuelResult({ result, coinsNow, onBack }: { result: Result; coinsNow: number; onBack: () => void }) {
  const [shown, setShown] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [closing, setClosing] = useState(false);
  // vira a carta: estreita (verso), troca e alarga já de frente
  const flip = () => { if (flipped || closing) return; setClosing(true); play('flip'); window.setTimeout(() => { setClosing(false); setFlipped(true); play('super'); }, 220); };
  useEffect(() => {
    if (!result.won || !result.coins) return;
    let n = 0;
    const step = Math.max(1, Math.ceil(result.coins / 18));
    const t = window.setInterval(() => {
      n = Math.min(result.coins, n + step);
      setShown(n);
      play('coin');
      if (n >= result.coins) window.clearInterval(t);
    }, 70);
    return () => window.clearInterval(t);
  }, [result]);
  useEffect(() => {
    if (!result.card) return;
    const t = window.setTimeout(flip, 1500);
    return () => window.clearTimeout(t);
    // só quando chega a carta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.card]);
  return (
    <div className={`dr-box w-[min(94vw,460px)] rounded-xl border-4 ${result.won ? 'border-[#8cc63f]' : 'border-[#b02a3a]'} bg-[#141018] p-5 text-white text-center ${pixel}`}>
      <style>{`
        .dr-box { animation: drin .35s cubic-bezier(.2,1.4,.4,1); }
        @keyframes drin { from { opacity: 0; transform: scale(.7) translateY(10%); } }
        .dr-coins { animation: drpulse .14s ease; }
        @keyframes drpulse { 50% { transform: scale(1.15); } }
        .dr-flip .in { position: relative; width: 170px; aspect-ratio: 5/7; animation: drcard .6s cubic-bezier(.2,1.4,.4,1) .4s both; }
        .dr-flip .f { position: absolute; inset: 0; }
        .dr-flip.closing .in { animation: drclose .22s ease-in forwards; }
        .dr-flip.on .in { animation: dropen .3s cubic-bezier(.2,1.5,.4,1) both; }
        @keyframes drclose { to { transform: scaleX(0); } }
        @keyframes dropen { from { transform: scaleX(0); } }
        .dr-flip.on::before { content: ''; position: absolute; inset: -40px; background: repeating-conic-gradient(rgba(255,224,102,.25) 0 10deg, transparent 10deg 22deg); border-radius: 50%;
          mask: radial-gradient(circle, #000 25%, transparent 65%); animation: drrays 5s linear infinite; }
        @keyframes drrays { to { transform: rotate(360deg); } }
        @keyframes drcard { from { opacity: 0; transform: translateY(-60px) scale(.5) rotate(-12deg); } }
        @media (prefers-reduced-motion: reduce) { .dr-box, .dr-flip .in, .dr-flip.on::before { animation: none; transition: none; } }
      `}</style>
      <div className={`text-[18px] ${result.won ? 'text-lime-300' : 'text-red-300'}`}>{result.won ? 'VITÓRIA!' : 'DERROTA'}</div>
      {result.won ? (
        <>
          <div key={shown} className="dr-coins mt-4 text-[14px] text-yellow-200">● +{shown} MOEDAS</div>
          <div className="mt-1 text-[8px] text-white/60">{result.firstWin ? 'primeira vitória contra este desafiante' : 'revanche: 20% das moedas'}</div>
          {result.card && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="text-[10px] text-lime-200">{flipped ? 'CARTA CONQUISTADA!' : 'O CHEFE DEIXOU UMA CARTA...'}</div>
              <button className={`dr-flip relative ${flipped ? 'on' : closing ? 'closing' : ''}`} onClick={flip} aria-label="Virar a carta">
                <div className="in">
                  <div className="f">{flipped ? <TcgCard card={result.card} /> : <TcgCardBack />}</div>
                </div>
              </button>
            </div>
          )}
          {result.unlocked && <div className="mt-4 text-[10px] text-lime-300">ANDAR {result.unlocked} LIBERADO! A ESCADA ESTÁ ABERTA.</div>}
        </>
      ) : (
        <div className="mt-4 text-[10px] leading-5 text-white/80">Tente de novo! Dica: monte o deck no botão DECK e guarde os bônus para o ataque certo.</div>
      )}
      <div className="mt-5 text-[9px] text-white/60">MOEDAS: {coinsNow - (result.coins - shown)}</div>
      <button onClick={onBack} className="mt-4 px-5 py-2.5 rounded-md bg-[#2f6b1e] border-2 border-[#8cc63f] text-[11px]">VOLTAR</button>
    </div>
  );
}

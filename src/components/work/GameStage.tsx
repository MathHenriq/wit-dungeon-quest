// Palco comum dos minijogos: o cenário da profissão em cima (Scene), a
// contagem 3-2-1 antes de começar e a reação a cada acerto ou erro (carimbo,
// faíscas, tremida), ouvindo os sons que os jogos já tocam (sfx: coin/win =
// acerto, lose = erro). Assim todos os minijogos ganham o mesmo capricho.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ProfId } from '@/game/professions';
import { play } from '@/game/sfx';
import { Scene } from './Scene';
import './gamestage.css';

const GOOD = ['ACERTOU!', 'ISSO!', 'MUITO BEM!', 'BOA!'];
const BAD = ['OPS!', 'QUASE!', 'ERROU'];

interface Burst { id: number; good: boolean; text: string; x: number }

export function GameStage({ prof, title, color, children }: { prof: ProfId; title: string; color: string; children: ReactNode }) {
  const [count, setCount] = useState(3);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [combo, setCombo] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const n = useRef(0);

  // 3, 2, 1, VAI! e só então o jogo monta (os relógios dele começam na hora certa)
  useEffect(() => {
    if (count < 0) return;
    play(count === 0 ? 'super' : 'click');
    const t = window.setTimeout(() => setCount(c => c - 1), count === 0 ? 500 : 520);
    return () => window.clearTimeout(t);
  }, [count]);

  useEffect(() => {
    if (count >= 0) return;
    const on = (e: Event) => {
      const s = (e as CustomEvent<string>).detail;
      const good = s === 'coin' || s === 'win' || s === 'super';
      if (!good && s !== 'lose') return;
      const id = ++n.current;
      setCombo(c => (good ? c + 1 : 0));
      const text = good ? GOOD[id % GOOD.length] : BAD[id % BAD.length];
      setBursts(b => [...b.slice(-3), { id, good, text, x: 30 + ((id * 37) % 40) }]);
      window.setTimeout(() => setBursts(b => b.filter(x => x.id !== id)), 900);
      if (!good) box.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { duration: 300 });
    };
    window.addEventListener('wit-sfx', on);
    return () => window.removeEventListener('wit-sfx', on);
  }, [count]);

  return (
    <div className="gs" style={{ ['--gc' as string]: color }}>
      <div className="gs-top">
        <Scene prof={prof} height={88} />
        <div className="gs-title">{title}</div>
        {combo >= 3 && <div key={combo} className="gs-combo">COMBO ×{combo}</div>}
      </div>
      <div ref={box} className="gs-body">
        {count >= 0 ? (
          <div className="gs-count" key={count}>{count === 0 ? 'VAI!' : count}</div>
        ) : children}
        {bursts.map(b => (
          <div key={b.id} className={`gs-burst ${b.good ? 'good' : 'bad'}`} style={{ left: `${b.x}%` }}>
            <span className="txt">{b.text}</span>
            {b.good && Array.from({ length: 10 }, (_, i) => <i key={i} style={{ ['--a' as string]: `${i * 36}deg`, ['--d' as string]: `${30 + (i % 3) * 14}px` }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

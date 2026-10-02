// Primeiro acesso: o aluno escolhe o Caminho (estilo de jogo) e ganha o deck
// inicial dele. Lista dos 8 com o estilo e 3 cartas de amostra; tocando, vê
// as 20 cartas e confirma. Qualquer carta serve para qualquer Caminho depois.
import { useMemo, useState } from 'react';
import { PATHS, pathDeck, type PathId } from '@/lib/tcg/paths';
import { choosePath, loadProgress, saveProgress } from '@/game/progress';
import { TcgCard } from '@/components/tcg/TcgCard';
import { play } from '@/game/sfx';

const font = "font-['Press_Start_2P',monospace]";

export function PathChooser({ onDone }: { onDone: () => void }) {
  const [sel, setSel] = useState<PathId | null>(null);
  const suggested = useMemo(() => loadProgress().caminhoSugerido, []);
  const decks = useMemo(() => Object.fromEntries(PATHS.map(p => [p.id, pathDeck(p.id)])), []);
  const p = sel ? PATHS.find(x => x.id === sel)! : null;
  // amostra: as 3 cartas mais "do Caminho" que não são repetidas
  const sample = (id: PathId) => [...new Map(decks[id].map(c => [c.id, c])).values()].filter(c => c.type !== 'attack').slice(0, 2).concat(decks[id].filter(c => c.type === 'attack').slice(0, 1));
  const confirm = () => {
    if (!sel) return;
    saveProgress(choosePath(loadProgress(), sel));
    play('win');
    onDone();
  };
  return (
    <div className={`absolute inset-0 z-50 overflow-auto bg-[#141022] text-white ${font}`}>
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        {!p ? (
          <>
            <div className="text-center text-[16px] text-[#ffd84a]">ESCOLHA O SEU CAMINHO</div>
            <div className="text-center text-[9px] leading-5 text-white/70 mt-2 mb-5">É o seu estilo de jogo e o seu primeiro deck (20 cartas). Depois você pode usar qualquer carta que ganhar: o Caminho é só o começo.</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PATHS.map(x => (
                <button key={x.id} onClick={() => { setSel(x.id); play('click'); }}
                  className="text-left rounded-xl border-4 p-3 bg-[#1e1832] hover:-translate-y-1 transition-transform" style={{ borderColor: x.color }}>
                  <div className="text-[11px]" style={{ color: x.color }}>{x.name.toUpperCase()}</div>
                  {suggested === x.id && <div className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[#ffd84a] text-[#141022] text-[7px]">PARECIDO COM A SUA CLASSE DO WIT 1</div>}
                  <div className="text-[8px] leading-4 text-white/85 mt-1 min-h-[32px]">{x.style}</div>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    {sample(x.id).map(c => <div key={c.id} className="pointer-events-none"><TcgCard card={c} /></div>)}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <button onClick={() => setSel(null)} className="px-3 py-2 rounded bg-white/15 text-[9px]">VOLTAR</button>
              <div className="text-[15px]" style={{ color: p.color }}>{p.name.toUpperCase()}</div>
            </div>
            <div className="text-[9px] leading-5 text-white/85 mb-1">{p.style}.</div>
            <div className="text-[8px] leading-5 text-white/65 mb-3">{p.about}</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
              {decks[p.id].map((c, k) => <div key={k}><TcgCard card={c} /></div>)}
            </div>
            <button onClick={confirm} className="mt-4 w-full py-4 rounded-xl text-[12px] border-b-4 border-black/30" style={{ background: p.color }}>
              SEGUIR O CAMINHO: {p.name.toUpperCase()}
            </button>
            <div className="text-center text-[7px] text-white/50 mt-2">A escolha é uma só (pense bem!). As cartas entram na sua coleção e viram o seu deck.</div>
          </>
        )}
      </div>
    </div>
  );
}

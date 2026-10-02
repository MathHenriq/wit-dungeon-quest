// Grimório (aba da tela do deck): os talentos pequenos, em 3 ramos. Os pontos
// vêm da Torre (1 a cada 2 andares). E o verso de carta, para quem aprendeu.
import { useState } from 'react';
import { BRANCH_NAME, freePoints, GRIMOIRE, grimoirePoints, hasTalent, learn, TALENT_BY_ID, type Branch, type Verso } from '@/game/grimoire';
import { saveProgress, type Progress } from '@/game/progress';
import { play } from '@/game/sfx';
import { TcgCardBack } from '@/components/tcg/TcgCard';

const pixel = "font-['Press_Start_2P',monospace]";

export function GrimoirePanel({ progress }: { progress: Progress }) {
  const [msg, setMsg] = useState<string | null>(null);
  const setVerso = (v: Verso) => { saveProgress({ ...progress, verso: v }); play('click'); };
  return (
    <div className={`flex-1 min-h-0 overflow-auto p-3 text-white ${pixel}`}>
      <div className="text-[9px] leading-5 text-white/75 mb-3">
        Talentos pequenos: nada de mais dano ou vida. Você ganha 1 ponto a cada 2 andares da Torre.
        <span className="ml-2 text-lime-300">Pontos livres: {freePoints(progress)} de {grimoirePoints(progress)}</span>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {(['colecao', 'estilo', 'duelo'] as Branch[]).map(b => (
          <div key={b} className="rounded-lg bg-white/5 border border-white/15 p-2">
            <div className="text-[10px] text-lime-300 mb-2">{BRANCH_NAME[b]}</div>
            {GRIMOIRE.filter(t => t.branch === b).map(t => {
              const have = hasTalent(progress, t.id), locked = !!t.needs && !hasTalent(progress, t.needs);
              return (
                <div key={t.id} className={`rounded-md p-2 mb-2 border ${have ? 'border-lime-400 bg-lime-400/10' : 'border-white/15'}`}>
                  <div className="flex items-center justify-between gap-2"><span className="text-[9px]">{t.name}</span><span className="text-[8px] text-yellow-200">{t.cost} pt</span></div>
                  <div className="text-[7px] leading-4 text-white/70 mt-1">{t.about}</div>
                  {t.needs && !have && <div className="text-[7px] text-white/45 mt-1">precisa de: {TALENT_BY_ID.get(t.needs)!.name}</div>}
                  {have ? <div className="text-[8px] text-lime-300 mt-1">APRENDIDO</div>
                    : <button disabled={locked} onClick={() => {
                      const r = learn(progress, t.id);
                      if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
                      saveProgress(r.progress); play('win'); setMsg(`Aprendeu: ${t.name}!`);
                    }} className="mt-1 px-2 py-1 rounded bg-lime-500/80 text-[#14210a] text-[8px] disabled:opacity-40">APRENDER</button>}
                </div>
              );
            })}
            {b === 'estilo' && (
              <div className="mt-2">
                <div className="text-[8px] text-white/70 mb-1">VERSO DAS CARTAS</div>
                <div className="flex gap-2">
                  {(['classico', 'dourado', 'noite'] as Verso[]).map(v => {
                    const ok = v === 'classico' || hasTalent(progress, v === 'dourado' ? 'verso-dourado' : 'verso-noite');
                    const on = (progress.verso ?? 'classico') === v && ok;
                    return (
                      <button key={v} disabled={!ok} onClick={() => setVerso(v)} className={`w-12 rounded border-2 ${on ? 'border-lime-400' : 'border-transparent'} disabled:opacity-30`}>
                        <div data-verso-preview={v} className="pointer-events-none"><TcgCardBack /></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {msg && <div className="mt-3 text-[9px] text-lime-300">{msg}</div>}
    </div>
  );
}

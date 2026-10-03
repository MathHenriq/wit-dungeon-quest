// Forja do Prof. Ian (Oficina de Cartas): desmanchar cartas repetidas em pó da
// raridade delas e forjar, com esse pó, a carta que falta no álbum.
import { useMemo, useState } from 'react';
import { PxPanel } from '@/components/pixel/Pixel';
import { CATALOG } from '@/lib/tcg/cards/catalog';
import { RARITY_PT } from '@/lib/tcg/labels';
import type { CardDef, Rarity } from '@/lib/tcg/types';
import { disenchant, DUST, dustOf, forge, spare } from '@/game/forge';
import { RARITY_ORDER } from '@/game/packs';
import { loadProgress, saveProgress, type Progress } from '@/game/progress';
import { play } from '@/game/sfx';
import { TcgCard } from '@/components/tcg/TcgCard';
import { RARITY_COLOR } from './PackOpening';

export function ForgePanel({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const [tab, setTab] = useState<'desmanchar' | 'forjar'>('desmanchar');
  const [rar, setRar] = useState<Rarity>('common');
  const [msg, setMsg] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ card: CardDef; key: number } | null>(null);
  const font = "font-['Press_Start_2P',monospace]";
  const dupes = useMemo(() => CATALOG.filter(c => spare(progress, c.id) > 0)
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)), [progress]);
  const missing = useMemo(() => CATALOG.filter(c => c.rarity === rar && !progress.collection[c.id]), [progress, rar]);
  const cost = DUST[rar].costs;

  const doDis = (c: CardDef, all: boolean) => {
    const r = disenchant(loadProgress(), c.id, all ? 99 : 1);
    if ('reason' in r) { setMsg(r.reason); return; }
    saveProgress(r.progress); play('burn');
    setMsg(`+${r.dust} de pó ${RARITY_PT[r.rarity].toLowerCase()}`);
  };
  const doForge = (c: CardDef) => {
    const r = forge(loadProgress(), c.id);
    if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
    saveProgress(r.progress); play('super');
    setFlash({ card: c, key: Date.now() });
    setMsg(`Forjada: ${c.name}!`);
  };

  return (
    <PxPanel title="FORJA DO PROF. IAN" color="#c85a1a" onClose={onClose} width={880} dark>
        {/* pó de cada raridade */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {RARITY_ORDER.map(r => (
            <div key={r} className="px-2 py-1 rounded border-2 text-[8px] bg-black/30" style={{ borderColor: RARITY_COLOR[r], color: RARITY_COLOR[r] }}>
              PÓ {RARITY_PT[r].toUpperCase()}: {dustOf(progress, r)}
            </div>
          ))}
        </div>
        <div className="flex gap-1 mb-3">
          {(['desmanchar', 'forjar'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(null); }}
              className={`px-3 py-1.5 rounded text-[9px] border-2 ${tab === t ? 'bg-[#e86a2a] border-[#e86a2a]' : 'border-white/20'}`}>{t.toUpperCase()}</button>
          ))}
        </div>
        {tab === 'desmanchar' && (
          <div>
            <div className="text-[8px] leading-4 text-white/70 mb-2">Só as cópias repetidas viram pó (a primeira fica no álbum). Pó da raridade da carta: Comum dá pó comum, Rara dá pó raro...</div>
            {!dupes.length && <div className="text-[9px] text-white/60">Nenhuma carta repetida ainda. Abra pacotinhos ou vença chefes!</div>}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {dupes.map(c => (
                <div key={c.id} className="flex flex-col items-center">
                  <div className="w-full"><TcgCard card={c} /></div>
                  <div className="text-[7px] mt-1">×{progress.collection[c.id]} · +{DUST[c.rarity].gives} pó</div>
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => doDis(c, false)} className="px-1.5 py-1 rounded bg-[#a8481a] text-[7px]">1</button>
                    {spare(progress, c.id) > 1 && <button onClick={() => doDis(c, true)} className="px-1.5 py-1 rounded bg-[#7a3010] text-[7px]">TODAS</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'forjar' && (
          <div>
            <div className="flex flex-wrap gap-1 mb-2">
              {RARITY_ORDER.filter(r => DUST[r].costs !== null).map(r => (
                <button key={r} onClick={() => setRar(r)} className="px-2 py-1 rounded text-[8px] border-2"
                  style={{ borderColor: RARITY_COLOR[r], background: rar === r ? RARITY_COLOR[r] : 'transparent', color: rar === r ? '#10081a' : RARITY_COLOR[r] }}>{RARITY_PT[r].toUpperCase()}</button>
              ))}
            </div>
            <div className="text-[8px] leading-4 text-white/70 mb-2">Cartas {RARITY_PT[rar]}s que faltam no seu álbum ({missing.length}). Cada uma custa {cost} de pó {RARITY_PT[rar].toLowerCase()}; você tem {dustOf(progress, rar)}.</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {missing.map(c => {
                const can = cost !== null && dustOf(progress, rar) >= cost;
                return (
                  <div key={c.id} className="flex flex-col items-center">
                    <div className={`w-full ${can ? '' : 'opacity-50 grayscale-[60%]'}`}><TcgCard card={c} /></div>
                    <button disabled={!can} onClick={() => doForge(c)} className={`mt-1 px-2 py-1 rounded text-[7px] ${can ? 'bg-[#e86a2a]' : 'bg-white/10 text-white/40'}`}>FORJAR</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {msg && <div className="sticky bottom-0 mt-3 py-2 text-[9px] text-[#ffd45c] bg-[#21160f]">{msg}</div>}
        {flash && (
          <div key={flash.key} className="absolute inset-0 flex items-center justify-center bg-black/60 forge-pop" onClick={() => setFlash(null)}>
            <div className="w-[200px]" style={{ filter: `drop-shadow(0 0 24px ${RARITY_COLOR[flash.card.rarity]})` }}><TcgCard card={flash.card} /></div>
          </div>
        )}
        <style>{`.forge-pop > div { animation: forgein .6s cubic-bezier(.2,1.5,.4,1) both; } @keyframes forgein { from { transform: scale(.2) rotate(-25deg); opacity: 0; filter: brightness(4); } }`}</style>
    </PxPanel>
  );
}

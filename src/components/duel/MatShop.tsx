import { useState } from 'react';
import { PLAYMATS, matStyle, type MatTheme, type Playmat } from '@/game/playmats';
import { buyMat, equipMat, saveProgress, type Progress } from '@/game/progress';
import { MatAnim } from './MatAnim';

/**
 * Tapetes do duelo: vitrine com a prévia de cada um (inclinado, como fica na
 * mesa), preço, COMPRAR / USAR. Os de imagem ainda sem arte aparecem como
 * EM BREVE. Fica na aba TAPETES da tela do deck.
 */

const pixel = "font-['Press_Start_2P',monospace]";
const THEMES: MatTheme[] = ['Básico', 'WIT', 'Natureza', 'Elementos', 'Anime', 'Cartas', 'Monstrinhos'];

/** O tapete em miniatura, inclinado, com as vagas marcadas. */
export function MatPreview({ mat, el = '#f97316', el2 = '#7c2d12' }: { mat: Playmat; el?: string; el2?: string }) {
  return (
    <div className="relative w-full aspect-[16/8]" style={{ perspective: 420, containerType: 'size', ['--el' as string]: el, ['--el2' as string]: el2 }}>
      <div className="absolute inset-[6%_4%_4%] rounded-[10px] border-[3px] shadow-[0_12px_20px_rgba(0,0,0,.55)]"
        style={{ transform: 'rotateX(28deg)', transformOrigin: '50% 100%', ...matStyle(mat, import.meta.env.BASE_URL) }}>
        <MatAnim mat={mat} />
        {[0, 1].map(r => (
          <div key={r} className="absolute left-[4%] right-[4%] flex gap-[2%]" style={r ? { bottom: '8%' } : { top: '8%' }}>
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="w-[9%] aspect-[5/7] rounded-[3px] border border-dashed border-white/35" />)}
            <div className="flex-1" />
            <div className="w-[9%] aspect-[5/7] rounded-[3px] bg-[repeating-linear-gradient(135deg,#3b2468_0_3px,#2a1850_3px_6px)] border border-[#b69cdc]" />
            <div className="w-[9%] aspect-[5/7] rounded-[3px] border border-dashed border-white/35" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatShop({ progress }: { progress: Progress }) {
  const [msg, setMsg] = useState<{ id: string; text: string } | null>(null);
  const act = (m: Playmat) => {
    if (progress.mats.includes(m.id)) { saveProgress(equipMat(progress, m.id)); setMsg(null); return; }
    const r = buyMat(progress, m.id);
    if (r.ok === false) { setMsg({ id: m.id, text: r.reason }); return; }
    saveProgress(r.progress);
    setMsg({ id: m.id, text: 'Comprado! Já está na sua mesa.' });
  };
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[13px] text-white/80">O tapete é a sua mesa nos duelos. Não muda as regras: é só estilo.</span>
        <span className={`ml-auto px-2.5 py-1.5 rounded bg-black/40 border border-yellow-300/40 text-[10px] text-yellow-200 ${pixel}`}>● {progress.coins} MOEDAS</span>
      </div>
      {THEMES.map(t => {
        const list = PLAYMATS.filter(m => m.tema === t);
        if (!list.length) return null;
        return (
          <section key={t}>
            <h3 className={`text-[10px] text-lime-300 mb-2 ${pixel}`}>{t.toUpperCase()}</h3>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {list.map(m => {
                const have = progress.mats.includes(m.id), using = progress.mat === m.id;
                return (
                  <div key={m.id} className={`rounded-lg border-2 p-2.5 flex flex-col gap-2 ${using ? 'border-[#8cc63f] bg-[#1d2a17]' : 'border-white/10 bg-white/[.04]'}`}>
                    <div className={m.emBreve ? 'opacity-40 grayscale' : ''}><MatPreview mat={m} /></div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[14px] font-semibold">{m.nome}</span>
                      {m.anim && <span className={`text-[7px] px-1 py-0.5 rounded bg-[#8a4ac8] text-white ${pixel}`}>ANIMADO</span>}
                      {!have && !m.emBreve && <span className={`ml-auto text-[9px] text-yellow-200 ${pixel}`}>● {m.preco}</span>}
                    </div>
                    <p className="text-[12px] text-white/65 leading-4 min-h-[32px]">{m.descricao}</p>
                    {m.emBreve
                      ? <div className={`py-2 rounded text-center text-[9px] bg-white/5 text-white/50 ${pixel}`}>EM BREVE</div>
                      : <button onClick={() => act(m)} disabled={using}
                          className={`py-2 rounded text-[9px] ${pixel} ${using ? 'bg-transparent text-lime-300' : have ? 'bg-[#3c56b0]' : 'bg-[#2f6b1e] border-2 border-[#8cc63f]'}`}>
                          {using ? 'EM USO' : have ? 'USAR' : 'COMPRAR'}
                        </button>}
                    {msg?.id === m.id && <div className="text-[12px] text-center text-yellow-100">{msg.text}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

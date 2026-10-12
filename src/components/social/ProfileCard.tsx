// Cartão de perfil de um colega (tocou nele na cidade): retrato, apelido,
// título, andar, Caminho, guilda e 3 cartas favoritas. Botões: amizade,
// desafiar (vai para a Arena), trocar (Oficina) e denunciar (vai para o professor).
import { useEffect, useRef, useState } from 'react';
import { friendAnswer, friendRequest, profileOf, report, REPORT_REASONS, socialError, type PublicProfile } from '@/game/social';
import { loadLookFrames } from '@/game/world/sprites';
import { normalizeLook, type Look } from '@/game/world/outfit';
import { PATH_BY_ID } from '@/lib/tcg/paths';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { TcgCard } from '@/components/tcg/TcgCard';
import { PxBox, PxButton, PxPanel } from '@/components/pixel/Pixel';
import { play } from '@/game/sfx';

/** Retrato: o quadro parado de frente do boneco, ampliado sem borrar. */
export function LookPortrait({ look, size = 96 }: { look: Partial<Look>; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    loadLookFrames(normalizeLook(look)).then(f => {
      const c = ref.current, img = f.walk.south[0];
      if (!alive || !c || !img) return;
      c.width = img.width; c.height = img.height;
      const x = c.getContext('2d')!;
      x.imageSmoothingEnabled = false;
      x.clearRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [look]);
  return <canvas ref={ref} style={{ width: size, height: size * 1.25, imageRendering: 'pixelated' }} />;
}

export function ProfileCard({ handle, onClose, onChallenge, onTrade }: {
  handle: string; onClose: () => void; onChallenge?: () => void; onTrade?: () => void;
}) {
  const [p, setP] = useState<PublicProfile | null | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  useEffect(() => {
    profileOf(handle).then(setP).catch(e => { setP(null); setMsg(socialError(e)); });
  }, [handle]);

  const friend = async () => {
    if (!p) return;
    try {
      const r = p.amizade === 'recebido' ? await friendAnswer(handle, true) : await friendRequest(handle);
      setP({ ...p, amizade: r === 'amigos' ? 'amigos' : 'enviado' });
      setMsg(r === 'amigos' ? `Agora vocês são amigos!` : 'Pedido de amizade enviado.');
      play('coin');
    } catch (e) { setMsg(socialError(e)); }
  };
  const doReport = async (reason: typeof REPORT_REASONS[number]['id']) => {
    try { await report(handle, reason); setMsg('Obrigado. O professor vai ver.'); } catch (e) { setMsg(socialError(e)); }
    setReporting(false);
  };

  const path = p?.caminho ? PATH_BY_ID.get(p.caminho as never) : undefined;
  return (
    <PxPanel title="PERFIL" color="#2a7a8a" onClose={onClose} width={560}>
      {p === undefined && <div className="text-[9px] text-[#6a4a2a]">Carregando...</div>}
      {p === null && <div className="text-[9px] text-[#6a4a2a]">{msg ?? 'Colega não encontrado.'}</div>}
      {p && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <PxBox className="shrink-0 flex items-end justify-center" style={{ width: 120, height: 140, background: '#bfe3ec' }}>
              <LookPortrait look={p.look} size={92} />
            </PxBox>
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="text-[16px] text-[#2e2a40] truncate">{p.nick}</div>
              {p.title && <div className="text-[9px] text-[#3a9a5a]">{p.title}</div>}
              <div className="text-[8px] leading-4 text-[#6a4a2a]">
                ANDAR {p.andar}{path ? ` · ${path.name.toUpperCase()}` : ''}{p.guilda ? ` · GUILDA ${p.guilda.toUpperCase()}` : ''}
              </div>
              {p.amizade === 'amigos' && <div className="text-[8px] text-[#c8486a]">VOCÊS SÃO AMIGOS</div>}
            </div>
          </div>
          {p.favs.length > 0 && (
            <div>
              <div className="text-[8px] text-[#6a4a2a] mb-1">CARTAS FAVORITAS</div>
              <div className="grid grid-cols-3 gap-2">
                {p.favs.map(id => CARD_BY_ID.get(id)).filter(Boolean).map(c => <div key={c!.id}><TcgCard card={c!} /></div>)}
              </div>
            </div>
          )}
          {reporting ? (
            <PxBox>
              <div className="text-[8px] text-[#6a4a2a] mb-2">O que aconteceu? Só o professor vê.</div>
              <div className="flex flex-wrap gap-1.5">
                {REPORT_REASONS.map(r => <PxButton key={r.id} color="#b8433a" onClick={() => void doReport(r.id)}>{r.label.toUpperCase()}</PxButton>)}
                <PxButton color="#6a6a7a" onClick={() => setReporting(false)}>VOLTAR</PxButton>
              </div>
            </PxBox>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {p.amizade !== 'amigos' && (
                <PxButton color="#c8486a" disabled={p.amizade === 'enviado'} onClick={() => void friend()}>
                  {p.amizade === 'recebido' ? 'ACEITAR AMIZADE' : p.amizade === 'enviado' ? 'PEDIDO ENVIADO' : 'ADICIONAR AMIGO'}
                </PxButton>
              )}
              {onChallenge && <PxButton color="#e8485a" onClick={onChallenge}>DESAFIAR</PxButton>}
              {onTrade && <PxButton color="#3a78c8" onClick={onTrade}>TROCAR</PxButton>}
              <PxButton color="#6a6a7a" onClick={() => setReporting(true)}>DENUNCIAR</PxButton>
            </div>
          )}
          {msg && <div className="text-[8px] text-[#3a9a5a]">{msg}</div>}
        </div>
      )}
    </PxPanel>
  );
}

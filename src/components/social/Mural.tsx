// Mural da turma (o mural da praça): frases prontas, fotos do álbum (só depois
// do professor aprovar) e fases de fliperama dos colegas para jogar. POSTAR:
// escolher uma frase da lista ou uma foto do álbum; CRIAR FASE abre o editor.
import { useEffect, useState } from 'react';
import { deletePost, levelPlayed, muralPosts, MURAL_FRASES, postFoto, postFrase, socialError, socialOn, type Post } from '@/game/social';
import { LEVEL_TITLES } from '@/game/arcade';
import { loadPhotos } from '@/game/photos';
import { PxBox, PxButton, PxPanel, PxTabs } from '@/components/pixel/Pixel';
import { ArcadePlayer } from './Arcade';
import { castVote, currentVote, leader, themeLabel, votePct, type Vote } from '@/game/class-events';
import { play } from '@/game/sfx';

export function Mural({ onClose, onMissions, onMaker }: { onClose: () => void; onMissions?: () => void; onMaker?: () => void }) {
  const [tab, setTab] = useState<'mural' | 'postar' | 'votar'>(() => (new URLSearchParams(window.location.search).has('votar') ? 'votar' : 'mural'));
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Post | null>(null);
  const load = () => { muralPosts().then(setPosts).catch(e => { setPosts([]); setMsg(socialError(e)); }); };
  useEffect(load, []);
  const run = async (f: () => Promise<unknown>, ok: string) => {
    try { await f(); setMsg(ok); play('coin'); load(); setTab('mural'); } catch (e) { setMsg(socialError(e)); }
  };
  const photos = loadPhotos();
  return (
    <PxPanel title="MURAL DA TURMA" color="#c8762a" onClose={onClose} width={780}>
      {playing?.fase ? (
        <ArcadePlayer level={playing.fase} title={`${LEVEL_TITLES[playing.titulo ?? 0]} · de ${playing.nick ?? 'colega'}`} onClose={() => setPlaying(null)} onWin={() => setMsg('Você venceu a fase do colega!')} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <PxTabs<'mural' | 'postar' | 'votar'> tabs={[['mural', 'MURAL'], ['postar', 'POSTAR'], ['votar', 'VOTAÇÃO']]} value={tab} onChange={setTab} color="#c8762a" />
            <span className="flex-1" />
            {onMissions && <PxButton color="#3a78c8" onClick={onMissions}>MISSÕES DO DIA</PxButton>}
            {onMaker && <PxButton color="#c8303a" onClick={onMaker}>CRIAR FASE</PxButton>}
          </div>
          {!socialOn() && <div className="text-[8px] leading-4 text-[#6a4a2a]">O mural da turma precisa estar online (com o banco ligado). As missões do dia continuam aqui no botão ao lado.</div>}
          {socialOn() && tab === 'mural' && (
            <div className="grid sm:grid-cols-2 gap-2 max-h-[52vh] overflow-auto pr-1">
              {!posts && <div className="text-[8px]">Carregando...</div>}
              {posts && !posts.length && <div className="text-[8px] text-[#6a4a2a]">O mural está vazio. Seja o primeiro a postar!</div>}
              {posts?.map(p => (
                <PxBox key={p.id} className="flex flex-col gap-1">
                  <div className="text-[7px] text-[#6a4a2a]">{p.minha ? 'VOCÊ' : (p.nick ?? 'COLEGA').toUpperCase()}{p.esperando ? ' · ESPERANDO O PROFESSOR' : ''}</div>
                  {p.kind === 'frase' && <div className="text-[11px] leading-5">"{MURAL_FRASES[p.frase ?? 0]}"</div>}
                  {p.kind === 'foto' && p.foto && <img src={p.foto} alt="" className="w-full rounded [image-rendering:pixelated]" />}
                  {p.kind === 'fase' && (
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] flex-1">FASE: {LEVEL_TITLES[p.titulo ?? 0]}<div className="text-[7px] text-[#6a4a2a]">jogada {p.plays} vezes</div></div>
                      <PxButton color="#c8303a" onClick={() => { setPlaying(p); void levelPlayed(p.id); }}>JOGAR</PxButton>
                    </div>
                  )}
                  {p.minha && <button className="self-end text-[7px] underline text-[#6a4a2a]" onClick={() => void run(() => deletePost(p.id), 'Apagada.')}>apagar</button>}
                </PxBox>
              ))}
            </div>
          )}
          {socialOn() && tab === 'votar' && <VotePanel />}
          {socialOn() && tab === 'postar' && (
            <div className="grid md:grid-cols-2 gap-3">
              <PxBox>
                <div className="text-[9px] mb-1">UMA FRASE</div>
                <div className="flex flex-col gap-1 max-h-[40vh] overflow-auto">
                  {MURAL_FRASES.map((f, i) => <button key={f} className="text-left px-2 py-1 rounded bg-white/70 hover:bg-white text-[9px]" onClick={() => void run(() => postFrase(i), 'Postado!')}>{f}</button>)}
                </div>
              </PxBox>
              <PxBox>
                <div className="text-[9px] mb-1">UMA FOTO DO SEU ÁLBUM</div>
                <div className="text-[7px] leading-4 text-[#6a4a2a] mb-1">Fotos tiradas no jogo (tecla F). Aparece depois que o professor aprovar.</div>
                {!photos.length && <div className="text-[8px]">Seu álbum está vazio.</div>}
                <div className="grid grid-cols-2 gap-1.5">
                  {photos.map(ph => <button key={ph.id} onClick={() => void run(() => postFoto(ph.data), 'Foto enviada: aparece quando o professor aprovar.')}><img src={ph.data} alt={ph.lugar} className="w-full rounded" /></button>)}
                </div>
              </PxBox>
            </div>
          )}
        </>
      )}
      {msg && <div className="text-[8px] text-[#3a9a5a] mt-2">{msg}</div>}
    </PxPanel>
  );
}

/** Votação do tema da próxima coleção (o professor abre e fecha). */
function VotePanel() {
  const [v, setV] = useState<Vote | null | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { currentVote().then(setV).catch(e => { setV(null); setMsg(socialError(e)); }); }, []);
  if (v === undefined) return <div className="text-[8px]">Carregando...</div>;
  if (!v) return <div className="text-[8px] leading-4 text-[#6a4a2a]">Nenhuma votação ainda. Quando o professor abrir, você escolhe aqui o tema da próxima coleção de cartas.</div>;
  const win = leader(v);
  const vote = async (o: string) => {
    try { setV(await castVote(v.id, o)); play('coin'); setMsg(`Seu voto: ${themeLabel(o)}. Dá para trocar até fechar.`); } catch (e) { setMsg(socialError(e)); }
  };
  return (
    <div>
      <div className="text-[9px] mb-1">{v.aberta ? 'QUAL O TEMA DA PRÓXIMA COLEÇÃO?' : 'RESULTADO DA ÚLTIMA VOTAÇÃO'}</div>
      <div className="text-[7px] text-[#6a4a2a] mb-2">{v.aberta ? `Fecha em ${new Date(v.ends).toLocaleDateString('pt-BR')} · ${v.total} votos` : `${v.total} votos · venceu: ${win ? themeLabel(win) : 'ninguém'}`}</div>
      <div className="grid gap-1.5">
        {v.options.map(o => (
          <PxBox key={o} color={v.meu === o ? '#fff3c8' : undefined} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-[10px]">{themeLabel(o)}{!v.aberta && o === win ? ' · VENCEU' : ''}{v.meu === o ? ' · SEU VOTO' : ''}</div>
              <div className="h-2 mt-1 bg-[#e8dcc0]"><div className="h-full bg-[#c8762a]" style={{ width: `${votePct(v, o)}%` }} /></div>
            </div>
            <div className="text-[9px] w-9 text-right">{votePct(v, o)}%</div>
            {v.aberta && <PxButton color={v.meu === o ? '#6a6a7a' : '#3a9a5a'} disabled={v.meu === o} onClick={() => void vote(o)}>VOTAR</PxButton>}
          </PxBox>
        ))}
      </div>
      {msg && <div className="text-[8px] text-[#3a9a5a] mt-2">{msg}</div>}
    </div>
  );
}

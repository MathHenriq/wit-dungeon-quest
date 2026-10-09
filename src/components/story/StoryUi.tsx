// A história na tela: o rastreador no alto (uma linha que só some por hoje),
// o Caderno (missão, pistas, desaparecidos e as perguntas) e a escolha.
// Tudo lê `src/game/story/runtime.ts` e se atualiza pelo evento `wit-historia`.
import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { PxBox, PxButton, PxPanel, PxTabs } from '@/components/pixel/Pixel';
import { ALERTA_MAX } from '@/game/story/engine';
import { CAPITULOS, LINHA, PISTAS, SELADAS } from '@/game/story/chapters';
import {
  hideStoryToday, loadStory, STORY_EVENT, storyAnswer, storyGoal, storyHidden, storyNow, type storyCtx,
} from '@/game/story/runtime';
import './story.css';

type Ctx = ReturnType<typeof storyCtx>;

/** Re-renderiza quando a história muda. */
export function useStory(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const on = () => setN(x => x + 1);
    window.addEventListener(STORY_EVENT, on);
    return () => window.removeEventListener(STORY_EVENT, on);
  }, []);
  return n;
}

/** A linha no alto da tela. Tocar abre o Caderno. */
export function StoryHud({ onOpen }: { onOpen: () => void }) {
  useStory();
  const h = loadStory();
  const goal = storyGoal();
  const now = storyNow();
  const alerta = h.marcas['lia-revelada'] !== undefined;
  if (storyHidden() || !goal) {
    return (
      <div className="story-hud mini">
        <button className="story-book" onClick={onOpen} title="Caderno"><Icon id="livro" size={18} /></button>
        {!goal && h.pos > 0 && <span className="story-line done">ATO 1 COMPLETO · o Ato 2 vem aí</span>}
        {alerta && <Alerta n={h.alerta} />}
      </div>
    );
  }
  const ask = now?.passo.tipo === 'pergunta';
  return (
    <div className="story-hud">
      <button className={`story-line ${ask ? 'pulse' : ''}`} onClick={onOpen} title="Abrir o Caderno">
        <Icon id="livro" size={16} />
        <b>{goal.cap}</b>
        <span className="txt">{goal.texto}{goal.conta ? ` (${goal.conta})` : ''}</span>
        <i>{goal.onde}</i>
      </button>
      <button className="story-x" onClick={hideStoryToday} title="Esconder até amanhã">×</button>
      {alerta && <Alerta n={h.alerta} />}
    </div>
  );
}

function Alerta({ n }: { n: number }) {
  return (
    <span className={`story-eye ${n >= 4 ? 'hot' : ''}`} title="Alerta da Ordem: bisbilhotar na frente deles faz subir; agir normal faz baixar">
      <span className="eye" aria-hidden>◉</span>
      {Array.from({ length: ALERTA_MAX }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}
    </span>
  );
}

type Tab = 'missao' | 'pistas' | 'sumidos';

export function Caderno({ ctx, onClose, onLines }: { ctx: () => Ctx; onClose: () => void; onLines: (lines: string[]) => void }) {
  useStory();
  const [tab, setTab] = useState<Tab>('missao');
  const [msg, setMsg] = useState<string | null>(null);
  const h = loadStory();
  const now = storyNow();
  const doneCaps = CAPITULOS.filter(c => LINHA.findIndex(l => l.cap.id === c.id) + c.passos.length <= h.pos);
  const goal = storyGoal();

  return (
    <PxPanel title="CADERNO" color="#6a4aa8" onClose={onClose}>
      <PxTabs<Tab> color="#6a4aa8" value={tab} onChange={t => { setTab(t); setMsg(null); }}
        tabs={[['missao', 'HISTÓRIA', 'livro'], ['pistas', `PISTAS (${h.pistas.length})`, 'lupa'], ['sumidos', 'DESAPARECIDOS', 'carta-verso']]} />

      {tab === 'missao' && (
        <div className="story-col">
          {now && goal && (
            <PxBox color="#f3e2ff" className="story-now">
              <div className="story-cap">{now.cap.num === 0 ? 'PRÓLOGO' : `CAPÍTULO ${now.cap.num}`} · {now.cap.titulo.toUpperCase()}</div>
              {now.passo.tipo === 'pergunta' ? (
                <>
                  <div className="story-q">{now.passo.pergunta}</div>
                  <div className="story-opts">
                    {now.passo.opcoes.map((o, i) => (
                      <PxButton key={o} color="#6a4aa8" onClick={() => {
                        const r = storyAnswer(i, ctx());
                        if (r.avancou && r.falas) { onClose(); onLines(r.falas); }
                        else setMsg(r.falas?.[0] ?? null);
                      }}>{o}</PxButton>
                    ))}
                  </div>
                  {msg && <div className="story-err">{msg}</div>}
                </>
              ) : (
                <>
                  <div className="story-goal">{goal.texto}{goal.conta ? ` (${goal.conta})` : ''}</div>
                  <div className="story-where">Onde: {goal.onde}</div>
                  {now.passo.dica && <div className="story-tip">Dica: {now.passo.dica}</div>}
                </>
              )}
            </PxBox>
          )}
          {!now && <PxBox color="#f3e2ff"><div className="story-goal">Fim do Ato 1. O Ato 2, "A Ordem do Verso", vem aí.</div></PxBox>}
          {doneCaps.slice().reverse().map(c => (
            <PxBox key={c.id} className="story-past">
              <div className="story-cap">{c.num === 0 ? 'PRÓLOGO' : `CAPÍTULO ${c.num}`} · {c.titulo.toUpperCase()}</div>
              <div className="story-sum">{c.resumo}</div>
            </PxBox>
          ))}
        </div>
      )}

      {tab === 'pistas' && (
        <div className="story-col">
          {!h.pistas.length && <div className="story-sum">Nenhuma pista ainda.</div>}
          {h.pistas.slice().reverse().map(k => PISTAS[k] && (
            <PxBox key={k}>
              <div className="story-cap">{PISTAS[k].nome}</div>
              <div className="story-sum">{PISTAS[k].texto}</div>
            </PxBox>
          ))}
        </div>
      )}

      {tab === 'sumidos' && (
        <div className="story-cards">
          {Array.from({ length: 12 }, (_, i) => {
            const s = SELADAS[i];
            const got = s && h.pistas.includes(s.pista);
            return got ? (
              <div key={i} className="story-card" style={{ ['--c' as string]: s.cor }}>
                <span className="who">{s.quem}</span>
                <span className="name">{s.nome}</span>
                <span className="sel">CARTA SELADA</span>
              </div>
            ) : (
              <div key={i} className="story-card back"><span>?</span></div>
            );
          })}
          <div className="story-sum wide">Gente do Vale que virou carta. Cada espaço vazio é alguém que ainda não foi encontrado.</div>
        </div>
      )}
    </PxPanel>
  );
}

/** A escolha de um passo (ex.: contar ou guardar o segredo do Seu Joca). */
export function StoryChoice({ pergunta, opcoes, onPick }: { pergunta: string[]; opcoes: string[]; onPick: (i: number) => void }) {
  return (
    <div className="story-choice">
      <div className="story-choice-box">
        {pergunta.map(l => <p key={l}>{l}</p>)}
        <div className="story-opts">
          {opcoes.map((o, i) => <PxButton key={o} color={i ? '#3a9a5a' : '#b8433a'} onClick={() => onPick(i)}>{o}</PxButton>)}
        </div>
      </div>
    </div>
  );
}

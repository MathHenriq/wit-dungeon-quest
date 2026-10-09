// Salão dos Campeões (Arena): os 3 rankings de todos os alunos, cada um com o
// seu visual. Guildas (Castelo: azul real e ouro), PvP (Arena: vermelho e fogo)
// e Desafiantes da Torre (roxo e ciano). Pódio com os 3 primeiros, a lista até
// o 50º e a faixa "você" sempre à vista. Só apelido, visual e números do jogo.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { rankGuilds, rankPlayers, rankPvp, socialError, socialOn, type RankDuelist, type RankGuild, type RankPlayer, type Ranking } from '@/game/social';
import { Icon } from '@/components/Icon';
import { loadLookFrames } from '@/game/world/sprites';
import { normalizeLook, type Look } from '@/game/world/outfit';
import { GuildEmblem } from './GuildPanel';
import { play } from '@/game/sfx';
import './hall-of-fame.css';

export type Board = 'guildas' | 'pvp' | 'jogadores';

const BOARDS: Record<Board, { title: string; sub: string; icon: string; metric: string }> = {
  guildas: { title: 'TORNEIO DAS GUILDAS', sub: 'Pontos das metas da semana (PvP, Torre, trabalhos, aula...). Zera toda segunda!', icon: 'escudo', metric: 'pontos' },
  pvp: { title: 'CAMPEÕES DA ARENA', sub: 'Vitórias no PvP ao vivo, contra alunos de toda a escola.', icon: 'espadas', metric: 'vitórias' },
  jogadores: { title: 'DESAFIANTES DA TORRE', sub: 'O andar mais alto da Torre. Empate: quem tem mais cartas.', icon: 'coroa', metric: 'andar' },
};

type Row = { key: string; pos: number; name: string; sub?: string | null; value: number; extra?: string; mine: boolean; avatar: ReactNode };
type Data = { rows: Row[]; me: { pos: number; value: number; label?: string } | null; total: number };

function toData(b: Board, r: Ranking<RankGuild, { pos: number; pontos: number; name: string }> | Ranking<RankDuelist, { pos: number; vitorias: number; semana: number }> | Ranking<RankPlayer, { pos: number; andar: number; cartas: number }>): Data {
  if (b === 'guildas') {
    const g = r as Ranking<RankGuild, { pos: number; pontos: number; name: string }>;
    return {
      rows: g.top.map(x => ({ key: `${x.pos}-${x.name}`, pos: x.pos, name: x.name, sub: `${x.membros} membro${x.membros === 1 ? '' : 's'}`,
        extra: `${x.metas}/${x.totalMetas} metas`, value: x.pontos, mine: x.minha, avatar: <GuildEmblem i={x.emblem} size={56} /> })),
      me: g.eu ? { pos: g.eu.pos, value: g.eu.pontos, label: g.eu.name } : null, total: g.total,
    };
  }
  if (b === 'pvp') {
    const p = r as Ranking<RankDuelist, { pos: number; vitorias: number; semana: number }>;
    return {
      rows: p.top.map(x => ({ key: x.handle, pos: x.pos, name: x.nick, sub: x.title, value: x.vitorias, extra: x.semana > 0 ? `+${x.semana} na semana` : undefined,
        mine: x.eu, avatar: <Portrait look={x.look} /> })),
      me: p.eu ? { pos: p.eu.pos, value: p.eu.vitorias } : null, total: p.total,
    };
  }
  const j = r as Ranking<RankPlayer, { pos: number; andar: number; cartas: number }>;
  return {
    rows: j.top.map(x => ({ key: x.handle, pos: x.pos, name: x.nick, sub: x.guilda ? `${x.title ? `${x.title} · ` : ''}${x.guilda}` : x.title, value: x.andar,
      extra: `${x.cartas} cartas`, mine: x.eu, avatar: <Portrait look={x.look} /> })),
    me: j.eu ? { pos: j.eu.pos, value: j.eu.andar } : null, total: j.total,
  };
}

const load = (b: Board) => (b === 'guildas' ? rankGuilds() : b === 'pvp' ? rankPvp() : rankPlayers());

export function HallOfFame({ board: first, onClose }: { board: Board; onClose: () => void }) {
  const [board, setBoard] = useState<Board>(first);
  const [data, setData] = useState<Partial<Record<Board, Data>>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!socialOn() || data[board]) return;
    let alive = true;
    setErr(null);
    load(board).then(r => { if (alive) setData(d => ({ ...d, [board]: toData(board, r) })); })
      .catch(e => { if (alive) setErr(socialError(e)); });
    return () => { alive = false; };
  }, [board, data]);

  const d = data[board];
  const info = BOARDS[board];
  const podium = d?.rows.slice(0, 3) ?? [];
  const rest = d?.rows.slice(3) ?? [];

  return (
    <div className="hof-overlay" onPointerDown={onClose}>
      <div className={`hof hof-${board}`} onPointerDown={e => e.stopPropagation()} role="dialog" aria-label={info.title}>
        <div className="hof-rays" aria-hidden />
        <header className="hof-head">
          <div className="hof-tabs" role="tablist">
            {(Object.keys(BOARDS) as Board[]).map(b => (
              <button key={b} role="tab" aria-selected={b === board} className={`hof-tab hof-tab-${b} ${b === board ? 'on' : ''}`}
                onClick={() => { if (b !== board) { play('click'); setBoard(b); } }}>
                <Icon id={BOARDS[b].icon} size={18} />
                <span>{b === 'guildas' ? 'Guildas' : b === 'pvp' ? 'Arena PvP' : 'Desafiantes'}</span>
              </button>
            ))}
          </div>
          <button className="hof-close" onClick={onClose} aria-label="Sair">✕</button>
        </header>

        <div className="hof-title">
          <Icon id={info.icon} size={34} className="hof-title-icon" />
          <div>
            <h2>{info.title}</h2>
            <p>{info.sub}</p>
          </div>
          <Icon id={info.icon} size={34} className="hof-title-icon hof-flip" />
        </div>

        <div className="hof-body">
          {!socialOn() && <div className="hof-empty">O ranking precisa estar online (com o banco ligado).</div>}
          {socialOn() && err && <div className="hof-empty">{err}</div>}
          {socialOn() && !err && !d && <div className="hof-empty">Carregando os campeões...</div>}
          {d && d.rows.length === 0 && (
            <div className="hof-empty">
              <Icon id="trofeu" size={48} />
              <div>Ninguém no placar ainda.</div>
              <div className="hof-empty-sub">{board === 'guildas' ? 'Crie ou entre numa guilda no Castelo e cumpra as metas da semana!' : board === 'pvp' ? 'Sente numa mesa livre da Arena e vença um duelo ao vivo!' : 'Suba a Torre para aparecer aqui!'}</div>
            </div>
          )}
          {d && d.rows.length > 0 && (
            <>
              <div className="hof-podium">
                {[1, 0, 2].map(i => podium[i] && (
                  <div key={podium[i].key} className={`hof-step hof-step-${i + 1} ${podium[i].mine ? 'mine' : ''}`}>
                    {i === 0 && <Icon id="coroa" size={30} className="hof-crown" />}
                    <div className="hof-avatar">{podium[i].avatar}</div>
                    <div className="hof-pname" title={podium[i].name}>{podium[i].name}</div>
                    {podium[i].sub && <div className="hof-psub">{podium[i].sub}</div>}
                    <div className="hof-block">
                      <span className="hof-place">{podium[i].pos}º</span>
                      <span className="hof-pval">{fmt(board, podium[i].value)}</span>
                      {podium[i].extra && <span className="hof-pextra">{podium[i].extra}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {rest.length > 0 && (
                <ol className="hof-list">
                  {rest.map(r => (
                    <li key={r.key} className={`hof-row ${r.mine ? 'mine' : ''}`}>
                      <span className="hof-rpos">{r.pos}º</span>
                      <span className="hof-ravatar">{r.pos <= 10 || r.mine ? r.avatar : null}</span>
                      <span className="hof-rname">
                        <b>{r.name}</b>
                        {r.sub && <small>{r.sub}</small>}
                      </span>
                      {r.extra && <span className="hof-rextra">{r.extra}</span>}
                      <span className="hof-rval">{fmt(board, r.value)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>

        {d && (
          <footer className="hof-me">
            {d.me
              ? <><span className="hof-me-tag">VOCÊ</span><span>{d.me.label ? `${d.me.label} · ` : ''}<b>{d.me.pos}º</b> de {d.total}</span><span className="hof-me-val">{fmt(board, d.me.value)}</span></>
              : <span>{board === 'guildas' ? 'Você ainda não está numa guilda. Vá ao Castelo das Guildas!' : board === 'pvp' ? 'Vença um duelo ao vivo na Arena para entrar no placar.' : 'Abra o jogo na cidade para entrar no placar.'}</span>}
          </footer>
        )}
      </div>
    </div>
  );
}

/**
 * Retrato recortado no boneco (o quadro do sprite tem muita sobra em volta):
 * a figura enche a altura de quem a contém, sem borrar.
 */
function Portrait({ look }: { look: Partial<Look> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    loadLookFrames(normalizeLook(look)).then(f => {
      const c = ref.current, img = f.walk.south[0];
      if (!alive || !c || !img) return;
      const px = img.getContext('2d')!.getImageData(0, 0, img.width, img.height).data;
      let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
      for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
        if (px[(y * img.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 < 0) return;
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      c.width = w; c.height = h;
      const g = c.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      g.drawImage(img, x0, y0, w, h, 0, 0, w, h);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [look]);
  return <canvas ref={ref} className="hof-portrait" />;
}

function fmt(b: Board, v: number): string {
  if (b === 'jogadores') return `Andar ${v}`;
  return `${v} ${b === 'pvp' ? (v === 1 ? 'vitória' : 'vitórias') : (v === 1 ? 'ponto' : 'pontos')}`;
}

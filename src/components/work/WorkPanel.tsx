import { useState } from 'react';
import { applyReward, chooseProfession, playsLeft, today, spendPlay, WORK_HUNGER, PLAYS_PER_DAY, type Reward } from '@/game/life';
import { buy, buyPrice } from '@/game/market';
import { rewardOf } from '@/game/minigames';
import { plain } from '@/game/news';
import { MINIGAME_NAME, perkLevel, profOfMinigame, TITLES, type MinigameId } from '@/game/professions';
import { loadProgress, saveProgress, type Progress } from '@/game/progress';
import { itemIcon, itemLabel } from '@/game/items';
import { play } from '@/game/sfx';
import { GAMES, type GameResult } from './Minigames';
import { LevelBar, Shell, Tabs } from './Shell';
import { Icon } from '@/components/Icon';
import { orderOf } from '@/game/deliveries';
import { OrderBox } from './OrderBox';
import { Jornalzinho } from './Jornalzinho';
import { FieldBox } from './FieldBox';
import { fieldOf } from '@/game/fieldwork';

const COLOR: Record<MinigameId, string> = {
  compor: '#3a78c8', pao: '#c87a2a', forno: '#c87a2a', ritmo: '#3a78c8', pintura: '#b0487a', rotular: '#2a9ac8', circuito: '#2a9a5a', pares: '#7a4ac8', noticia: '#c84a6a', materia: '#c84a6a', programar: '#2a9ac8', grafico: '#c8762a', afinar: '#3a78c8', cores: '#b0487a', regras: '#2a9a5a', rota: '#e8762a', coordenadas: '#7a4ac8', acuracia: '#2a9ac8', calendario: '#5a9a3a', fermento: '#c87a2a', barraca: '#c8762a', boato: '#c84a6a', logica: '#c8a020', pixelart: '#b0487a', 'teste-jogo': '#c8a020',
};

/**
 * Trabalho num prédio: explica a profissão, mostra o nível, joga o minijogo e
 * entrega o que ele rendeu (5 vezes por dia rendem; depois é só treino).
 * `shop` = o que o lugar vende (a Padaria vende pão e bolo).
 */
export function WorkPanel({ game: first, also = [], progress, nick, shop, onClose }: { game: MinigameId; also?: MinigameId[]; progress: Progress; nick: string; shop?: string[]; onClose: () => void }) {
  const [game, setGame] = useState<MinigameId>(first);
  const games = [first, ...also];
  const prof = profOfMinigame(game);
  const color = COLOR[game];
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro');
  const [tab, setTab] = useState<'trabalhar' | 'comprar' | 'encomenda' | 'jornal' | 'campo'>('trabalhar');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [res, setRes] = useState<{ r: GameResult; reward: Reward | null; levelUp?: number; news?: boolean } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const xp = progress.xp[prof.id] ?? 0;
  const perk = perkLevel(progress.profissao, prof.id, xp);
  const left = playsLeft(progress, game);
  const Game = GAMES[game];
  const tabs: ['trabalhar' | 'comprar' | 'encomenda' | 'jornal' | 'campo', string][] = [['trabalhar', 'TRABALHO']];
  if (shop) tabs.push(['comprar', 'COMPRAR']);
  if (orderOf(prof.id)) tabs.push(['encomenda', 'ENCOMENDA']);
  if (fieldOf(prof.id)) tabs.push(['campo', 'NO MAPA']);
  if (prof.id === 'reporter') tabs.push(['jornal', 'JORNALZINHO']);

  const start = () => {
    if (progress.fome < WORK_HUNGER) { setMsg('Você está com fome demais para trabalhar. Coma alguma coisa (MOCHILA)!'); play('lose'); return; }
    setSeed(Math.floor(Math.random() * 1e6)); setMsg(null); setPhase('play'); play('click');
  };
  const done = (r: GameResult) => {
    const p = loadProgress();
    let reward: Reward | null = null, levelUp: number | undefined, news = false;
    let next: Progress = { ...p, fome: Math.max(0, p.fome - WORK_HUNGER) };
    if (playsLeft(p, game) > 0) {
      reward = rewardOf(game, r.score, perk, r.hits, r.item);
      const a = applyReward(spendPlay(next, game), prof.id, reward);
      next = a.progress; levelUp = a.levelUp;
      if ((game === 'noticia' || game === 'materia') && r.headline && r.score >= 0.6) { next = { ...next, jornal: { day: today(), text: plain(`${nick}: ${r.headline}`) } }; news = true; }
    }
    saveProgress(next);
    play(r.score >= 0.5 ? 'win' : 'lose');
    setRes({ r, reward, levelUp, news });
    setPhase('result');
  };
  const choose = () => { saveProgress(chooseProfession(progress, prof.id)); play('coin'); setMsg(`Agora você é ${prof.name}! O bônus já vale.`); };
  const buyOne = (id: string) => {
    const r = buy(progress, id);
    if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
    saveProgress(r.progress); play('coin'); setMsg(`+1 ${itemLabel(id)}`);
  };

  return (
    <Shell title={prof.place.toUpperCase()} color={color} coins={progress.coins} onClose={onClose} wide={game === 'compor' || game === 'pao' || game === 'materia' || game === 'programar' || game === 'grafico' || game === 'rota' || game === 'coordenadas' || game === 'acuracia' || game === 'regras' || game === 'calendario' || game === 'fermento' || game === 'barraca' || game === 'boato' || game === 'logica' || game === 'pixelart' || tab === 'jornal'}>
      {phase === 'intro' && tabs.length > 1 && <Tabs tabs={tabs} value={tab} onChange={t => { setTab(t); setMsg(null); }} color={color} />}
      {phase === 'intro' && tab === 'campo' && <FieldBox prof={prof.id} progress={progress} />}
      {phase === 'intro' && tab === 'jornal' && <Jornalzinho progress={progress} />}
      {phase === 'intro' && tab === 'encomenda' && <OrderBox prof={prof.id} progress={progress} />}
      {phase === 'intro' && tab === 'comprar' && shop && (
        <div className="grid gap-1.5">
          {shop.map(id => (
            <div key={id} className="flex items-center gap-2 py-1 border-b border-[#e0d8c4]">
              <Icon id={itemIcon(id)} size={32} />
              <span className="flex-1 text-[9px]">{itemLabel(id)} <span className="text-[#5a5470]">· tem {progress.itens[id] ?? 0}</span></span>
              <button onClick={() => buyOne(id)} className="px-2 py-1.5 rounded bg-[#3a9a5a] text-white text-[8px]">{buyPrice(id)} <Icon id="moeda" size={10} /></button>
            </div>
          ))}
        </div>
      )}
      {phase === 'intro' && tab === 'trabalhar' && (
        <div>
          {games.length > 1 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {games.map(g => (
                <button key={g} onClick={() => { setGame(g); setMsg(null); }}
                  className={`px-2 py-1.5 rounded text-[8px] border-2 ${g === game ? 'text-white' : 'bg-white border-[#c8c0ac]'}`}
                  style={g === game ? { background: COLOR[g], borderColor: COLOR[g] } : undefined}>{MINIGAME_NAME[g].toUpperCase()}</button>
              ))}
            </div>
          )}
        <div>
          <div className="text-[10px] mb-1">{prof.name}</div>
          <div className="text-[8px] leading-4 text-[#5a5470] mb-2">{prof.how}</div>
          <LevelBar xp={xp} />
          <div className="mt-2 rounded-lg bg-white border-2 p-2 text-[8px] leading-4" style={{ borderColor: color }}>
            {progress.profissao === prof.id
              ? <>SEU CARGO · bônus: {prof.perk}</>
              : <>Bônus de quem tem o cargo: {prof.perk}<br /><button onClick={choose} className="mt-1 px-2 py-1 rounded text-white text-[8px]" style={{ background: color }}>ESCOLHER ESTE CARGO</button></>}
          </div>
          <div className="text-[8px] mt-2 text-[#5a5470]">Hoje ainda rende: {left}/{PLAYS_PER_DAY} {left <= 0 && '(agora é só treino, sem prêmio)'} · gasta um pouco da barriga</div>
          <button onClick={start} className="mt-3 w-full py-3 rounded-lg text-white text-[11px] border-b-4 border-black/30" style={{ background: color }}>TRABALHAR</button>
        </div>
        </div>
      )}
      {phase === 'play' && <Game perk={perk} seed={seed} onDone={done} towerMax={progress.towerMax} day={Math.floor(Date.now() / 86_400_000)} />}
      {phase === 'result' && res && (
        <div className="text-center">
          <div className="text-[13px] mb-1" style={{ color }}>{res.r.score >= 0.9 ? 'EXCELENTE!' : res.r.score >= 0.6 ? 'BOM TRABALHO!' : res.r.score >= 0.3 ? 'DÁ PARA MELHORAR' : 'NÃO FOI DESSA VEZ'}</div>
          <div className="text-[9px] text-[#5a5470] mb-3">Nota: {Math.round(res.r.score * 100)}%</div>
          {res.reward ? (
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              {Object.entries(res.reward.items).map(([id, n]) => <span key={id} className="px-2 py-1 rounded bg-white border-2 border-[#d8d0c0] text-[9px] flex items-center gap-1"><Icon id={itemIcon(id)} size={20} /> {itemLabel(id)} ×{n}</span>)}
              {res.reward.coins > 0 && <span className="px-2 py-1 rounded bg-white border-2 border-[#d8d0c0] text-[9px] flex items-center gap-1"><Icon id="moeda" size={16} /> +{res.reward.coins}</span>}
              <span className="px-2 py-1 rounded bg-white border-2 border-[#d8d0c0] text-[9px]">+{res.reward.xp} XP</span>
              {!Object.keys(res.reward.items).length && !res.reward.coins && <div className="w-full text-[8px] text-[#5a5470]">Nenhum item desta vez: capriche mais na próxima!</div>}
            </div>
          ) : <div className="text-[8px] text-[#5a5470] mb-2">Treino: este trabalho já rendeu {PLAYS_PER_DAY} vezes hoje. Amanhã rende de novo.</div>}
          {res.levelUp && <div className="text-[10px] text-[#e8a020] my-2">SUBIU DE NÍVEL! {prof.name} · {TITLES[res.levelUp - 1]}</div>}
          {res.news && <div className="text-[8px] text-[#c84a6a] my-2">Sua matéria saiu no telão do Jornal WIT!</div>}
          <div className="flex gap-2 justify-center mt-3">
            <button onClick={() => setPhase('intro')} className="px-3 py-2 rounded bg-[#4a4660] text-white text-[9px]">VOLTAR</button>
            <button onClick={start} className="px-3 py-2 rounded text-white text-[9px]" style={{ background: color }}>DE NOVO</button>
          </div>
        </div>
      )}
      {msg && <div className="mt-3 text-[9px] text-[#3a9a5a]">{msg}</div>}
    </Shell>
  );
}

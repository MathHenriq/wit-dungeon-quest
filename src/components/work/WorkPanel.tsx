import { useState } from 'react';
import { applyReward, chooseProfession, playsLeft, today, spendPlay, WORK_HUNGER, PLAYS_PER_DAY, type Reward } from '@/game/life';
import { buy, buyPrice } from '@/game/market';
import { rewardOf } from '@/game/minigames';
import { plain } from '@/game/news';
import { MINIGAME_ABOUT, MINIGAME_NAME, perkLevel, profOfMinigame, TITLES, type MinigameId } from '@/game/professions';
import { loadProgress, saveProgress, type Progress } from '@/game/progress';
import { itemIcon, itemLabel } from '@/game/items';
import { play } from '@/game/sfx';
import { GAMES, type GameResult } from './Minigames';
import { GameStage } from './GameStage';
import { LevelBar, Shell, Tabs } from './Shell';
import { Icon } from '@/components/Icon';
import { frame, PxBox, PxButton } from '@/components/pixel/Pixel';
import { buttonColors, PAPER } from '@/components/pixel/pixel';
import { orderOf } from '@/game/deliveries';
import { OrderBox } from './OrderBox';
import { Jornalzinho } from './Jornalzinho';
import { FieldBox } from './FieldBox';
import { fieldOf } from '@/game/fieldwork';

const COLOR: Record<MinigameId, string> = {
  compor: '#3a78c8', pao: '#c87a2a', forno: '#c87a2a', ritmo: '#3a78c8', pintura: '#b0487a', rotular: '#2a9ac8', circuito: '#2a9a5a', pares: '#7a4ac8', noticia: '#c84a6a', materia: '#c84a6a', programar: '#2a9ac8', grafico: '#c8762a', afinar: '#3a78c8', cores: '#b0487a', regras: '#2a9a5a', rota: '#e8762a', coordenadas: '#7a4ac8', acuracia: '#2a9ac8', calendario: '#5a9a3a', fermento: '#c87a2a', barraca: '#c8762a', boato: '#c84a6a', logica: '#c8a020', pixelart: '#b0487a', 'teste-jogo': '#c8a020', sala3d: '#7a4ac8',
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
  const tabs: ['trabalhar' | 'comprar' | 'encomenda' | 'jornal' | 'campo', string, string][] = [['trabalhar', 'TRABALHO', prof.icon]];
  if (shop) tabs.push(['comprar', 'COMPRAR', 'moeda']);
  if (orderOf(prof.id)) tabs.push(['encomenda', 'ENCOMENDA', 'pacote']);
  if (fieldOf(prof.id)) tabs.push(['campo', 'NO MAPA', 'mapa']);
  if (prof.id === 'reporter') tabs.push(['jornal', 'JORNALZINHO', 'jornal']);

  const start = (g: MinigameId = game) => {
    if (progress.fome < WORK_HUNGER) { setMsg('Você está com fome demais para trabalhar. Coma alguma coisa (MOCHILA)!'); play('lose'); return; }
    setGame(g);
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
    <Shell title={prof.place.toUpperCase()} color={color} coins={progress.coins} onClose={onClose} wide={phase === 'intro' || game === 'compor' || game === 'pao' || game === 'materia' || game === 'programar' || game === 'grafico' || game === 'rota' || game === 'coordenadas' || game === 'sala3d' || game === 'acuracia' || game === 'regras' || game === 'calendario' || game === 'fermento' || game === 'barraca' || game === 'boato' || game === 'logica' || game === 'pixelart' || tab === 'jornal'}>
      {phase === 'intro' && tabs.length > 1 && <Tabs tabs={tabs} value={tab} onChange={t => { setTab(t); setMsg(null); }} color={color} />}
      {phase === 'intro' && tab === 'campo' && <FieldBox prof={prof.id} progress={progress} />}
      {phase === 'intro' && tab === 'jornal' && <Jornalzinho progress={progress} />}
      {phase === 'intro' && tab === 'encomenda' && <OrderBox prof={prof.id} progress={progress} />}
      {phase === 'intro' && tab === 'comprar' && shop && (
        <div className="grid gap-1.5">
          {shop.map(id => (
            <div key={id} className="flex items-center gap-2 py-1 border-b-2 border-dashed border-[#d8bf8a]">
              <Icon id={itemIcon(id)} size={32} />
              <span className="flex-1 text-[9px]">{itemLabel(id)} <span className="text-[#5a5470]">· tem {progress.itens[id] ?? 0}</span></span>
              <PxButton color="#3a9a5a" onClick={() => buyOne(id)}>{buyPrice(id)} <Icon id="moeda" size={10} /></PxButton>
            </div>
          ))}
        </div>
      )}
      {phase === 'intro' && tab === 'trabalhar' && (
        <div>
          <div className="wk-head">
            <div className="wk-medal" style={frame(buttonColors(color), 8, true)}><Icon id={prof.icon} size={40} /></div>
            <div>
              <div className="wk-name flex items-center gap-2">{prof.name.toUpperCase()}
                {progress.profissao === prof.id && <span className="wk-stamp" style={frame(buttonColors('#3a9a5a'), 4, true)}>SEU CARGO</span>}
              </div>
              <LevelBar xp={xp} />
              <div className="wk-sub mt-1">{prof.how}</div>
            </div>
          </div>
          <div className="wk-tasks">
            {games.map(g => {
              const lf = playsLeft(progress, g);
              return (
                <button key={g} className="wk-task" style={frame(g === game ? { ...PAPER, ink: COLOR[g], inner: COLOR[g] } : PAPER, 8, true)}
                  onClick={() => { setGame(g); start(g); }}>
                  <span className="ic" style={frame(buttonColors(COLOR[g]), 4, true)}><Icon id={MINIGAME_ABOUT[g][1]} size={28} /></span>
                  <span className="nm">{MINIGAME_NAME[g].toUpperCase()}</span>
                  <span className="ab">{MINIGAME_ABOUT[g][0]}</span>
                  <span className="ft">
                    {lf > 0 ? <>RENDE <span className="wk-pips">{Array.from({ length: PLAYS_PER_DAY }, (_, i) => <i key={i} className={i < lf ? 'on' : ''} />)}</span></> : <>SÓ TREINO HOJE</>}
                    <span className="wk-play px-btn" style={frame(buttonColors(COLOR[g]), 8, true)}>JOGAR</span>
                  </span>
                </button>
              );
            })}
          </div>
          <PxBox className="wk-perk" style={{ marginTop: 10 }}>
            <Icon id="diamante" size={20} />
            <span className="flex-1">{progress.profissao === prof.id ? <>Seu bônus: {prof.perk}</> : <>Bônus de quem escolhe este cargo: {prof.perk}</>}</span>
            {progress.profissao !== prof.id && <PxButton color={color} onClick={choose}>ESCOLHER CARGO</PxButton>}
          </PxBox>
          <div className="text-[7px] mt-2 text-[#7a5a34]">Cada tarefa rende {PLAYS_PER_DAY} vezes por dia; depois é treino, sem prêmio. Trabalhar gasta um pouco da barriga.</div>
        </div>
      )}
      {phase === 'play' && (
        <GameStage key={seed} prof={prof.id} title={MINIGAME_NAME[game].toUpperCase()} color={color}>
          <Game perk={perk} seed={seed} onDone={done} towerMax={progress.towerMax} day={Math.floor(Date.now() / 86_400_000)} />
        </GameStage>
      )}
      {phase === 'result' && res && (
        <div className="wk-result">
          <div className="big" style={{ color }}>{res.r.score >= 0.9 ? 'EXCELENTE!' : res.r.score >= 0.6 ? 'BOM TRABALHO!' : res.r.score >= 0.3 ? 'DÁ PARA MELHORAR' : 'NÃO FOI DESSA VEZ'}</div>
          <div className="wk-stars">{[0.3, 0.6, 0.9].map((t, i) => <span key={t} className={res.r.score >= t ? 'on' : ''} style={{ animationDelay: `${0.15 + i * 0.2}s` }} />)}</div>
          <div className="text-[8px] text-[#7a5a34] mb-3">Nota: {Math.round(res.r.score * 100)}%</div>
          {res.reward ? (
            <div className="wk-loot">
              {Object.entries(res.reward.items).map(([id, n]) => <PxBox key={id}><Icon id={itemIcon(id)} size={22} /> {itemLabel(id)} ×{n}</PxBox>)}
              {res.reward.coins > 0 && <PxBox><Icon id="moeda" size={18} /> +{res.reward.coins}</PxBox>}
              <PxBox>+{res.reward.xp} XP</PxBox>
              {!Object.keys(res.reward.items).length && !res.reward.coins && <div className="w-full text-[8px] text-[#7a5a34]">Nenhum item desta vez: capriche mais na próxima!</div>}
            </div>
          ) : <div className="text-[8px] text-[#7a5a34] mb-2">Treino: esta tarefa já rendeu {PLAYS_PER_DAY} vezes hoje. Amanhã rende de novo.</div>}
          {res.levelUp && <div className="text-[10px] text-[#c87a10] my-2">SUBIU DE NÍVEL! {prof.name} · {TITLES[res.levelUp - 1]}</div>}
          {res.news && <div className="text-[8px] text-[#c84a6a] my-2">Sua matéria saiu no telão do Jornal WIT!</div>}
          <div className="flex gap-2 justify-center mt-3">
            <PxButton color="#6a5a8a" onClick={() => setPhase('intro')}>VOLTAR</PxButton>
            <PxButton color={color} onClick={() => start()}>DE NOVO</PxButton>
          </div>
        </div>
      )}
      {msg && <div className="mt-3 text-[9px] text-[#2a7a4a]">{msg}</div>}
    </Shell>
  );
}

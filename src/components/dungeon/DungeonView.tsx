// Masmorra (src/game/dungeon.ts): o portal de um rank, do começo ao chefe.
// Teclado: WASD/setas andam · J ou clique ataca (mira no mouse; sem mouse,
// mira automática) · K/ESPAÇO esquiva · Q troca espada ↔ arma longa · E pega
// · 1–4 cartas · ESC sai. Toque: alavanca à esquerda; ATAQUE, ESQUIVA, TROCA e
// as cartas à direita. Arte PROVISÓRIA (pets e desafiantes como monstros,
// piso do castelo pintado pelo rank) até a do GPT (docs/gpt-masmorra.md).
import { useEffect, useRef, useState } from 'react';
import {
  chooseBuff, doorTile, ENEMY, GRID, NO_INPUT, RH, RW, solidAt, startRun, stepRun, BUFFS, FLOORS, petCap, LOOT_CATS,
  type Input, type Run, type Side, type EnemyKind, type LootCat, type BuffId,
} from '@/game/dungeon';
import { weapon } from '@/game/dungeon-weapons';
import { finishPortal, portalRun, rankName, type PortalPrize } from '@/game/hunter';
import { loadProgress, saveProgress } from '@/game/progress';
import { cloudDungeonCard, cloudEnabled } from '@/game/cloud';
import { loadLookFrames, loadNpcFrames, loadPetFrames, type Frames } from '@/game/world/sprites';
import { DEFAULT_PET, type Look } from '@/game/world/outfit';
import type { Dir } from '@/game/world/movement';
import { cut, loadAtlas, loadInteriorManifest } from '@/components/city/interior-atlas';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { cardArtUrl } from '@/components/tcg/cardArt';
import { TcgCard } from '@/components/tcg/TcgCard';
import { Icon } from '@/components/Icon';
import { iconUrl } from '@/game/icons';
import { itemIcon, itemLabel } from '@/game/items';
import { play } from '@/game/sfx';
import { SystemWindow } from './SystemWindow';
import { drawFx, EL_COLOR, fxFrom, type Fx } from './dungeon-vfx';
import './dungeon.css';

const T = 32;
const W = RW * T, H = RH * T;
const DIR: Record<Side, Dir> = { n: 'north', s: 'south', e: 'east', w: 'west' };
/** Monstros provisórios (pets e desafiantes) até a arte do GPT. */
const MOB_SPRITE: Record<Exclude<EnemyKind, 'chefe'>, string> = {
  goblin: 'pet-filhote-lutador', arqueiro: 'pet-corujinha-vento', xama: 'pet-cogumelinho', slime: 'pet-sapinho-roxo',
  slimeP: 'pet-sapinho-roxo', morcego: 'pet-morcego-noite', lobo: 'pet-gato-sombra', golem: 'pet-tatu-rocha',
};
/** Cor do chão de cada rank (E cinza, D roxo, C gelo, B lava, A floresta, S sombras). */
const RANK_TINT = ['rgba(60,60,70,.25)', 'rgba(90,40,120,.3)', 'rgba(60,150,200,.28)', 'rgba(160,50,20,.3)', 'rgba(30,110,50,.3)', 'rgba(20,0,40,.45)'];
const CAT_ICON: Record<LootCat, string> = { minerio: 'rubi', erva: 'folha', cristal: 'cristal', trofeu: 'pena' };
const CAT_NAME: Record<LootCat, string> = { minerio: 'minério', erva: 'ervas', cristal: 'cristais', trofeu: 'troféus' };

/** Arte do GPT (public/game/masmorra/inimigos): nome do arquivo por tipo. */
const GPT_MOB: Partial<Record<EnemyKind, string>> = { goblin: 'goblin', arqueiro: 'goblin-arqueiro', xama: 'goblin-xama', slime: 'slime', slimeP: 'slime', morcego: 'morcego', lobo: 'lobo-sombrio', golem: 'golem' };
/** Folha do GPT em grade (linhas: frente, esquerda, direita, costas; colunas: andar ×2, ataque ×2). */
interface Grid { walk: Record<Dir, HTMLCanvasElement[]>; atk: Record<Dir, HTMLCanvasElement[]> }
function loadGrid(url: string, cols: number, rows: number): Promise<Grid | null> {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const cw = img.width / cols, ch = img.height / rows, dirs: Dir[] = ['south', 'west', 'east', 'north'];
      const cell = (r: number, c: number) => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; cv.getContext('2d')!.drawImage(img, c * cw, r * ch, cw, ch, 0, 0, cw, ch); return cv; };
      const walk = {} as Grid['walk'], atk = {} as Grid['atk'];
      dirs.forEach((d, k) => { const r = rows === 4 ? k : 0; walk[d] = [0, 1, 0, 1].map(c => cell(r, c)); atk[d] = rows === 4 ? [2, 3].map(c => cell(r, c)) : [0, 1, 2, 3].map(c => cell(1, c)); });
      res({ walk, atk });
    };
    img.onerror = () => res(null);
    img.src = url;
  });
}

interface Art {
  floor: CanvasPattern | null; wall: HTMLCanvasElement | null; rock: HTMLCanvasElement | null; chest: HTMLCanvasElement | null; stairs: HTMLCanvasElement | null;
  player: Frames | null; pet: Frames | null; mobs: Partial<Record<EnemyKind, Frames>>; boss: Frames | null; gpt: Partial<Record<EnemyKind, Grid>>; icons: Map<string, HTMLImageElement>;
}

export function DungeonView({ look, rank, onClose }: { look: Look; rank: number; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pet = look.pet ?? DEFAULT_PET;
  const [seed, setSeed] = useState(() => Date.now() % 1e9);
  const run = useRef<Run>(null as unknown as Run);
  /** Progresso a gravar fora do render (as poções levadas saem da mochila). */
  const pending = useRef<ReturnType<typeof loadProgress> | null>(null);
  const begin = (s: number) => {
    const r = portalRun(loadProgress(), rank, s, pet);
    pending.current = r.progress;
    return startRun(r.options);
  };
  if (!run.current) run.current = begin(seed);
  useEffect(() => { if (pending.current) { saveProgress(pending.current); pending.current = null; } }, [seed]);
  const input = useRef<Input>({ ...NO_INPUT });
  const art = useRef<Art>({ floor: null, wall: null, rock: null, chest: null, stairs: null, player: null, pet: null, mobs: {}, boss: null, gpt: {}, icons: new Map() });
  const fx = useRef<Fx[]>([]);
  const [hud, setHud] = useState(() => snapshot(run.current));
  const [prize, setPrize] = useState<PortalPrize | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const finished = useRef(false);
  const touch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  // a sala de fora re-renderiza à toa: o teclado não pode ser refeito (perderia as teclas seguradas)
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // arte provisória
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [m, atlas] = await Promise.all([loadInteriorManifest(), loadAtlas()]);
      const ctx = canvas.current?.getContext('2d');
      if (!alive || !ctx) return;
      const fl = cut(m, atlas, 'piso-torre-piso-1') ?? cut(m, atlas, 'piso-castelo-piso');
      art.current.floor = fl ? ctx.createPattern(fl, 'repeat') : null;
      art.current.wall = cut(m, atlas, 'parede-castelo-parede');
      art.current.rock = cut(m, atlas, 'arco-pedra') ?? cut(m, atlas, 'barril-agua');
      art.current.chest = cut(m, atlas, 'bau-tesouro');
      art.current.stairs = cut(m, atlas, 'escada');
    })().catch(() => undefined);
    loadLookFrames(look).then(f => { if (alive) art.current.player = f; }).catch(() => undefined);
    loadPetFrames(pet).then(f => { if (alive) art.current.pet = f; }).catch(() => undefined);
    for (const [k, id] of Object.entries(MOB_SPRITE)) loadPetFrames(id).then(f => { if (alive) art.current.mobs[k as EnemyKind] = f; }).catch(() => undefined);
    loadNpcFrames(`npc-desafiante-0${(rank % 9) + 1}`).then(f => { if (alive) art.current.boss = f; }).catch(() => undefined);
    // arte do GPT, se já foi importada (scripts/arte/importar-masmorra.py)
    for (const [k, f] of Object.entries(GPT_MOB)) void loadGrid(`/game/masmorra/inimigos/${f}.png`, 4, 4).then(g => { if (alive && g) art.current.gpt[k as EnemyKind] = g; });
    void loadGrid(`/game/masmorra/inimigos/chefe-${'edcbas'[Math.min(5, rank)]}.png`, 4, 3).then(g => { if (alive && g) art.current.gpt.chefe = g; });
    const items = ['moeda', 'mana', 'vida', 'minerio:cobre', 'minerio:ferro', 'minerio:ouro', 'erva:cura', 'erva:mana', 'cristal:azul', 'cristal:roxo', 'cristal:dourado', 'pena', 'pelo'];
    for (const it of items) {
      const img = new Image();
      img.src = iconUrl(it === 'moeda' ? 'moeda' : it === 'mana' ? 'gota' : it === 'vida' ? 'coracao' : itemIcon(it));
      art.current.icons.set(it, img);
    }
    return () => { alive = false; };
  }, [look, pet, rank]);

  // teclado e mouse
  useEffect(() => {
    const keys = new Set<string>();
    const sync = () => {
      const i = input.current;
      i.mx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      i.my = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
      i.attack = keys.has('j') || keys.has('mouse');
      i.dodge = keys.has(' ') || keys.has('k') || keys.has('shift');
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') return closeRef.current();
      if (e.repeat) { if (k === ' ' || k.startsWith('arrow')) e.preventDefault(); return; }
      if (k === 'q') input.current.swap = true;
      if (k === 'e') input.current.use = true;
      if (/^[1-4]$/.test(k)) input.current.skill = Number(k) - 1;
      keys.add(k); if (k === ' ' || k.startsWith('arrow')) e.preventDefault(); sync();
    };
    const up = (e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); sync(); };
    const cv = canvas.current!;
    const aim = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const b = cv.getBoundingClientRect(), p = run.current.p;
      input.current.ax = ((e.clientX - b.left) / b.width) * RW - p.x;
      input.current.ay = ((e.clientY - b.top) / b.height) * RH - p.y;
    };
    const md = (e: PointerEvent) => { if (e.pointerType !== 'touch') { keys.add('mouse'); aim(e); sync(); } };
    const mu = () => { keys.delete('mouse'); input.current.ax = 0; input.current.ay = 0; sync(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    cv.addEventListener('pointermove', aim); cv.addEventListener('pointerdown', md); window.addEventListener('pointerup', mu);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); cv.removeEventListener('pointermove', aim); cv.removeEventListener('pointerdown', md); window.removeEventListener('pointerup', mu); };
  }, []);

  // laço: passo da regra + desenho
  useEffect(() => {
    let raf = 0, last = performance.now(), hudAt = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      let r = run.current;
      for (let left = Math.min(dt, 0.15); left > 0; left -= 0.05) {
        r = stepRun(r, input.current, Math.min(0.05, left));
        input.current.swap = false; input.current.use = false; input.current.skill = undefined;
        sounds(r);
        fxFrom(r.ev, fx.current);
        for (const e of r.ev) {
          if (e.k === 'full') setToast(`O pet está cheio de ${CAT_NAME[e.cat]}!`);
          if (e.k === 'weapon') setToast(`Pegou: ${weapon(e.id).name}`);
          if (e.k === 'phase') setToast(e.phase === 2 ? '[SISTEMA] O chefe ficou furioso!' : '[SISTEMA] Última fase do chefe!');
          if (e.k === 'wave') setToast('Mais monstros!');
          if (e.k === 'potion') setToast(e.what === 'vida' ? 'Bebeu a Poção de Vida!' : 'Bebeu a Poção de Mana!');
        }
      }
      run.current = r;
      if (import.meta.env.DEV) (window as unknown as { __dungeon: Run }).__dungeon = r;
      const ctx = canvas.current?.getContext('2d') ?? null;
      if (ctx) { draw(ctx, r, art.current, now); fx.current = drawFx(ctx, fx.current, Math.min(dt, 0.1), T); }
      if (now - hudAt > 90 || r.result || r.choice) { hudAt = now; setHud(snapshot(r)); }
      if (!r.result) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [seed]);

  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 1800); return () => window.clearTimeout(t); }, [toast]);

  // fim: prêmio do SISTEMA
  useEffect(() => {
    if (!hud.result || finished.current) return;
    finished.current = true;
    play(hud.result === 'win' ? 'win' : 'lose');
    const r = finishPortal(loadProgress(), run.current);
    if (cloudEnabled() && r.card) {
      // com o banco, a carta vem do servidor (moedas e itens vão pelo sync)
      const local = { ...r.progress, collection: { ...r.progress.collection, [r.card]: Math.max(0, (r.progress.collection[r.card] ?? 1) - 1) } };
      saveProgress(local);
      void cloudDungeonCard(run.current.rank).then(card => {
        if (card) { const p = loadProgress(); saveProgress({ ...p, collection: { ...p.collection, [card]: (p.collection[card] ?? 0) + 1 } }); }
        setPrize({ ...r, card: card ?? undefined });
      });
    } else {
      saveProgress(r.progress);
      setPrize(r);
    }
  }, [hud.result]);

  const again = () => { finished.current = false; setPrize(null); fx.current = []; const s = Date.now() % 1e9; run.current = begin(s); setHud(snapshot(run.current)); setSeed(s); };
  const pick = (b: BuffId) => { play('super'); run.current = chooseBuff(run.current, b); setHud(snapshot(run.current)); };
  const d = run.current.d, p = run.current.p;
  return (
    <div className="dg-wrap">
      <div className="dg-top">
        <div className="dg-bars">
          <div className="dg-hp">{Array.from({ length: hud.max }, (_, k) => <Icon key={k} id={k < hud.hp ? 'coracao' : 'coracao-partido'} size={18} />)}</div>
          <div className="dg-armor">{Array.from({ length: hud.armorMax }, (_, k) => <i key={k} className={k < hud.armor ? 'on' : ''} />)}</div>
          <div className="dg-mana" title="Mana (a arma longa gasta)"><i style={{ width: `${(hud.mana / hud.manaMax) * 100}%` }} /><span>{Math.floor(hud.mana)}</span></div>
        </div>
        <div className="dg-title">
          <b>PORTAL {rankName(rank)}</b> · ANDAR {hud.floor}/{FLOORS}
          <span className="dg-gold"><Icon id="moeda" size={14} /> {hud.gold}</span>
        </div>
        <div className="dg-map" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
          {Array.from({ length: GRID * GRID }, (_, k) => {
            const i = d.rooms.findIndex(r => r.gx === k % GRID && r.gy === Math.floor(k / GRID));
            const seen = i >= 0 && hud.seen[i];
            const kind = i >= 0 ? d.rooms[i].kind : '';
            return <i key={k} className={i < 0 || !seen ? '' : i === hud.room ? 'here' : kind === 'chefe' || kind === 'fim' ? 'boss' : kind === 'tesouro' ? 'gold' : kind === 'loja' ? 'shop' : hud.cleared[i] ? 'done' : 'seen'} />;
          })}
        </div>
        <button className="dg-exit" onClick={onClose}>SAIR</button>
      </div>
      <div className="dg-stage">
        <canvas ref={canvas} width={W} height={H} className="dg-canvas" />
        {toast && <div className="dg-toast">{toast}</div>}
        {hud.boss > 0 && <div className="dg-boss"><span>CHEFE DO PORTAL {rankName(rank)}</span><i style={{ width: `${hud.boss * 100}%` }} /></div>}
      </div>
      <div className="dg-bottom">
        <div className="dg-arms">
          {p.arms.map((a, k) => (
            <button key={k} className={`dg-arm ${hud.hand === k ? 'on' : ''}`} onClick={() => { input.current.swap = hud.hand !== k; }}>
              <WeaponIcon id={a.id} /><span>{weapon(a.id).name}{a.lvl ? ` +${a.lvl}` : ''}</span><small>{k === 0 ? 'CURTA' : weapon(a.id).mana ? `${weapon(a.id).mana} mana` : 'LONGA'}</small>
            </button>
          ))}
        </div>
        <div className="dg-skills">
          {p.skills.map((s, k) => (
            <button key={s.card} className="dg-skill" style={{ ['--el' as string]: EL_COLOR[s.element][0] }} onPointerDown={() => { input.current.skill = k; }} title={`${s.name}: ${s.dmg} de dano`}>
              <img src={cardArtUrl(s.card.replace(/\+$/, ''))} alt="" draggable={false} />
              {hud.cds[k] > 0 && <i className="cd" style={{ height: `${(hud.cds[k] / s.cd) * 100}%` }}><b>{Math.ceil(hud.cds[k])}</b></i>}
              <kbd>{k + 1}</kbd>
            </button>
          ))}
          {!p.skills.length && <div className="dg-noskill">Sem cartas: escolha no SISTEMA da Associação</div>}
        </div>
        <div className="dg-pet" title="Mochila do pet">
          {LOOT_CATS.map(c => <span key={c} className={hud.bag[c] >= petCap(pet, c) ? 'full' : ''}><Icon id={CAT_ICON[c]} size={14} />{hud.bag[c]}/{petCap(pet, c)}</span>)}
        </div>
      </div>
      {touch && <TouchPad input={input} />}
      {!touch && <div className="dg-help">WASD anda · J/clique ataca · K/ESPAÇO esquiva · Q troca espada ↔ tiro · E pega · 1–4 cartas · vermelho no chão = golpe vindo: saia!</div>}

      {hud.choice && (
        <div className="dg-end">
          <SystemWindow title="ANDAR LIMPO" sub={`Escolha uma bênção para o andar ${hud.floor + 1}`}>
            <div className="sys-choices">
              {hud.choice.map(b => { const def = BUFFS.find(x => x.id === b)!; return (
                <button key={b} className="sys-choice" onClick={() => pick(b)}><b>{def.name}</b><span>{def.about}</span></button>
              ); })}
            </div>
          </SystemWindow>
        </div>
      )}
      {hud.result && (
        <div className="dg-end">
          <SystemWindow title={hud.result === 'win' ? 'PORTAL LIMPO' : 'VOCÊ CAIU'} sub={hud.result === 'win' ? `O chefe do portal ${rankName(rank)} foi derrotado.` : 'O pet trouxe metade do que carregava.'} danger={hud.result !== 'win'}>
            {!prize && <div className="sys-line">Calculando a recompensa...</div>}
            {prize && <>
              <div className="sys-line">+{prize.xp} XP de caçador{prize.rankUp !== undefined && <b className="sys-up"> · SUBIU PARA O RANK {rankName(prize.rankUp)}!</b>}</div>
              <div className="sys-line"><Icon id="moeda" size={14} /> {prize.paid ? `+${prize.coins} moedas` : 'Hoje os 3 portais pagos já foram: este valeu XP e itens.'}</div>
              {Object.keys(prize.items).length > 0 && <div className="sys-items">{Object.entries(prize.items).map(([k, n]) => <span key={k}><Icon id={itemIcon(k)} size={16} /> {n} {itemLabel(k)}</span>)}</div>}
              {prize.missao && <div className={`sys-line ${prize.missao.completou ? 'sys-up' : ''}`}>[MISSÃO DIÁRIA] {prize.missao.label}: {prize.missao.feito}/{prize.missao.alvo}{prize.missao.completou ? ' · CUMPRIDA (+40 moedas, +120 XP)' : ''}</div>}
              {prize.sombra && <div className="sys-arise">ARISE! Uma sombra {prize.sombra} agora acompanha você.</div>}
              {prize.card && CARD_BY_ID.get(prize.card) && <div className="sys-card"><TcgCard card={CARD_BY_ID.get(prize.card)!} /><span>Carta do chefe: {CARD_BY_ID.get(prize.card)?.name}</span></div>}
              <div className="sys-actions"><button className="sys-btn" onClick={again}>ENTRAR DE NOVO</button><button className="sys-btn alt" onClick={onClose}>VOLTAR À ASSOCIAÇÃO</button></div>
            </>}
          </SystemWindow>
        </div>
      )}
    </div>
  );
}

function snapshot(r: Run) {
  const boss = r.enemies.find(e => e.kind === 'chefe');
  return {
    hp: r.p.hp, max: r.p.max, armor: r.p.armor, armorMax: r.p.armorMax, mana: r.p.mana, manaMax: r.p.manaMax, gold: r.gold,
    room: r.room, seen: r.seen, cleared: r.cleared, floor: r.floor, hand: r.p.hand, cds: r.p.skillCd, bag: { ...r.pet.bag },
    boss: boss ? Math.max(0, boss.hp / boss.max) : 0, choice: r.choice, result: r.result,
  };
}

let lastSound = 0;
function sounds(r: Run) {
  const now = performance.now();
  for (const e of r.ev) {
    if (e.k === 'hurt') play('lose');
    else if (e.k === 'block') play('trap');
    else if (e.k === 'kill') play(e.kind === 'chefe' ? 'win' : 'coin');
    else if (e.k === 'cast' && e.slot >= 0) play(e.skill.ownVfx ? 'bigHit' : 'super');
    else if (e.k === 'room' || e.k === 'stairs') play('turn');
    else if (e.k === 'chest' || e.k === 'buy' || e.k === 'weapon') play('super');
    else if ((e.k === 'swing' || e.k === 'shoot') && now - lastSound > 90) { lastSound = now; play(e.k === 'swing' ? 'flip' : 'draw'); }
    else if (e.k === 'hit' && e.crit) play('hit');
    else if (e.k === 'nomana') play('click');
  }
}

/** Ícone da arma desenhado em código (até as armas do GPT). */
function WeaponIcon({ id }: { id: string }) {
  const w = weapon(id as never);
  const blade = w.kind === 'curta';
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} style={{ imageRendering: 'pixelated' }}>
      {blade ? <>
        <rect x="11" y="2" width="3" height={id === 'lanca' ? 18 : 13} fill={id === 'foice' ? '#a87aff' : id === 'machado' || id === 'martelo' ? '#8a8a9a' : '#e8f0f8'} />
        {(id === 'machado' || id === 'martelo') && <rect x="6" y="2" width="12" height="6" fill="#9aa0b0" />}
        <rect x="8" y="15" width="9" height="2" fill="#c8a040" /><rect x="11" y="17" width="3" height="5" fill="#6a3a20" />
      </> : <>
        <rect x="3" y="9" width="16" height="5" fill={id === 'cajado' || id === 'varinha' ? '#a0703a' : '#5a6a8a'} />
        <rect x="17" y="8" width="5" height="3" fill={id === 'cajado' ? '#ff3a5a' : '#7ae8ff'} /><rect x="6" y="14" width="4" height="6" fill="#3a3a4a" />
      </>}
    </svg>
  );
}

function TouchPad({ input }: { input: React.MutableRefObject<Input> }) {
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  return (
    <>
      <div className="dg-stick"
        onPointerDown={e => { (e.target as HTMLElement).setPointerCapture(e.pointerId); origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; setKnob({ x: 0, y: 0 }); }}
        onPointerMove={e => {
          const o = origin.current; if (!o || o.id !== e.pointerId) return;
          const dx = e.clientX - o.x, dy = e.clientY - o.y, l = Math.hypot(dx, dy), m = Math.min(1, l / 45);
          input.current.mx = l ? (dx / l) * m : 0; input.current.my = l ? (dy / l) * m : 0;
          setKnob({ x: (l ? dx / l : 0) * Math.min(l, 45), y: (l ? dy / l : 0) * Math.min(l, 45) });
        }}
        onPointerUp={() => { origin.current = null; input.current.mx = 0; input.current.my = 0; setKnob(null); }}>
        <i style={knob ? { transform: `translate(${knob.x}px, ${knob.y}px)` } : undefined} />
      </div>
      <div className="dg-btns">
        <button className="swap" onPointerDown={() => { input.current.swap = true; }}>TROCA</button>
        <button onPointerDown={() => { input.current.dodge = true; }} onPointerUp={() => { input.current.dodge = false; }}>ESQUIVA</button>
        <button className="fire" onPointerDown={() => { input.current.attack = true; }} onPointerUp={() => { input.current.attack = false; }} onPointerLeave={() => { input.current.attack = false; }}>ATAQUE</button>
      </div>
    </>
  );
}

// ─── desenho ────────────────────────────────────────────────────────────────

/** O que não muda dentro da sala (piso, paredes, grades, pedras) fica pronto num canvas. */
const still = { key: '', cv: null as HTMLCanvasElement | null };
function roomLayer(run: Run, a: Art): HTMLCanvasElement {
  const room = run.d.rooms[run.room], open = run.cleared[run.room];
  const key = `${run.seed}|${run.floor}|${run.room}|${open}|${!!a.floor}|${!!a.wall}|${!!a.rock}`;
  if (still.cv && still.key === key) return still.cv;
  const cv = still.cv ?? document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = a.floor ?? '#5a4a3a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = RANK_TINT[Math.min(5, run.rank)]; ctx.fillRect(0, 0, W, H);
  for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    if (!solidAt(room, tx, ty, open, []) || (tx > 0 && ty > 0 && tx < RW - 1 && ty < RH - 1)) continue;
    if (ty === 0 && a.wall) { ctx.drawImage(a.wall, (tx * T) % a.wall.width, a.wall.height - T, T, T, tx * T, 0, T, T); ctx.fillStyle = RANK_TINT[Math.min(5, run.rank)]; ctx.fillRect(tx * T, 0, T, T); }
    else { ctx.fillStyle = '#1e1628'; ctx.fillRect(tx * T, ty * T, T, T); ctx.fillStyle = '#2e2240'; ctx.fillRect(tx * T + 2, ty * T + 2, T - 4, T - 6); }
  }
  // portas trancadas: barras de energia azul (portão de Solo Leveling)
  if (!open) for (const s of room.doors) {
    const [dx, dy] = doorTile(s), horiz = s === 'n' || s === 's';
    for (let k = -1; k <= 1; k++) {
      const x = (horiz ? dx + k : dx) * T, y = (horiz ? dy : dy + k) * T;
      ctx.fillStyle = 'rgba(20,40,90,.7)'; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#5ab8ff';
      for (let b = 0; b < 4; b++) { if (horiz) ctx.fillRect(x + 3 + b * 8, y + 2, 2, T - 4); else ctx.fillRect(x + 2, y + 3 + b * 8, T - 4, 2); }
    }
  }
  // pedregulhos fixos (cobertura contra tiros)
  for (const [x, y] of room.rocks) {
    const X = x * T + 16, Y = y * T + 18;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(X, Y + 9, 15, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2e2838'; ctx.beginPath(); ctx.ellipse(X, Y + 2, 15, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4e4660'; ctx.beginPath(); ctx.ellipse(X - 1, Y - 1, 13, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6e6684'; ctx.beginPath(); ctx.ellipse(X - 4, Y - 5, 6, 4, -0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#2e2838'; ctx.fillRect(X + 2, Y - 2, 6, 2); ctx.fillRect(X + 6, Y, 2, 4);
  }
  still.key = key; still.cv = cv;
  return cv;
}

const BREAK_COLOR: Record<string, [string, string]> = { pedra: ['#6a6478', '#8a8498'], minerio: ['#6a6478', '#e8884a'], erva: ['#2e7a3a', '#5ac85a'], barril: ['#7a4a22', '#a0703a'], cristal: ['#2a4a8a', '#7ab8ff'] };

function draw(ctx: CanvasRenderingContext2D, run: Run, a: Art, now: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(roomLayer(run, a), 0, 0);
  const room = run.d.rooms[run.room], CX = Math.floor(RW / 2), CY = Math.floor(RH / 2);

  // coisas que quebram (pedra, veio, erva, barril, cristal)
  for (const b of run.breaks[run.room]) {
    if (b.hp <= 0) continue;
    const [c1, c2] = BREAK_COLOR[b.kind], x = b.x * T, y = b.y * T;
    if (b.kind === 'erva') { ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(x + 16, y + 18, 11, 0, 7); ctx.fill(); ctx.fillStyle = c2; for (const [ox, oy] of [[-5, -3], [4, -5], [0, 3]]) { ctx.beginPath(); ctx.arc(x + 16 + ox, y + 16 + oy, 5, 0, 7); ctx.fill(); } ctx.fillStyle = '#ff5a6a'; ctx.fillRect(x + 12, y + 12, 3, 3); continue; }
    if (b.kind === 'barril') { ctx.fillStyle = c1; ctx.fillRect(x + 6, y + 4, 20, 26); ctx.fillStyle = c2; ctx.fillRect(x + 8, y + 6, 16, 22); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 6, y + 10, 20, 2); ctx.fillRect(x + 6, y + 22, 20, 2); continue; }
    if (b.kind === 'cristal') { ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x + 16, y + 2); ctx.lineTo(x + 26, y + 18); ctx.lineTo(x + 16, y + 30); ctx.lineTo(x + 6, y + 18); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x + 16, y + 6); ctx.lineTo(x + 21, y + 17); ctx.lineTo(x + 16, y + 24); ctx.fill(); continue; }
    ctx.fillStyle = '#3a3248'; ctx.beginPath(); ctx.ellipse(x + 16, y + 20, 14, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(x + 16, y + 17, 12, 10, 0, 0, 7); ctx.fill();
    if (b.kind === 'minerio') { ctx.fillStyle = c2; for (const [ox, oy] of [[-5, -2], [4, 1], [-1, 5]]) ctx.fillRect(x + 15 + ox, y + 15 + oy, 4, 4); }
    else { ctx.fillStyle = c2; ctx.fillRect(x + 9, y + 11, 7, 3); }
  }
  // baú, escada, loja e armas no chão
  if (room.kind === 'tesouro' && a.chest) { ctx.globalAlpha = run.chests.includes(run.room) ? 0.55 : 1; ctx.drawImage(a.chest, CX * T - 4, CY * T - 6, 40, 34); ctx.globalAlpha = 1; }
  if (room.kind === 'fim') {
    const on = run.cleared[run.room], pulse = 0.5 + 0.5 * Math.sin(now / 250);
    ctx.fillStyle = '#0a0612'; ctx.fillRect(CX * T, CY * T, T, T);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = `rgb(${60 - k * 12},${50 - k * 10},${80 - k * 14})`; ctx.fillRect(CX * T + 2, CY * T + 2 + k * 7, T - 4, 5); }
    if (on) { ctx.strokeStyle = `rgba(90,184,255,${0.4 + pulse * 0.6})`; ctx.lineWidth = 2; ctx.strokeRect(CX * T - 2, CY * T - 2, T + 4, T + 4); }
  }
  for (const x of run.pickups) {
    if (x.room !== run.room) continue;
    const bought = run.bought.includes(x.id);
    if (x.kind === 'loja') {
      ctx.fillStyle = '#4a4058'; ctx.fillRect(x.x * T - 12, x.y * T - 4, 24, 14); ctx.fillStyle = '#6a6080'; ctx.fillRect(x.x * T - 10, x.y * T - 6, 20, 4);
      if (!bought) {
        const icon = a.icons.get(x.what === 'vida' ? 'vida' : x.what === 'mana' ? 'mana' : 'moeda');
        if (x.what === 'arma') { ctx.fillStyle = '#e8f0f8'; ctx.fillRect(x.x * T - 1, x.y * T - 22, 3, 16); ctx.fillStyle = '#c8a040'; ctx.fillRect(x.x * T - 5, x.y * T - 8, 11, 2); }
        else if (icon?.complete) ctx.drawImage(icon, x.x * T - 9, x.y * T - 22, 18, 18);
        label(ctx, `${x.price}`, x.x * T, x.y * T + 22, '#ffd84a');
      }
    } else if (x.weapon) {
      const bob = Math.sin(now / 300) * 2, w = weapon(x.weapon);
      ctx.save(); ctx.translate(x.x * T, x.y * T + bob); ctx.rotate(-0.6);
      ctx.fillStyle = w.kind === 'curta' ? '#e8f0f8' : '#5a6a8a'; ctx.fillRect(-2, -14, 4, 20); ctx.fillStyle = '#c8a040'; ctx.fillRect(-6, 4, 12, 2);
      ctx.restore();
      label(ctx, w.name, x.x * T, x.y * T + 22, '#bfe8ff');
    }
  }
  // itens no chão
  for (const l of run.loot) {
    const img = a.icons.get(l.item), bob = Math.sin(now / 220 + l.id) * 2;
    if (img?.complete && img.naturalWidth) ctx.drawImage(img, l.x * T - 8, l.y * T - 10 + bob, 16, 16);
    else { ctx.fillStyle = l.item === 'moeda' ? '#ffd84a' : '#7ab8ff'; ctx.beginPath(); ctx.arc(l.x * T, l.y * T + bob, 4, 0, 7); ctx.fill(); }
  }
  // avisos no chão: o golpe vem quando o vermelho enche
  for (const w of run.warns) {
    const k = 1 - w.t / w.total;
    ctx.save();
    ctx.fillStyle = `rgba(255,40,60,${0.12 + k * 0.28})`; ctx.strokeStyle = `rgba(255,80,90,${0.5 + k * 0.5})`; ctx.lineWidth = 2;
    if (w.kind === 'circle') {
      ctx.beginPath(); ctx.arc(w.x * T, w.y * T, w.r * T, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = `rgba(255,60,70,${0.35})`; ctx.beginPath(); ctx.arc(w.x * T, w.y * T, w.r * T * k, 0, 7); ctx.fill();
    } else {
      const ang = Math.atan2(w.y2 - w.y, w.x2 - w.x), len = Math.hypot(w.x2 - w.x, w.y2 - w.y) * T, wd = Math.max(4, w.r * 2 * T);
      ctx.translate(w.x * T, w.y * T); ctx.rotate(ang);
      ctx.fillRect(0, -wd / 2, len, wd); ctx.strokeRect(0, -wd / 2, len, wd);
      ctx.fillStyle = 'rgba(255,60,70,.35)'; ctx.fillRect(0, -wd / 2, len * k, wd);
    }
    ctx.restore();
  }

  // corpos, de trás para a frente
  const bodies: { y: number; f: () => void }[] = [];
  const p = run.p;
  for (const e of run.enemies) bodies.push({ y: e.y, f: () => {
    const fr = e.kind === 'chefe' ? a.boss : a.mobs[e.kind];
    const dir: Dir = Math.abs(p.x - e.x) > Math.abs(p.y - e.y) ? (p.x > e.x ? 'east' : 'west') : (p.y > e.y ? 'south' : 'north');
    const step = e.stun > 0 || e.state === 'wind' ? 0 : Math.floor(now / 150) % 4;
    const big = e.kind === 'chefe' ? 1.6 : e.kind === 'golem' ? 1.4 : e.kind === 'slimeP' ? 0.7 : 1.05;
    const shake = e.state === 'wind' ? Math.sin(now / 25) * 1.5 : 0;
    const hop = (e.kind === 'slime' || e.kind === 'slimeP') && (e.t % 1.2) < 0.45 ? -Math.sin(((e.t % 1.2) / 0.45) * Math.PI) * 8 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T + 2, ENEMY[e.kind].r * T, ENEMY[e.kind].r * T * 0.4, 0, 0, 7); ctx.fill();
    ctx.save();
    if (e.hit > 0) ctx.filter = 'brightness(2.2)';
    else if (e.freeze > 0) ctx.filter = 'hue-rotate(180deg) saturate(1.6)';
    else if (!a.gpt[e.kind] && e.kind !== 'chefe' && e.kind !== 'morcego' && e.kind !== 'slime' && e.kind !== 'slimeP') ctx.filter = e.kind === 'lobo' ? 'brightness(.6) hue-rotate(220deg)' : e.kind === 'golem' ? 'grayscale(.6)' : 'hue-rotate(60deg) saturate(1.4)';
    const g = a.gpt[e.kind];
    if (g) { const img = e.state !== 'move' ? g.atk[dir][Math.floor(now / 160) % g.atk[dir].length] : g.walk[dir][step]; const gb = e.kind === 'slimeP' ? 0.7 : 1.4; ctx.drawImage(img, e.x * T - (img.width * gb) / 2 + shake, e.y * T - img.height * gb * 0.9 + hop, img.width * gb, img.height * gb); }
    else if (fr) { const img = fr.walk[dir][step]; ctx.drawImage(img, e.x * T - (img.width * big) / 2 + shake, e.y * T - img.height * big * 0.85 + hop, img.width * big, img.height * big); }
    else { ctx.fillStyle = '#9a4ac8'; ctx.beginPath(); ctx.arc(e.x * T, e.y * T - 8, ENEMY[e.kind].r * T, 0, 7); ctx.fill(); }
    ctx.restore();
    if (e.burn > 0 && Math.floor(now / 120) % 2) { ctx.fillStyle = '#ff8a2a'; ctx.fillRect(e.x * T - 3, e.y * T - 30, 6, 6); }
    if (e.stun > 0) { ctx.fillStyle = '#ffe03a'; for (let k = 0; k < 3; k++) { const ang = now / 200 + k * 2.1; ctx.fillRect(e.x * T + Math.cos(ang) * 10 - 2, e.y * T - 34 + Math.sin(ang) * 3, 4, 4); } }
    if (e.kind !== 'chefe' && e.hp < e.max) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x * T - 12, e.y * T + 6, 24, 4); ctx.fillStyle = '#ff5a6a'; ctx.fillRect(e.x * T - 11, e.y * T + 7, 22 * Math.max(0, e.hp / e.max), 2); }
  } });
  // sombras do Arise: o boneco do aluno em azul-escuro
  for (const al of run.allies) bodies.push({ y: al.y, f: () => {
    const fr = a.player; if (!fr) return;
    const img = fr.walk.south[Math.floor(now / 160) % 4];
    ctx.save(); ctx.globalAlpha = 0.85; ctx.filter = 'brightness(.35) sepia(1) hue-rotate(200deg) saturate(3)';
    ctx.drawImage(img, al.x * T - img.width / 2, al.y * T - img.height * 0.9, img.width, img.height);
    ctx.restore();
    ctx.fillStyle = '#c87aff'; ctx.fillRect(al.x * T - 5, al.y * T - img.height * 0.62, 3, 2); ctx.fillRect(al.x * T + 2, al.y * T - img.height * 0.62, 3, 2);
  } });
  // pet
  bodies.push({ y: run.pet.y, f: () => {
    const fr = a.pet; if (!fr) return;
    const pet = run.pet, moving = Math.hypot(pet.x - p.x, pet.y - p.y) > 1;
    const img = fr.walk[pet.x > p.x + 0.3 ? 'west' : pet.x < p.x - 0.3 ? 'east' : 'south'][moving ? Math.floor(now / 130) % 4 : 0];
    ctx.drawImage(img, pet.x * T - img.width / 2, pet.y * T - img.height * 0.85, img.width, img.height);
  } });
  // jogador: andar, rolar na esquiva, golpe e arma na mão
  bodies.push({ y: p.y, f: () => {
    if (p.inv > 0 && p.dash <= 0 && Math.floor(now / 70) % 2) return;
    const fr = a.player, moving = Math.hypot(p.dx, p.dy) > 0.1;
    const img = fr?.walk[DIR[p.face]][p.dash > 0 ? 1 : moving ? Math.floor(now / 130) % 4 : 0];
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x * T, p.y * T + 2, 10, 4, 0, 0, 7); ctx.fill();
    if (!img) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(p.x * T, p.y * T, 10, 0, 7); ctx.fill(); return; }
    ctx.save();
    ctx.translate(p.x * T, p.y * T - img.height * 0.4);
    if (p.dash > 0) { ctx.rotate(((p.face === 'w' ? -1 : 1) * (1 - p.dash / 0.17)) * Math.PI * 2); ctx.globalAlpha = 0.85; }
    ctx.drawImage(img, -img.width / 2, -img.height * 0.5, img.width, img.height);
    ctx.restore();
    // arma: espada atrás no ombro (ou balançando no golpe); arma longa apontando
    const w = weapon(p.arms[p.hand].id);
    const tgt = run.enemies.reduce<{ e: typeof run.enemies[number] | null; d: number }>((best, e) => { const d = Math.hypot(e.x - p.x, e.y - p.y); return d < best.d ? { e, d } : best; }, { e: null, d: 9 }).e;
    const ang = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : Math.atan2(p.dy, p.dx);
    ctx.save();
    ctx.translate(p.x * T, p.y * T - 14);
    if (w.kind === 'curta') {
      const swing = p.swing > 0 ? (1 - p.swing / 0.18) * (w.arc ?? 1.6) - (w.arc ?? 1.6) / 2 : -0.9;
      ctx.rotate(ang + swing + Math.PI / 2);
      ctx.fillStyle = w.id === 'foice' ? '#a87aff' : '#e8f0f8'; ctx.fillRect(-2, -8 - w.range * 9, 4, w.range * 9);
      ctx.fillStyle = '#c8a040'; ctx.fillRect(-6, -8, 12, 3); ctx.fillStyle = '#6a3a20'; ctx.fillRect(-1.5, -5, 3, 7);
    } else {
      const kick = p.atk > w.cd - 0.06 ? -3 : 0;
      ctx.rotate(ang);
      ctx.fillStyle = '#3a3a4a'; ctx.fillRect(4 + kick, -3, 16, 6); ctx.fillStyle = '#7ae8ff'; ctx.fillRect(18 + kick, -2, 3, 4);
    }
    ctx.restore();
  } });
  bodies.sort((x, y) => x.y - y.y).forEach(b => b.f());

  // tiros
  for (const s of run.shots) {
    const X = s.x * T, Y = s.y * T;
    if (s.kind === 'carta') {
      const [c1, c2] = EL_COLOR[(s.el ?? 'Fire') as keyof typeof EL_COLOR];
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(X, Y, 9, 0, 7); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(X, Y, 4, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.4; ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(X - s.vx * 1.6, Y - s.vy * 1.6, 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    } else if (s.kind === 'flecha') {
      const ang = Math.atan2(s.vy, s.vx);
      ctx.save(); ctx.translate(X, Y); ctx.rotate(ang); ctx.fillStyle = s.mine ? '#e8d0a0' : '#ff8a5a'; ctx.fillRect(-8, -1, 14, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(5, -2, 4, 4); ctx.restore();
    } else {
      ctx.fillStyle = s.mine ? (s.kind === 'magia' ? '#ff7ad8' : '#fff3a0') : '#ff5ad8';
      ctx.beginPath(); ctx.arc(X, Y, s.mine ? 4 : 6, 0, 7); ctx.fill();
      ctx.fillStyle = s.mine ? '#ffb83a' : '#8a1a6a'; ctx.beginPath(); ctx.arc(X, Y, s.mine ? 2 : 3, 0, 7); ctx.fill();
    }
  }
  // dica de pegar
  const near = run.pickups.find(x => x.room === run.room && !run.bought.includes(x.id) && Math.hypot(x.x - p.x, x.y - p.y) < 0.9);
  if (near) label(ctx, near.kind === 'loja' ? `E: comprar (${near.price})` : 'E: trocar de arma', p.x * T, p.y * T - 48, '#ffffff');
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = "8px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
  ctx.lineWidth = 3; ctx.strokeStyle = '#120a1a'; ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y);
}

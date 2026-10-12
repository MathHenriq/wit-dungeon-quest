// Masmorra (src/game/dungeon.ts): o portal de um rank, do começo ao chefe do
// 5º andar. Teclado: WASD/setas andam · J ou clique ataca (toque = combo;
// segurar e soltar = golpe pesado; logo depois da esquiva = investida) ·
// K/ESPAÇO esquiva (no último instante = esquiva perfeita) · Q troca espada ↔
// arma longa · E pega/compra · 1–4 cartas (segure as que carregam) · L
// habilidade do Caminho · ESC sai. Toque: alavanca à esquerda; ATAQUE (segure
// = pesado), ESQUIVA, TROCA, CAMINHO e as cartas à direita. Arte PROVISÓRIA
// (pets e desafiantes como monstros) até a do GPT (docs/gpt-masmorra.md).
import { useEffect, useRef, useState } from 'react';
import {
  BUFFS, CLASS_SKILL, chooseBuff, CX, CY, doorTile, ELITE_NAME, ENEMY, FLOORS, GRID, isBoss, LOOT_CATS, NO_INPUT, petCap, RH, RW,
  SHOP_NAME, solidAt, spikeState, startRun, stepRun,
  type BuffId, type Enemy, type EnemyKind, type Grade, type Input, type LootCat, type Run, type Side,
} from '@/game/dungeon';
import { weapon } from '@/game/dungeon-weapons';
import { finishPortal, portalRun, rankName, type PortalMode, type PortalPrize } from '@/game/hunter';
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
import { colorsOf, drawActs, drawCine, drawFx, drawStatus, EL_COLOR, fxFrom, type Fx } from './dungeon-vfx';
import './dungeon.css';

const T = 32;
const W = RW * T, H = RH * T;
const DIR: Record<Side, Dir> = { n: 'north', s: 'south', e: 'east', w: 'west' };
/** Monstros provisórios (pets) até a arte do GPT. */
const MOB_SPRITE: Partial<Record<EnemyKind, string>> = {
  goblin: 'pet-filhote-lutador', arqueiro: 'pet-corujinha-vento', xama: 'pet-cogumelinho', slime: 'pet-sapinho-roxo', slimeP: 'pet-sapinho-roxo',
  morcego: 'pet-morcego-noite', lobo: 'pet-gato-sombra', golem: 'pet-tatu-rocha', escudeiro: 'pet-canguru-boxe', bombardeiro: 'pet-furao-faisca',
  mago: 'pet-polvo-bebe', invocador: 'pet-lagartinha-neon', cavador: 'pet-toupeira-pedra', espirito: 'pet-fantasminha', planta: 'pet-broto-tartaruga',
  minion: 'pet-sapinho-roxo',
};
/** Chefes provisórios (desafiantes pintados) e a cor de cada um. */
const BOSS_NPC: Partial<Record<EnemyKind, [string, string]>> = {
  reiGoblin: ['npc-desafiante-03', 'hue-rotate(60deg) saturate(1.3)'], guardiao: ['npc-desafiante-07', 'hue-rotate(240deg) brightness(.85)'],
  troll: ['npc-desafiante-05', 'hue-rotate(160deg) saturate(1.4)'], golemLava: ['npc-desafiante-09', 'sepia(1) saturate(4) hue-rotate(-20deg)'],
  espiritoFloresta: ['npc-desafiante-11', 'hue-rotate(80deg) saturate(1.6)'], monarca: ['npc-desafiante-12', 'brightness(.45) saturate(2) hue-rotate(220deg)'],
};
/** Arte do GPT (public/game/masmorra/inimigos): nome do arquivo por tipo. */
const GPT_MOB: Partial<Record<EnemyKind, string>> = {
  goblin: 'goblin', arqueiro: 'goblin-arqueiro', xama: 'goblin-xama', slime: 'slime', slimeP: 'slime', morcego: 'morcego', lobo: 'lobo-sombrio', golem: 'golem',
  escudeiro: 'goblin-escudeiro', bombardeiro: 'goblin-bombardeiro', mago: 'goblin-mago', invocador: 'invocador', cavador: 'toupeira-cavadora', espirito: 'espirito', planta: 'planta-torreta', minion: 'slime',
  reiGoblin: 'chefe-e', guardiao: 'chefe-d', troll: 'chefe-c', golemLava: 'chefe-b', espiritoFloresta: 'chefe-a', monarca: 'chefe-s',
};
/** Cor do chão de cada rank (E cinza, D roxo, C gelo, B lava, A floresta, S sombras). */
const RANK_TINT = ['rgba(60,60,70,.25)', 'rgba(90,40,120,.3)', 'rgba(60,150,200,.28)', 'rgba(160,50,20,.3)', 'rgba(30,110,50,.3)', 'rgba(20,0,40,.45)'];
const CAT_ICON: Record<LootCat, string> = { minerio: 'rubi', erva: 'folha', cristal: 'cristal', trofeu: 'pena' };
const CAT_NAME: Record<LootCat, string> = { minerio: 'minério', erva: 'ervas', cristal: 'cristais', trofeu: 'troféus' };
const ELITE_COLOR: Record<string, string> = { veloz: '#7affd8', blindado: '#c8d8e8', explosivo: '#ff7a2a', vampiro: '#ff3a6a', gemeo: '#ffd84a', refletor: '#8ad0ff', gelado: '#bff0ff', venenoso: '#b07aff', fantasma: '#e0d0ff' };
const GRADE_COLOR: Record<Grade, string> = { S: '#ffd84a', A: '#7aff9a', B: '#8ad0ff', C: '#c8c0d8' };

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
  player: Frames | null; pet: Frames | null; mobs: Partial<Record<EnemyKind, Frames>>; gpt: Partial<Record<EnemyKind, Grid>>; icons: Map<string, HTMLImageElement>;
}

export function DungeonView({ look, rank, mode = {}, onClose }: { look: Look; rank: number; mode?: PortalMode; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pet = look.pet ?? DEFAULT_PET;
  const [seed, setSeed] = useState(() => Date.now() % 1e9);
  const run = useRef<Run>(null as unknown as Run);
  /** Progresso a gravar fora do render (as poções levadas saem da mochila). */
  const pending = useRef<ReturnType<typeof loadProgress> | null>(null);
  const begin = (s: number) => {
    const r = portalRun(loadProgress(), rank, s, pet, mode);
    pending.current = r.progress;
    return startRun(r.options);
  };
  if (!run.current) run.current = begin(seed);
  useEffect(() => { if (pending.current) { saveProgress(pending.current); pending.current = null; } }, [seed]);
  const input = useRef<Input>({ ...NO_INPUT });
  const art = useRef<Art>({ floor: null, wall: null, rock: null, chest: null, stairs: null, player: null, pet: null, mobs: {}, gpt: {}, icons: new Map() });
  const fx = useRef<Fx[]>([]);
  const shake = useRef(0);
  const [hud, setHud] = useState(() => snapshot(run.current));
  const [prize, setPrize] = useState<PortalPrize | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
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
    for (const [k, [id]] of Object.entries(BOSS_NPC)) loadNpcFrames(id).then(f => { if (alive) art.current.mobs[k as EnemyKind] = f; }).catch(() => undefined);
    // arte do GPT, se já foi importada (scripts/arte/importar-masmorra.py)
    for (const [k, f] of Object.entries(GPT_MOB)) void loadGrid(`/game/masmorra/inimigos/${f}.png`, 4, f.startsWith('chefe-') ? 3 : 4).then(g => { if (alive && g) art.current.gpt[k as EnemyKind] = g; });
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
      const held = ['1', '2', '3', '4'].find(k => keys.has(k));
      i.held = held ? Number(held) - 1 : undefined;
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') return closeRef.current();
      if (e.repeat) { if (k === ' ' || k.startsWith('arrow')) e.preventDefault(); return; }
      if (k === 'q') input.current.swap = true;
      if (k === 'e') input.current.use = true;
      if (k === 'l') input.current.classe = true;
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
        input.current.swap = false; input.current.use = false; input.current.skill = undefined; input.current.classe = false;
        sounds(r);
        shake.current = Math.max(shake.current, fxFrom(r.ev, fx.current));
        for (const e of r.ev) {
          if (e.k === 'full') setToast(`O pet está cheio de ${CAT_NAME[e.cat]}!`);
          if (e.k === 'weapon') setToast(`Pegou: ${weapon(e.id).name}`);
          if (e.k === 'phase') setToast(e.phase === 2 ? '[SISTEMA] O chefe ficou mais forte!' : '[SISTEMA] Última fase do chefe!');
          if (e.k === 'enrage') setToast('[SISTEMA] O chefe está FURIOSO!');
          if (e.k === 'wave') setToast('Mais monstros!');
          if (e.k === 'potion') setToast(e.what === 'vida' ? 'Bebeu a Poção de Vida!' : 'Bebeu a Poção de Mana!');
          if (e.k === 'segredo') setToast('[SISTEMA] Passagem secreta!');
          if (e.k === 'reviveu') setToast('[SISTEMA] A Pedra da Ressurreição te trouxe de volta!');
          if (e.k === 'msg') setToast(e.text);
          if (e.k === 'classe') setToast(CLASS_SKILL[e.id].name);
          if (e.k === 'semcarta') setToast('Selado: as cartas não saem agora!');
          if (e.k === 'grade') setGrade(e.g);
          if (e.k === 'buy' && e.what.startsWith('estatua:')) setToast(`Bênção: ${BUFFS.find(b => b.id === e.what.slice(8))?.name ?? ''}`);
        }
      }
      run.current = r;
      if (import.meta.env.DEV) {
        // scripts de teste (scripts/mapa/masmorra-robo.mjs): ler e mexer na partida
        const w = window as unknown as { __dungeon: Run; __dungeonEdit: (f: (x: Run) => Run) => void };
        w.__dungeon = r; w.__dungeonEdit = f => { run.current = f(run.current); };
      }
      const ctx = canvas.current?.getContext('2d') ?? null;
      if (ctx) {
        const sh = shake.current;
        shake.current = Math.max(0, sh - dt * 30);
        ctx.save();
        if (sh > 0.3) ctx.translate((Math.random() - 0.5) * sh * 2, (Math.random() - 0.5) * sh * 2);
        // cena: a câmera chega perto de quem soltou a carta
        if (r.cine) { const k = 1 - r.cine.t / r.cine.total, z = 1 + 0.18 * Math.min(1, k * 2.5), cx = r.cine.x * T, cy = r.cine.y * T; ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); }
        draw(ctx, r, art.current, now);
        fx.current = drawFx(ctx, fx.current, Math.min(dt, 0.1), T);
        ctx.restore();
        if (r.cine) drawCine(ctx, r, now, W, H, T, CARD_BY_ID.get(r.cine.card)?.name ?? '');
        if (r.slow > 0) { ctx.fillStyle = `rgba(40,90,255,${0.18 * Math.min(1, r.slow * 3)})`; ctx.fillRect(0, 0, W, H); }
      }
      if (now - hudAt > 90 || r.result || r.choice) { hudAt = now; setHud(snapshot(r)); }
      if (!r.result) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [seed]);

  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 1800); return () => window.clearTimeout(t); }, [toast]);
  useEffect(() => { if (!grade) return; const t = window.setTimeout(() => setGrade(null), 1400); return () => window.clearTimeout(t); }, [grade]);

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
  const cls = CLASS_SKILL[p.classe];
  return (
    <div className="dg-wrap">
      <div className="dg-top">
        <div className="dg-bars">
          <div className="dg-hp">{Array.from({ length: hud.max }, (_, k) => <Icon key={k} id={k < hud.hp ? 'coracao' : 'coracao-partido'} size={18} />)}{hud.revive > 0 && <span className="dg-stone" title="Pedra da Ressurreição">{hud.revive}</span>}</div>
          <div className="dg-armor">{Array.from({ length: hud.armorMax }, (_, k) => <i key={k} className={k < hud.armor ? 'on' : ''} />)}{hud.extra > 0 && Array.from({ length: hud.extra }, (_, k) => <i key={`x${k}`} className="extra" />)}</div>
          <div className="dg-mana" title="Mana (a arma longa gasta)"><i style={{ width: `${(hud.mana / hud.manaMax) * 100}%` }} /><span>{Math.floor(hud.mana)}</span></div>
        </div>
        <div className="dg-title">
          <b>PORTAL {rankName(rank)}{mode.pesadelo ? ' · PESADELO' : mode.semana ? ' · DA SEMANA' : ''}</b> · ANDAR {hud.floor}/{FLOORS}
          <span className="dg-gold"><Icon id="moeda" size={14} /> {hud.gold}</span>
          {hud.combo >= 3 && <span className="dg-combo" style={{ color: hud.combo >= 25 ? '#ffd84a' : hud.combo >= 15 ? '#7aff9a' : '#8ad0ff' }}>{hud.combo} ACERTOS</span>}
        </div>
        <div className="dg-map" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
          {Array.from({ length: GRID * GRID }, (_, k) => {
            const i = d.rooms.findIndex(r => r.gx === k % GRID && r.gy === Math.floor(k / GRID));
            const seen = i >= 0 && hud.seen[i];
            const kind = i >= 0 ? d.rooms[i].kind : '';
            const cls2 = i < 0 || !seen ? '' : i === hud.room ? 'here' : kind === 'chefe' || kind === 'fim' || kind === 'elite' ? 'boss' : kind === 'tesouro' || kind === 'secreta' ? 'gold' : kind === 'loja' || kind === 'mercador' || kind === 'estatua' ? 'shop' : kind === 'desafio' ? 'red' : hud.cleared[i] ? 'done' : 'seen';
            return <i key={k} className={cls2} />;
          })}
        </div>
        <button className="dg-exit" onClick={onClose}>SAIR</button>
      </div>
      <div className="dg-stage">
        <canvas ref={canvas} width={W} height={H} className="dg-canvas" />
        {toast && <div className="dg-toast">{toast}</div>}
        {grade && <div className="dg-grade" style={{ color: GRADE_COLOR[grade] }}>{grade}<small>NOTA DA SALA</small></div>}
        {hud.boss && (
          <div className="dg-boss">
            <span>{hud.boss.name}{hud.boss.enraged ? ' · FURIOSO' : ''} · FASE {hud.boss.phase}{hud.boss.shield ? ` · ${hud.boss.shieldLabel}` : ''}</span>
            <i style={{ width: `${hud.boss.hp * 100}%` }} />
            <em style={{ width: `${hud.boss.poise * 100}%` }} className={hud.boss.broken ? 'broken' : ''} />
          </div>
        )}
      </div>
      <div className="dg-bottom">
        <div className="dg-arms">
          {p.arms.map((a, k) => (
            <button key={k} className={`dg-arm ${hud.hand === k ? 'on' : ''}`} onClick={() => { input.current.swap = hud.hand !== k; }}>
              <WeaponIcon id={a.id} /><span>{weapon(a.id).name}{a.lvl ? ` +${a.lvl}` : ''}</span><small>{k === 0 ? (hud.heavy > 0 ? `PESADO ${Math.round(hud.heavy * 100)}%` : 'CURTA') : weapon(a.id).mana ? `${weapon(a.id).mana} mana` : 'LONGA'}</small>
            </button>
          ))}
        </div>
        <div className="dg-skills">
          {p.skills.map((s, k) => (
            <button key={s.card} className="dg-skill" style={{ ['--el' as string]: colorsOf(s.card, s.element)[0] }}
              onPointerDown={e => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); input.current.skill = k; input.current.held = k; }}
              onPointerUp={() => { input.current.held = undefined; }} onPointerCancel={() => { input.current.held = undefined; }}
              title={`${s.name}: ${s.kit.about}`}>
              <img src={cardArtUrl(s.card.replace(/\+$/, ''))} alt="" draggable={false} />
              {hud.cds[k] > 0 && <i className="cd" style={{ height: `${(hud.cds[k] / s.cd) * 100}%` }}><b>{Math.ceil(hud.cds[k])}</b></i>}
              {hud.charge && hud.charge.slot === k && <i className="charge" style={{ width: `${Math.min(1, hud.charge.t / hud.charge.max) * 100}%` }} />}
              {s.lvl > 0 && <em className="lvl">{'★'.repeat(s.lvl)}</em>}
              <kbd>{k + 1}</kbd>
            </button>
          ))}
          <button className="dg-skill dg-class" title={`${cls.name}: ${cls.about}`} onPointerDown={() => { input.current.classe = true; }}>
            <b>{cls.name.split(' ')[0].toUpperCase()}</b>
            {hud.classCd > 0 && <i className="cd" style={{ height: `${(hud.classCd / p.classMax) * 100}%` }}><b>{Math.ceil(hud.classCd)}</b></i>}
            <kbd>L</kbd>
          </button>
          {!p.skills.length && <div className="dg-noskill">Sem cartas: escolha no SISTEMA da Associação</div>}
        </div>
        <div className="dg-pet" title="Mochila do pet">
          {LOOT_CATS.map(c => <span key={c} className={hud.bag[c] >= petCap(pet, c) ? 'full' : ''}><Icon id={CAT_ICON[c]} size={14} />{hud.bag[c]}/{petCap(pet, c)}</span>)}
        </div>
      </div>
      {touch && <TouchPad input={input} />}
      {!touch && <div className="dg-help">WASD anda · J/clique ataca (toque = combo, segure = pesado) · K/ESPAÇO esquiva (no último instante = perfeita) · Q troca · E pega · 1–4 cartas · L {cls.name} · vermelho no chão = golpe vindo!</div>}

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
          <SystemWindow title={hud.result === 'win' ? 'PORTAL LIMPO' : 'VOCÊ CAIU'} sub={hud.result === 'win' ? `O chefe do portal ${rankName(rank)} foi derrotado.` : `Caiu no andar ${hud.floor}. O pet trouxe metade do que carregava.`} danger={hud.result !== 'win'}>
            {!prize && <div className="sys-line">Calculando a recompensa...</div>}
            {prize && <>
              <div className="sys-line">+{prize.xp} XP de caçador{prize.grade > 1.01 && <span> (nota ×{prize.grade.toFixed(2)})</span>}{prize.rankUp !== undefined && <b className="sys-up"> · SUBIU PARA O RANK {rankName(prize.rankUp)}!</b>}{prize.levelUp !== undefined && <b className="sys-up"> · NÍVEL {prize.levelUp}: ponto de status!</b>}</div>
              <div className="sys-line"><Icon id="moeda" size={14} /> {prize.paid ? `+${prize.coins} moedas` : 'Hoje os 3 portais pagos já foram: este valeu XP e itens.'}</div>
              {prize.abriu !== undefined && <div className="sys-line sys-up">[SISTEMA] O PORTAL {rankName(prize.abriu)} FOI ABERTO!</div>}
              {prize.maestria.map(m => <div key={m.card} className="sys-line sys-up">Maestria de {CARD_BY_ID.get(m.card)?.name}: nível {m.depois}</div>)}
              {prize.semana && <div className="sys-line">Portal da Semana: andar {prize.semana.andar > FLOORS ? 'CHEFE VENCIDO' : prize.semana.andar} em {Math.floor(prize.semana.tempo / 60)}min{prize.semana.recorde ? ' · NOVO RECORDE!' : ''}</div>}
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
  const boss = r.enemies.find(e => isBoss(e.kind));
  return {
    hp: r.p.hp, max: r.p.max, armor: r.p.armor, armorMax: r.p.armorMax, extra: r.p.boons.find(b => b.kind === 'escudo')?.v ?? 0, mana: r.p.mana, manaMax: r.p.manaMax, gold: r.gold,
    room: r.room, seen: r.seen, cleared: r.cleared, floor: r.floor, hand: r.p.hand, cds: r.p.skillCd, bag: { ...r.pet.bag }, revive: r.revive,
    combo: r.combo, classCd: r.p.classCd, charge: r.p.charge ? { ...r.p.charge } : undefined, heavy: r.p.heavy,
    boss: boss ? {
      name: ENEMY[boss.kind].name, hp: Math.max(0, boss.hp / boss.max), poise: boss.broken > 0 ? 1 : 1 - boss.poise / boss.poiseMax, broken: boss.broken > 0, phase: boss.phase, enraged: boss.enraged,
      shield: boss.shield > 0, shieldLabel: boss.kind === 'guardiao' ? `${boss.shield} LAMPIÕES ACESOS` : boss.kind === 'troll' ? 'ARMADURA DE GELO' : '',
    } : null,
    choice: r.choice, result: r.result,
  };
}

let lastSound = 0;
function sounds(r: Run) {
  const now = performance.now();
  for (const e of r.ev) {
    if (e.k === 'hurt') play('lose');
    else if (e.k === 'block') play('trap');
    else if (e.k === 'kill') play(isBoss(e.kind) ? 'win' : 'coin');
    else if (e.k === 'cast' && e.slot >= 0) play(e.skill?.ownVfx ? 'bigHit' : 'super');
    else if (e.k === 'cine' || e.k === 'perfeita' || e.k === 'postura' || e.k === 'reacao') play('bigHit');
    else if (e.k === 'room' || e.k === 'stairs' || e.k === 'cardflip') play('turn');
    else if (e.k === 'chest' || e.k === 'buy' || e.k === 'weapon' || e.k === 'segredo' || e.k === 'grade') play('super');
    else if ((e.k === 'swing' || e.k === 'shoot') && now - lastSound > 90) { lastSound = now; play(e.k === 'swing' ? 'flip' : 'draw'); }
    else if (e.k === 'hit' && e.crit) play('hit');
    else if (e.k === 'nomana' || e.k === 'semcarta') play('click');
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
        <div className="dg-btns-col">
          <button className="swap" onPointerDown={() => { input.current.swap = true; }}>TROCA</button>
          <button className="swap cls" onPointerDown={() => { input.current.classe = true; }}>CAMINHO</button>
        </div>
        <button onPointerDown={() => { input.current.dodge = true; }} onPointerUp={() => { input.current.dodge = false; }} onPointerLeave={() => { input.current.dodge = false; }}>ESQUIVA</button>
        <button className="fire" onPointerDown={() => { input.current.attack = true; }} onPointerUp={() => { input.current.attack = false; }} onPointerLeave={() => { input.current.attack = false; }}>ATAQUE<small>segure: pesado</small></button>
      </div>
    </>
  );
}

// ─── desenho ────────────────────────────────────────────────────────────────

/** O que não muda dentro da sala (piso, paredes, grades, pedras) fica pronto num canvas. */
const still = { key: '', cv: null as HTMLCanvasElement | null };
function roomLayer(run: Run, a: Art): HTMLCanvasElement {
  const room = run.d.rooms[run.room], open = run.cleared[run.room], cracked = run.cracked.includes(run.room);
  const key = `${run.seed}|${run.floor}|${run.room}|${open}|${cracked}|${!!a.floor}|${!!a.wall}|${!!a.rock}`;
  if (still.cv && still.key === key) return still.cv;
  const cv = still.cv ?? document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = a.floor ?? '#5a4a3a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = RANK_TINT[Math.min(5, run.rank)]; ctx.fillRect(0, 0, W, H);
  if (room.kind === 'desafio') { ctx.fillStyle = 'rgba(160,20,40,.18)'; ctx.fillRect(0, 0, W, H); }
  for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    if (!solidAt(room, tx, ty, open, [], cracked) || (tx > 0 && ty > 0 && tx < RW - 1 && ty < RH - 1)) continue;
    if (ty === 0 && a.wall) { ctx.drawImage(a.wall, (tx * T) % a.wall.width, a.wall.height - T, T, T, tx * T, 0, T, T); ctx.fillStyle = RANK_TINT[Math.min(5, run.rank)]; ctx.fillRect(tx * T, 0, T, T); }
    else { ctx.fillStyle = '#1e1628'; ctx.fillRect(tx * T, ty * T, T, T); ctx.fillStyle = '#2e2240'; ctx.fillRect(tx * T + 2, ty * T + 2, T - 4, T - 6); }
  }
  // parede rachada (sala secreta): rachaduras que dão para ver
  if (room.secret && !cracked) {
    const s = room.secret, [dx, dy] = doorTile(s);
    for (let k = -1; k <= 1; k++) {
      const x = (s === 'n' || s === 's' ? dx + k : dx) * T, y = (s === 'n' || s === 's' ? dy : dy + k) * T;
      ctx.strokeStyle = '#0a0612'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 6, y + 4); ctx.lineTo(x + 14, y + 14); ctx.lineTo(x + 10, y + 22); ctx.lineTo(x + 20, y + 28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 14, y + 14); ctx.lineTo(x + 24, y + 10); ctx.stroke();
    }
  }
  // portas trancadas: barras de energia (azul; vermelha no desafio)
  if (!open) for (const s of room.doors) {
    if (s === room.secret && !cracked) continue;
    const [dx, dy] = doorTile(s), horiz = s === 'n' || s === 's';
    for (let k = -1; k <= 1; k++) {
      const x = (horiz ? dx + k : dx) * T, y = (horiz ? dy : dy + k) * T;
      ctx.fillStyle = room.kind === 'desafio' ? 'rgba(90,20,30,.7)' : 'rgba(20,40,90,.7)'; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = room.kind === 'desafio' ? '#ff5a6a' : '#5ab8ff';
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

const BREAK_COLOR: Record<string, [string, string]> = { pedra: ['#6a6478', '#8a8498'], minerio: ['#6a6478', '#e8884a'], erva: ['#2e7a3a', '#5ac85a'], barril: ['#7a4a22', '#a0703a'], explosivo: ['#8a1a1a', '#e83a2a'], cristal: ['#2a4a8a', '#7ab8ff'], lampiao: ['#3a3048', '#ffd84a'], planta: ['#2e7a3a', '#5ac85a'] };

function drawHazards(ctx: CanvasRenderingContext2D, run: Run, now: number) {
  const room = run.d.rooms[run.room];
  for (const h of [...room.haz, ...run.trail]) {
    const x = h.x * T, y = h.y * T;
    if (h.kind === 'espinho') {
      const st = spikeState(h, run.t);
      ctx.fillStyle = '#2a2436'; ctx.fillRect(x + 3, y + 3, T - 6, T - 6);
      if (st === 'aviso') { ctx.fillStyle = `rgba(255,60,70,${0.35 + Math.sin(now / 40) * 0.2})`; ctx.fillRect(x + 3, y + 3, T - 6, T - 6); }
      ctx.fillStyle = st === 'alto' ? '#d8d8e8' : '#4a4458';
      for (const [ox, oy] of [[8, 9], [20, 9], [14, 18], [8, 24], [20, 24]]) { const hh = st === 'alto' ? 9 : 3; ctx.beginPath(); ctx.moveTo(x + ox - 3, y + oy + 3); ctx.lineTo(x + ox, y + oy + 3 - hh); ctx.lineTo(x + ox + 3, y + oy + 3); ctx.fill(); }
    } else if (h.kind === 'lava') {
      ctx.fillStyle = '#7a1a0a'; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = `rgba(255,${120 + Math.sin(now / 200 + h.x) * 40},40,.85)`; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + ((now / 30 + h.y * 7) % 24) + 3, y + 10, 4, 3);
    } else if (h.kind === 'veneno') {
      ctx.fillStyle = 'rgba(120,50,170,.55)'; ctx.beginPath(); ctx.ellipse(x + 16, y + 17, 14, 11, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8a0ff'; ctx.beginPath(); ctx.arc(x + 10 + ((now / 70) % 12), y + 14, 2, 0, 7); ctx.fill();
    } else if (h.kind === 'gelo') {
      ctx.fillStyle = 'rgba(190,240,255,.45)'; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x + 6, y + 8, 10, 2); ctx.fillRect(x + 16, y + 20, 8, 2);
    }
  }
}

function draw(ctx: CanvasRenderingContext2D, run: Run, a: Art, now: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(roomLayer(run, a), 0, 0);
  const room = run.d.rooms[run.room], p = run.p;
  const iceBoss = run.enemies.some(e => e.kind === 'troll');
  if (iceBoss) { ctx.fillStyle = 'rgba(190,240,255,.18)'; ctx.fillRect(T, T, W - 2 * T, H - 2 * T); }
  drawHazards(ctx, run, now);

  // coisas que quebram (pedra, veio, erva, barril, cristal, lampião)
  for (const b of run.breaks[run.room]) {
    if (b.hp <= 0) continue;
    const [c1, c2] = BREAK_COLOR[b.kind], x = b.x * T, y = b.y * T;
    if (b.kind === 'erva') { ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(x + 16, y + 18, 11, 0, 7); ctx.fill(); ctx.fillStyle = c2; for (const [ox, oy] of [[-5, -3], [4, -5], [0, 3]]) { ctx.beginPath(); ctx.arc(x + 16 + ox, y + 16 + oy, 5, 0, 7); ctx.fill(); } ctx.fillStyle = '#ff5a6a'; ctx.fillRect(x + 12, y + 12, 3, 3); continue; }
    if (b.kind === 'barril' || b.kind === 'explosivo') { ctx.fillStyle = c1; ctx.fillRect(x + 6, y + 4, 20, 26); ctx.fillStyle = c2; ctx.fillRect(x + 8, y + 6, 16, 22); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 6, y + 10, 20, 2); ctx.fillRect(x + 6, y + 22, 20, 2); if (b.kind === 'explosivo') { ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 13, y + 13, 6, 6); ctx.fillStyle = '#1a0a0a'; ctx.fillRect(x + 15, y + 14, 2, 3); ctx.fillRect(x + 15, y + 18, 2, 1); } continue; }
    if (b.kind === 'cristal') { ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x + 16, y + 2); ctx.lineTo(x + 26, y + 18); ctx.lineTo(x + 16, y + 30); ctx.lineTo(x + 6, y + 18); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x + 16, y + 6); ctx.lineTo(x + 21, y + 17); ctx.lineTo(x + 16, y + 24); ctx.fill(); continue; }
    if (b.kind === 'lampiao') {
      ctx.fillStyle = c1; ctx.fillRect(x + 12, y + 8, 8, 22); ctx.fillStyle = '#5a4a6a'; ctx.fillRect(x + 9, y + 2, 14, 8);
      ctx.fillStyle = c2; ctx.globalAlpha = 0.7 + Math.sin(now / 120 + b.x) * 0.3; ctx.fillRect(x + 11, y + 3, 10, 6); ctx.globalAlpha = 1;
      continue;
    }
    ctx.fillStyle = '#3a3248'; ctx.beginPath(); ctx.ellipse(x + 16, y + 20, 14, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(x + 16, y + 17, 12, 10, 0, 0, 7); ctx.fill();
    if (b.kind === 'minerio') { ctx.fillStyle = c2; for (const [ox, oy] of [[-5, -2], [4, 1], [-1, 5]]) ctx.fillRect(x + 15 + ox, y + 15 + oy, 4, 4); }
    else { ctx.fillStyle = c2; ctx.fillRect(x + 9, y + 11, 7, 3); }
  }
  // baú, escada, estátua, mercador, loja e armas no chão
  if (room.kind === 'tesouro' && a.chest) { ctx.globalAlpha = run.chests.includes(run.room) ? 0.55 : 1; ctx.drawImage(a.chest, CX * T - 4, CY * T - 6, 40, 34); ctx.globalAlpha = 1; }
  if ((room.kind === 'fim' || room.kind === 'elite') && run.cleared[run.room]) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 250);
    ctx.fillStyle = '#0a0612'; ctx.fillRect(CX * T, CY * T, T, T);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = `rgb(${60 - k * 12},${50 - k * 10},${80 - k * 14})`; ctx.fillRect(CX * T + 2, CY * T + 2 + k * 7, T - 4, 5); }
    ctx.strokeStyle = `rgba(90,184,255,${0.4 + pulse * 0.6})`; ctx.lineWidth = 2; ctx.strokeRect(CX * T - 2, CY * T - 2, T + 4, T + 4);
  }
  for (const x of run.pickups) {
    if (x.room !== run.room) continue;
    const bought = run.bought.includes(x.id);
    if (x.kind === 'estatua') {
      const X = x.x * T, Y = x.y * T;
      ctx.fillStyle = '#4a4458'; ctx.fillRect(X - 14, Y - 6, 28, 12); ctx.fillStyle = '#7a7488'; ctx.fillRect(X - 8, Y - 40, 16, 34); ctx.beginPath(); ctx.arc(X, Y - 44, 8, 0, 7); ctx.fill();
      if (!bought) { ctx.fillStyle = `rgba(138,208,255,${0.4 + Math.sin(now / 200) * 0.3})`; ctx.beginPath(); ctx.arc(X, Y - 44, 12, 0, 7); ctx.fill(); label(ctx, `${BUFFS.find(b => b.id === x.what)?.name ?? ''} · ${x.price}`, X, Y + 18, '#ffd84a'); }
      continue;
    }
    if (x.kind === 'loja' || x.kind === 'mercador') {
      ctx.fillStyle = x.kind === 'mercador' ? '#3a2a4a' : '#4a4058'; ctx.fillRect(x.x * T - 12, x.y * T - 4, 24, 14); ctx.fillStyle = '#6a6080'; ctx.fillRect(x.x * T - 10, x.y * T - 6, 20, 4);
      if (!bought) {
        const icon = a.icons.get(x.what === 'vida' ? 'vida' : x.what === 'mana' ? 'mana' : x.what === 'cristal' ? 'cristal:roxo' : 'moeda');
        if (x.what === 'arma' || x.what === 'afiar') { ctx.fillStyle = '#e8f0f8'; ctx.fillRect(x.x * T - 1, x.y * T - 22, 3, 16); ctx.fillStyle = '#c8a040'; ctx.fillRect(x.x * T - 5, x.y * T - 8, 11, 2); }
        else if (x.what === 'pedra') { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x.x * T, x.y * T - 14, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x.x * T - 1, x.y * T - 19, 2, 10); ctx.fillRect(x.x * T - 4, x.y * T - 16, 8, 2); }
        else if (icon?.complete) ctx.drawImage(icon, x.x * T - 9, x.y * T - 22, 18, 18);
        label(ctx, `${x.price}`, x.x * T, x.y * T + 22, '#ffd84a');
      }
      continue;
    }
    if (x.weapon) {
      const bob = Math.sin(now / 300) * 2, w = weapon(x.weapon);
      ctx.save(); ctx.translate(x.x * T, x.y * T + bob); ctx.rotate(-0.6);
      ctx.fillStyle = w.kind === 'curta' ? '#e8f0f8' : '#5a6a8a'; ctx.fillRect(-2, -14, 4, 20); ctx.fillStyle = '#c8a040'; ctx.fillRect(-6, 4, 12, 2);
      ctx.restore();
      label(ctx, w.name, x.x * T, x.y * T + 22, '#bfe8ff');
    }
  }
  if (room.kind === 'mercador') { const X = CX * T + 16, Y = (CY - 1.6) * T; ctx.fillStyle = '#2a1a3a'; ctx.beginPath(); ctx.moveTo(X - 12, Y + 20); ctx.lineTo(X, Y - 14); ctx.lineTo(X + 12, Y + 20); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(X - 4, Y - 2, 3, 3); ctx.fillRect(X + 2, Y - 2, 3, 3); }
  // itens no chão
  for (const l of run.loot) {
    const img = a.icons.get(l.item), bob = Math.sin(now / 220 + l.id) * 2;
    if (img?.complete && img.naturalWidth) ctx.drawImage(img, l.x * T - 8, l.y * T - 10 + bob, 16, 16);
    else { ctx.fillStyle = l.item === 'moeda' ? '#ffd84a' : '#7ab8ff'; ctx.beginPath(); ctx.arc(l.x * T, l.y * T + bob, 4, 0, 7); ctx.fill(); }
  }
  // sombras do Monarca no chão: pise para purificar
  for (const c of run.corpses) { ctx.fillStyle = `rgba(40,0,70,${0.6 + Math.sin(now / 90) * 0.2})`; ctx.beginPath(); ctx.ellipse(c.x * T, c.y * T, 14, 6, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#a04aff'; ctx.lineWidth = 1; ctx.stroke(); }
  // avisos no chão: o golpe vem quando o vermelho enche
  for (const w of run.warns) {
    const k = 1 - w.t / w.total;
    ctx.save();
    const soft = w.dmg <= 0 && !w.st;
    ctx.fillStyle = soft ? `rgba(255,140,60,${0.08 + k * 0.16})` : `rgba(255,40,60,${0.12 + k * 0.28})`; ctx.strokeStyle = soft ? `rgba(255,170,90,${0.4 + k * 0.4})` : `rgba(255,80,90,${0.5 + k * 0.5})`; ctx.lineWidth = 2;
    if (w.kind === 'circle') {
      ctx.beginPath(); ctx.arc(w.x * T, w.y * T, w.r * T, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = soft ? 'rgba(255,150,70,.3)' : 'rgba(255,60,70,.35)'; ctx.beginPath(); ctx.arc(w.x * T, w.y * T, w.r * T * k, 0, 7); ctx.fill();
    } else {
      const ang = Math.atan2(w.y2 - w.y, w.x2 - w.x), len = Math.hypot(w.x2 - w.x, w.y2 - w.y) * T, wd = Math.max(4, w.r * 2 * T);
      ctx.translate(w.x * T, w.y * T); ctx.rotate(ang);
      ctx.fillRect(0, -wd / 2, len, wd); ctx.strokeRect(0, -wd / 2, len, wd);
      ctx.fillStyle = soft ? 'rgba(255,150,70,.3)' : 'rgba(255,60,70,.35)'; ctx.fillRect(0, -wd / 2, len * k, wd);
    }
    ctx.restore();
  }
  // peças das cartas no chão (zonas, minas, vórtices, prisões)
  drawActs(ctx, { ...run, acts: run.acts.filter(x => ['zona', 'armadilha', 'puxar', 'prender'].includes(x.mv.m)) }, now, T);

  // corpos, de trás para a frente
  const bodies: { y: number; f: () => void }[] = [];
  for (const e of run.enemies) bodies.push({ y: e.y, f: () => drawEnemy(ctx, run, e, a, now) });
  // sombras do Arise e invocações
  for (const al of run.allies) bodies.push({ y: al.y, f: () => {
    const fr = a.player;
    if (al.kind === 'torreta') { ctx.fillStyle = '#5a6a8a'; ctx.fillRect(al.x * T - 9, al.y * T - 14, 18, 14); ctx.fillStyle = '#8ad0ff'; ctx.fillRect(al.x * T - 3, al.y * T - 20, 6, 8); return; }
    if (al.kind === 'inseto') { ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.arc(al.x * T, al.y * T - 8, 3, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(220,240,255,.7)'; ctx.fillRect(al.x * T - 5, al.y * T - 12 + Math.sin(now / 20) * 2, 4, 2); ctx.fillRect(al.x * T + 1, al.y * T - 12 - Math.sin(now / 20) * 2, 4, 2); return; }
    if (!fr) return;
    const img = fr.walk.south[Math.floor(now / 160) % 4];
    const big = al.kind === 'formiga' || al.kind === 'diabo' ? 1.25 : 1;
    ctx.save(); ctx.globalAlpha = al.kind === 'clone' ? 0.6 : 0.85;
    ctx.filter = al.kind === 'clone' ? 'none' : al.kind === 'formiga' ? 'brightness(.3) sepia(1) hue-rotate(240deg) saturate(4)' : al.kind === 'diabo' ? 'brightness(.35) sepia(1) hue-rotate(310deg) saturate(4)' : al.kind === 'mago' ? 'brightness(.5) sepia(1) hue-rotate(260deg) saturate(3)' : 'brightness(.35) sepia(1) hue-rotate(200deg) saturate(3)';
    ctx.drawImage(img, al.x * T - (img.width * big) / 2, al.y * T - img.height * 0.9 * big, img.width * big, img.height * big);
    ctx.restore();
    if (al.kind !== 'clone') { ctx.fillStyle = al.kind === 'diabo' ? '#ff3a4a' : '#c87aff'; ctx.fillRect(al.x * T - 5, al.y * T - img.height * 0.62 * big, 3, 2); ctx.fillRect(al.x * T + 2, al.y * T - img.height * 0.62 * big, 3, 2); }
    if (al.kind === 'diabo') { ctx.fillStyle = '#2a0a1a'; ctx.fillRect(al.x * T - 9, al.y * T - img.height * 0.95 * big, 4, 7); ctx.fillRect(al.x * T + 5, al.y * T - img.height * 0.95 * big, 4, 7); }
  } });
  // pet
  bodies.push({ y: run.pet.y, f: () => {
    const fr = a.pet; if (!fr) return;
    const pet = run.pet, moving = Math.hypot(pet.x - p.x, pet.y - p.y) > 1;
    const img = fr.walk[pet.x > p.x + 0.3 ? 'west' : pet.x < p.x - 0.3 ? 'east' : 'south'][moving ? Math.floor(now / 130) % 4 : 0];
    ctx.drawImage(img, pet.x * T - img.width / 2, pet.y * T - img.height * 0.85, img.width, img.height);
  } });
  // jogador: andar, rolar na esquiva, golpe, arma na mão, transformação
  bodies.push({ y: p.y, f: () => drawPlayer(ctx, run, a, now) });
  bodies.sort((x, y) => x.y - y.y).forEach(b => b.f());

  // peças das cartas no ar (tiros, tornados, raios, chuva, órbitas)
  drawActs(ctx, { ...run, acts: run.acts.filter(x => !['zona', 'armadilha', 'puxar', 'prender'].includes(x.mv.m)) }, now, T);
  // tiros
  for (const s of run.shots) {
    const X = s.x * T, Y = s.y * T;
    if (s.kind === 'bomba') {
      // a bomba voa em arco por cima
      const tot = Math.hypot(s.vx, s.vy) || 1, done = 1 - s.life / Math.max(0.3, s.life + 0.01), hop = Math.sin(Math.min(1, done) * Math.PI) * 30;
      void tot;
      ctx.fillStyle = '#2a2a3a'; ctx.beginPath(); ctx.arc(X, Y - 10 - hop, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#ff7a2a'; ctx.fillRect(X - 1, Y - 18 - hop, 2, 4);
      continue;
    }
    if (s.kind === 'flecha') {
      const ang = Math.atan2(s.vy, s.vx);
      ctx.save(); ctx.translate(X, Y); ctx.rotate(ang); ctx.fillStyle = s.mine ? '#e8d0a0' : '#ff8a5a'; ctx.fillRect(-8, -1, 14, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(5, -2, 4, 4); ctx.restore();
    } else if (s.kind === 'folha') {
      ctx.save(); ctx.translate(X, Y); ctx.rotate(now / 80); ctx.fillStyle = s.mine ? '#7aff6a' : '#3ac85a'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, 7); ctx.fill(); ctx.restore();
    } else {
      const frozen = (s.frozen ?? 0) > 0;
      ctx.fillStyle = frozen ? '#bff0ff' : s.mine ? (s.kind === 'magia' ? '#ff7ad8' : '#fff3a0') : s.kind === 'magia' ? '#7a3aff' : '#ff5ad8';
      ctx.beginPath(); ctx.arc(X, Y, s.mine ? 4 : 6, 0, 7); ctx.fill();
      ctx.fillStyle = s.mine ? '#ffb83a' : '#8a1a6a'; ctx.beginPath(); ctx.arc(X, Y, s.mine ? 2 : 3, 0, 7); ctx.fill();
    }
  }
  // escuridão (Guardião da Cripta, Monarca): só a luz em volta do caçador e dos lampiões
  if (run.dark > 0) {
    const lights = [{ x: p.x, y: p.y, r: 3.2 }, ...run.breaks[run.room].filter(b => b.kind === 'lampiao' && b.hp > 0).map(b => ({ x: b.x + 0.5, y: b.y + 0.5, r: 3.6 }))];
    const lay = darkLayer();
    const lc = lay.getContext('2d')!;
    lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, W, H);
    lc.fillStyle = `rgba(4,2,10,${run.dark})`; lc.fillRect(0, 0, W, H);
    lc.globalCompositeOperation = 'destination-out';
    for (const l of lights) { const g = lc.createRadialGradient(l.x * T, l.y * T, 4, l.x * T, l.y * T, l.r * T); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(l.x * T, l.y * T, l.r * T, 0, 7); lc.fill(); }
    ctx.drawImage(lay, 0, 0);
  }
  // dica de pegar
  const near = run.pickups.find(x => x.room === run.room && !run.bought.includes(x.id) && Math.hypot(x.x - p.x, x.y - p.y) < 0.9);
  if (near) label(ctx, near.kind === 'arma' ? 'E: trocar de arma' : near.kind === 'estatua' ? `E: bênção (${near.price})` : `E: ${SHOP_NAME[near.what ?? ''] ?? 'comprar'} (${near.price})`, p.x * T, p.y * T - 48, '#ffffff');
}
const darkCv = { cv: null as HTMLCanvasElement | null };
function darkLayer() { if (!darkCv.cv) { darkCv.cv = document.createElement('canvas'); darkCv.cv.width = W; darkCv.cv.height = H; } return darkCv.cv; }

function drawEnemy(ctx: CanvasRenderingContext2D, run: Run, e: Enemy, a: Art, now: number) {
  const p = run.p, boss = isBoss(e.kind);
  if (e.state === 'under') {
    // cavador embaixo da terra: só o monte andando
    ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, 12, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a5a2a'; for (let k = 0; k < 3; k++) ctx.fillRect(e.x * T - 8 + k * 6, e.y * T - 6 - ((now / 60 + k * 5) % 6), 3, 3);
    return;
  }
  if (e.ghost > 0 && !boss) return;
  const fr = a.mobs[e.kind];
  const dir: Dir = Math.abs(p.x - e.x) > Math.abs(p.y - e.y) ? (p.x > e.x ? 'east' : 'west') : (p.y > e.y ? 'south' : 'north');
  const frozen = (e.sb.congelado?.t ?? 0) > 0, stunned = (e.sb.atordoado?.t ?? 0) > 0;
  const step = stunned || frozen || e.state === 'wind' || e.state === 'card' ? 0 : Math.floor(now / 150) % 4;
  const big = (boss ? 1.6 : e.kind === 'golem' ? 1.4 : e.kind === 'slimeP' || e.kind === 'minion' ? 0.7 : e.kind === 'escudeiro' ? 1.15 : 1.05) * e.scale;
  const shake = e.state === 'wind' || e.state === 'card' ? Math.sin(now / 25) * 1.5 : 0;
  const hop = (e.kind === 'slime' || e.kind === 'slimeP') && (e.t % 1.2) < 0.45 ? -Math.sin(((e.t % 1.2) / 0.45) * Math.PI) * 8 : 0;
  const R = ENEMY[e.kind].r * e.scale;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T + 2, R * T, R * T * 0.4, 0, 0, 7); ctx.fill();
  // aura da elite
  if (e.elite) { const c = ELITE_COLOR[e.elite]; ctx.save(); ctx.globalAlpha = e.eliteOff > 0 ? 0.15 : 0.35 + Math.sin(now / 150) * 0.15; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T - R * T * 0.8, R * T * 1.3, R * T * 1.6, 0, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.save();
  if (e.ghost > 0) ctx.globalAlpha = 0.25;
  if (e.elite === 'refletor' && e.aux2 > 0) { ctx.strokeStyle = '#8ad0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x * T, e.y * T - R * T, R * T * 1.4, 0, 7); ctx.stroke(); }
  if (e.hit > 0) ctx.filter = 'brightness(2.2)';
  else if (frozen) ctx.filter = 'hue-rotate(180deg) saturate(1.6) brightness(1.2)';
  else if (e.kind === 'sombraP') ctx.filter = 'brightness(.3) sepia(1) hue-rotate(220deg) saturate(3)';
  else if (boss && !a.gpt[e.kind]) ctx.filter = BOSS_NPC[e.kind]?.[1] ?? 'none';
  else if (!a.gpt[e.kind] && !['morcego', 'slime', 'slimeP', 'espirito', 'planta', 'cavador', 'minion'].includes(e.kind)) ctx.filter = e.kind === 'lobo' ? 'brightness(.6) hue-rotate(220deg)' : e.kind === 'golem' ? 'grayscale(.6)' : e.kind === 'mago' ? 'hue-rotate(200deg) saturate(1.4)' : 'hue-rotate(60deg) saturate(1.4)';
  const g = a.gpt[e.kind];
  if (e.kind === 'sombraP' && a.player) { const img = a.player.walk[dir][step]; ctx.drawImage(img, e.x * T - img.width / 2 + shake, e.y * T - img.height * 0.9, img.width, img.height); }
  else if (g) { const img = e.state !== 'move' ? g.atk[dir][Math.floor(now / 160) % g.atk[dir].length] : g.walk[dir][step]; const gb = (e.kind === 'slimeP' || e.kind === 'minion' ? 0.7 : boss ? 1.5 : 1.4) * e.scale; ctx.drawImage(img, e.x * T - (img.width * gb) / 2 + shake, e.y * T - img.height * gb * 0.9 + hop, img.width * gb, img.height * gb); }
  else if (fr) { const img = fr.walk[dir][step]; ctx.drawImage(img, e.x * T - (img.width * big) / 2 + shake, e.y * T - img.height * big * 0.85 + hop, img.width * big, img.height * big); }
  else { ctx.fillStyle = '#9a4ac8'; ctx.beginPath(); ctx.arc(e.x * T, e.y * T - 8, R * T, 0, 7); ctx.fill(); }
  ctx.restore();
  const h = (boss ? 1.6 : 1) * R * T * 2.2;
  // escudo do escudeiro (vira devagar)
  if (e.kind === 'escudeiro' && e.broken <= 0) { ctx.save(); ctx.translate(e.x * T + Math.cos(e.face) * 13, e.y * T - 10 + Math.sin(e.face) * 9); ctx.rotate(e.face); ctx.fillStyle = '#8a8a9a'; ctx.fillRect(-3, -11, 6, 22); ctx.fillStyle = '#c8d8e8'; ctx.fillRect(-1, -9, 2, 18); ctx.restore(); }
  // núcleo do Golem de Lava (brilha nas costas quando exposto)
  if (e.kind === 'golemLava' && e.aux > 0) { ctx.fillStyle = `rgba(255,216,74,${0.6 + Math.sin(now / 60) * 0.3})`; ctx.beginPath(); ctx.arc(e.x * T - Math.cos(e.face) * R * T * 0.8, e.y * T - 18 - Math.sin(e.face) * R * T * 0.4, 9, 0, 7); ctx.fill(); }
  // armadura de gelo do Troll
  if (e.kind === 'troll' && e.shield > 0) { ctx.save(); ctx.globalAlpha = 0.35 + 0.35 * (e.shield / Math.max(1, e.shieldMax)); ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T - h * 0.5, R * T * 1.2, h * 0.6, 0, 0, 7); ctx.stroke(); ctx.restore(); }
  // escudo dos lampiões do Guardião
  if (e.kind === 'guardiao' && e.shield > 0) { ctx.save(); ctx.globalAlpha = 0.25 + e.shield * 0.08; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(e.x * T, e.y * T - h * 0.5, R * T * 1.5, 0, 7); ctx.fill(); ctx.restore(); }
  drawStatus(ctx, e.sb, e.x * T, e.y * T, h, now);
  // carta virando em cima da cabeça (vai usar a carta)
  if (e.state === 'card' && e.card) {
    const k = Math.min(1, (now / 1000) % 1), flip = Math.abs(Math.cos(now / 90));
    const cx = e.x * T, cy = e.y * T - h - 22;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(flip, 1);
    const card = CARD_BY_ID.get(e.card), [c1] = card ? EL_COLOR[card.element] : ['#fff'];
    ctx.fillStyle = Math.cos(now / 90) > 0 ? '#ffffff' : '#2a1a4a'; ctx.fillRect(-9, -13, 18, 26); ctx.strokeStyle = c1; ctx.lineWidth = 2; ctx.strokeRect(-9, -13, 18, 26);
    ctx.restore();
    void k;
    if (card) label(ctx, card.name, cx, cy - 18, '#ffd84a');
  }
  // vida e postura (elites e comuns machucados)
  if (!boss && (e.hp < e.max || e.elite)) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x * T - 13, e.y * T + 6, 26, e.elite ? 7 : 4);
    ctx.fillStyle = '#ff5a6a'; ctx.fillRect(e.x * T - 12, e.y * T + 7, 24 * Math.max(0, e.hp / e.max), 2);
    if (e.elite) { ctx.fillStyle = e.broken > 0 ? '#ffe03a' : '#c8c0a0'; ctx.fillRect(e.x * T - 12, e.y * T + 10, 24 * (e.broken > 0 ? 1 : 1 - e.poise / e.poiseMax), 2); }
  }
  if (e.elite) label(ctx, ELITE_NAME[e.elite].toUpperCase(), e.x * T, e.y * T - h - 4, ELITE_COLOR[e.elite]);
}

function drawPlayer(ctx: CanvasRenderingContext2D, run: Run, a: Art, now: number) {
  const p = run.p, f = p.form;
  if (p.inv > 0 && p.dash <= 0 && p.lock <= 0 && !run.cine && Math.floor(now / 70) % 2) return;
  const fr = a.player, moving = Math.hypot(p.dx, p.dy) > 0.1;
  const img = fr?.walk[DIR[p.face]][p.dash > 0 ? 1 : moving ? Math.floor(now / 130) % 4 : 0];
  const scale = f ? f.scale : 1;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x * T, p.y * T + 2, 10 * scale, 4 * scale, 0, 0, 7); ctx.fill();
  // aura da transformação
  if (f) {
    const [c1, c2] = colorsOf(f.card, f.el);
    ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(now / 100) * 0.1; ctx.fillStyle = f.form === 'demonio' ? '#5a0a1a' : f.form === 'psiquico' ? '#a87aff' : f.form === 'veneno' ? '#a04ad8' : c1;
    ctx.beginPath(); ctx.ellipse(p.x * T, p.y * T - 20 * scale, 16 * scale, 26 * scale, 0, 0, 7); ctx.fill(); ctx.restore();
    if (f.aura) { ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -now / 30; ctx.beginPath(); ctx.arc(p.x * T, p.y * T, f.aura.r * T, 0, 7); ctx.stroke(); ctx.restore(); }
    if (f.form === 'nuvem') { ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.ellipse(p.x * T, p.y * T + 2, 20, 8, 0, 0, 7); ctx.fill(); }
  }
  if (!img) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(p.x * T, p.y * T, 10, 0, 7); ctx.fill(); return; }
  ctx.save();
  ctx.translate(p.x * T, p.y * T - img.height * 0.4 * scale);
  if (p.dash > 0) { ctx.rotate(((p.face === 'w' ? -1 : 1) * (1 - p.dash / 0.17)) * Math.PI * 2); ctx.globalAlpha = 0.85; }
  if (f?.form === 'colosso') ctx.filter = 'sepia(.6) saturate(2) hue-rotate(-20deg) brightness(1.1)';
  else if (f?.form === 'tita') ctx.filter = 'sepia(.4) saturate(1.4)';
  else if (f?.form === 'demonio') ctx.filter = 'brightness(.6) saturate(1.6) hue-rotate(-30deg)';
  if (p.perfect) ctx.filter = 'drop-shadow(0 0 4px #8ad0ff)';
  ctx.drawImage(img, (-img.width / 2) * scale, -img.height * 0.5 * scale, img.width * scale, img.height * scale);
  ctx.restore();
  // vapor do Titã Colossal
  if (f?.form === 'colosso') for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(240,240,240,.35)'; ctx.beginPath(); ctx.arc(p.x * T - 14 + k * 9, p.y * T - img.height * scale - ((now / 20 + k * 13) % 30), 6, 0, 7); ctx.fill(); }
  // arma: espada atrás no ombro (ou balançando no golpe); arma longa apontando
  const w = weapon(p.arms[p.hand].id);
  const tgt = run.enemies.reduce<{ e: Enemy | null; d: number }>((best, e) => { const d = Math.hypot(e.x - p.x, e.y - p.y); return d < best.d ? { e, d } : best; }, { e: null, d: 9 }).e;
  const ang = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : Math.atan2(p.dy, p.dx);
  ctx.save();
  ctx.translate(p.x * T, p.y * T - 14 * scale);
  ctx.scale(scale, scale);
  if (w.kind === 'curta') {
    const arc = p.swingKind === 'pesado' && (w.arc ?? 1.6) >= 1.8 ? Math.PI * 2 : w.arc ?? 1.6;
    const swing = p.swing > 0 ? (1 - p.swing / 0.18) * arc - arc / 2 : p.heavy > 0 ? -1.6 - p.heavy * 0.6 : -0.9;
    ctx.rotate(ang + swing + Math.PI / 2);
    ctx.fillStyle = p.heavy >= 1 ? '#ffd84a' : w.id === 'foice' ? '#a87aff' : '#e8f0f8'; ctx.fillRect(-2, -8 - w.range * 9, 4, w.range * 9);
    ctx.fillStyle = '#c8a040'; ctx.fillRect(-6, -8, 12, 3); ctx.fillStyle = '#6a3a20'; ctx.fillRect(-1.5, -5, 3, 7);
  } else {
    const kick = p.atk > w.cd - 0.06 ? -3 : 0;
    ctx.rotate(ang);
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(4 + kick, -3, 16, 6); ctx.fillStyle = '#7ae8ff'; ctx.fillRect(18 + kick, -2, 3, 4);
  }
  ctx.restore();
  // golpe pesado carregando / carta carregando
  if (p.heavy > 0) { ctx.strokeStyle = p.heavy >= 1 ? '#ffd84a' : '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x * T, p.y * T - 14, 16, -Math.PI / 2, -Math.PI / 2 + p.heavy * Math.PI * 2); ctx.stroke(); }
  if (p.charge) { const k = Math.min(1, p.charge.t / p.charge.max), sk = p.skills[p.charge.slot], [c1] = sk ? colorsOf(sk.card, sk.element) : ['#fff']; ctx.fillStyle = c1; ctx.globalAlpha = 0.5 + k * 0.5; ctx.beginPath(); ctx.arc(p.x * T, p.y * T - 18, 4 + k * 10, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  drawStatus(ctx, p.sb, p.x * T, p.y * T, img.height * 0.8 * scale, now);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = "8px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
  ctx.lineWidth = 3; ctx.strokeStyle = '#120a1a'; ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y);
}

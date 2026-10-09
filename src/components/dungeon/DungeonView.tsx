// Masmorra (src/game/dungeon.ts): canvas da sala, mini-mapa, vida e moedas.
// Teclado: WASD/setas andam, J ou clique segurado atira (mira no mouse; sem
// mouse, mira automática), ESPAÇO/K esquiva. Toque: alavanca à esquerda,
// TIRO e ESQUIVA à direita. Arte PROVISÓRIA (piso e parede do castelo, pets
// como monstrinhos, um desafiante como chefe) até a do GPT (PROMPTS-GPT.md §O).
import { useEffect, useRef, useState } from 'react';
import { dungeonFloor, ENEMY, finishRun, GRID, NO_INPUT, RH, RW, solidAt, startRun, stepRun, doorTile, type Input, type Run, type Side } from '@/game/dungeon';
import { loadProgress, saveProgress } from '@/game/progress';
import { cloudDungeonCard, cloudEnabled } from '@/game/cloud';
import { loadLookFrames, loadNpcFrames, loadPetFrames, type Frames } from '@/game/world/sprites';
import type { Look } from '@/game/world/outfit';
import type { Dir } from '@/game/world/movement';
import { cut, loadAtlas, loadInteriorManifest } from '@/components/city/interior-atlas';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { TcgCard } from '@/components/tcg/TcgCard';
import { PxButton, PxPanel } from '@/components/pixel/Pixel';
import { Icon } from '@/components/Icon';
import { play } from '@/game/sfx';
import './dungeon.css';

const T = 32;                        // px por bloco (hd)
const W = RW * T, H = RH * T;
const DIR: Record<Side, Dir> = { n: 'north', s: 'south', e: 'east', w: 'west' };
const MOB_SPRITE = { slime: 'pet-cogumelinho', morcego: 'pet-morcego-noite', arqueiro: 'pet-fantasminha' } as const;

interface Art { floor: CanvasPattern | null; wall: HTMLCanvasElement | null; rock: HTMLCanvasElement | null; chest: HTMLCanvasElement | null; player: Frames | null; mobs: Partial<Record<string, Frames>>; boss: Frames | null }

export function DungeonView({ look, onClose }: { look: Look; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(() => Date.now() % 1e9);
  const [andar] = useState(() => dungeonFloor(loadProgress()));
  const run = useRef<Run>(null as unknown as Run);
  if (!run.current) run.current = startRun(seed, andar);
  const input = useRef<Input>({ ...NO_INPUT });
  const art = useRef<Art>({ floor: null, wall: null, rock: null, chest: null, player: null, mobs: {}, boss: null });
  const [hud, setHud] = useState(() => ({ hp: 6, max: 6, coins: 0, room: 0, seen: [] as boolean[], cleared: [] as boolean[], result: undefined as Run['result'] }));
  const [prize, setPrize] = useState<{ coins: number; card?: string; paid: boolean } | null>(null);
  const finished = useRef(false);
  const touch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // arte provisória
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [m, atlas] = await Promise.all([loadInteriorManifest(), loadAtlas()]);
      const ctx = canvas.current?.getContext('2d');
      const fl = cut(m, atlas, 'piso-castelo-piso');
      if (!alive || !ctx) return;
      art.current.floor = fl ? ctx.createPattern(fl, 'repeat') : null;
      art.current.wall = cut(m, atlas, 'parede-castelo-parede');
      art.current.rock = cut(m, atlas, 'barris');
      art.current.chest = cut(m, atlas, 'bau-tesouro');
    })().catch(() => undefined);
    loadLookFrames(look).then(f => { if (alive) art.current.player = f; }).catch(() => undefined);
    for (const [k, id] of Object.entries(MOB_SPRITE)) loadPetFrames(id).then(f => { if (alive) art.current.mobs[k] = f; }).catch(() => undefined);
    loadNpcFrames(`npc-desafiante-0${(andar % 9) + 1}`).then(f => { if (alive) art.current.boss = f; }).catch(() => undefined);
    return () => { alive = false; };
  }, [look, andar]);

  // a sala de fora re-renderiza à toa: o teclado não pode ser refeito (perderia as teclas seguradas)
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // teclado e mouse
  useEffect(() => {
    const keys = new Set<string>();
    const sync = () => {
      const i = input.current;
      i.mx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      i.my = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
      i.shoot = keys.has('j') || keys.has('mouse');
      i.dodge = keys.has(' ') || keys.has('k') || keys.has('shift');
    };
    const down = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k === 'escape') return closeRef.current(); keys.add(k); if (k === ' ' || k.startsWith('arrow')) e.preventDefault(); sync(); };
    const up = (e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); sync(); };
    const cv = canvas.current!;
    const aim = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const b = cv.getBoundingClientRect(), p = run.current.p;
      input.current.ax = ((e.clientX - b.left) / b.width) * RW - p.x;
      input.current.ay = ((e.clientY - b.top) / b.height) * RH - p.y;
    };
    const md = (e: PointerEvent) => { if (e.pointerType !== 'touch') { keys.add('mouse'); aim(e); sync(); } };
    const mu = () => { keys.delete('mouse'); sync(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    cv.addEventListener('pointermove', aim); cv.addEventListener('pointerdown', md); window.addEventListener('pointerup', mu);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); cv.removeEventListener('pointermove', aim); cv.removeEventListener('pointerdown', md); window.removeEventListener('pointerup', mu); };
  }, []);

  // laço: passo da regra + desenho
  useEffect(() => {
    let raf = 0, last = performance.now(), hudAt = 0, lastHp = run.current.p.hp, lastKills = 0, lastRoom = run.current.room;
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      // até 3 passos por quadro (aba voltando do fundo não acelera a partida)
      let r = run.current;
      for (let left = Math.min(dt, 0.15); left > 0; left -= 0.05) r = stepRun(r, input.current, Math.min(0.05, left));
      if (input.current.dodge && r.p.dash > 0 && run.current.p.dash <= 0) play('flip');
      if (r.p.hp < lastHp) play('lose');
      if (r.kills > lastKills) play('coin');
      if (r.room !== lastRoom) play('drop');
      lastHp = r.p.hp; lastKills = r.kills; lastRoom = r.room;
      run.current = r;
      if (import.meta.env.DEV) (window as unknown as { __dungeon: Run }).__dungeon = r;
      draw(canvas.current?.getContext('2d') ?? null, r, art.current, now);
      if (now - hudAt > 100 || r.result) {
        hudAt = now;
        setHud({ hp: r.p.hp, max: r.p.max, coins: r.coins, room: r.room, seen: r.seen, cleared: r.cleared, result: r.result });
      }
      if (!r.result) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [seed]);

  // fim: prêmio
  useEffect(() => {
    if (!hud.result || finished.current) return;
    finished.current = true;
    play(hud.result === 'win' ? 'win' : 'lose');
    const r = finishRun(loadProgress(), run.current);
    if (cloudEnabled() && r.card) {
      // com o banco, a carta vem do servidor (as moedas vão pelo sync como sempre)
      const local = { ...r.progress, collection: { ...r.progress.collection, [r.card]: Math.max(0, (r.progress.collection[r.card] ?? 1) - 1) } };
      saveProgress(local);
      void cloudDungeonCard().then(card => {
        if (card) { const p = loadProgress(); saveProgress({ ...p, collection: { ...p.collection, [card]: (p.collection[card] ?? 0) + 1 } }); }
        setPrize({ coins: r.coins, card: card ?? undefined, paid: r.paid });
      });
    } else {
      saveProgress(r.progress);
      setPrize({ coins: r.coins, card: r.card, paid: r.paid });
    }
  }, [hud.result]);

  const again = () => { finished.current = false; setPrize(null); const s = Date.now() % 1e9; run.current = startRun(s, andar); setSeed(s); };
  const d = run.current.d;
  return (
    <div className="dg-wrap">
      <div className="dg-top">
        <div className="dg-hp">{Array.from({ length: hud.max }, (_, k) => <Icon key={k} id={k < hud.hp ? 'coracao' : 'coracao-partido'} size={22} />)}</div>
        <div className="dg-coins"><Icon id="moeda" size={18} /> {hud.coins}</div>
        <div className="dg-title">MASMORRA · ANDAR {andar}</div>
        <div className="dg-map" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
          {Array.from({ length: GRID * GRID }, (_, k) => {
            const i = d.rooms.findIndex(r => r.gx === k % GRID && r.gy === Math.floor(k / GRID));
            const seen = i >= 0 && hud.seen[i];
            return <i key={k} className={i < 0 || !seen ? '' : i === hud.room ? 'here' : i === d.boss ? 'boss' : hud.cleared[i] ? 'done' : 'seen'} />;
          })}
        </div>
        <button className="dg-exit" onClick={onClose}>SAIR</button>
      </div>
      <canvas ref={canvas} width={W} height={H} className="dg-canvas" />
      {touch && <TouchPad input={input} />}
      {!touch && <div className="dg-help">WASD anda · clique ou J atira (mira no mouse) · ESPAÇO esquiva · limpe a sala para abrir as portas · o chefe fica na sala mais longe</div>}
      {hud.result && (
        <div className="dg-end">
          <PxPanel title={hud.result === 'win' ? 'MASMORRA VENCIDA!' : 'VOCÊ CAIU...'} color={hud.result === 'win' ? '#3a9a5a' : '#c8303a'} onClose={onClose} width={420}>
            {!prize && <div className="text-[9px]">Contando o prêmio...</div>}
            {prize && <>
              <div className="text-[10px] flex items-center gap-1 mb-2"><Icon id="moeda" size={14} /> {prize.paid ? `+${prize.coins} moedas` : 'Hoje as 3 masmorras pagas já foram: esta valeu só pela diversão.'}</div>
              {prize.card && CARD_BY_ID.get(prize.card) && <div className="w-[180px] mx-auto mb-2"><TcgCard card={CARD_BY_ID.get(prize.card)!} /></div>}
              {prize.card && <div className="text-[8px] text-center mb-2">Carta do chefe: {CARD_BY_ID.get(prize.card)?.name} foi para o seu álbum!</div>}
              <div className="flex gap-2 justify-center"><PxButton color="#3a78c8" onClick={again}>DE NOVO</PxButton><PxButton color="#6a6a7a" onClick={onClose}>SAIR</PxButton></div>
            </>}
          </PxPanel>
        </div>
      )}
    </div>
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
        <button onPointerDown={() => { input.current.dodge = true; }} onPointerUp={() => { input.current.dodge = false; }}>ESQUIVA</button>
        <button className="fire" onPointerDown={() => { input.current.shoot = true; }} onPointerUp={() => { input.current.shoot = false; }} onPointerLeave={() => { input.current.shoot = false; }}>TIRO</button>
      </div>
    </>
  );
}

// ─── desenho ────────────────────────────────────────────────────────────────

/** O que não muda dentro da sala (piso, paredes, grades, pedras, baú) fica pronto num canvas. */
const still = { key: '', cv: null as HTMLCanvasElement | null };
function roomLayer(run: Run, a: Art): HTMLCanvasElement {
  const room = run.d.rooms[run.room], open = run.cleared[run.room];
  const key = `${run.d.seed}|${run.room}|${open}|${run.chest}|${!!a.floor}|${!!a.wall}|${!!a.rock}|${!!a.chest}`;
  if (still.cv && still.key === key) return still.cv;
  const cv = still.cv ?? document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = a.floor ?? '#5a4a3a';
  ctx.fillRect(0, 0, W, H);
  // parede: a de cima com a arte do castelo; as outras escurecidas
  for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    if (!solidAt(room, tx, ty, open) || (tx > 0 && ty > 0 && tx < RW - 1 && ty < RH - 1)) continue;
    if (ty === 0 && a.wall) ctx.drawImage(a.wall, (tx * T) % a.wall.width, a.wall.height - T, T, T, tx * T, 0, T, T);
    else { ctx.fillStyle = '#2a1e2e'; ctx.fillRect(tx * T, ty * T, T, T); ctx.fillStyle = '#3e2c42'; ctx.fillRect(tx * T + 2, ty * T + 2, T - 4, T - 6); }
  }
  // portas trancadas: grades douradas
  if (!open) for (const s of room.doors) {
    const [dx, dy] = doorTile(s), horiz = s === 'n' || s === 's';
    for (let k = -1; k <= 1; k++) {
      const x = (horiz ? dx + k : dx) * T, y = (horiz ? dy : dy + k) * T;
      ctx.fillStyle = 'rgba(20,10,20,.6)'; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#e8b83a';
      for (let b = 0; b < 4; b++) { if (horiz) ctx.fillRect(x + 3 + b * 8, y + 2, 3, T - 4); else ctx.fillRect(x + 2, y + 3 + b * 8, T - 4, 3); }
    }
  }
  for (const [x, y] of room.rocks) {
    if (a.rock) ctx.drawImage(a.rock, x * T, y * T - 6, T, (a.rock.height / a.rock.width) * T);
    else { ctx.fillStyle = '#4a4058'; ctx.fillRect(x * T, y * T, T, T); }
  }
  if (room.kind === 'tesouro' && !run.chest && a.chest) ctx.drawImage(a.chest, 7 * T - 4, 4 * T - 4, 40, 34);
  still.key = key; still.cv = cv;
  return cv;
}

function draw(ctx: CanvasRenderingContext2D | null, run: Run, a: Art, now: number) {
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(roomLayer(run, a), 0, 0);

  // bichos e jogador, de trás para a frente
  const bodies: { y: number; f: () => void }[] = [];
  for (const e of run.enemies) bodies.push({ y: e.y, f: () => {
    const fr = e.kind === 'chefe' ? a.boss : a.mobs[e.kind];
    const dir: Dir = Math.abs(run.p.x - e.x) > Math.abs(run.p.y - e.y) ? (run.p.x > e.x ? 'east' : 'west') : (run.p.y > e.y ? 'south' : 'north');
    const step = Math.floor(now / 160) % 4;
    const big = e.kind === 'chefe' ? 1.5 : 1;
    ctx.globalAlpha = e.hit > 0 ? 0.5 : 1;
    if (fr) { const img = fr.walk[dir][step]; ctx.drawImage(img, e.x * T - (img.width * big) / 2, e.y * T - img.height * big * 0.85, img.width * big, img.height * big); }
    else { ctx.fillStyle = '#9a4ac8'; ctx.beginPath(); ctx.arc(e.x * T, e.y * T, ENEMY[e.kind].r * T, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  } });
  const p = run.p;
  bodies.push({ y: p.y, f: () => {
    if (p.inv > 0 && Math.floor(now / 80) % 2) return;
    const fr = a.player, img = fr?.walk[DIR[p.face]][p.dash > 0 || Math.hypot(p.dx, p.dy) < 0.1 ? 0 : Math.floor(now / 140) % 4];
    if (img) ctx.drawImage(img, p.x * T - img.width / 2, p.y * T - img.height * 0.9, img.width, img.height);
    else { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(p.x * T, p.y * T, 10, 0, 7); ctx.fill(); }
  } });
  bodies.sort((x, y) => x.y - y.y).forEach(b => b.f());

  // tiros
  for (const s of run.shots) {
    ctx.fillStyle = s.mine ? '#fff3a0' : '#ff5ad8';
    ctx.beginPath(); ctx.arc(s.x * T, s.y * T, s.mine ? 4 : 5, 0, 7); ctx.fill();
    ctx.fillStyle = s.mine ? '#ffb83a' : '#8a1a6a';
    ctx.beginPath(); ctx.arc(s.x * T, s.y * T, s.mine ? 2 : 2.5, 0, 7); ctx.fill();
  }
  // vida do chefe
  const boss = run.enemies.find(e => e.kind === 'chefe');
  if (boss) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(W / 2 - 120, 6, 240, 12);
    ctx.fillStyle = '#e8485a'; ctx.fillRect(W / 2 - 118, 8, 236 * (boss.hp / boss.max), 8);
  }
}

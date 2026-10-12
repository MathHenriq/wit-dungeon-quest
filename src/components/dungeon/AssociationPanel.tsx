// Associação dos Caçadores, na janela do SISTEMA: portais E…S (cada um abre
// vencendo o chefe do anterior), Portal da Semana e Modo Pesadelo; o caçador
// (cartas que viram poder, sombra, habilidade do Caminho, missão do dia);
// CARTAS (Códex: o que cada carta faz na masmorra, maestria); STATUS (pontos
// de Força, Agilidade, Vitalidade, Inteligência, Percepção); ferreiro de
// armas, boticária e o baú do pet (cristal vira pó da forja de cartas).
import { useMemo, useState } from 'react';
import { loadProgress, saveProgress, type Progress } from '@/game/progress';
import {
  brew, chooseSombra, CRYSTAL_DUST, crystalsToDust, equipWeapon, forgeWeapon, hunterLevel, hunterRank, hunterStats, missionNow, nextRank,
  nightmareOpen, pointsFree, portalOpen, rankName, resetPoints, setSkills, skillChoices, spendPoint, STAT_INFO, STAT_MAX, upgradeWeapon,
  weekOf, ARISE_WINS, sombraOfRank, MAX_POTIONS, type PortalMode,
} from '@/game/hunter';
import { forgeCost, upgradeCost, WEAPONS, MAX_WEAPON_LEVEL, levelMult, dps } from '@/game/dungeon-weapons';
import { CLASS_SKILL, FLOORS, RANKS } from '@/game/dungeon';
import { kitTags, MASTERY_KILLS, masteryLevel, skillOf } from '@/game/dungeon-skills';
import { SOMBRAS, type StatPts } from '@/game/hunter-state';
import { itemIcon, itemLabel } from '@/game/items';
import { CATALOG } from '@/lib/tcg/cards/catalog';
import { cardArtUrl } from '@/components/tcg/cardArt';
import { Icon } from '@/components/Icon';
import { colorsOf } from './dungeon-vfx';
import { SystemWindow } from './SystemWindow';
import { play } from '@/game/sfx';

export type AssocTab = 'portais' | 'cacador' | 'cartas' | 'status' | 'armas' | 'boticaria' | 'bau';
export const ASSOC_TABS: AssocTab[] = ['portais', 'cacador', 'cartas', 'status', 'armas', 'boticaria', 'bau'];
const TABS: { id: AssocTab; nome: string }[] = [
  { id: 'portais', nome: 'PORTAIS' }, { id: 'cacador', nome: 'CAÇADOR' }, { id: 'cartas', nome: 'CARTAS' }, { id: 'status', nome: 'STATUS' },
  { id: 'armas', nome: 'FERREIRO' }, { id: 'boticaria', nome: 'BOTICÁRIA' }, { id: 'bau', nome: 'BAÚ DO PET' },
];
const PORTAL_NAME = ['Caverna dos Goblins', 'Cripta das Velas', 'Gruta de Gelo', 'Fornalha de Lava', 'Floresta Sombria', 'Castelo das Sombras'];
const BOSS_NAME = ['Rei Goblin', 'Guardião da Cripta', 'Troll de Gelo', 'Golem de Lava', 'Espírito da Floresta', 'Monarca das Sombras'];
const BOSS_TIP = [
  'Investida e porrete que volta. Na fase 3, pedras caem: olhe o chão.',
  'Sala escura. Os 4 lampiões dão escudo a ele: apague os lampiões.',
  'Chão escorrega. A armadura de gelo só cai com fogo ou golpe pesado.',
  'Bata nas COSTAS depois do pisão: o núcleo fica exposto.',
  'As plantas curam o chefe: destrua as plantas primeiro. Esquive para soltar das raízes.',
  'Cópias usam as SUAS cartas. Pise nas sombras do chão antes que levantem.',
];
const MASM_ITEMS = ['minerio:cobre', 'minerio:ferro', 'minerio:ouro', 'erva:cura', 'erva:mana', 'cristal:azul', 'cristal:roxo', 'cristal:dourado', 'pena', 'pelo', 'pocao:vida', 'pocao:mana'];
const RARITY_NAME: Record<string, string> = { common: 'Comum', uncommon: 'Incomum', rare: 'Rara', epic: 'Épica', legendary: 'Lendária', mythic: 'Mítica', unknown: 'Desconhecida' };

export function AssociationPanel({ tab: tab0 = 'portais', onEnter, onClose }: { tab?: AssocTab; onEnter: (rank: number, mode?: PortalMode) => void; onClose: () => void }) {
  const [tab, setTab] = useState<AssocTab>(tab0);
  const [p, setP] = useState<Progress>(() => loadProgress());
  const [msg, setMsg] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'minhas' | 'descobertas'>('minhas');
  const save = (q: Progress, text?: string) => { saveProgress(q); setP(q); if (text) { setMsg(text); play('super'); } };
  const fail = (r: object) => { setMsg('reason' in r ? String(r.reason) : 'Não deu.'); play('click'); };
  const h = p.masmorra, rank = hunterRank(h.xp), st = hunterStats(rank, h.pontos), nxt = nextRank(h.xp), mm = missionNow(h), lvl = hunterLevel(h.xp), free = pointsFree(h);
  const top = Math.max(0, ...RANKS.map((_, k) => (portalOpen(p, k).ok ? k : 0)));
  const cls = CLASS_SKILL[p.caminho ?? 'desafiante'];
  const codex = useMemo(() => CATALOG.filter(c => c.type === 'attack').map(c => ({ c, s: skillOf(c, masteryLevel(h.maestria[c.id] ?? 0))! })), [h.maestria]);

  return (
    <div className="dg-end" style={{ position: 'fixed', zIndex: 55 }} onPointerDown={onClose}>
      <SystemWindow title="ASSOCIAÇÃO DOS CAÇADORES" sub={`Caçador rank ${rankName(rank)} · nível ${lvl} · ${h.xp} XP${nxt ? ` · faltam ${nxt.falta} para o ${rankName(nxt.rank)}` : ' · rank máximo'}`} onClose={onClose} wide>
        <div className="sys-bar"><i style={{ width: `${(nxt?.pct ?? 1) * 100}%` }} /></div>
        <div className="sys-tabs">{TABS.map(t => <button key={t.id} className={`sys-tab ${tab === t.id ? 'on' : ''}`} onClick={() => { setTab(t.id); setMsg(null); }}>{t.nome}{t.id === 'status' && free > 0 ? ` (${free})` : ''}</button>)}</div>
        {msg && <div className="sys-line" style={{ color: '#ffd84a' }}>{msg}</div>}

        {tab === 'portais' && <>
          <div className="sys-line">[MISSÃO DIÁRIA] {mm.m.label}: {mm.feito}/{mm.m.alvo}{mm.pago ? ' · CUMPRIDA' : ''}</div>
          <div className="sys-grid">
            {RANKS.map((r, k) => {
              const open = portalOpen(p, k);
              return (
                <div key={r} className={`sys-cell ${open.ok ? '' : 'lock'}`}>
                  <b style={{ fontSize: 10 }}>RANK {r}</b>
                  <span>{PORTAL_NAME[k]} · chefe: {BOSS_NAME[k]}</span>
                  <span>Vencido: {h.vitorias[k] ?? 0}×{(h.vitorias[k] ?? 0) < ARISE_WINS ? ` (Arise com ${ARISE_WINS})` : ''}</span>
                  {open.ok && <span style={{ color: '#9ac8f0' }}>Dica: {BOSS_TIP[k]}</span>}
                  {open.ok ? <button className="sys-btn" onClick={() => { play('turn'); onEnter(k); }}>ENTRAR</button> : <span style={{ color: '#ff9aa8' }}>{open.why}</span>}
                </div>
              );
            })}
            <div className="sys-cell">
              <b style={{ fontSize: 9 }}>PORTAL DA SEMANA</b>
              <span>O mesmo portal {rankName(top)} para a turma inteira até domingo. Quem vai mais fundo?</span>
              <span>Seu recorde: {h.semana.semana === weekOf() && h.semana.andar ? (h.semana.andar > FLOORS ? `chefe vencido em ${Math.floor(h.semana.tempo / 60)} min` : `andar ${h.semana.andar}`) : 'ainda não jogou'}</span>
              <button className="sys-btn" onClick={() => { play('turn'); onEnter(top, { semana: true }); }}>ENTRAR</button>
            </div>
            <div className={`sys-cell ${nightmareOpen(p) ? '' : 'lock'}`}>
              <b style={{ fontSize: 9, color: '#ff9aa8' }}>MODO PESADELO</b>
              <span>Portal S com elites em toda parte, chefe campeão e +1 de dano em cada golpe. XP ×1,5.</span>
              <span>Vitórias: {h.pesadelo}</span>
              {nightmareOpen(p) ? <button className="sys-btn" onClick={() => { play('turn'); onEnter(5, { pesadelo: true }); }}>ENTRAR</button> : <span style={{ color: '#ff9aa8' }}>Vença o Monarca das Sombras (portal S).</span>}
            </div>
          </div>
          <div className="sys-line" style={{ fontSize: 7, color: '#9ac8f0' }}>5 andares por portal; no 3º, o mini-chefe; no 5º, o chefe. Toque = combo, segure = golpe pesado, esquive no último instante = esquiva perfeita. Os 3 primeiros portais do dia dão moedas e a carta do chefe.</div>
        </>}

        {tab === 'cacador' && <>
          <div className="sys-line">Vida {st.hearts} · Escudo {st.armor} · Mana {st.mana} · Cartas {st.slots} · Poções: {Math.min(MAX_POTIONS, p.itens['pocao:vida'] ?? 0)} de vida e {Math.min(MAX_POTIONS, p.itens['pocao:mana'] ?? 0)} de mana entram no portal</div>
          <div className="sys-line"><b>CAMINHO ({cls.name}, tecla L):</b> {cls.about}</div>
          <div className="sys-line"><b>SOMBRA:</b>
            <button className={`sys-tab ${!h.sombra ? 'on' : ''}`} onClick={() => save(chooseSombra(p, undefined))}>NENHUMA</button>
            {SOMBRAS.map(s => h.sombras.includes(s)
              ? <button key={s} className={`sys-tab ${h.sombra === s ? 'on' : ''}`} onClick={() => save(chooseSombra(p, s), `A sombra ${s} vai com você.`)}>{s.toUpperCase()}</button>
              : <span key={s} className="sys-tab" style={{ opacity: 0.4 }}>{s.toUpperCase()} · chefe {rankName(SOMBRAS.indexOf(s) * 2)} {ARISE_WINS}×</span>)}
          </div>
          <div className="sys-line"><b>CARTAS QUE VIRAM PODER ({h.cartas.length}/{st.slots}):</b> toque para pôr ou tirar</div>
          <div className="sys-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {skillChoices(p).slice(0, 60).map(s => {
              const on = h.cartas.includes(s.card);
              return (
                <button key={s.card} className={`sys-cell ${on ? 'on' : ''}`} style={{ all: 'unset', cursor: 'pointer', padding: 5, border: `1px solid ${on ? '#8ad0ff' : '#2a4a7a'}`, background: on ? 'rgba(90,184,255,.2)' : 'rgba(10,30,70,.5)', fontSize: 7, lineHeight: 1.5, display: 'flex', gap: 5 }}
                  onClick={() => {
                    const ids = on ? h.cartas.filter(x => x !== s.card) : [...h.cartas, s.card];
                    if (!on && h.cartas.length >= st.slots) { setMsg(`Só cabem ${st.slots} cartas no rank ${rankName(rank)}.`); return; }
                    save(setSkills(p, ids));
                  }}>
                  <img src={cardArtUrl(s.card.replace(/\+$/, ''))} alt="" style={{ width: 34, height: 24, objectFit: 'cover', border: `1px solid ${colorsOf(s.card, s.element)[0]}` }} />
                  <span><b>{s.name}</b>{s.lvl > 0 ? ` ${'★'.repeat(s.lvl)}` : ''}<br />{s.dmg} poder · {s.cd}s{s.kit.custo ? ` · paga ${s.kit.custo === 'coracao' ? '1 coração' : '1 escudo'}` : ''}<br /><span style={{ color: '#9ac8f0' }}>{s.kit.about}</span></span>
                </button>
              );
            })}
          </div>
        </>}

        {tab === 'cartas' && <>
          <div className="sys-line">Cada carta de Ataque tem um golpe próprio na masmorra. A MAESTRIA sobe derrotando inimigos com ela: +5% por nível; no 3, um extra (mais um projétil, estado mais longo); no 5, recarga menor.</div>
          <div className="sys-tabs">{(['minhas', 'descobertas', 'todas'] as const).map(f => <button key={f} className={`sys-tab ${filtro === f ? 'on' : ''}`} onClick={() => setFiltro(f)}>{f.toUpperCase()}</button>)}</div>
          <div className="sys-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {codex.filter(({ c }) => filtro === 'todas' || (filtro === 'minhas' ? (p.collection[c.id] ?? 0) > 0 : h.maestria[c.id] !== undefined)).map(({ c, s }) => {
              const known = h.maestria[c.id] !== undefined, kills = h.maestria[c.id] ?? 0, lv = masteryLevel(kills), next = MASTERY_KILLS[lv + 1];
              const tags = kitTags(s);
              return (
                <div key={c.id} className="sys-cell" style={{ borderColor: colorsOf(c.id, c.element)[0] }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <img src={cardArtUrl(c.id)} alt="" style={{ width: 40, height: 28, objectFit: 'cover', filter: known ? 'none' : 'grayscale(1) brightness(.5)' }} />
                    <span><b>{c.name}</b><br />{RARITY_NAME[c.rarity]} · {lv > 0 ? '★'.repeat(lv) : 'maestria 0'}</span>
                  </div>
                  {known ? <>
                    <span>{s.kit.about}</span>
                    <span style={{ color: '#9ac8f0' }}>{tags.formas.join(' · ')}{tags.estados.length ? ` · ${tags.estados.join(', ')}` : ''}</span>
                    {tags.reacoes.length > 0 && <span style={{ color: '#ffd84a' }}>Reação: {tags.reacoes.slice(0, 2).join(' · ')}</span>}
                    <span>{s.dmg} poder · {s.cd}s · {kills} derrotados{next ? ` (nível ${lv + 1} com ${next})` : ' · MAESTRIA MÁXIMA'}</span>
                  </> : <span style={{ color: '#8a9ac8' }}>Não descoberta: use esta carta num portal para ver o que ela faz.</span>}
                </div>
              );
            })}
          </div>
        </>}

        {tab === 'status' && <>
          <div className="sys-line">Nível {lvl} de caçador · {free} ponto{free === 1 ? '' : 's'} para distribuir (1 por nível, até {STAT_MAX} em cada). O efeito é pequeno de propósito: quem decide é a sua habilidade.</div>
          <div className="sys-grid">
            {(Object.keys(STAT_INFO) as (keyof StatPts)[]).map(k => (
              <div key={k} className="sys-cell">
                <b>{STAT_INFO[k].nome}: {h.pontos[k]}/{STAT_MAX}</b>
                <div className="sys-bar"><i style={{ width: `${(h.pontos[k] / STAT_MAX) * 100}%` }} /></div>
                <span>{STAT_INFO[k].about}</span>
                <button className="sys-btn" disabled={free <= 0 || h.pontos[k] >= STAT_MAX} onClick={() => save(spendPoint(p, k), `+1 de ${STAT_INFO[k].nome}`)}>+1</button>
              </div>
            ))}
          </div>
          <div className="sys-actions"><button className="sys-btn alt" onClick={() => save(resetPoints(p), 'Pontos devolvidos: distribua de novo.')}>DEVOLVER OS PONTOS</button></div>
        </>}

        {tab === 'armas' && <>
          <div className="sys-line">Leva para o portal: <b>{WEAPONS.find(w => w.id === h.curta)!.name}</b> (curta) e <b>{WEAPONS.find(w => w.id === h.longa)!.name}</b> (longa). Minério: {['cobre', 'ferro', 'ouro'].map(o => <span key={o} style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}><Icon id={itemIcon(`minerio:${o}`)} size={12} />{p.itens[`minerio:${o}`] ?? 0}</span>)} · <Icon id="moeda" size={12} />{p.coins}</div>
          <div className="sys-grid">
            {WEAPONS.map(w => {
              const lvlW = h.armas[w.id], own = lvlW !== undefined, on = h.curta === w.id || h.longa === w.id;
              const cost = own ? (lvlW! < MAX_WEAPON_LEVEL ? upgradeCost(w, lvlW!) : null) : forgeCost(w);
              return (
                <div key={w.id} className={`sys-cell ${on ? 'on' : ''} ${own ? '' : 'lock'}`} style={{ opacity: 1 }}>
                  <b>{w.name}{own && lvlW ? ` +${lvlW}` : ''}</b>
                  <span>{w.kind === 'curta' ? 'CURTA · combo, golpe pesado, devolve tiros' : `LONGA · ${w.mana ? `${w.mana} mana` : 'sem mana'}`}</span>
                  <span>{Math.round(dps(w) * levelMult(lvlW ?? 0))} de dano por segundo{w.blast ? ' · explode' : ''}{w.pierce ? ' · atravessa' : ''}</span>
                  {cost && <span>{own ? 'Melhorar' : 'Forjar'}: {cost.moedas} moedas + {Object.entries(cost.minerio).map(([k, n]) => `${n} ${itemLabel(k).replace('Minério de ', '')}`).join(', ')}</span>}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {own && !on && <button className="sys-btn" onClick={() => save(equipWeapon(p, w.id), `${w.name} equipada.`)}>LEVAR</button>}
                    {own && cost && <button className="sys-btn alt" onClick={() => { const r = upgradeWeapon(p, w.id); if (r.ok) save(r.progress, `${w.name} melhorou!`); else fail(r); }}>MELHORAR</button>}
                    {!own && <button className="sys-btn" onClick={() => { const r = forgeWeapon(p, w.id); if (r.ok) save(r.progress, `${w.name} forjada!`); else fail(r); }}>FORJAR</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {tab === 'boticaria' && <div className="sys-grid">
          {(['vida', 'mana'] as const).map(w => (
            <div key={w} className="sys-cell">
              <b>Poção de {w === 'vida' ? 'Vida' : 'Mana'}</b>
              <span>3 {w === 'vida' ? 'Ervas de Cura' : 'Ervas de Mana'} → 1 poção. Você tem {p.itens[w === 'vida' ? 'erva:cura' : 'erva:mana'] ?? 0} ervas e {p.itens[`pocao:${w}`] ?? 0} poções.</span>
              <span>{w === 'vida' ? 'Com 1 coração, bebe sozinho (+3).' : 'Sem mana, bebe sozinho (enche).'} Entram até {MAX_POTIONS} por portal.</span>
              <button className="sys-btn" onClick={() => { const r = brew(p, w); if (r.ok) save(r.progress, 'Poção pronta!'); else fail(r); }}>FAZER</button>
            </div>
          ))}
        </div>}

        {tab === 'bau' && <>
          <div className="sys-items">{MASM_ITEMS.filter(k => (p.itens[k] ?? 0) > 0).map(k => <span key={k}><Icon id={itemIcon(k)} size={16} /> {p.itens[k]} {itemLabel(k)}</span>)}</div>
          {!MASM_ITEMS.some(k => (p.itens[k] ?? 0) > 0) && <div className="sys-line">O baú está vazio. O pet cata minério, ervas, cristais, penas e pelos dentro dos portais.</div>}
          <div className="sys-grid">
            {Object.entries(CRYSTAL_DUST).map(([k, c]) => (
              <div key={k} className="sys-cell">
                <b>{itemLabel(k)}</b>
                <span>Cada um vira {c.po} de pó {c.rarity === 'common' ? 'comum' : c.rarity === 'rare' ? 'raro' : 'épico'} da forja de cartas. Você tem {p.itens[k] ?? 0}.</span>
                <button className="sys-btn" disabled={!(p.itens[k] ?? 0)} onClick={() => { const r = crystalsToDust(p, k); if (r.ok) save(r.progress, `+${r.po} de pó!`); else fail(r); }}>VIRAR PÓ</button>
              </div>
            ))}
          </div>
          <div className="sys-line" style={{ fontSize: 7, color: '#9ac8f0' }}>Penas e pelos vendem no Mercado da Cidade WIT. Minério vai para o ferreiro; ervas, para a boticária.</div>
        </>}
        <div className="sys-line" style={{ fontSize: 6, color: '#6a8ab8' }}>Sombra do rank: {RANKS.map((r, k) => `${r}=${sombraOfRank(k)}`).join(' · ')}</div>
      </SystemWindow>
    </div>
  );
}

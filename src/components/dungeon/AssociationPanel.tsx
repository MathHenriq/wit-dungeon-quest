// Associação dos Caçadores, na janela do SISTEMA: portais E…S, status do
// caçador (rank, cartas que viram poder, sombra, missão do dia), ferreiro de
// armas, boticária e o baú do pet (cristal vira pó da forja de cartas).
import { useState } from 'react';
import { loadProgress, saveProgress, type Progress } from '@/game/progress';
import {
  brew, chooseSombra, CRYSTAL_DUST, crystalsToDust, equipWeapon, forgeWeapon, hunterRank, hunterStats, missionNow, nextRank,
  portalOpen, rankName, setSkills, skillChoices, upgradeWeapon, ARISE_WINS, sombraOfRank, MAX_POTIONS, PORTAL_TOWER,
} from '@/game/hunter';
import { forgeCost, upgradeCost, weapon, WEAPONS, MAX_WEAPON_LEVEL, levelMult, dps } from '@/game/dungeon-weapons';
import { RANKS } from '@/game/dungeon';
import { SOMBRAS } from '@/game/hunter-state';
import { itemIcon, itemLabel } from '@/game/items';
import { cardArtUrl } from '@/components/tcg/cardArt';
import { Icon } from '@/components/Icon';
import { EL_COLOR } from './dungeon-vfx';
import { SystemWindow } from './SystemWindow';
import { play } from '@/game/sfx';

export type AssocTab = 'portais' | 'cacador' | 'armas' | 'boticaria' | 'bau';
const TABS: { id: AssocTab; nome: string }[] = [
  { id: 'portais', nome: 'PORTAIS' }, { id: 'cacador', nome: 'CAÇADOR' }, { id: 'armas', nome: 'FERREIRO' }, { id: 'boticaria', nome: 'BOTICÁRIA' }, { id: 'bau', nome: 'BAÚ DO PET' },
];
const PORTAL_NAME = ['Caverna dos Goblins', 'Cripta das Velas', 'Gruta de Gelo', 'Fornalha de Lava', 'Floresta Sombria', 'Castelo das Sombras'];
const SHAPE: Record<string, string> = { projetil: 'projétil', linha: 'raio reto', area: 'área em volta', alvo: 'área no alvo', arco: 'golpe largo', chuva: 'cai do céu' };
const EFFECT: Record<string, string> = { queimar: 'queima', congelar: 'congela', roubar: 'rouba vida', atordoar: 'atordoa' };
const MASM_ITEMS = ['minerio:cobre', 'minerio:ferro', 'minerio:ouro', 'erva:cura', 'erva:mana', 'cristal:azul', 'cristal:roxo', 'cristal:dourado', 'pena', 'pelo', 'pocao:vida', 'pocao:mana'];

export function AssociationPanel({ tab: tab0 = 'portais', onEnter, onClose }: { tab?: AssocTab; onEnter: (rank: number) => void; onClose: () => void }) {
  const [tab, setTab] = useState<AssocTab>(tab0);
  const [p, setP] = useState<Progress>(() => loadProgress());
  const [msg, setMsg] = useState<string | null>(null);
  const save = (q: Progress, text?: string) => { saveProgress(q); setP(q); if (text) { setMsg(text); play('super'); } };
  const fail = (r: object) => { setMsg('reason' in r ? String(r.reason) : 'Não deu.'); play('click'); };
  const h = p.masmorra, rank = hunterRank(h.xp), st = hunterStats(rank), nxt = nextRank(h.xp), mm = missionNow(h);

  return (
    <div className="dg-end" style={{ position: 'fixed', zIndex: 55 }} onPointerDown={onClose}>
      <SystemWindow title="ASSOCIAÇÃO DOS CAÇADORES" sub={`Caçador rank ${rankName(rank)} · ${h.xp} XP${nxt ? ` · faltam ${nxt.falta} para o ${rankName(nxt.rank)}` : ' · rank máximo'}`} onClose={onClose} wide>
        <div className="sys-bar"><i style={{ width: `${(nxt?.pct ?? 1) * 100}%` }} /></div>
        <div className="sys-tabs">{TABS.map(t => <button key={t.id} className={`sys-tab ${tab === t.id ? 'on' : ''}`} onClick={() => { setTab(t.id); setMsg(null); }}>{t.nome}</button>)}</div>
        {msg && <div className="sys-line" style={{ color: '#ffd84a' }}>{msg}</div>}

        {tab === 'portais' && <>
          <div className="sys-line">[MISSÃO DIÁRIA] {mm.m.label}: {mm.feito}/{mm.m.alvo}{mm.pago ? ' · CUMPRIDA' : ''}</div>
          <div className="sys-grid">
            {RANKS.map((r, k) => {
              const open = portalOpen(p, k);
              return (
                <div key={r} className={`sys-cell ${open.ok ? '' : 'lock'}`}>
                  <b style={{ fontSize: 10 }}>RANK {r}</b>
                  <span>{PORTAL_NAME[k]}</span>
                  <span>Chefe vencido: {h.vitorias[k] ?? 0}×{(h.vitorias[k] ?? 0) < ARISE_WINS ? ` (Arise com ${ARISE_WINS})` : ''}</span>
                  {open.ok ? <button className="sys-btn" onClick={() => { play('turn'); onEnter(k); }}>ENTRAR</button> : <span style={{ color: '#ff9aa8' }}>{open.why ?? `Torre andar ${PORTAL_TOWER[k]}`}</span>}
                </div>
              );
            })}
          </div>
          <div className="sys-line" style={{ fontSize: 7, color: '#9ac8f0' }}>3 andares por portal. Espada: mais dano, mais risco. Arma longa: gasta mana, mais segura. Os 3 primeiros portais do dia dão moedas e a carta do chefe.</div>
        </>}

        {tab === 'cacador' && <>
          <div className="sys-line">Vida {st.hearts} · Escudo {st.armor} · Mana {st.mana} · Cartas {st.slots} · Poções: {Math.min(MAX_POTIONS, p.itens['pocao:vida'] ?? 0)} de vida e {Math.min(MAX_POTIONS, p.itens['pocao:mana'] ?? 0)} de mana entram no portal</div>
          <div className="sys-line"><b>SOMBRA:</b>
            <button className={`sys-tab ${!h.sombra ? 'on' : ''}`} onClick={() => save(chooseSombra(p, undefined))}>NENHUMA</button>
            {SOMBRAS.map(s => h.sombras.includes(s)
              ? <button key={s} className={`sys-tab ${h.sombra === s ? 'on' : ''}`} onClick={() => save(chooseSombra(p, s), `A sombra ${s} vai com você.`)}>{s.toUpperCase()}</button>
              : <span key={s} className="sys-tab" style={{ opacity: 0.4 }}>{s.toUpperCase()} · chefe {rankName(SOMBRAS.indexOf(s) * 2)} {ARISE_WINS}×</span>)}
          </div>
          <div className="sys-line"><b>CARTAS QUE VIRAM PODER ({h.cartas.length}/{st.slots}):</b> toque para pôr ou tirar</div>
          <div className="sys-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {skillChoices(p).slice(0, 60).map(s => {
              const on = h.cartas.includes(s.card);
              return (
                <button key={s.card} className={`sys-cell ${on ? 'on' : ''}`} style={{ all: 'unset', cursor: 'pointer', padding: 5, border: `1px solid ${on ? '#8ad0ff' : '#2a4a7a'}`, background: on ? 'rgba(90,184,255,.2)' : 'rgba(10,30,70,.5)', fontSize: 7, lineHeight: 1.5, display: 'flex', gap: 5 }}
                  onClick={() => {
                    const ids = on ? h.cartas.filter(x => x !== s.card) : [...h.cartas, s.card];
                    if (!on && h.cartas.length >= st.slots) { setMsg(`Só cabem ${st.slots} cartas no rank ${rankName(rank)}.`); return; }
                    save(setSkills(p, ids));
                  }}>
                  <img src={cardArtUrl(s.card.replace(/\+$/, ''))} alt="" style={{ width: 34, height: 24, objectFit: 'cover', border: `1px solid ${EL_COLOR[s.element][0]}` }} />
                  <span><b>{s.name}</b><br />{s.dmg} dano · {s.cd}s · {SHAPE[s.shape]}{s.effect ? ` · ${EFFECT[s.effect]}` : ''}{s.ownVfx ? ' · efeito próprio' : ''}</span>
                </button>
              );
            })}
          </div>
        </>}

        {tab === 'armas' && <>
          <div className="sys-line">Leva para o portal: <b>{weapon(h.curta).name}</b> (curta) e <b>{weapon(h.longa).name}</b> (longa). Minério: {['cobre', 'ferro', 'ouro'].map(o => <span key={o} style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}><Icon id={itemIcon(`minerio:${o}`)} size={12} />{p.itens[`minerio:${o}`] ?? 0}</span>)} · <Icon id="moeda" size={12} />{p.coins}</div>
          <div className="sys-grid">
            {WEAPONS.map(w => {
              const lvl = h.armas[w.id], own = lvl !== undefined, on = h.curta === w.id || h.longa === w.id;
              const cost = own ? (lvl! < MAX_WEAPON_LEVEL ? upgradeCost(w, lvl!) : null) : forgeCost(w);
              return (
                <div key={w.id} className={`sys-cell ${on ? 'on' : ''} ${own ? '' : 'lock'}`} style={{ opacity: 1 }}>
                  <b>{w.name}{own && lvl ? ` +${lvl}` : ''}</b>
                  <span>{w.kind === 'curta' ? 'CURTA · corta tiros' : `LONGA · ${w.mana ? `${w.mana} mana` : 'sem mana'}`}</span>
                  <span>{Math.round(dps(w) * levelMult(lvl ?? 0))} de dano por segundo{w.blast ? ' · explode' : ''}{w.pierce ? ' · atravessa' : ''}</span>
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

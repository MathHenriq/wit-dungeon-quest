// Guilda (Castelo, Sir Téo): criar com nome e emblema, entrar pelo código,
// meta de presença da semana, chefe da guilda (cada vitória na Torre de cada
// membro tira 1 de vida; derrubou, todo mundo pega 1 Pacotinho Comum), mentoria
// (escolher um colega 5 andares acima: ele ganha moedas quando você sobe).
import { useEffect, useState } from 'react';
import { bossShare, guildClaim, guildCreate, guildGoalClaim, guildGoals, guildInfo, guildJoin, guildLeave, guildMentor, nickOk, presenceGoal, socialError, socialOn, type GuildGoals, type GuildInfo } from '@/game/social';
import { PACK_BY_ID, type PackId } from '@/game/packs';
import { Icon } from '@/components/Icon';
import { ELEMENT_STYLE } from '@/components/tcg/TcgCard';
import { Symbol } from '@/components/Icon';
import { PxBar, PxBox, PxButton, PxPanel } from '@/components/pixel/Pixel';
import { LookPortrait } from './ProfileCard';
import { play } from '@/game/sfx';

const EMBLEMS = Object.values(ELEMENT_STYLE);

export function GuildEmblem({ i, size = 40 }: { i: number; size?: number }) {
  const e = EMBLEMS[i % EMBLEMS.length];
  return (
    <div className="flex items-center justify-center rounded-md border-2 shrink-0" style={{ width: size, height: size, background: `linear-gradient(160deg, ${e.el}, ${e.el2})`, borderColor: e.el2 }}>
      <Symbol id={e.icon} size={Math.round(size * 0.6)} />
    </div>
  );
}

export function GuildPanel({ onClose }: { onClose: () => void }) {
  const [g, setG] = useState<GuildInfo | null | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [emblem, setEmblem] = useState(0);
  const [code, setCode] = useState('');
  const [goals, setGoals] = useState<GuildGoals | null>(null);
  const load = () => {
    guildInfo().then(setG).catch(e => { setG(null); setMsg(socialError(e)); });
    guildGoals().then(setGoals).catch(() => setGoals(null));
  };
  useEffect(load, []);
  const run = async (f: () => Promise<unknown>, ok: string) => {
    try { await f(); setMsg(ok); play('coin'); load(); } catch (e) { setMsg(socialError(e)); play('lose'); }
  };
  const me = g?.members.find(m => m.eu);

  return (
    <PxPanel title="GUILDA" color="#8a2a3a" onClose={onClose} width={720}>
      {!socialOn() && <div className="text-[8px] leading-4 text-[#6a4a2a]">A guilda precisa estar online (com o banco ligado). Cada guilda é uma equipe da turma: meta de presença, chefe da semana e mentoria.</div>}
      {socialOn() && g === undefined && <div className="text-[8px] text-[#6a4a2a]">Carregando...</div>}
      {socialOn() && g === null && (
        <div className="grid sm:grid-cols-2 gap-3">
          <PxBox>
            <div className="text-[10px] mb-2">CRIAR UMA GUILDA</div>
            <input value={name} maxLength={16} onChange={e => setName(e.target.value)} placeholder="nome da guilda"
              className="w-full px-2 py-1.5 mb-2 text-[10px] rounded border-2 border-[#c8a86e] bg-white" />
            <div className="grid grid-cols-6 gap-1 mb-2">
              {EMBLEMS.map((_, i) => (
                <button key={i} onClick={() => setEmblem(i)} className={`p-0.5 rounded ${emblem === i ? 'ring-2 ring-[#e8a020]' : ''}`}><GuildEmblem i={i} size={34} /></button>
              ))}
            </div>
            <PxButton color="#8a2a3a" disabled={!nickOk(name) || name.trim().length < 3}
              onClick={() => void run(async () => { const r = await guildCreate(name.trim(), emblem); setMsg(`Guilda criada! Código: ${r.code}`); }, 'Guilda criada!')}>CRIAR</PxButton>
            {name && !nickOk(name) && <div className="text-[7px] text-[#b8433a] mt-1">Só letras, números e espaço (3 a 16).</div>}
          </PxBox>
          <PxBox>
            <div className="text-[10px] mb-2">ENTRAR COM O CÓDIGO</div>
            <input value={code} maxLength={5} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ex.: K7P2Q"
              className="w-full px-2 py-1.5 mb-2 text-[12px] tracking-[4px] rounded border-2 border-[#c8a86e] bg-white" />
            <PxButton color="#3a78c8" disabled={code.length !== 5} onClick={() => void run(() => guildJoin(code), 'Você entrou na guilda!')}>ENTRAR</PxButton>
            <div className="text-[7px] leading-4 text-[#6a4a2a] mt-2">Peça o código para quem criou a guilda. Até 12 alunos, de qualquer turma.</div>
          </PxBox>
        </div>
      )}
      {g && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <GuildEmblem i={g.emblem} size={56} />
            <div className="min-w-0">
              <div className="text-[16px] truncate">{g.name.toUpperCase()}</div>
              <div className="text-[8px] text-[#6a4a2a]">CÓDIGO PARA CONVIDAR: <b className="tracking-[3px] text-[#8a2a3a]">{g.code}</b> · {g.members.length}/12</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <PxBox>
              <div className="text-[9px] mb-1">CHEFE DA SEMANA</div>
              <PxBar value={bossShare(g)} color="#c8303a" />
              <div className="text-[7px] leading-4 text-[#6a4a2a] mt-1">
                {g.bossHp > 0 ? `${g.bossHp}/${g.bossMax} de vida. Cada vitória na Torre de cada membro tira 1 (até 15 por pessoa).` : 'Derrotado! Cada membro ganha 1 Pacotinho Comum.'}
              </div>
              {g.bossHp === 0 && (
                <PxButton color="#c8861a" className="mt-1" disabled={g.premio} onClick={() => void run(guildClaim, 'Pacotinho guardado em MEUS PACOTES, na Loja.')}>
                  {g.premio ? 'JÁ PEGOU' : 'PEGAR PRÊMIO'}
                </PxButton>
              )}
            </PxBox>
            <PxBox>
              <div className="text-[9px] mb-1">META DE PRESENÇA</div>
              <PxBar value={presenceGoal(g).total ? presenceGoal(g).done / presenceGoal(g).total : 0} color="#3a9a5a" />
              <div className="text-[7px] leading-4 text-[#6a4a2a] mt-1">{presenceGoal(g).done} de {presenceGoal(g).total} vieram em pelo menos 1 aula nesta semana.</div>
            </PxBox>
          </div>
          {goals && (
            <PxBox>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px]">METAS DA SEMANA</div>
                <div className="text-[9px] text-[#8a2a3a]">{goals.pontos} PONTOS</div>
              </div>
              <div className="text-[7px] leading-4 text-[#6a4a2a] mb-2">A guilda inteira soma. Cada meta cumprida dá pontos no ranking do Salão dos Campeões e 1 pacotinho para cada membro. Zera toda segunda.</div>
              <div className="flex flex-col gap-1.5">
                {goals.metas.map(mt => (
                  <div key={mt.id} className="flex items-center gap-2">
                    <Icon id={mt.icone} size={22} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 text-[8px] leading-3 mb-0.5"><span>{mt.titulo}</span><span className="shrink-0 text-[#8a2a3a]">+{mt.pontos}</span></div>
                      <PxBar value={mt.valor / mt.meta} color={mt.feita ? '#3a9a5a' : '#e8a020'} />
                      <div className="text-[7px] text-[#6a4a2a]">{mt.valor}/{mt.meta}</div>
                    </div>
                    <span title={PACK_BY_ID.get(mt.pack as PackId)?.name}><Icon id={`pacote-${mt.pack}`} size={22} /></span>
                    <PxButton color={mt.resgatada ? '#6a6a7a' : '#c8861a'} disabled={!mt.feita || mt.resgatada}
                      onClick={() => void run(() => guildGoalClaim(mt.id), `${PACK_BY_ID.get(mt.pack as PackId)?.name ?? 'Pacotinho'} guardado em MEUS PACOTES, na Loja.`)}>
                      {mt.resgatada ? 'PEGOU' : 'PEGAR'}
                    </PxButton>
                  </div>
                ))}
              </div>
            </PxBox>
          )}
          <div className="grid sm:grid-cols-2 gap-1.5">
            {g.members.map(mb => {
              const canMentor = me && !mb.eu && mb.andar >= me.andar + 5;
              return (
                <PxBox key={mb.handle} className="flex items-center gap-2">
                  <div className="shrink-0 w-[40px] h-[50px] overflow-hidden flex items-end justify-center bg-[#bfe3ec]"><LookPortrait look={mb.look} size={36} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] truncate">{mb.nick}{mb.role === 'lider' ? ' · LÍDER' : ''}{mb.eu ? ' (você)' : ''}</div>
                    <div className="text-[7px] text-[#5a5470]">ANDAR {mb.andar} · {mb.hits} golpes{mb.presente ? ' · veio na aula' : ''}</div>
                    {mb.mentor && <div className="text-[7px] text-[#3a78c8]">mentor: {g.members.find(x => x.handle === mb.mentor)?.nick ?? '?'}</div>}
                  </div>
                  {canMentor && me?.mentor !== mb.handle && <PxButton color="#3a78c8" onClick={() => void run(() => guildMentor(mb.handle), `${mb.nick} agora é seu mentor.`)}>MENTOR</PxButton>}
                </PxBox>
              );
            })}
          </div>
          <div className="text-[7px] leading-4 text-[#6a4a2a]">Mentoria: escolha um colega pelo menos 5 andares acima. Cada andar novo que você liberar dá 25 moedas para ele.</div>
          <div><PxButton color="#6a6a7a" onClick={() => void run(guildLeave, 'Você saiu da guilda.')}>SAIR DA GUILDA</PxButton></div>
        </div>
      )}
      {msg && <div className="text-[8px] text-[#3a9a5a] mt-2">{msg}</div>}
    </PxPanel>
  );
}

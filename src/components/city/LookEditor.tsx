import { useEffect, useMemo, useRef, useState } from 'react';
import { PxPanel } from '@/components/pixel/Pixel';
import { CLOTH, DEFAULT_PET, HAIR, MODEL_CELL, MODELOS, SKIN, type Look, type Ramp } from '@/game/world/outfit';
import { loadModelSheet, paintModel } from '@/game/world/model-sprite';
import {
  ACC_INFO, ACC_SLOTS, DEFAULT_ACC_COLOR, loadAccessories, tintGray, type AccAssets,
} from '@/game/world/accessories';

/**
 * Tela de visual do personagem: escolhe o modelo e as cores de pele, cabelo,
 * parte de cima e parte de baixo. O boneco grande gira e anda na prévia.
 */

const pixelFont = "font-['Press_Start_2P',monospace]";
const NAMES: Record<string, string> = {
  castanho: 'castanho', preto: 'preto', loiro: 'loiro', ruivo: 'ruivo', rosa: 'rosa', azul: 'azul', lilas: 'lilás',
  verde: 'verde', vermelho: 'vermelho', amarelo: 'amarelo', marinho: 'marinho', roxo: 'roxo', laranja: 'laranja',
  branco: 'branco', jeans: 'jeans', caqui: 'cáqui',
};

function Sprite({ frame, scale }: { frame: HTMLCanvasElement | null; scale: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, c.width, c.height);
    if (frame) x.drawImage(frame, 0, 0);
  }, [frame]);
  return (
    <canvas
      ref={ref}
      width={MODEL_CELL.w}
      height={MODEL_CELL.h}
      style={{ width: MODEL_CELL.w * scale, height: MODEL_CELL.h * scale, imageRendering: 'pixelated' }}
    />
  );
}

function Swatches({ label, table, value, onPick }: {
  label: string; table: Record<string, Ramp>; value: string; onPick: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <div className="text-[9px] text-[#2f6b1e] mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(table).map(([id, r]) => (
          <button
            key={id}
            title={NAMES[id] ?? id}
            aria-label={`${label} ${NAMES[id] ?? id}`}
            onClick={() => onPick(id)}
            className={`w-7 h-7 rounded-md border-2 ${value === id ? 'border-[#1f2a1c] ring-2 ring-[#8cc63f]' : 'border-black/25'}`}
            style={{ background: `linear-gradient(135deg, ${r[3]} 0 30%, ${r[2]} 30% 70%, ${r[1]} 70%)` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Pets do GPT (public/game/sprites/bichos/manifest.json). */
function usePets(): string[] {
  const [pets, setPets] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}game/sprites/bichos/manifest.json`)
      .then(r => r.json())
      .then((j: { sprites?: string[] }) => { if (alive) setPets(j.sprites ?? []); })
      .catch(err => console.error('pets', err));
    return () => { alive = false; };
  }, []);
  return pets;
}

/** Miniatura de um acessório (vista de frente, na cor escolhida). */
function AccThumb({ acc, id, cor }: { acc: AccAssets; id: string; cor?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current, def = acc.manifest[id];
    if (!c || !def) return;
    const [ax, ay, aw, ah] = def.a[0];
    c.width = aw; c.height = ah;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(acc.atlas, ax, ay, aw, ah, 0, 0, aw, ah);
    if (!def.fixo) {
      const d = x.getImageData(0, 0, aw, ah);
      tintGray(d.data, CLOTH[cor ?? DEFAULT_ACC_COLOR]);
      x.putImageData(d, 0, 0);
    }
  }, [acc, id, cor]);
  return <canvas ref={ref} className="max-w-[36px] max-h-[30px]" style={{ imageRendering: 'pixelated' }} />;
}

const petName = (id: string) => id.replace(/^pet-/, '').replace(/-/g, ' ');

export function LookEditor({ value, onChange, onClose }: { value: Look; onChange: (l: Look) => void; onClose: () => void }) {
  const [sheets, setSheets] = useState<Record<string, HTMLImageElement>>({});
  const [tick, setTick] = useState(0);
  const pets = usePets();
  const [acc, setAcc] = useState<AccAssets | null>(null);
  useEffect(() => {
    let alive = true;
    loadAccessories().then(a => { if (alive) setAcc(a); }).catch(err => console.error('acessórios', err));
    return () => { alive = false; };
  }, []);
  const pet = value.pet ?? DEFAULT_PET;

  useEffect(() => {
    let alive = true;
    Promise.all(MODELOS.map(async m => [m, await loadModelSheet(m)] as const))
      .then(list => { if (alive) setSheets(Object.fromEntries(list)); })
      .catch(err => console.error('modelos', err));
    return () => { alive = false; };
  }, []);

  // prévia: anda 4 passos em cada direção
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 180);
    return () => window.clearInterval(id);
  }, []);

  const painted = useMemo(() => Object.fromEntries(
    MODELOS.filter(m => sheets[m]).map(m => [m, paintModel(sheets[m], { ...value, modelo: m }, acc)]),
  ), [sheets, value, acc]);
  const cur = painted[value.modelo];
  const dirRow = [0, 1, 3, 2][Math.floor(tick / 16) % 4];
  const preview = cur ? cur[dirRow][tick % 4] : null;
  const set = (patch: Partial<Look>) => onChange({ ...value, ...patch });

  return (
    <PxPanel title="SEU VISUAL" color="#2f6b1e" onClose={onClose} width={740}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex sm:flex-col items-center justify-center gap-2 rounded-lg bg-[#9fd67a] border-2 border-[#5aa33a] p-3 sm:w-[190px] sm:h-[220px] sm:sticky sm:top-0 sm:self-start shrink-0">
            <Sprite frame={preview} scale={2} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="apelido" className="block text-[9px] text-[#2f6b1e] mb-1">APELIDO</label>
            <input
              id="apelido"
              value={value.apelido ?? ''}
              maxLength={14}
              placeholder="Seu apelido"
              onChange={e => set({ apelido: e.target.value })}
              onKeyDown={e => e.stopPropagation()}
              className="w-full mb-3 px-2 py-2 rounded-md border-2 border-[#2f6b1e]/40 bg-white text-[11px] text-[#1f2a1c] focus:outline-none focus:border-[#2f6b1e]"
            />
            <div className="text-[9px] text-[#2f6b1e] mb-1">MODELO</div>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {MODELOS.map((m, i) => (
                <button
                  key={m}
                  aria-label={`modelo ${i + 1}`}
                  onClick={() => set({ modelo: m })}
                  className={`flex items-end justify-center rounded-md border-2 bg-white pt-1 ${value.modelo === m ? 'border-[#2f6b1e] ring-2 ring-[#8cc63f]' : 'border-black/15'}`}
                >
                  <Sprite frame={painted[m]?.[0][0] ?? null} scale={1} />
                </button>
              ))}
            </div>
            <Swatches label="PELE" table={SKIN} value={value.pele} onPick={v => set({ pele: v })} />
            <Swatches label="CABELO" table={HAIR} value={value.cabelo} onPick={v => set({ cabelo: v })} />
            <Swatches label="PARTE DE CIMA" table={CLOTH} value={value.cima} onPick={v => set({ cima: v })} />
            <Swatches label="PARTE DE BAIXO" table={CLOTH} value={value.baixo} onPick={v => set({ baixo: v })} />
            {acc && ACC_SLOTS.map(({ id: slot, nome }) => {
              const cur = value.acc?.[slot];
              const wear = (v: { id: string; cor?: string } | null) => {
                const next = { ...(value.acc ?? {}) };
                if (v) next[slot] = v; else delete next[slot];
                set({ acc: Object.keys(next).length ? next : undefined });
              };
              const ids = Object.keys(ACC_INFO).filter(k => ACC_INFO[k].slot === slot && acc.manifest[k]);
              return (
                <div key={slot} className="mb-3">
                  <div className="text-[9px] text-[#2f6b1e] mb-1">{nome}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => wear(null)} aria-label={`${nome} nenhum`}
                      className={`w-11 h-10 rounded-md border-2 bg-white text-[8px] text-[#2f6b1e] ${!cur ? 'border-[#2f6b1e] ring-2 ring-[#8cc63f]' : 'border-black/15'}`}>—</button>
                    {ids.map(id => (
                      <button key={id} title={acc.manifest[id].nome} aria-label={acc.manifest[id].nome}
                        onClick={() => wear({ id, cor: cur?.cor })}
                        className={`w-11 h-10 rounded-md border-2 bg-white flex items-center justify-center ${cur?.id === id ? 'border-[#2f6b1e] ring-2 ring-[#8cc63f]' : 'border-black/15'}`}>
                        <AccThumb acc={acc} id={id} cor={cur?.id === id ? cur.cor : undefined} />
                      </button>
                    ))}
                  </div>
                  {cur && !acc.manifest[cur.id]?.fixo && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(CLOTH).map(([cid, r]) => (
                        <button key={cid} aria-label={`cor ${cid}`} onClick={() => wear({ ...cur, cor: cid })}
                          className={`w-6 h-6 rounded border-2 ${(cur.cor ?? DEFAULT_ACC_COLOR) === cid ? 'border-[#1f2a1c] ring-2 ring-[#8cc63f]' : 'border-black/25'}`}
                          style={{ background: `linear-gradient(135deg, ${r[3]} 0 30%, ${r[2]} 30% 70%, ${r[1]} 70%)` }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {pets.length > 0 && (
              <>
                <div className="text-[9px] text-[#2f6b1e] mb-1">PET</div>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                  {pets.map(id => (
                    <button
                      key={id}
                      title={petName(id)}
                      aria-label={`pet ${petName(id)}`}
                      onClick={() => set({ pet: id })}
                      className={`flex items-center justify-center rounded-md border-2 bg-white h-12 ${pet === id ? 'border-[#2f6b1e] ring-2 ring-[#8cc63f]' : 'border-black/15'}`}
                    >
                      <div
                        style={{
                          width: 48, height: 48, imageRendering: 'pixelated',
                          backgroundImage: `url(${import.meta.env.BASE_URL}game/sprites/bichos/${id}.png)`,
                          backgroundPosition: '0 0',
                        }}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
    </PxPanel>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { CLOTH, HAIR, MODEL_CELL, MODELOS, SKIN, type Look, type Ramp } from '@/game/world/outfit';
import { loadModelSheet, paintModel } from '@/game/world/model-sprite';

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

export function LookEditor({ value, onChange, onClose }: { value: Look; onChange: (l: Look) => void; onClose: () => void }) {
  const [sheets, setSheets] = useState<Record<string, HTMLImageElement>>({});
  const [tick, setTick] = useState(0);

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
    MODELOS.filter(m => sheets[m]).map(m => [m, paintModel(sheets[m], { ...value, modelo: m })]),
  ), [sheets, value]);
  const cur = painted[value.modelo];
  const dirRow = [0, 1, 3, 2][Math.floor(tick / 16) % 4];
  const preview = cur ? cur[dirRow][tick % 4] : null;
  const set = (patch: Partial<Look>) => onChange({ ...value, ...patch });

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-3" onPointerDown={onClose}>
      <div
        onPointerDown={e => e.stopPropagation()}
        className={`w-[min(94vw,720px)] max-h-[92vh] overflow-y-auto rounded-xl border-4 border-[#2f6b1e] bg-[#f4f8ef] p-4 text-[#1f2a1c] ${pixelFont}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] text-[#2f6b1e]">SEU VISUAL</div>
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-[#2f6b1e] text-white text-[10px]">PRONTO</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex sm:flex-col items-center justify-center gap-2 rounded-lg bg-[#9fd67a] border-2 border-[#5aa33a] p-3 sm:w-[190px] shrink-0">
            <Sprite frame={preview} scale={2} />
          </div>
          <div className="flex-1 min-w-0">
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
          </div>
        </div>
      </div>
    </div>
  );
}

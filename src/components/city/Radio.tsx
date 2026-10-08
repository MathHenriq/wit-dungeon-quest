// Botão e plaquinha do Rádio WIT na cidade (radio.ts): liga a trilha com as
// músicas dos alunos, baixinho, e mostra o que está tocando.
import { useEffect, useRef, useState } from 'react';
import { areaTheme, playlist, RADIO_STEPS } from '@/game/radio';
import { loadProgress } from '@/game/progress';
import { audio } from '@/game/sfx';
import { loopSong } from '@/components/work/synth';

const KEY = 'wit.radio';

/** `zone` e `hour`: a música da cidade (tema da área, de dia ou de noite) entra na fila. */
export function Radio({ className, zone, hour }: { className: string; zone?: string; hour?: number }) {
  const [on, setOn] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });
  const [now, setNow] = useState<string | null>(null);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => {
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* sem armazenamento */ }
    if (!on) return;
    const a = audio();
    if (!a) return;
    const vol = a.createGain(); vol.gain.value = 0.35; vol.connect(a.destination);
    const list = playlist(loadProgress().musicas, zone ? areaTheme(zone, hour ?? 12) : undefined);
    let k = 0, steps = 0;
    setNow(list[0].nome);
    stop.current = loopSong(() => list[k % list.length], s => {
      if (s < 0) return;
      if (++steps >= RADIO_STEPS) { steps = 0; k++; setNow(list[k % list.length].nome); }
    }, vol);
    return () => { stop.current?.(); vol.disconnect(); setNow(null); };
  // a área muda (ou vira noite): recomeça com o tema novo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, zone, (hour ?? 12) >= 19 || (hour ?? 12) < 6]);
  return (
    <button onClick={() => setOn(o => !o)} title="Rádio WIT: o tema da área e as músicas dos alunos" className={className}>
      {on ? `RÁDIO: ${(now ?? '').toUpperCase().slice(0, 18)}` : 'RÁDIO'}
    </button>
  );
}

// Botão e plaquinha do Rádio WIT na cidade (radio.ts): liga a trilha com as
// músicas dos alunos, baixinho, e mostra o que está tocando.
import { useEffect, useRef, useState } from 'react';
import { playlist, RADIO_STEPS } from '@/game/radio';
import { loadProgress } from '@/game/progress';
import { audio } from '@/game/sfx';
import { loopSong } from '@/components/work/synth';

const KEY = 'wit.radio';

export function Radio({ className }: { className: string }) {
  const [on, setOn] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });
  const [now, setNow] = useState<string | null>(null);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => {
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* sem armazenamento */ }
    if (!on) return;
    const a = audio();
    if (!a) return;
    const vol = a.createGain(); vol.gain.value = 0.35; vol.connect(a.destination);
    const list = playlist(loadProgress().musicas);
    let k = 0, steps = 0;
    setNow(list[0].nome);
    stop.current = loopSong(() => list[k % list.length], s => {
      if (s < 0) return;
      if (++steps >= RADIO_STEPS) { steps = 0; k++; setNow(list[k % list.length].nome); }
    }, vol);
    return () => { stop.current?.(); vol.disconnect(); setNow(null); };
  }, [on]);
  return (
    <button onClick={() => setOn(o => !o)} title="Rádio WIT: as músicas dos alunos" className={className}>
      {on ? `RÁDIO: ${(now ?? '').toUpperCase().slice(0, 18)}` : 'RÁDIO'}
    </button>
  );
}

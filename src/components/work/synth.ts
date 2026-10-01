// Instrumentos do Estúdio de Música, sintetizados no navegador (Web Audio):
// teclado, violão (corda dedilhada, Karplus-Strong), flauta e xilofone, mais
// a bateria (bumbo, caixa, chimbal, palma). Nenhum arquivo de som.
import { audio } from '@/game/sfx';
import { DRUMS, NOTES, STEPS, type InstrumentId, type Song } from '@/game/music';

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

let noise: AudioBuffer | null = null;
function noiseBuf(a: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === a.sampleRate) return noise;
  const b = a.createBuffer(1, a.sampleRate, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (noise = b);
}

const strings = new Map<number, AudioBuffer>();
/** Corda dedilhada (Karplus-Strong): ruído curto que vai se suavizando num laço do tamanho da onda. */
function pluck(a: AudioContext, midi: number): AudioBuffer {
  const hit = strings.get(midi);
  if (hit && hit.sampleRate === a.sampleRate) return hit;
  const sr = a.sampleRate, len = Math.floor(sr * 1.4), b = a.createBuffer(1, len, sr), d = b.getChannelData(0);
  const period = Math.round(sr / freq(midi));
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  let k = 0;
  for (let i = 0; i < len; i++) {
    const next = (k + 1) % period;
    ring[k] = (ring[k] + ring[next]) * 0.4985;
    d[i] = ring[k];
    k = next;
  }
  strings.set(midi, b);
  return b;
}

function env(a: AudioContext, t: number, attack: number, peak: number, release: number): GainNode {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  return g;
}

export function playNote(inst: InstrumentId, midi: number, t: number, dur: number, out?: AudioNode): void {
  const a = audio();
  if (!a) return;
  const dest = out ?? a.destination;
  const f = freq(midi);
  if (inst === 'violao') {
    const s = a.createBufferSource(); s.buffer = pluck(a, midi);
    const g = env(a, t, 0.004, 0.5, Math.max(0.6, dur * 2));
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    s.connect(lp).connect(g).connect(dest); s.start(t); s.stop(t + 1.4);
    return;
  }
  if (inst === 'xilofone') {
    for (const [mul, vol] of [[1, 0.35], [3.9, 0.08], [9.2, 0.03]] as const) {
      const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul;
      const g = env(a, t, 0.002, vol, 0.45 / (mul > 1 ? 2 : 1));
      o.connect(g).connect(dest); o.start(t); o.stop(t + 0.6);
    }
    return;
  }
  if (inst === 'flauta') {
    const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const vib = a.createOscillator(), vg = a.createGain(); vib.frequency.value = 5.5; vg.gain.value = f * 0.008;
    vib.connect(vg).connect(o.frequency);
    const breath = a.createBufferSource(); breath.buffer = noiseBuf(a);
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 6;
    const bg = env(a, t, 0.04, 0.025, dur);
    const g = env(a, t, 0.05, 0.3, Math.max(0.2, dur));
    o.connect(g).connect(dest); breath.connect(bp).connect(bg).connect(dest);
    o.start(t); vib.start(t); breath.start(t);
    const end = t + Math.max(0.3, dur) + 0.1; o.stop(end); vib.stop(end); breath.stop(end);
    return;
  }
  // teclado: duas ondas (quadrada suave + triângulo), com queda de piano
  for (const [type, vol, det] of [['triangle', 0.3, 0], ['square', 0.06, 4]] as const) {
    const o = a.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const g = env(a, t, 0.005, vol, Math.max(0.35, dur * 1.6));
    o.connect(lp).connect(g).connect(dest); o.start(t); o.stop(t + Math.max(0.4, dur * 1.6) + 0.05);
  }
}

export function playDrum(i: number, t: number, out?: AudioNode): void {
  const a = audio();
  if (!a) return;
  const dest = out ?? a.destination;
  const nz = (dur: number, type: BiquadFilterType, f: number, vol: number, q = 1) => {
    const s = a.createBufferSource(); s.buffer = noiseBuf(a);
    const flt = a.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
    const g = env(a, t, 0.002, vol, dur);
    s.connect(flt).connect(g).connect(dest); s.start(t); s.stop(t + dur + 0.05);
  };
  if (DRUMS[i] === 'BUMBO') {
    const o = a.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = env(a, t, 0.003, 0.9, 0.28);
    o.connect(g).connect(dest); o.start(t); o.stop(t + 0.35);
  } else if (DRUMS[i] === 'CAIXA') {
    nz(0.16, 'highpass', 1200, 0.45);
    const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = 190;
    const g = env(a, t, 0.002, 0.25, 0.09); o.connect(g).connect(dest); o.start(t); o.stop(t + 0.12);
  } else if (DRUMS[i] === 'CHIMBAL') {
    nz(0.05, 'highpass', 7000, 0.25);
  } else {
    for (const d of [0, 0.012, 0.024]) {
      const s = a.createBufferSource(); s.buffer = noiseBuf(a);
      const flt = a.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 1500; flt.Q.value = 1.2;
      const g = env(a, t + d, 0.001, 0.4, 0.06);
      s.connect(flt).connect(g).connect(dest); s.start(t + d); s.stop(t + d + 0.1);
    }
  }
}

/**
 * Toca a música em laço. `onStep` avisa o tempo tocando agora (para a luz da
 * grade). Devolve a função de parar. Agenda um pouco adiante (o relógio do
 * áudio é preciso; o do navegador, não).
 */
export function loopSong(getSong: () => Pick<Song, 'inst' | 'bpm' | 'notas' | 'bateria'>, onStep: (step: number) => void): () => void {
  const a = audio();
  if (!a) return () => undefined;
  let step = 0, next = a.currentTime + 0.06;
  const timers: number[] = [];
  const tick = () => {
    const song = getSong();
    const stepDur = 60 / song.bpm / 4;   // semicolcheias
    while (next < a.currentTime + 0.12) {
      const s = step % STEPS;
      for (const row of song.notas[s]) playNote(song.inst, NOTES[row].midi, next, stepDur * 2);
      for (const d of song.bateria[s]) playDrum(d, next);
      const at = (next - a.currentTime) * 1000;
      timers.push(window.setTimeout(() => onStep(s), Math.max(0, at)));
      next += stepDur; step++;
    }
  };
  const id = window.setInterval(tick, 25);
  tick();
  return () => { window.clearInterval(id); timers.forEach(t => window.clearTimeout(t)); onStep(-1); };
}

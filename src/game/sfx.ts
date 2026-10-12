// Efeitos sonoros curtos, sintetizados no navegador (Web Audio): nenhum arquivo,
// nada pago. Cada som é uma receita de poucos osciladores e ruído. O botão de
// mudo guarda a escolha no navegador (`wit.som`).

export type Sfx = 'card' | 'drop' | 'draw' | 'flip' | 'hit' | 'bigHit' | 'super' | 'trap' | 'coin' | 'win' | 'lose' | 'click' | 'turn' | 'burn';

const KEY = 'wit.som';
let ctx: AudioContext | null = null;
let muted = (() => { try { return localStorage.getItem(KEY) === 'mudo'; } catch { return false; } })();

export const isMuted = () => muted;
export function setMuted(v: boolean): void {
  muted = v;
  try { localStorage.setItem(KEY, v ? 'mudo' : 'som'); } catch { /* sem armazenamento */ }
}

export function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Um tom com envelope rápido (ataque curto, queda exponencial). */
function tone(a: AudioContext, t: number, freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

/** Um sopro de ruído filtrado (papel, vento, impacto). */
function noise(a: AudioContext, t: number, dur: number, vol: number, from: number, to: number, q = 1) {
  const len = Math.ceil(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t); src.stop(t + dur);
}

export function play(s: Sfx): void {
  // avisa quem quer reagir ao som (o palco dos minijogos solta faíscas no acerto)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('wit-sfx', { detail: s }));
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.005;
  switch (s) {
    case 'card': noise(a, t, 0.16, 0.25, 900, 3500, 0.8); break;                       // carta saindo da mão
    case 'drop': noise(a, t, 0.08, 0.35, 2500, 600, 1.2); tone(a, t, 180, 0.09, 'triangle', 0.12); break; // carta batendo na mesa
    case 'draw': noise(a, t, 0.12, 0.18, 3000, 1500, 1); break;                        // compra
    case 'flip': noise(a, t, 0.06, 0.2, 4000, 2000, 2); break;
    case 'hit': noise(a, t, 0.18, 0.5, 900, 120, 0.7); tone(a, t, 150, 0.18, 'square', 0.12, 60); break;
    case 'bigHit': noise(a, t, 0.35, 0.7, 700, 60, 0.6); tone(a, t, 110, 0.35, 'sawtooth', 0.16, 40); tone(a, t + 0.02, 70, 0.4, 'sine', 0.3, 35); break;
    case 'super': [660, 880, 1320].forEach((f, i) => tone(a, t + i * 0.06, f, 0.18, 'square', 0.07)); break;
    case 'trap': tone(a, t, 440, 0.12, 'square', 0.08); tone(a, t + 0.1, 330, 0.25, 'square', 0.08, 220); break;
    case 'coin': tone(a, t, 988, 0.08, 'square', 0.06); tone(a, t + 0.07, 1319, 0.2, 'square', 0.06); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(a, t + i * 0.11, f, i === 3 ? 0.5 : 0.14, 'square', 0.08)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(a, t + i * 0.16, f, i === 3 ? 0.6 : 0.2, 'triangle', 0.12)); break;
    case 'click': tone(a, t, 700, 0.05, 'square', 0.05); break;
    case 'turn': tone(a, t, 523, 0.1, 'triangle', 0.1); tone(a, t + 0.09, 784, 0.18, 'triangle', 0.1); break;
    case 'burn': noise(a, t, 0.3, 0.2, 400, 1800, 0.5); break;
  }
}

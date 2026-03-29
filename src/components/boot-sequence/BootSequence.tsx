import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { GlitchOverlay } from './GlitchOverlay';
import { DiveEffect } from './DiveEffect';
import './BootSequence.css';

interface SystemCheck {
  id: string;
  label: string;
  duration: number;
}

const SYSTEM_CHECKS: SystemCheck[] = [
  { id: 'auth',      label: 'Autenticação de Usuário',     duration: 1.2 },
  { id: 'database',  label: 'Conexão com Banco de Dados',  duration: 1.0 },
  { id: 'classroom', label: 'Integração Google Classroom', duration: 1.2 },
  { id: 'realtime',  label: 'Sistema de Tempo Real',       duration: 0.9 },
  { id: 'graphics',  label: 'Motor Gráfico 3D',            duration: 1.4 },
  { id: 'audio',     label: 'Sistema de Áudio',            duration: 0.7 },
  { id: 'complete',  label: 'Sistema Pronto',              duration: 0.6 },
];

// Typing click via Web Audio API — no external files needed
let audioCtx: AudioContext | null = null;
function playTypeSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 600 + Math.random() * 400;
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.025);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.025);
  } catch { /* silently ignore if AudioContext blocked */ }
}

export function BootSequence() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentCheck, setCurrentCheck] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showGlitch, setShowGlitch] = useState(false);
  const [showDive, setShowDive] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline();

    SYSTEM_CHECKS.forEach((check, index) => {
      tl.call(() => {
        setCurrentCheck(index);
        typewriterEffect(check.label, index);
      });
      tl.to({}, { duration: check.duration });
      tl.to({}, {
        duration: 0.1,
        onUpdate: () => {
          const prog = ((index + 1) / SYSTEM_CHECKS.length) * 100;
          setProgress(prog);
        },
      });
    });

    tl.to('.system-checks', { filter: 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.8))', duration: 0.5 });
    tl.to('.progress-fill', { scaleX: 1, duration: 0.5, ease: 'power2.inOut' });
    tl.to('.boot-content', { opacity: 0, duration: 1, ease: 'power2.inOut' });
    tl.call(() => setShowDive(true));
    tl.to({}, { duration: 5 });
    tl.call(() => setShowGlitch(true));
    tl.to({}, { duration: 0.5 });
    tl.to('.boot-container', {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        localStorage.setItem('hasSeenIntro', 'true');
        navigate('/login');
      },
    });
  }, { scope: containerRef });

  const typewriterEffect = (text: string, index: number) => {
    const element = document.getElementById(`check-${index}`);
    if (!element) return;

    let charIndex = 0;
    const interval = setInterval(() => {
      if (charIndex < text.length) {
        element.textContent += text[charIndex];
        charIndex++;
        playTypeSound();
      } else {
        clearInterval(interval);
        const checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        checkmark.textContent = ' ✓';
        element.appendChild(checkmark);
      }
    }, 30);
  };

  return (
    <div ref={containerRef} className="boot-container">
      {showDive && <DiveEffect />}
      {showGlitch && <GlitchOverlay />}

      {!showDive && (
        <div className="boot-content">
          <div className="system-checks">
            <div className="checks-title">INICIALIZANDO SISTEMAS</div>
            {SYSTEM_CHECKS.map((check, index) => (
              <div
                key={check.id}
                className={`check-item ${index <= currentCheck ? 'active' : ''} ${
                  index < currentCheck ? 'complete' : ''
                }`}
              >
                <span id={`check-${index}`} className="check-label"></span>
              </div>
            ))}
          </div>

          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-text">{Math.round(progress)}%</div>
          </div>

          <div className="scanline" />
        </div>
      )}
    </div>
  );
}

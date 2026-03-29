import { useEffect, useRef, useState, useCallback } from 'react'; // useCallback kept for onCheckTyped
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ParticleField } from './ParticleField';
import { GlitchOverlay } from './GlitchOverlay';
import './BootSequence.css';

interface SystemCheck {
  id: string;
  label: string;
  duration: number;
}

const SYSTEM_CHECKS: SystemCheck[] = [
  { id: 'auth',      label: 'Autenticação de Usuário',       duration: 0.8 },
  { id: 'database',  label: 'Conexão com Banco de Dados',    duration: 0.6 },
  { id: 'classroom', label: 'Integração Google Classroom',   duration: 0.7 },
  { id: 'realtime',  label: 'Sistema de Tempo Real',         duration: 0.5 },
  { id: 'graphics',  label: 'Motor Gráfico 3D',              duration: 0.9 },
  { id: 'audio',     label: 'Sistema de Áudio',              duration: 0.4 },
  { id: 'complete',  label: 'Sistema Pronto',                duration: 0.3 },
];

type CheckState = 'hidden' | 'typing' | 'complete';

interface BootSequenceProps {
  onComplete: () => void;
}

function TypewriterLabel({
  text,
  state,
  onDone,
}: {
  text: string;
  state: CheckState;
  onDone: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const doneRef = useRef(false);

  useEffect(() => {
    if (state !== 'typing') return;
    doneRef.current = false;
    setDisplayed('');
    let idx = 0;
    const id = setInterval(() => {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx >= text.length) {
        clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      }
    }, 28);
    return () => clearInterval(id);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'complete') {
    return (
      <span className="boot-check-label">
        {text}
        <span className="boot-checkmark"> ✓</span>
      </span>
    );
  }

  return <span className="boot-check-label">{displayed}</span>;
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const [checkStates, setCheckStates] = useState<CheckState[]>(
    SYSTEM_CHECKS.map(() => 'hidden')
  );
  const [progress, setProgress] = useState(0);
  const [showGlitch, setShowGlitch] = useState(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Advance to next check after typewriter finishes
  const onCheckTyped = useCallback((index: number) => {
    setCheckStates(prev => {
      const next = [...prev];
      next[index] = 'complete';
      if (index + 1 < SYSTEM_CHECKS.length) next[index + 1] = 'typing';
      return next;
    });
    setProgress(((index + 1) / SYSTEM_CHECKS.length) * 100);
    tlRef.current?.resume();
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({ paused: false });
    tlRef.current = tl;

    // Phase 1 — logo entrance (1.5s)
    tl.from('.boot-logo', {
      scale: 0,
      rotation: 540,
      opacity: 0,
      duration: 1.5,
      ease: 'back.out(1.7)',
    });

    // Divider line expand
    tl.to('.boot-logo-divider', {
      width: 240,
      duration: 0.8,
      ease: 'power2.out',
    }, '-=0.6');

    // Phase 2 — logo pulse
    tl.to('.boot-logo', {
      scale: 1.05,
      duration: 0.25,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    });

    // Phase 3 — system checks (pause & resume driven by typewriter)
    SYSTEM_CHECKS.forEach((_, index) => {
      tl.call(() => {
        setCheckStates(prev => {
          const next = [...prev];
          next[index] = 'typing';
          return next;
        });
        // Pause; TypewriterLabel calls resume via onCheckTyped when done
        tl.pause();
      });
      // Small gap after each resume before starting next check
      tl.to({}, { duration: 0.05 });
    });

    // Phase 4 — green glow on checks
    tl.to('.boot-system-checks', {
      filter: 'drop-shadow(0 0 18px rgba(0, 255, 136, 0.7))',
      duration: 0.4,
    });

    // Phase 5 — glitch + flash
    tl.call(() => setShowGlitch(true));
    tl.to({}, { duration: 0.6 });

    // Phase 6 — fade out + complete callback
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        localStorage.setItem('wit_boot_seen', 'true');
        onComplete();
      },
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="boot-container">
      {/* Background particles */}
      <ParticleField />

      {/* Scanline */}
      <div className="boot-scanline" />

      {/* Corner brackets */}
      <div className="boot-corner boot-corner-tl" />
      <div className="boot-corner boot-corner-tr" />
      <div className="boot-corner boot-corner-bl" />
      <div className="boot-corner boot-corner-br" />

      {/* Glitch overlay */}
      {showGlitch && <GlitchOverlay />}

      {/* Main content */}
      <div className="boot-content">
        {/* Logo */}
        <div className="boot-logo">
          <div className="boot-logo-text">WIT</div>
          <div className="boot-logo-subtext">DUNGEON</div>
          <div ref={dividerRef} className="boot-logo-divider" />
          <div className="boot-logo-version">v2.0</div>
        </div>

        {/* System checks */}
        <div className="boot-system-checks">
          <div className="boot-checks-title">INICIALIZANDO SISTEMAS</div>
          {SYSTEM_CHECKS.map((check, index) => {
            const state = checkStates[index];
            return (
              <div
                key={check.id}
                className={`boot-check-item ${state !== 'hidden' ? 'visible' : ''} ${state}`}
              >
                <span className="boot-check-arrow">{'>'}</span>
                <TypewriterLabel
                  text={check.label}
                  state={state}
                  onDone={() => onCheckTyped(index)}
                />
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="boot-progress-container">
          <div className="boot-progress-bar">
            <div
              className="boot-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="boot-progress-text">{Math.round(progress)}%</div>
        </div>
      </div>
    </div>
  );
}

// BootSequenceWrapper removed — intro flow is now handled by IntroRouter
// at src/components/IntroRouter.tsx using the hasSeenIntro localStorage key.

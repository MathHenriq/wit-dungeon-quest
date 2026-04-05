import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CrucibleSymbol } from './CrucibleSymbol';
import { ArenaBackground } from './ArenaBackground';
import type { PvpProfile } from './pvp-types';
import { getDivision } from './pvp-types';

type QueueState = 'idle' | 'searching' | 'found';

interface ArenaHeroProps {
  profile: PvpProfile;
  queueState: QueueState;
  onToggleQueue: () => void;
}

const QUEUE_LABELS: Record<QueueState, string> = {
  idle:      'Entrar na Fila',
  searching: 'Buscando Oponente...',
  found:     'Oponente Encontrado',
};

export function ArenaHero({ profile, queueState, onToggleQueue }: ArenaHeroProps) {
  const symbolRef  = useRef<HTMLDivElement>(null);
  const titleRef   = useRef<HTMLDivElement>(null);
  const buttonRef  = useRef<HTMLButtonElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);
  const arcsRef    = useRef<SVGSVGElement>(null);
  const flashRef   = useRef<HTMLDivElement>(null);

  const div = getDivision(profile.elo);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.from(symbolRef.current,  { scale: 0.45, opacity: 0, duration: 0.9, ease: 'power3.out' })
      .from(titleRef.current,   { y: 22, opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.4')
      .from(buttonRef.current,  { y: 14, opacity: 0, duration: 0.4, ease: 'power2.out' }, '-=0.25')
      .from(statsRef.current,   { y: 10, opacity: 0, duration: 0.35, ease: 'power2.out' }, '-=0.2');

    // Animate ritual arcs (draw-on effect)
    if (arcsRef.current) {
      const paths = arcsRef.current.querySelectorAll('path');
      paths.forEach((path) => {
        const len = (path as SVGPathElement).getTotalLength?.() ?? 800;
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, { strokeDashoffset: 0, duration: 2.5, delay: 0.2, ease: 'power1.inOut' });
      });
    }
  }, []);

  // Flash animation when opponent found
  useEffect(() => {
    if (queueState === 'found' && flashRef.current) {
      gsap.to(flashRef.current, { opacity: 0.5, duration: 0.15, yoyo: true, repeat: 3 });
      if (symbolRef.current) {
        gsap.to(symbolRef.current, { scale: 1.18, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      }
    }
  }, [queueState]);

  return (
    <section className="arena-hero">
      {/* Flash overlay (ref passed to section's parent — ArenaBackground handles it) */}
      <div ref={flashRef} className="arena-flash" />

      <ArenaBackground />

      {/* Symbol */}
      <div ref={symbolRef}>
        <CrucibleSymbol size={148} />
      </div>

      {/* Title */}
      <div ref={titleRef} style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div className="arena-title-main">Arena PVP</div>
        <div className="arena-title-divider" />
        <div className="arena-title-sub">Crucible &mdash; Campo de Batalha</div>
      </div>

      {/* Queue button */}
      <button
        ref={buttonRef}
        className={`queue-button ${queueState}`}
        onClick={onToggleQueue}
      >
        {QUEUE_LABELS[queueState]}
      </button>

      {/* Player stats */}
      <div ref={statsRef} className="arena-player-stats">
        <span className="elo-value" style={{ color: div.color }}>{profile.elo} ELO</span>
        {'  '}&mdash;{'  '}
        {div.name} {div.tier === 1 ? 'I' : div.tier === 2 ? 'II' : 'III'}
        {'  '}&mdash;{'  '}
        {profile.wins}V &nbsp;{profile.losses}D
      </div>
    </section>
  );
}

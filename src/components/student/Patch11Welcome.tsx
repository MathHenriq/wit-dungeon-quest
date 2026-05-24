// Patch11Welcome — Season 2 / Patch 1.1 landing modal.
//
// Renders ONCE per student, the next time they log in after the
// SQL wipe (`SELECT apply_patch11_wipe();`) has flagged their row.
// Once the student dismisses it, mark_patch11_seen() flips the
// seen flag and the modal never re-fires.
//
// Visual: full-screen dark glass, Orbitron + Rajdhani fonts,
// GSAP fade+scale entry. Copy lives in src/content/patch-1-1-message.tsx
// so non-engineers can edit without touching JSX.

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { GameIcon } from '@/components/icons/GameIcon';
import { PATCH_1_1_CONTENT, formatRefundLine } from '@/content/patch-1-1-message';

interface Props {
  refund: number;
  onDismissed: () => void;
}

export function Patch11Welcome({ refund, onDismissed }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const cardRef    = useRef<HTMLDivElement | null>(null);
  const [closing, setClosing] = useState(false);

  // ── Entry animation ──────────────────────────────────────────
  useEffect(() => {
    if (!overlayRef.current || !cardRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.45, ease: 'power2.out' },
    );
    tl.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.94, y: -16 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      '-=0.2',
    );
    return () => { tl.kill(); };
  }, []);

  // ── Dismiss: animate out, mark seen server-side, then notify parent ──
  async function handleDismiss() {
    if (closing) return;
    setClosing(true);

    // Optimistic: don't wait on the network for the animation.
    void supabaseStudent.rpc('mark_patch11_seen').then(({ error }) => {
      if (error) console.warn('[Patch11Welcome] mark_patch11_seen failed:', error);
    });

    await new Promise<void>((resolve) => {
      if (!overlayRef.current || !cardRef.current) { resolve(); return; }
      gsap.timeline({ onComplete: () => resolve() })
        .to(cardRef.current, { opacity: 0, scale: 0.96, y: 8, duration: 0.32, ease: 'power2.in' })
        .to(overlayRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in' }, '-=0.2');
    });

    onDismissed();
  }

  const { title, subtitle, hero, paragraphs, outro, cta } = PATCH_1_1_CONTENT;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 10_000,
        background: 'radial-gradient(ellipse at center, rgba(4,6,10,0.96) 0%, rgba(2,4,8,0.99) 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        backdropFilter: 'blur(24px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patch11-title"
    >
      {/* Faint grid backdrop */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(rgba(56,217,232,0.04) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(56,217,232,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.6,
      }} />

      {/* Hero glow orbs */}
      <div style={{
        position: 'absolute', top: '12%', left: '-10%', width: 480, height: 360, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(56,217,232,0.10), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '12%', right: '-10%', width: 480, height: 360, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(155,109,255,0.10), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div
        ref={cardRef}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 640,
          background: 'rgba(8,12,22,0.78)',
          border: '1px solid rgba(56,217,232,0.22)',
          borderRadius: 16,
          padding: '40px 36px 32px',
          boxShadow:
            '0 0 60px rgba(56,217,232,0.08),' +
            '0 0 120px rgba(155,109,255,0.06),' +
            '0 24px 80px rgba(0,0,0,0.85)',
          backdropFilter: 'blur(18px)',
        }}
      >
        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11, letterSpacing: '5px',
              color: 'rgba(56,217,232,0.55)',
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <h1
            id="patch11-title"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 30, fontWeight: 900, letterSpacing: '8px',
              color: '#e2e8f0', margin: 0,
              textShadow:
                '0 0 30px rgba(56,217,232,0.4),' +
                '0 0 60px rgba(155,109,255,0.25)',
            }}
          >
            {subtitle}
          </h1>
          <div
            style={{
              marginTop: 14, height: 1,
              background:
                'linear-gradient(90deg, transparent, rgba(56,217,232,0.4) 50%, transparent)',
            }}
          />
        </div>

        {/* Hero line */}
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 15, lineHeight: 1.55,
            color: 'rgba(200,216,240,0.85)',
            textAlign: 'center',
            margin: '0 0 22px',
          }}
        >
          {hero}
        </p>

        {/* Feature paragraphs */}
        <ul
          style={{
            listStyle: 'none', padding: 0, margin: '0 0 26px',
            display: 'grid', gap: 10,
          }}
        >
          {paragraphs.map((p, i) => (
            <li
              key={i}
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 13, lineHeight: 1.5,
                color: 'rgba(200,216,240,0.7)',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(56,217,232,0.10)',
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-block', marginRight: 10,
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                  color: 'rgba(56,217,232,0.5)',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              {p}
            </li>
          ))}
        </ul>

        {/* Refund call-out */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background:
              'linear-gradient(90deg, rgba(255,200,80,0.06), rgba(56,217,232,0.04))',
            border: '1px solid rgba(255,200,80,0.22)',
            borderRadius: 10,
            marginBottom: 26,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 38, height: 38, borderRadius: 8,
              background: 'rgba(255,200,80,0.12)',
              border: '1px solid rgba(255,200,80,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <GameIcon id="coin" size={18} />
          </div>
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 13.5, lineHeight: 1.45,
              color: 'rgba(255,225,170,0.92)',
              margin: 0, flex: 1,
            }}
          >
            {formatRefundLine(refund)}
          </p>
        </div>

        {/* Outro */}
        <p
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 12, fontWeight: 700, letterSpacing: '5px',
            color: 'rgba(56,217,232,0.65)',
            textAlign: 'center',
            margin: '0 0 22px',
            textTransform: 'uppercase',
          }}
        >
          {outro}
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => void handleDismiss()}
            disabled={closing}
            style={{
              padding: '12px 32px', borderRadius: 8,
              background:
                'linear-gradient(90deg, rgba(56,217,232,0.18), rgba(155,109,255,0.16))',
              border: '1px solid rgba(56,217,232,0.45)',
              color: '#e2e8f0',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 11, fontWeight: 700, letterSpacing: '4px',
              cursor: closing ? 'not-allowed' : 'pointer',
              opacity: closing ? 0.55 : 1,
              boxShadow: '0 0 24px rgba(56,217,232,0.18)',
              transition: 'transform .18s ease, box-shadow .18s ease',
            }}
            onMouseEnter={(e) => {
              if (closing) return;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 36px rgba(56,217,232,0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(56,217,232,0.18)';
            }}
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

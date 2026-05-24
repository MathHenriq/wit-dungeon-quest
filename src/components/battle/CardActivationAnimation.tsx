// Patch 6.1 — Cinematic activation animation for cards.
//
// Renders a full-screen overlay driven by GSAP. Every card use shows an
// ornamented "ALARM" panel (inspired by Solo Leveling notification boxes)
// containing the card image, name and ability description. The frame's tone
// (border, corner ornaments, glow) varies by rarity. Higher rarities layer
// cinematic FX behind the panel: rings (Legendary), lightning (Mythic),
// glitch (Unknown).
//
// API
//   <CardActivationAnimation
//      cardName=..., rarity="legendary", description=...,
//      cardImage=..., customTone="#a855f7"?,
//      muted={boolean}, onComplete={() => void} />
//
// Helper hook `useCardActivation()` returns:
//   { play(opts): Promise<void>, overlay: ReactElement | null }
//   Pattern: `await play({ rarity, cardName, description }); fireMechanicalEffect();`
//
// The overlay never blocks the page underneath after onComplete fires — the
// component returns null and removes its DOM. Pointer events on the overlay
// are intercepted only while it's mounted so a stray click during the
// animation can't fire an extra ability.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";

export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "unknown";

// Each rarity stays on-screen long enough for the player to read the
// description. Common still fast-ish so basic attacks don't feel sluggish.
const RARITY_DURATIONS_MS: Record<CardRarity, number> = {
  common:    1500,
  uncommon:  1700,
  rare:      1900,
  epic:      2100,
  legendary: 2500,
  mythic:    2900,
  unknown:   3200,
};
const RARITY_TONES: Record<CardRarity, string> = {
  common:    "#7dd3fc",   // light cyan — matches Solo Leveling default panel
  uncommon:  "#4ade80",
  rare:      "#60c8f8",
  epic:      "#b57bee",
  legendary: "#f5c84b",
  mythic:    "#f05050",
  unknown:   "#94a3b8",   // overridable
};

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

interface Props {
  rarity: CardRarity;
  cardName?: string;
  cardImage?: string | null;
  description?: string;
  /** Override colour for ??? cards or theming. */
  customTone?: string;
  muted?: boolean;
  onComplete: () => void;
}

// ─── Corner ornament SVG ─────────────────────────────────────────────────────
// A celtic-style curl, drawn once. Rotated via CSS for each corner.
export function CornerOrnament() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      {/* Outer curl */}
      <path d="M2 14 Q2 2 14 2" />
      <path d="M2 24 Q2 8 18 8" opacity="0.7" />
      {/* Inner flourish */}
      <path d="M10 18 Q10 10 18 10 Q22 10 22 14 Q22 18 18 18 Q14 18 14 14" opacity="0.85" />
      {/* Dot accent */}
      <circle cx="22" cy="22" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CardActivationAnimation({
  rarity, cardName, cardImage, description, customTone, muted = true, onComplete,
}: Props) {
  const rootRef       = useRef<HTMLDivElement | null>(null);
  const panelRef      = useRef<HTMLDivElement | null>(null);
  const flashRef      = useRef<HTMLDivElement | null>(null);
  const ringRef       = useRef<HTMLDivElement | null>(null);
  const lightningRef  = useRef<HTMLDivElement | null>(null);
  const glitchRef     = useRef<HTMLDivElement | null>(null);
  const nameRef       = useRef<HTMLDivElement | null>(null);
  const descRef       = useRef<HTMLDivElement | null>(null);
  const [done, setDone] = useState(false);

  const tone = customTone ?? RARITY_TONES[rarity];
  const mobileScale = isMobile() ? 0.7 : 1;
  const dur = (RARITY_DURATIONS_MS[rarity] / 1000) * mobileScale;

  useEffect(() => {
    if (muted) return;
    // Slot SFX here when assets exist.
  }, [muted]);

  useEffect(() => {
    if (!rootRef.current) return;
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => { setDone(true); onComplete(); },
    });

    // ── Backdrop dim ────────────────────────────────────────────────────────
    const bgDarken =
      rarity === "mythic"   ? "rgba(0,0,0,0.85)" :
      rarity === "unknown"  ? "rgba(8,4,14,0.9)" :
      rarity === "legendary"? "rgba(0,0,0,0.55)" :
                              "rgba(0,0,0,0.35)";
    tl.to(rootRef.current, { backgroundColor: bgDarken, duration: dur * 0.15 }, 0);

    // ── Center flash ────────────────────────────────────────────────────────
    tl.fromTo(flashRef.current,
      { opacity: 0, scale: 0.5 },
      { opacity: 0.85, scale: 1.4, duration: dur * 0.18 }, 0)
      .to(flashRef.current, { opacity: 0, scale: 2.2, duration: dur * 0.22 }, ">-0.04");

    // ── ALARM panel slides in ───────────────────────────────────────────────
    tl.fromTo(panelRef.current,
      { opacity: 0, scale: 0.78, y: 18 },
      { opacity: 1, scale: 1, y: 0, duration: dur * 0.28, ease: "back.out(1.6)" }, dur * 0.06);

    // Captions
    tl.fromTo([nameRef.current, descRef.current].filter(Boolean),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: dur * 0.18, stagger: 0.06 }, dur * 0.2);

    // ── Rarity-specific FX layered behind the panel ─────────────────────────
    if (rarity === "legendary" && ringRef.current) {
      const rings = ringRef.current.querySelectorAll<HTMLDivElement>(".cact-ring");
      tl.fromTo(rings,
        { opacity: 0, scale: 0.3 },
        {
          opacity: (_, _t, idx) => 0.65 - idx * 0.15,
          scale: (_, _t, idx) => 2 + idx * 0.6,
          duration: dur * 0.6,
          stagger: 0.1,
          ease: "expo.out",
        }, 0.05)
        .to(rings, { opacity: 0, duration: dur * 0.2 }, ">-0.05");
    }

    if (rarity === "mythic" && lightningRef.current) {
      const bolts = lightningRef.current.querySelectorAll<HTMLDivElement>(".cact-bolt");
      tl.fromTo(bolts,
        { opacity: 0, scaleY: 0.4, transformOrigin: "50% 0%" },
        { opacity: 1, scaleY: 1, duration: 0.08, stagger: 0.06, repeat: 3, yoyo: true, ease: "steps(2)" }, 0.18);
    }

    if (rarity === "unknown" && glitchRef.current) {
      const lines = glitchRef.current.querySelectorAll<HTMLDivElement>(".cact-glitch");
      tl.fromTo(lines,
        { opacity: 0, x: -20, scaleX: 0.5 },
        { opacity: 1, x: 0, scaleX: 1, duration: 0.05, stagger: 0.02, ease: "steps(3)" }, 0.05);
      tl.to(lines, { x: 20, duration: 0.04, stagger: 0.02, repeat: 5, yoyo: true, ease: "steps(2)" }, "<");

      // Glitch shuffle on panel
      tl.to(panelRef.current, { x: -5, duration: 0.04, repeat: 4, yoyo: true, ease: "steps(2)" }, dur * 0.4)
        .to(panelRef.current, { x: 5,  duration: 0.04, repeat: 4, yoyo: true, ease: "steps(2)" }, ">")
        .to(panelRef.current, { x: 0,  duration: 0.05 }, ">");
    }

    // ── Outro ───────────────────────────────────────────────────────────────
    const outroStart = dur * 0.78;
    tl.to(panelRef.current, { opacity: 0, scale: 1.04, y: -10, duration: dur * 0.18, ease: "sine.in" }, outroStart);
    tl.to([nameRef.current, descRef.current].filter(Boolean),
      { opacity: 0, duration: dur * 0.15 }, outroStart);
    tl.to(rootRef.current, { backgroundColor: "rgba(0,0,0,0)", duration: dur * 0.18 }, ">-0.05");

    return () => { tl.kill(); };
  }, [rarity, dur, mobileScale, onComplete]);

  if (done) return null;

  return createPortal(
    <div
      ref={rootRef}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        pointerEvents: "auto",            // block underlying input during anim
        display: "flex", alignItems: "center", justifyContent: "center",
        ['--tone' as string]: tone,
      } as React.CSSProperties}
      onClick={e => e.stopPropagation()}
      aria-hidden="true"
    >
      <style>{CSS}</style>

      {/* Center flash */}
      <div ref={flashRef} className="cact-flash" />

      {/* Legendary rings */}
      {rarity === "legendary" && (
        <div ref={ringRef} className="cact-rings">
          <div className="cact-ring" />
          <div className="cact-ring" />
          <div className="cact-ring" />
        </div>
      )}

      {/* Mythic lightning bolts */}
      {rarity === "mythic" && (
        <div ref={lightningRef} className="cact-lightning">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="cact-bolt" style={{ left: `${10 + i * 20}%` }} />
          ))}
        </div>
      )}

      {/* Unknown glitch lines */}
      {rarity === "unknown" && (
        <div ref={glitchRef} className="cact-glitch-layer">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="cact-glitch" style={{ top: `${5 + i * 8}%` }} />
          ))}
        </div>
      )}

      {/* ─── ALARM panel (always visible) ───────────────────────────────── */}
      <div ref={panelRef} className="cact-panel">
        {/* Corner ornaments */}
        <span className="cact-corner cact-corner-tl"><CornerOrnament /></span>
        <span className="cact-corner cact-corner-tr"><CornerOrnament /></span>
        <span className="cact-corner cact-corner-bl"><CornerOrnament /></span>
        <span className="cact-corner cact-corner-br"><CornerOrnament /></span>

        {/* Header bar */}
        <div className="cact-header">
          <span className="cact-header-icon" aria-hidden="true">!</span>
          <span className="cact-header-text">ALARM</span>
        </div>

        {/* Divider */}
        <div className="cact-divider" />

        {/* Body: image + name + description */}
        <div className="cact-body">
          <div className="cact-thumb">
            {cardImage
              ? <img src={cardImage} alt="" />
              : <span className="cact-thumb-ph">{(cardName ?? "?").charAt(0).toUpperCase()}</span>}
          </div>
          <div className="cact-text">
            {cardName && <div ref={nameRef} className="cact-name">{cardName}</div>}
            {description && (
              <div ref={descRef} className="cact-desc">
                <span className="cact-bracket">[</span>
                {description}
                <span className="cact-bracket">]</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Hook for imperative invocation ─────────────────────────────────────────
interface PlayOptions {
  rarity: CardRarity;
  cardName?: string;
  cardImage?: string | null;
  description?: string;
  customTone?: string;
}

export function useCardActivation(muted = true) {
  const [state, setState] = useState<PlayOptions | null>(null);
  const resolverRef = useRef<(() => void) | null>(null);

  const play = useCallback((opts: PlayOptions): Promise<void> => {
    return new Promise<void>(resolve => {
      resolverRef.current = resolve;
      setState(opts);
    });
  }, []);

  const onComplete = useCallback(() => {
    setState(null);
    const r = resolverRef.current;
    resolverRef.current = null;
    if (r) r();
  }, []);

  const overlay = state ? (
    <CardActivationAnimation
      rarity={state.rarity}
      cardName={state.cardName}
      cardImage={state.cardImage}
      description={state.description}
      customTone={state.customTone}
      muted={muted}
      onComplete={onComplete}
    />
  ) : null;

  return { play, overlay };
}

const CSS = `
.cact-flash {
  position: absolute;
  width: 240px; height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--tone) 0%, transparent 70%);
  filter: blur(10px);
  opacity: 0; pointer-events: none;
}
.cact-rings { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); pointer-events: none; }
.cact-ring {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 200px; height: 200px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--tone) 70%, transparent);
  box-shadow: 0 0 30px color-mix(in srgb, var(--tone) 60%, transparent);
  opacity: 0;
}
.cact-lightning { position: absolute; inset: 0; pointer-events: none; }
.cact-bolt {
  position: absolute; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg,
    transparent 0%,
    color-mix(in srgb, var(--tone) 80%, white) 30%,
    color-mix(in srgb, var(--tone) 60%, transparent) 70%,
    transparent 100%);
  box-shadow: 0 0 24px var(--tone), 0 0 60px var(--tone);
  opacity: 0;
  filter: blur(0.5px);
}
.cact-glitch-layer { position: absolute; inset: 0; pointer-events: none; }
.cact-glitch {
  position: absolute; left: 0; right: 0; height: 3px;
  background: var(--tone);
  mix-blend-mode: screen;
  opacity: 0;
  box-shadow: 0 0 6px var(--tone);
}

/* ─── ALARM panel ──────────────────────────────────────────────────────── */
.cact-panel {
  position: relative;
  z-index: 2;
  width: min(540px, 86vw);
  padding: 22px 28px 26px;
  background: linear-gradient(180deg,
    rgba(10, 18, 38, 0.94) 0%,
    rgba(6, 12, 26, 0.96) 100%);
  border: 2px solid var(--tone);
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08) inset,
    0 0 32px color-mix(in srgb, var(--tone) 55%, transparent),
    0 0 64px color-mix(in srgb, var(--tone) 25%, transparent);
  opacity: 0;
  color: #fff;
  font-family: 'Rajdhani', 'Cinzel', sans-serif;
}

/* Corner ornaments — celtic curls tinted by rarity tone */
.cact-corner {
  position: absolute;
  width: 48px; height: 48px;
  color: var(--tone);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--tone) 80%, transparent));
  pointer-events: none;
}
.cact-corner-tl { top: -10px; left: -10px; }
.cact-corner-tr { top: -10px; right: -10px; transform: scaleX(-1); }
.cact-corner-bl { bottom: -10px; left: -10px; transform: scaleY(-1); }
.cact-corner-br { bottom: -10px; right: -10px; transform: scale(-1, -1); }

/* Header */
.cact-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  font-size: 18px;
}
.cact-header-icon {
  display: inline-flex;
  align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border: 2px solid #fff;
  border-radius: 50%;
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 18px;
  line-height: 1;
  color: #fff;
}
.cact-header-text {
  color: #fff;
  text-shadow: 0 0 8px color-mix(in srgb, var(--tone) 70%, transparent);
}

.cact-divider {
  height: 1px;
  margin: 14px 0 16px;
  background: linear-gradient(90deg,
    transparent 0%,
    color-mix(in srgb, var(--tone) 80%, transparent) 50%,
    transparent 100%);
}

/* Body */
.cact-body {
  display: flex;
  align-items: center;
  gap: 18px;
}
.cact-thumb {
  flex-shrink: 0;
  width: 92px; height: 92px;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(180deg, #0d0e1a, #060912);
  border: 1px solid color-mix(in srgb, var(--tone) 70%, transparent);
  box-shadow:
    0 0 18px color-mix(in srgb, var(--tone) 45%, transparent),
    inset 0 0 18px color-mix(in srgb, var(--tone) 18%, transparent);
  display: flex; align-items: center; justify-content: center;
}
.cact-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
.cact-thumb-ph {
  font-family: 'Cinzel', serif;
  font-size: 44px;
  color: var(--tone);
  text-shadow: 0 0 12px var(--tone);
}
.cact-text { flex: 1; min-width: 0; }
.cact-name {
  font-family: 'Cinzel', serif;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-shadow: 0 0 12px color-mix(in srgb, var(--tone) 60%, transparent);
}
.cact-desc {
  font-size: 14px;
  line-height: 1.45;
  color: rgba(230, 240, 255, 0.92);
  letter-spacing: 0.02em;
}
.cact-bracket {
  color: var(--tone);
  font-weight: 700;
  padding: 0 2px;
}

@media (max-width: 768px) {
  .cact-panel { padding: 16px 18px 20px; }
  .cact-header { font-size: 15px; }
  .cact-header-icon { width: 24px; height: 24px; font-size: 15px; }
  .cact-thumb { width: 64px; height: 64px; }
  .cact-thumb-ph { font-size: 32px; }
  .cact-name { font-size: 17px; }
  .cact-desc { font-size: 12px; }
  .cact-corner { width: 36px; height: 36px; }
}
`;

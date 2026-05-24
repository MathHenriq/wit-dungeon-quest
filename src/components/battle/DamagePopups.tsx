// Patch 6.4 — Floating damage numbers above combatants.
//
// API
//   const { push, host } = useDamagePopups();
//   push({ side: 'enemy', kind: 'crit', value: 240 });
//
// • `host` is an absolutely-positioned React element you mount once inside the
//   battle scene. It renders all currently-animating numbers and removes them
//   from state when their GSAP timeline completes.
// • Stacking: when several popups spawn on the same side within a short
//   window, each gets a vertical offset (24px per index) so they don't
//   overlap.
// • Pure presentational — does not touch the BattleEngine state, never
//   intercepts pointer events.

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export type PopupKind = "physical" | "magical" | "heal" | "crit" | "miss";
export type PopupSide = "player" | "enemy";

export interface PopupSpec {
  id?:     string;
  side:    PopupSide;
  kind:    PopupKind;
  value:   number;  // ignored when kind === 'miss'
  /** Optional override label (e.g. "Imune!"). */
  label?:  string;
}

interface ActivePopup extends PopupSpec {
  id:        string;
  stackIdx:  number;
  bornAt:    number;
}

const KIND_STYLE: Record<PopupKind, { color: string; fontSize: number; rise: number; duration: number; weight: number; shadow: string }> = {
  physical: { color: "#f87171", fontSize: 26, rise: 80,  duration: 1.1, weight: 800, shadow: "rgba(248,113,113,0.6)" },
  magical:  { color: "#c084fc", fontSize: 26, rise: 80,  duration: 1.1, weight: 800, shadow: "rgba(192,132,252,0.65)" },
  heal:     { color: "#4ade80", fontSize: 26, rise: 80,  duration: 1.2, weight: 800, shadow: "rgba(74,222,128,0.6)" },
  crit:     { color: "#facc15", fontSize: 50, rise: 130, duration: 1.5, weight: 900, shadow: "rgba(250,204,21,0.75)" },
  miss:     { color: "#9ca3af", fontSize: 22, rise: 50,  duration: 0.9, weight: 700, shadow: "rgba(156,163,175,0.4)" },
};

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

export function useDamagePopups() {
  const [active, setActive] = useState<ActivePopup[]>([]);
  const counterRef = useRef(0);

  const push = useCallback((spec: PopupSpec) => {
    counterRef.current += 1;
    const now = performance.now();
    setActive(prev => {
      // Stack index: how many popups on the same side are active right now
      // (within a ~700ms window so old ones don't push new ones offscreen).
      const recentSameSide = prev.filter(p => p.side === spec.side && now - p.bornAt < 700).length;
      const id = spec.id ?? `dmg-${counterRef.current}`;
      return [...prev, {
        ...spec, id,
        stackIdx: recentSameSide,
        bornAt: now,
      }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setActive(prev => prev.filter(p => p.id !== id));
  }, []);

  const host = (
    <DamagePopupHost popups={active} onRemove={remove} />
  );

  return { push, host };
}

function DamagePopupHost({ popups, onRemove }: { popups: ActivePopup[]; onRemove: (id: string) => void }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute", inset: 0, zIndex: 25,
        pointerEvents: "none", overflow: "visible",
      }}
    >
      <style>{CSS}</style>
      {popups.map(p => <DamageNumber key={p.id} popup={p} onDone={() => onRemove(p.id)} />)}
    </div>
  );
}

function DamageNumber({ popup, onDone }: { popup: ActivePopup; onDone: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const style = KIND_STYLE[popup.kind];

  // Coordinates: player popups bottom-left, enemy popups top-right. Stack
  // with vertical offset. Match the rough sprite positions used by the
  // PokemonBattle layout — works without DOM refs to the sprites.
  const mobile = isMobile();
  const sideXPercent = popup.side === "enemy" ? (mobile ? 75 : 70) : (mobile ? 25 : 30);
  const sideYPercent = popup.side === "enemy" ? (mobile ? 22 : 30) : (mobile ? 55 : 62);
  const stackOffset  = popup.stackIdx * (popup.kind === "crit" ? 36 : 24);

  useEffect(() => {
    if (!ref.current) return;
    const rise = style.rise * (mobile ? 0.75 : 1);
    const dur  = style.duration * (mobile ? 0.85 : 1);

    const tl = gsap.timeline({ onComplete: onDone });
    tl.fromTo(ref.current,
      { opacity: 0, y: 0, scale: 0.6 },
      { opacity: 1, y: -8, scale: popup.kind === "crit" ? 1.15 : 1, duration: dur * 0.18, ease: "back.out(2)" }
    );
    // Crits get a small shake + extra glow pulse.
    if (popup.kind === "crit") {
      tl.to(ref.current, { x: -6, duration: 0.05, repeat: 3, yoyo: true, ease: "steps(2)" }, ">-0.05");
      tl.to(ref.current, { x: 0, duration: 0.05 }, ">");
    }
    tl.to(ref.current,
      { y: -rise, duration: dur * 0.55, ease: "power2.out" }, popup.kind === "crit" ? ">" : ">-0.05");
    tl.to(ref.current,
      { opacity: 0, duration: dur * 0.32, ease: "power1.in" }, ">-0.1");
    return () => { tl.kill(); };
  }, [popup.kind, mobile, onDone, style.duration, style.rise]);

  const text =
    popup.label
    ?? (popup.kind === "miss" ? "MISS"
      : popup.kind === "heal" ? `+${popup.value}`
      : String(popup.value));

  return (
    <div
      ref={ref}
      className={`dmg-pop dmg-${popup.kind}`}
      style={{
        left: `${sideXPercent}%`,
        top:  `calc(${sideYPercent}% - ${stackOffset}px)`,
        color: style.color,
        fontSize: style.fontSize,
        fontWeight: style.weight,
        textShadow: `0 0 14px ${style.shadow}, 0 0 28px ${style.shadow}, 0 2px 0 rgba(0,0,0,0.6)`,
      }}
    >
      {text}
    </div>
  );
}

const CSS = `
.dmg-pop {
  position: absolute;
  transform: translate(-50%, -50%);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.05em;
  pointer-events: none;
  will-change: transform, opacity;
  user-select: none;
  white-space: nowrap;
}
.dmg-crit {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  filter: drop-shadow(0 0 8px currentColor);
}
.dmg-miss { font-family: 'Share Tech Mono', monospace; letter-spacing: 0.18em; opacity: 0.85; }
`;

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { Ability, BattleCharacter, ElementType } from '@/types/character';
import { ELEMENT_META, getElementPoints } from '@/types/character';
import { SkillNodeHex } from './SkillNodeHex';

/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT ENGINE — Places abilities into a radial tree layout
   Each element gets a branch radiating from the center.
   Within each branch, skills are sorted by tier (1→4, trunk→tip).
   ═══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 10000;
const CANVAS_H = 10000;
const CENTER_X = CANVAS_W / 2;
const CENTER_Y = CANVAS_H / 2;

/** Minimum pixel distance between two adjacent node centers */
const MIN_NODE_DIST_PX = 120;

/** Generate node positions for all abilities arranged as a cosmic tree */
function computeTreeLayout(
  abilities: Ability[],
  elements: ElementType[],
  filterElement: ElementType | null,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  const visibleElements = filterElement
    ? elements.filter(e => e === filterElement)
    : elements;

  const totalElements = visibleElements.length;
  if (totalElements === 0) return positions;

  // Radial layout: each element gets an angular wedge
  const angleStep = (2 * Math.PI) / Math.max(totalElements, 1);
  const startAngle = -Math.PI / 2; // Start from top

  // Very large radii — massive spacing between tiers
  const TIER_RADII = [600, 1500, 2600, 3800];

  visibleElements.forEach((element, elIdx) => {
    const branchAngle = startAngle + elIdx * angleStep;
    const elementAbilities = abilities.filter(a => a.elementName === element);

    // Sort by tier, then by name for consistency
    const sorted = [...elementAbilities].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

    // Group by tier
    const tiers: Record<number, Ability[]> = { 1: [], 2: [], 3: [], 4: [] };
    sorted.forEach(a => { if (tiers[a.tier]) tiers[a.tier].push(a); });

    [1, 2, 3, 4].forEach((tier, tierIdx) => {
      const tierAbilities = tiers[tier];
      if (!tierAbilities.length) return;

      const radius = TIER_RADII[tierIdx];
      const count = tierAbilities.length;

      // Calculate angular spread from minimum pixel distance:
      // arc_length = radius * angle, so min_angle = min_dist / radius
      const minAnglePerGap = MIN_NODE_DIST_PX / radius;
      const desiredSpread = minAnglePerGap * (count - 1);
      // Bound to 85% of wedge to leave margins between elements
      const maxWedge = angleStep * 0.85;
      const totalSpread = count === 1 ? 0 : Math.min(desiredSpread, maxWedge);

      tierAbilities.forEach((ab, abIdx) => {
        const offsetAngle = count === 1
          ? 0
          : -totalSpread / 2 + (abIdx / Math.max(1, count - 1)) * totalSpread;

        const angle = branchAngle + offsetAngle;
        const x = CENTER_X + Math.cos(angle) * radius;
        const y = CENTER_Y + Math.sin(angle) * radius;

        positions.set(ab.id, { x, y });
      });
    });
  });

  return positions;
}

/** Generate connecting paths between tiers of the same element */
function computeConnections(
  abilities: Ability[],
  elements: ElementType[],
  positions: Map<string, { x: number; y: number }>,
  filterElement: ElementType | null,
): { from: string; to: string; element: ElementType }[] {
  const connections: { from: string; to: string; element: ElementType }[] = [];

  const visibleElements = filterElement
    ? elements.filter(e => e === filterElement)
    : elements;

  visibleElements.forEach(element => {
    const elementAbilities = abilities.filter(a => a.elementName === element);
    const sorted = [...elementAbilities].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

    // Group by tier
    const tiers: Record<number, Ability[]> = { 1: [], 2: [], 3: [], 4: [] };
    sorted.forEach(a => { if (tiers[a.tier]) tiers[a.tier].push(a); });

    // Connect between tiers:
    // Each node in tier N connects to the nearest node in tier N-1
    [2, 3, 4].forEach(tier => {
      const currentTier = tiers[tier];
      const prevTier = tiers[tier - 1];
      if (!currentTier.length || !prevTier.length) return;

      currentTier.forEach(ab => {
        // Connect to nearest parent
        const pos = positions.get(ab.id);
        if (!pos) return;

        let nearestParent = prevTier[0];
        let nearestDist = Infinity;

        prevTier.forEach(parent => {
          const pp = positions.get(parent.id);
          if (!pp) return;
          const d = Math.hypot(pp.x - pos.x, pp.y - pos.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestParent = parent;
          }
        });

        connections.push({ from: nearestParent.id, to: ab.id, element });
      });
    });

    // Connect all tier-1 nodes to a virtual center (we'll draw these as paths to center)
    tiers[1].forEach(ab => {
      connections.push({ from: '__center__', to: ab.id, element });
    });
  });

  return connections;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CANVAS COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface SkillTreeCanvasProps {
  abilities: Ability[];
  character: BattleCharacter;
  equipped: { ability_id: string; slot: number }[];
  selectedAbility: Ability | null;
  filterElement: ElementType | null;
  onSelectAbility: (ability: Ability) => void;
}

export function SkillTreeCanvas({
  abilities,
  character,
  equipped,
  selectedAbility,
  filterElement,
  onSelectAbility,
}: SkillTreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.22);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // All elements that have abilities
  const elements = useMemo(() => {
    const set = new Set<ElementType>();
    abilities.forEach(a => set.add(a.elementName));
    return Array.from(set);
  }, [abilities]);

  // Compute layout
  const positions = useMemo(
    () => computeTreeLayout(abilities, elements, filterElement),
    [abilities, elements, filterElement],
  );

  const connections = useMemo(
    () => computeConnections(abilities, elements, positions, filterElement),
    [abilities, elements, positions, filterElement],
  );

  const equippedMap = useMemo(
    () => new Map(equipped.map(e => [e.ability_id, e.slot])),
    [equipped],
  );

  // Center on mount
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - CENTER_X * scale,
        y: rect.height / 2 - CENTER_Y * scale,
      });
    }
  }, []);

  // Reset pan when filter changes
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - CENTER_X * scale,
        y: rect.height / 2 - CENTER_Y * scale,
      });
    }
  }, [filterElement, scale]);

  /* ── Pan handlers ─────────────────────────────────────────────────── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan from background, not from nodes
    if ((e.target as HTMLElement).closest('.st-node')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }, [isPanning]);

  const onPointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  /* ── Zoom handler ────────────────────────────────────────────────── */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setScale(s => Math.max(0.3, Math.min(1.8, s + delta)));
  }, []);

  /* ── SVG path helper ─────────────────────────────────────────────── */
  function getPathD(from: { x: number; y: number }, to: { x: number; y: number }) {
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    // Gentle curve
    const cx1 = from.x + (mx - from.x) * 0.5;
    const cy1 = from.y + (my - from.y) * 1.2;
    const cx2 = mx + (to.x - mx) * 0.5;
    const cy2 = my + (to.y - my) * 0.8;
    return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
  }

  return (
    <div
      ref={containerRef}
      className="st-canvas-container"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <div
        className="st-canvas-inner"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
      >
        {/* ── SVG connections layer ────────────────────────────────── */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ overflow: 'visible' }}
        >
          {/* Central radial decorations */}
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={80}
            fill="none"
            stroke="rgba(0,229,255,0.06)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={30}
            fill="rgba(0,229,255,0.04)"
            stroke="rgba(0,229,255,0.15)"
            strokeWidth="1.5"
          />
          {/* Central glow */}
          <circle cx={CENTER_X} cy={CENTER_Y} r={8} fill="rgba(0,229,255,0.3)">
            <animate attributeName="r" values="6;10;6" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Orbit rings at tier radii */}
          {[600, 1500, 2600, 3800].map((r, i) => (
            <circle
              key={r}
              cx={CENTER_X}
              cy={CENTER_Y}
              r={r}
              fill="none"
              stroke={`rgba(255,255,255,${0.03 - i * 0.005})`}
              strokeWidth="1"
              strokeDasharray="2 12"
            />
          ))}

          {connections.map((conn, idx) => {
            const fromPos = conn.from === '__center__'
              ? { x: CENTER_X, y: CENTER_Y }
              : positions.get(conn.from);
            const toPos = positions.get(conn.to);
            if (!fromPos || !toPos) return null;

            const meta = ELEMENT_META[conn.element];
            const toAbility = abilities.find(a => a.id === conn.to);
            const fromAbility = abilities.find(a => a.id === conn.from);
            const currentPts = getElementPoints(character, conn.element);
            const toUnlocked = toAbility ? currentPts >= toAbility.requirement : false;
            const fromUnlocked = conn.from === '__center__' || (fromAbility ? currentPts >= fromAbility.requirement : false);
            const bothUnlocked = toUnlocked && fromUnlocked;

            const d = getPathD(fromPos, toPos);

            return (
              <g key={idx}>
                {/* Base path */}
                <path
                  d={d}
                  className={`st-pathway ${
                    bothUnlocked ? 'st-pathway--active' : fromUnlocked ? 'st-pathway--available' : 'st-pathway--locked'
                  }`}
                  style={bothUnlocked ? { stroke: meta.color } : undefined}
                />
                {/* Energy flow on active paths */}
                {bothUnlocked && (
                  <path
                    d={d}
                    className="st-pathway-energy"
                    style={{ stroke: meta.color }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Central tree core ────────────────────────────────────── */}
        <div
          className="absolute"
          style={{
            left: CENTER_X,
            top: CENTER_Y,
            transform: 'translate(-50%, -50%)',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,229,255,0.15), transparent 70%)',
              border: '1.5px solid rgba(0,229,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.4))',
            }}
          >
            🌳
          </div>
        </div>

        {/* ── Skill nodes ─────────────────────────────────────────── */}
        {abilities
          .filter(a => !filterElement || a.elementName === filterElement)
          .map(ability => {
            const pos = positions.get(ability.id);
            if (!pos) return null;
            const slot = equippedMap.get(ability.id);

            return (
              <SkillNodeHex
                key={ability.id}
                ability={ability}
                character={character}
                isEquipped={!!slot}
                equippedSlot={slot}
                isSelected={selectedAbility?.id === ability.id}
                x={pos.x}
                y={pos.y}
                onClick={onSelectAbility}
              />
            );
          })}
      </div>
    </div>
  );
}

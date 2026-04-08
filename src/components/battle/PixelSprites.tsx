/**
 * Pixel-art battle sprites — 32×40 grid, scale=5 (160×200px output)
 *
 * Each character = 1 pixel. '.' = transparent (skipped).
 * parseGrid() normalises row width so minor off-by-one never crashes.
 */

import React from 'react';

// ─── Palette ────────────────────────────────────────────────────────────────

const C: Record<string, string> = {
  /* ── Player (mage — back view) ── */
  'H': '#2d0e52',   // hat outer dark
  'h': '#5c2a99',   // hat highlight purple
  'G': '#d4a017',   // gold hat band
  'g': '#a07008',   // gold shadow
  'S': '#f0c080',   // skin
  's': '#c88a4a',   // skin shadow
  'C': '#1a3a9a',   // cloak blue
  'c': '#0f2370',   // cloak shadow
  'i': '#2a54c0',   // cloak inner highlight
  'B': '#7a3a10',   // belt brown
  'b': '#6a3008',   // belt shadow
  'Q': '#0a0a1c',   // boot very dark
  'q': '#181830',   // boot highlight
  'L': '#141428',   // leg dark
  'l': '#242450',   // leg highlight
  'W': '#c8b880',   // staff wood
  'w': '#907840',   // staff dark

  /* ── Enemy (dark guardian — front view) ── */
  'D': '#120820',   // body deep dark
  'd': '#1e0e38',   // body mid dark
  'K': '#d4a000',   // horn gold
  'k': '#906800',   // horn shadow
  'E': '#ff1020',   // eye red
  'e': '#ff8888',   // eye glow/light
  'P': '#6600cc',   // chest energy
  'p': '#3a0088',   // energy dark
  'A': '#28284c',   // armour plate
  'a': '#3e3e70',   // armour highlight
  'O': '#060410',   // hard outline
  'R': '#3a0018',   // dark red accent
  'F': '#8833ff',   // magic glow
  'f': '#cc66ff',   // magic bright
  'M': '#0a0618',   // mask / socket
  'Z': '#4400aa',   // magic mid

  /* ── Shared ── */
  '.': '',
};

// ─── Grid normaliser ────────────────────────────────────────────────────────

/** Pads / trims every row so they all match the first row's length. */
function parseGrid(rows: string[]): string[] {
  const w = rows[0].length;
  return rows.map(r => r.padEnd(w, '.').slice(0, w));
}

// ─── Sprite grids (32 cols × 40 rows) ───────────────────────────────────────

const PLAYER_BACK_RAW: string[] = [
  /* 0 */ '................................',
  /* 1 */ '...............H................',
  /* 2 */ '..............HHH...............',
  /* 3 */ '.............HHhHH..............',
  /* 4 */ '............HHhhhHH.............',
  /* 5 */ '...........HHhhhhhHH............',
  /* 6 */ '..........HHhGGGGGhHH...........',
  /* 7 */ '..........HHhgGGGghHH...........',
  /* 8 */ '..........HHHhgggHHHH...........',
  /* 9 */ '...........HHHHHHHHHH...........',
  /* 10*/ '...........HSSSSSSSH............',
  /* 11*/ '..........HSSsSsSsSH............',
  /* 12*/ '..........HSSsSSSSsH............',
  /* 13*/ '...........HSSSSSSSH............',
  /* 14*/ '..........CCCSsSSCCC............',
  /* 15*/ '.........CCCCCCCCCCCCC..........',
  /* 16*/ '........CCiCCCCCCCiCCC..........',
  /* 17*/ '........CCiCBBBBBBCiCC..........',
  /* 18*/ '........CCiCBbBBBbCiCC..........',
  /* 19*/ '........CCiCCCCCCCiCCC..........',
  /* 20*/ '.........CcCCCCCCCcCC...........',
  /* 21*/ '..........CcCCCCCcCC............',
  /* 22*/ '...........CcCCCCcC.............',
  /* 23*/ '...........CCCC.CCCC............',
  /* 24*/ '..........CCCC...CCCC...........',
  /* 25*/ '.........CCC.......CCC..........',
  /* 26*/ '.........CC.........CC..........',
  /* 27*/ '.........CC.........CC..........',
  /* 28*/ '.........LL.........LL..........',
  /* 29*/ '.........LlL........LlL.........',
  /* 30*/ '.........LLL........LLL.........',
  /* 31*/ '.........LlL........LlL.........',
  /* 32*/ '.........LLL........LLL.........',
  /* 33*/ '.........LlL........LlL.........',
  /* 34*/ '........QQLL........LLQQ........',
  /* 35*/ '........QQQQ........QQQQ........',
  /* 36*/ '........QqQQ........QqQQ........',
  /* 37*/ '.......QQQQQ........QQQQQ.......',
  /* 38*/ '.......QqQQQ........QqQQQ.......',
  /* 39*/ '......QQQQQQ........QQQQQQ......',
];

const ENEMY_DARK_RAW: string[] = [
  /* 0 */ '...KK.......................KK...',
  /* 1 */ '..KkKK.....................KKkK..',
  /* 2 */ '..KkK.......................KkK..',
  /* 3 */ '...KK.......................KK...',
  /* 4 */ '....OOOOOOOOOOOOOOOOOOOOOO......',
  /* 5 */ '...OODDDDDDDDDDDDDDDDDDDDdOO...',
  /* 6 */ '..OODDDdddddddddddddddddDDDOO..',
  /* 7 */ '..ODDDd.MMMMMMMMMMMMMM.dDDDDO..',
  /* 8 */ '..ODDDd.MEEMe..eeMEMM.dDDDDO..',
  /* 9 */ '..ODDDd.MeEM....MEeM..dDDDDO..',
  /* 10*/ '..ODDDd.MMMMMMMMMMMM..dDDDDO..',
  /* 11*/ '..ODDDdDDDDDDDDDDDDDDdDDDDO..',
  /* 12*/ '..ODDddDDRRRRRRRRRRDDdDDDO...',
  /* 13*/ '..ODDdDDDDZPPPPPPZDDDdDDDO...',
  /* 14*/ '..ODDdDDDZPPFFFFPPZDDdDDDO...',
  /* 15*/ '..ODDdDDDZPPPFFPPPZDDdDDDO...',
  /* 16*/ '..ODDdDDDDZPPPPPZDDDdDDDO...',
  /* 17*/ '..ODDdDDDDDDDDDDDDDDdDDDO...',
  /* 18*/ '..ODDddDDAaAaAaAaAaAddDDO...',
  /* 19*/ '..ODDdddDAaAaAaAaAadddDDO...',
  /* 20*/ '..ODDDdddDDDDDDDDDdddDDDO...',
  /* 21*/ '..ODDDDddddDDDDDDdddDDDDO...',
  /* 22*/ '..ODDDDDdddddddddddDDDDDO...',
  /* 23*/ '...ODDDDDDDDDDDDDDDDDDDO....',
  /* 24*/ '....OOODDDDDDDDDDDDOOOO.....',
  /* 25*/ '.......ODDDDD.DDDDDDO.......',
  /* 26*/ '.......ODDDDd.dDDDDO........',
  /* 27*/ '.......ODDDDd.dDDDDO........',
  /* 28*/ '.......ODDDDd.dDDDDO........',
  /* 29*/ '.......ODDDDd.dDDDDO........',
  /* 30*/ '.......OODDDd.dDDDOO........',
  /* 31*/ '........OQQQd.dQQQO.........',
  /* 32*/ '........OQqQd.dQqQO.........',
  /* 33*/ '........OQQQO.OQQOO.........',
  /* 34*/ '.......OQQQQd.dQQQQO........',
  /* 35*/ '.......OQqQQd.dQqQQO........',
  /* 36*/ '.......OQQQQd.dQQQQO........',
  /* 37*/ '......OQQQQQd.dQQQQQO.......',
  /* 38*/ '......OQqQQQO.OQqQQQO.......',
  /* 39*/ '.....OQQQQQOO.OOQQQQqO......',
];

const ENEMY_FIRE_RAW: string[] = [
  /* 0 */ '.....FF...............FF........',
  /* 1 */ '....FfF..............FfF........',
  /* 2 */ '...FfFF...............FfF.......',
  /* 3 */ '....OOOOOOOOOOOOOOOOOOOO........',
  /* 4 */ '...OODDDDDDDDDDDDDDDDDdOO......',
  /* 5 */ '..OODDDdddddddddddddddDDDOO.....',
  /* 6 */ '..ODDDd.MMMMMMMMMMMM..dDDDDO....',
  /* 7 */ '..ODDDd.MEEMe..eeMEMM.dDDDDO....',
  /* 8 */ '..ODDDd.MeEM....MEeM..dDDDDO....',
  /* 9 */ '..ODDDd.MMMMMMMMMMMM..dDDDDO....',
  /* 10*/ '..ODDDdDDDDDDDDDDDDDDdDDDDO....',
  /* 11*/ '..ODDddDDRRRRRRRRRRDDdDDDO......',
  /* 12*/ '..ODDdDDDDFPPPPPPFDDDdDDDO......',
  /* 13*/ '..ODDdDDDFPPFFFFPPFDDdDDDO......',
  /* 14*/ '..ODDdDDDFPPPFFPPPFDDdDDDO......',
  /* 15*/ '..ODDdDDDDFPPPPPFDDDdDDDO.......',
  /* 16*/ '..ODDdDDDDDDDDDDDDDDdDDDO.......',
  /* 17*/ '..ODDddDDAaAaAaAaAaAddDDO.......',
  /* 18*/ '..ODDdddDAaAaAaAaAadddDDO.......',
  /* 19*/ '..ODDDdddDDDDDDDDDdddDDDO.......',
  /* 20*/ '..ODDDDddddDDDDDDdddDDDDO.......',
  /* 21*/ '..ODDDDDdddddddddddDDDDDO.......',
  /* 22*/ '...ODDDDDDDDDDDDDDDDDDDO........',
  /* 23*/ '....OOODDDDDDDDDDDDOOOO.........',
  /* 24*/ '.......ODDDDD.DDDDDDO...........',
  /* 25*/ '.......ODDDDd.dDDDDO............',
  /* 26*/ '.......ODDDDd.dDDDDO............',
  /* 27*/ '.......ODDDDd.dDDDDO............',
  /* 28*/ '.......ODDDDd.dDDDDO............',
  /* 29*/ '.......OODDDd.dDDDOO............',
  /* 30*/ '........OQQQd.dQQQO.............',
  /* 31*/ '........OQqQd.dQqQO.............',
  /* 32*/ '........OQQQO.OQQOO.............',
  /* 33*/ '.......OQQQQd.dQQQQO............',
  /* 34*/ '.......OQqQQd.dQqQQO............',
  /* 35*/ '.......OQQQQd.dQQQQO............',
  /* 36*/ '......OQQQQQd.dQQQQQO...........',
  /* 37*/ '......OQqQQQO.OQqQQQO...........',
  /* 38*/ '.....OQQQQQOO.OOQQQQqO..........',
  /* 39*/ '.....OQQQQQOO.OOQQQQqO..........',
];

// ─── Registry ────────────────────────────────────────────────────────────────

export type SpriteId = 'player-back' | 'enemy-dark' | 'enemy-fire';

const RAW_GRIDS: Record<SpriteId, string[]> = {
  'player-back': PLAYER_BACK_RAW,
  'enemy-dark':  ENEMY_DARK_RAW,
  'enemy-fire':  ENEMY_FIRE_RAW,
};

// ─── Component ───────────────────────────────────────────────────────────────

interface PixelSpriteProps {
  id:        SpriteId;
  scale?:    number;            // screen-pixels per grid-pixel (default 5)
  style?:    React.CSSProperties;
  className?: string;
}

export function PixelSprite({ id, scale = 5, style, className }: PixelSpriteProps) {
  const grid = parseGrid(RAW_GRIDS[id]);
  const rows = grid.length;
  const cols = grid[0].length;
  const W    = cols * scale;
  const H    = rows * scale;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block', shapeRendering: 'crispEdges', ...style }}
    >
      {grid.map((row, y) =>
        [...row].map((char, x) => {
          const fill = C[char];
          if (!fill) return null;
          return (
            <rect
              key={`${y}-${x}`}
              x={x * scale}
              y={y * scale}
              width={scale}
              height={scale}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}

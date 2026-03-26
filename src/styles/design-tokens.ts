/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          WIT DUNGEON QUEST — DESIGN SYSTEM TOKENS v2.0          ║
 * ║  Inspirações: Genshin Impact · Valorant · LoL · Cyberpunk 2077  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Como usar:
 *   import { colors, typography, spacing, shadows, animations } from '@/styles/design-tokens';
 *
 * No tailwind.config.ts: ver instruções em baixo do arquivo.
 */

// ─── CORES ────────────────────────────────────────────────────────────────────
// Formato HSL sem hsl() para compatibilidade com opacidade no Tailwind:
//   bg-[hsl(var(--ds-bg-primary))] ou use as constantes diretamente em estilos inline.
// ──────────────────────────────────────────────────────────────────────────────

/** Valores HSL brutos (sem `hsl()`). Use com `hsl()` ou CSS vars */
export const rawColors = {
  bg: {
    primary:   '240 10% 3.9%',
    secondary: '240 5.9% 10%',
    tertiary:  '240 4.8% 15%',
    elevated:  '240 3.7% 20%',
  },
  border: {
    default: '240 3.7% 15.9%',
    muted:   '240 3.7% 10%',
    accent:  '142 76% 36%',
  },
  text: {
    primary:   '0 0% 98%',
    secondary: '240 5% 64.9%',
    muted:     '240 3.8% 46.1%',
    accent:    '142 76% 36%',
  },
  status: {
    success: '142 76% 36%',
    warning: '38 92% 50%',
    error:   '0 84% 60%',
    info:    '217 91% 60%',
  },
  rewards: {
    coins:    '45 93% 47%',
    diamonds: '210 100% 66%',
    xp:       '142 76% 36%',
  },
} as const;

/** Valores completos com `hsl()` — para uso em estilos inline e tokens CSS */
export const colors = {
  // ── Backgrounds ─────────────────────────────────────────────────
  bg: {
    /** Quase preto — fundo principal */
    primary:   `hsl(${rawColors.bg.primary})`,
    /** Card / painel background */
    secondary: `hsl(${rawColors.bg.secondary})`,
    /** Hover states / alternados */
    tertiary:  `hsl(${rawColors.bg.tertiary})`,
    /** Modals, popovers, superfícies elevadas */
    elevated:  `hsl(${rawColors.bg.elevated})`,
  },

  // ── Bordas ──────────────────────────────────────────────────────
  border: {
    /** Borda padrão sutil */
    default: `hsl(${rawColors.border.default})`,
    /** Borda quase invisível */
    muted:   `hsl(${rawColors.border.muted})`,
    /** Borda verde cyber — destaque */
    accent:  `hsl(${rawColors.border.accent})`,
  },

  // ── Texto ───────────────────────────────────────────────────────
  text: {
    /** Quase branco — texto principal */
    primary:   `hsl(${rawColors.text.primary})`,
    /** Texto secundário / labels */
    secondary: `hsl(${rawColors.text.secondary})`,
    /** Placeholder / texto desativado */
    muted:     `hsl(${rawColors.text.muted})`,
    /** Verde cyber — destaque / links */
    accent:    `hsl(${rawColors.text.accent})`,
  },

  // ── Status ──────────────────────────────────────────────────────
  status: {
    success: `hsl(${rawColors.status.success})`,
    warning: `hsl(${rawColors.status.warning})`,
    error:   `hsl(${rawColors.status.error})`,
    info:    `hsl(${rawColors.status.info})`,
  },

  // ── Recompensas / XP ────────────────────────────────────────────
  rewards: {
    /** Ouro — moedas, itens raros */
    coins:    `hsl(${rawColors.rewards.coins})`,
    /** Azul diamante — gemas premium */
    diamonds: `hsl(${rawColors.rewards.diamonds})`,
    /** Verde XP — experiência, progresso */
    xp:       `hsl(${rawColors.rewards.xp})`,
  },

  // ── Aliases semânticos (conveniência) ───────────────────────────
  cyber: {
    green:  `hsl(${rawColors.text.accent})`,
    gold:   `hsl(${rawColors.rewards.coins})`,
    blue:   `hsl(${rawColors.rewards.diamonds})`,
    red:    `hsl(${rawColors.status.error})`,
  },
} as const;

// ─── TIPOGRAFIA ───────────────────────────────────────────────────────────────
// Fontes configuradas no index.html via Google Fonts (ver abaixo)
// ──────────────────────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    /** Interface / corpo de texto — limpo, legível */
    sans:    "'Inter', system-ui, -apple-system, sans-serif",
    /** Títulos / UI principal — futurista, marcante */
    display: "'Space Grotesk', sans-serif",
    /** Código / valores numéricos */
    mono:    "'JetBrains Mono', 'Fira Code', monospace",
    /** Mantido para compatibilidade — títulos de dungeon */
    rajdhani: "'Rajdhani', sans-serif",
    /** Mantido para compatibilidade — texto de jogo */
    exo:     "'Exo 2', sans-serif",
  },

  fontSize: {
    xs:   '0.75rem',   // 12px — badges, labels pequenos
    sm:   '0.875rem',  // 14px — texto secundário
    base: '1rem',      // 16px — padrão
    lg:   '1.125rem',  // 18px — destaque de texto
    xl:   '1.25rem',   // 20px — subtítulos
    '2xl': '1.5rem',   // 24px — títulos de seção
    '3xl': '1.875rem', // 30px — títulos de página
    '4xl': '2.25rem',  // 36px — títulos hero
  },

  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },

  lineHeight: {
    tight:  '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  letterSpacing: {
    tight:  '-0.025em',
    normal: '0em',
    wide:   '0.025em',
    wider:  '0.05em',
    widest: '0.1em',
    /** Para labels uppercase estilo HUD */
    hud:    '0.15em',
  },
} as const;

// ─── ESPAÇAMENTO ──────────────────────────────────────────────────────────────

export const spacing = {
  /** Padding horizontal de containers */
  containerPadding: '1.5rem',   // 24px
  /** Gap entre seções de página */
  sectionGap:       '3rem',     // 48px
  /** Padding interno de cards */
  cardPadding:      '1.5rem',   // 24px
  /** Padding de botões (shorthand) */
  buttonPadding:    '0.75rem 1.5rem', // 12px 24px
  /** Gap entre ícone e texto em botão */
  buttonIconGap:    '0.5rem',   // 8px
  /** Padding de badges */
  badgePadding:     '0.25rem 0.625rem', // 4px 10px
} as const;

// ─── BORDER RADIUS ────────────────────────────────────────────────────────────

export const borderRadius = {
  sm:   '0.5rem',  // 8px  — inputs, badges
  md:   '0.75rem', // 12px — botões, chips
  lg:   '1rem',    // 16px — cards
  xl:   '1.5rem',  // 24px — modais, painéis grandes
  full: '9999px',  // pill — avatares, tags
} as const;

// ─── SOMBRAS & EFEITOS ────────────────────────────────────────────────────────

export const shadows = {
  sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md:  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl:  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',

  /** Glows — efeito de brilho cyber */
  glow: {
    /** Glow verde cyber — ativo, sucesso, XP */
    green:  '0 0 20px hsla(142, 76%, 36%, 0.3)',
    /** Glow azul diamante — premium, info */
    blue:   '0 0 20px hsla(210, 100%, 66%, 0.3)',
    /** Glow dourado — coins, raridade */
    gold:   '0 0 20px hsla(45, 93%, 47%, 0.3)',
    /** Glow vermelho — perigo, boss */
    red:    '0 0 20px hsla(0, 84%, 60%, 0.3)',
    /** Glow intenso — hover, foco */
    greenStrong: '0 0 30px hsla(142, 76%, 36%, 0.5), 0 0 60px hsla(142, 76%, 36%, 0.15)',
    goldStrong:  '0 0 30px hsla(45, 93%, 47%, 0.5), 0 0 60px hsla(45, 93%, 47%, 0.15)',
  },

  /** Sombras internas — painéis flutuantes */
  inner: {
    dark: 'inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
    accent: `inset 0 0 0 1px hsla(142, 76%, 36%, 0.2)`,
  },
} as const;

// ─── ANIMAÇÕES ────────────────────────────────────────────────────────────────

export const animations = {
  transition: {
    fast:   '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base:   '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow:   '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  duration: {
    instant: '100ms',
    fast:    '150ms',
    base:    '200ms',
    slow:    '300ms',
    slower:  '500ms',
  },

  easing: {
    /** Entrada / saída suave */
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    /** Entrada rápida, saída lenta */
    out:   'cubic-bezier(0, 0, 0.2, 1)',
    /** Entrada lenta, saída rápida */
    in:    'cubic-bezier(0.4, 0, 1, 1)',
    /** Spring / bounce */
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ─── GLASS MORPHISM ───────────────────────────────────────────────────────────
// Padrões prontos para painéis com efeito de vidro

export const glass = {
  /** Painel padrão — fundo de cards */
  panel: {
    background: 'rgba(255, 255, 255, 0.03)',
    border:     '1px solid rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(12px)',
  },
  /** Painel com destaque verde */
  panelAccent: {
    background: 'rgba(34, 197, 94, 0.04)',
    border:     `1px solid hsla(142, 76%, 36%, 0.2)`,
    backdropFilter: 'blur(12px)',
  },
  /** Painel dourado — recompensas */
  panelGold: {
    background: 'rgba(234, 179, 8, 0.04)',
    border:     `1px solid hsla(45, 93%, 47%, 0.2)`,
    backdropFilter: 'blur(12px)',
  },
  /** Painel elevado — modais */
  panelElevated: {
    background: 'rgba(255, 255, 255, 0.06)',
    border:     '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
} as const;

// ─── Z-INDEX ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  raised:  1,
  dropdown: 10,
  sticky:  20,
  overlay: 30,
  modal:   40,
  popover: 50,
  toast:   60,
  tooltip: 70,
} as const;

// ─── BREAKPOINTS ──────────────────────────────────────────────────────────────

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
} as const;

// ─── EXPORT AGREGADO ──────────────────────────────────────────────────────────

export const designTokens = {
  colors,
  rawColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  glass,
  zIndex,
  breakpoints,
} as const;

export default designTokens;

/*
 * ═══════════════════════════════════════════════════════════════════
 * INSTRUÇÕES DE INTEGRAÇÃO COM TAILWIND
 * ═══════════════════════════════════════════════════════════════════
 *
 * No tailwind.config.ts, importe os tokens e adicione ao theme.extend:
 *
 * ```typescript
 * import { rawColors, borderRadius as dsRadius, shadows as dsShadows } from './src/styles/design-tokens';
 *
 * // Em theme.extend.colors, adicione namespace 'ds':
 * colors: {
 *   // ... cores existentes (shadcn) ...
 *   ds: {
 *     bg: {
 *       primary:   `hsl(${rawColors.bg.primary} / <alpha-value>)`,
 *       secondary: `hsl(${rawColors.bg.secondary} / <alpha-value>)`,
 *       tertiary:  `hsl(${rawColors.bg.tertiary} / <alpha-value>)`,
 *       elevated:  `hsl(${rawColors.bg.elevated} / <alpha-value>)`,
 *     },
 *     border: {
 *       default: `hsl(${rawColors.border.default} / <alpha-value>)`,
 *       muted:   `hsl(${rawColors.border.muted} / <alpha-value>)`,
 *       accent:  `hsl(${rawColors.border.accent} / <alpha-value>)`,
 *     },
 *     text: {
 *       primary:   `hsl(${rawColors.text.primary} / <alpha-value>)`,
 *       secondary: `hsl(${rawColors.text.secondary} / <alpha-value>)`,
 *       muted:     `hsl(${rawColors.text.muted} / <alpha-value>)`,
 *       accent:    `hsl(${rawColors.text.accent} / <alpha-value>)`,
 *     },
 *     status: {
 *       success: `hsl(${rawColors.status.success} / <alpha-value>)`,
 *       warning: `hsl(${rawColors.status.warning} / <alpha-value>)`,
 *       error:   `hsl(${rawColors.status.error} / <alpha-value>)`,
 *       info:    `hsl(${rawColors.status.info} / <alpha-value>)`,
 *     },
 *     rewards: {
 *       coins:    `hsl(${rawColors.rewards.coins} / <alpha-value>)`,
 *       diamonds: `hsl(${rawColors.rewards.diamonds} / <alpha-value>)`,
 *       xp:       `hsl(${rawColors.rewards.xp} / <alpha-value>)`,
 *     },
 *   },
 * },
 *
 * // Fontes novas:
 * fontFamily: {
 *   'ds-sans':    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
 *   'ds-display': ['Space Grotesk', 'sans-serif'],
 *   'ds-mono':    ['JetBrains Mono', 'Fira Code', 'monospace'],
 *   // manter fontes existentes:
 *   display: ['Rajdhani', 'sans-serif'],
 *   body:    ['Exo 2', 'sans-serif'],
 * },
 *
 * // Border radius do DS:
 * borderRadius: {
 *   'ds-sm':   '0.5rem',
 *   'ds-md':   '0.75rem',
 *   'ds-lg':   '1rem',
 *   'ds-xl':   '1.5rem',
 * },
 * ```
 *
 * Isso gera classes como:
 *   bg-ds-bg-primary, bg-ds-bg-primary/50
 *   text-ds-text-accent, text-ds-text-accent/70
 *   border-ds-border-accent
 *   text-ds-rewards-coins
 *   font-ds-display
 *   rounded-ds-lg
 * ═══════════════════════════════════════════════════════════════════
 */

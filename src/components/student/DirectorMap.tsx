import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword, ScrollText, Skull, Zap, Swords, Shield, Network,
  Store, Package, ArrowLeftRight, Trophy, User, Clock,
  LogOut, Settings
} from 'lucide-react';
import type { StudentTab } from './StudentNavigation';
import type { Student } from '@/types';
import { GameIcon } from '@/components/icons/GameIcon';

// ─── Node data type ─────────────────────────────────────
interface DirectorNode {
  id: StudentTab;
  name: string;
  subtitle: string;
  size: number;
  color: string;
  position: { top: string; left: string };
  icon: React.ReactNode;
  danger?: boolean;
}

// ─── Map node definitions ───────────────────────────────
const DIRECTOR_NODES: DirectorNode[] = [
  {
    id: 'challenges',
    name: 'Quests',
    subtitle: 'Desafios Semanais',
    size: 48,
    color: '#1e5a8a',
    position: { top: '50%', left: '50%' },
    icon: <Sword size={22} />,
  },
  {
    id: 'missions',
    name: 'Missões',
    subtitle: 'Patrulhas & Objetivos',
    size: 38,
    color: '#4a6741',
    position: { top: '34%', left: '63%' },
    icon: <ScrollText size={18} />,
  },
  {
    id: 'bosses',
    name: 'Bosses',
    subtitle: 'Combate de Chefes',
    size: 44,
    color: '#6b2525',
    position: { top: '62%', left: '70%' },
    icon: <Skull size={20} />,
    danger: true,
  },
  {
    id: 'dungeon',
    name: 'Dungeon',
    subtitle: 'Expedição Diária',
    size: 40,
    color: '#5c3d7a',
    position: { top: '70%', left: '54%' },
    icon: <Zap size={18} />,
  },
  {
    id: 'pvp',
    name: 'PvP Arena',
    subtitle: 'Combate Competitivo',
    size: 36,
    color: '#703333',
    position: { top: '66%', left: '36%' },
    icon: <Swords size={16} />,
    danger: true,
  },
  {
    id: 'guild',
    name: 'Guilda',
    subtitle: 'Aliança de Heróis',
    size: 34,
    color: '#2a5a5a',
    position: { top: '42%', left: '30%' },
    icon: <Shield size={16} />,
  },
  {
    id: 'skills',
    name: 'Skills',
    subtitle: 'Árvore de Habilidades',
    size: 32,
    color: '#4a4a6b',
    position: { top: '28%', left: '42%' },
    icon: <Network size={14} />,
  },
  {
    id: 'shop',
    name: 'Loja',
    subtitle: 'Emporium Arcano',
    size: 42,
    color: '#2b5f54',
    position: { top: '24%', left: '74%' },
    icon: <Store size={20} />,
  },
  {
    id: 'inventory',
    name: 'Mochila',
    subtitle: 'Arsenal do Herói',
    size: 34,
    color: '#8b693e',
    position: { top: '56%', left: '24%' },
    icon: <Package size={16} />,
  },
  {
    id: 'trading',
    name: 'Trading',
    subtitle: 'Posto de Trocas',
    size: 30,
    color: '#475569',
    position: { top: '78%', left: '44%' },
    icon: <ArrowLeftRight size={14} />,
  },
  {
    id: 'ranking',
    name: 'Ranking',
    subtitle: 'Classificação Global',
    size: 36,
    color: '#6b5b1e',
    position: { top: '20%', left: '56%' },
    icon: <Trophy size={16} />,
  },
  {
    id: 'character',
    name: 'Herói',
    subtitle: 'Ficha de Personagem',
    size: 38,
    color: '#1a4a6b',
    position: { top: '80%', left: '68%' },
    icon: <User size={18} />,
  },
];

// ─── Constellation lines (edges connecting nodes) ───────
const CONSTELLATION_LINES = [
  // Central hub (challenges) connects to neighbors
  { from: 'challenges', to: 'missions' },
  { from: 'challenges', to: 'bosses' },
  { from: 'challenges', to: 'dungeon' },
  { from: 'challenges', to: 'skills' },
  { from: 'challenges', to: 'guild' },
  { from: 'challenges', to: 'pvp' },
  // Secondary connections
  { from: 'missions', to: 'ranking' },
  { from: 'missions', to: 'shop' },
  { from: 'bosses', to: 'character' },
  { from: 'bosses', to: 'dungeon' },
  { from: 'guild', to: 'inventory' },
  { from: 'pvp', to: 'trading' },
  { from: 'dungeon', to: 'trading' },
  { from: 'shop', to: 'ranking' },
];

// ─── Helper: get node position as percentage numbers ────
function getNodePos(id: string): { top: number; left: number } | null {
  const n = DIRECTOR_NODES.find(n => n.id === id);
  if (!n) return null;
  return { top: parseFloat(n.position.top), left: parseFloat(n.position.left) };
}

// ─── Single Map Node ────────────────────────────────────
function MapNode({
  node,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: {
  node: DirectorNode;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const iconSize = Math.max(30, Math.min(50, node.size / 3 * 2.5));

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
      style={{ top: node.position.top, left: node.position.left }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        {/* SAO Spinning Data Rings */}
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: iconSize + 20,
            height: iconSize + 20,
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderLeftColor: 'rgba(0, 229, 255, 0.8)',
            borderRightColor: 'rgba(0, 229, 255, 0.8)',
          }}
          animate={{ rotate: 360, scale: isHovered ? 1.05 : 1, opacity: isHovered ? 1 : 0.6 }}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.2 } }}
        />
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: iconSize + 28,
            height: iconSize + 28,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'rgba(0, 229, 255, 0.5)',
            borderBottomColor: 'rgba(0, 229, 255, 0.5)',
          }}
          animate={{ rotate: -360, scale: isHovered ? 1.1 : 1, opacity: isHovered ? 1 : 0.4 }}
          transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.2 } }}
        />

        {/* Destiny Lock-on Selector on Hover */}
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{ width: iconSize + 36, height: iconSize + 36, border: '2px solid rgba(255,255,255,0.8)', borderStyle: 'dotted' }}
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 1.5,
            rotate: isHovered ? 180 : 0,
          }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { type: 'spring', damping: 20, stiffness: 300 },
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
          }}
        />

        {/* Inner lock-ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none border border-white/30"
          style={{ width: iconSize + 12, height: iconSize + 12 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Outer Hexagon border */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: iconSize + 8,
            height: iconSize + 8,
            border: '1px solid rgba(255,255,255,0.3)',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        />

        {/* Hexagon body */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{
            width: iconSize,
            height: iconSize,
            backgroundColor: node.color,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'1\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }} />
          <div className="relative z-10 text-white drop-shadow-md flex items-center justify-center scale-75">
            {node.icon}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Hover Label ────────────────────────────────────────
function HoverLabel({ node }: { node: DirectorNode | null }) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          className="absolute left-10 bottom-10 z-50 pointer-events-none"
        >
          <h1
            className="text-5xl md:text-6xl font-extrabold uppercase text-white drop-shadow-lg"
            style={{ fontFamily: 'Rajdhani, system-ui, sans-serif', letterSpacing: '0.05em' }}
          >
            {node.name}
          </h1>
          <p
            className="text-[#a1a1aa] text-lg md:text-xl uppercase tracking-[0.2em] mt-1 font-medium"
            style={{ fontFamily: 'Exo 2, system-ui, sans-serif' }}
          >
            {node.subtitle}
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs font-mono text-white/40 tracking-[0.2em]">
            <span>[CLICK PARA ENTRAR]</span>
            <span className="w-1 h-1 bg-white/30 rounded-full" />
            <span>ZONA TÁTICA ATIVA</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main DirectorMap Component ─────────────────────────
interface DirectorMapProps {
  student: Student;
  onNavigate: (tab: StudentTab) => void;
  onLogout: () => void;
  onOpenAccessibility?: () => void;
}

export function DirectorMap({ student, onNavigate, onLogout, onOpenAccessibility }: DirectorMapProps) {
  const [hoveredNode, setHoveredNode] = useState<DirectorNode | null>(null);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#020611] text-white selection:bg-white/20 z-30">

      {/* Background: Cosmic Space with Planets */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Space background image */}
        <img
          src="/images/director-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          style={{ filter: 'brightness(0.5) saturate(1.3)' }}
        />

        {/* Floating Data Rings (SAO) over the space */}
        <div className="absolute inset-0 flex items-center justify-center opacity-8 pointer-events-none">
          <motion.div
            className="absolute rounded-full border border-cyan-400"
            style={{ width: '80vh', height: '80vh', borderStyle: 'dashed', borderWidth: '2px' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute rounded-full border border-cyan-200"
            style={{ width: '140vh', height: '140vh', borderStyle: 'dotted', borderWidth: '4px' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Dark Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(2, 6, 17, 0.85) 75%)' }}
        />
      </div>

      {/* Top HUD — Player Info (unified left bar) */}
      <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-center pt-5 px-6 md:px-10 pointer-events-none">
        {/* Left: Player identity + stats */}
        <div className="flex items-center gap-3 pointer-events-auto" style={{ background: 'rgba(2,6,17,0.6)', backdropFilter: 'blur(12px)', borderRadius: 12, padding: '8px 16px 8px 8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-10 h-10 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
            {student.profile_photo_url ? (
              <img src={student.profile_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="text-white/70" size={20} />
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-[0.12em] text-white leading-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {(student.character_name || student.name || '').toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono tracking-wider">
              <span className="px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-bold">
                Lv. {student.level}
              </span>
              {student.character_class && (
                <span className="opacity-60">{student.character_class}</span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Coins */}
          <div className="flex items-center gap-1.5">
            <GameIcon id="coin" size={14} />
            <span className="text-sm font-bold text-yellow-400 font-mono">
              {student.coins >= 1000 ? `${(student.coins / 1000).toFixed(1)}k` : student.coins}
            </span>
          </div>
          {student.presencas_consecutivas > 0 && (
            <>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-orange-400 text-xs">🔥</span>
                <span className="text-xs font-bold text-orange-400 font-mono">{student.presencas_consecutivas}</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 pointer-events-auto" style={{ background: 'rgba(2,6,17,0.6)', backdropFilter: 'blur(12px)', borderRadius: 10, padding: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {onOpenAccessibility && (
            <button
              onClick={onOpenAccessibility}
              className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
              title="Acessibilidade"
            >
              <Settings size={16} />
            </button>
          )}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Constellation Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {CONSTELLATION_LINES.map((line, i) => {
          const from = getNodePos(line.from);
          const to = getNodePos(line.to);
          if (!from || !to) return null;
          const isHighlighted =
            hoveredNode && (hoveredNode.id === line.from || hoveredNode.id === line.to);
          return (
            <motion.line
              key={i}
              x1={`${from.left}%`} y1={`${from.top}%`}
              x2={`${to.left}%`} y2={`${to.top}%`}
              stroke={isHighlighted ? 'rgba(0, 229, 255, 0.5)' : 'rgba(0, 229, 255, 0.15)'}
              strokeWidth={isHighlighted ? '2' : '1'}
              strokeDasharray="4 8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.3 + (i * 0.06), ease: 'easeOut' }}
              style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
            />
          );
        })}
      </svg>

      {/* Map Nodes */}
      <div className="absolute inset-0 z-10">
        {DIRECTOR_NODES.map((node) => (
          <MapNode
            key={node.id}
            node={node}
            isHovered={hoveredNode?.id === node.id}
            onHover={() => setHoveredNode(node)}
            onLeave={() => setHoveredNode(null)}
            onClick={() => onNavigate(node.id)}
          />
        ))}
      </div>

      {/* Hover Label (Bottom Left) */}
      <HoverLabel node={hoveredNode} />

      {/* Bottom bar */}
      <div className="absolute bottom-6 left-0 w-full z-40 flex justify-between items-end px-8 md:px-12 pointer-events-none">
        <div className="text-white/20 text-[10px] font-mono tracking-[0.3em]">
          WIT DUNGEON QUEST // DIRECTOR v2.0
        </div>
        <div className="text-white/30 text-[10px] font-mono tracking-[0.3em]">
          SELECIONE UM DESTINO
        </div>
      </div>

      {/* Mobile: Bottom scrollable nav for small screens */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: 'rgba(2, 6, 17, 0.97)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(0, 229, 255, 0.1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {DIRECTOR_NODES.slice(0, 8).map((node) => (
            <button
              key={node.id}
              onClick={() => onNavigate(node.id)}
              className="flex-shrink-0 flex flex-col items-center gap-1 py-2.5 px-3 text-white/40 hover:text-cyan-400 transition-colors"
              style={{ minWidth: 56 }}
            >
              <div className="scale-75">{node.icon}</div>
              <span className="text-[8px] font-bold uppercase tracking-wider whitespace-nowrap">{node.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

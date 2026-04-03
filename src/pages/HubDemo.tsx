import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlanetNode, PlanetProps } from '../components/hub/PlanetNode';
import { DestinationCard } from '../components/hub/DestinationCard';
import { Box, Home, Target, Sword, ArrowLeftRight, ShoppingCart, User } from 'lucide-react';

const mapNodesData: PlanetProps[] = [
  {
    id: 'andares',
    name: 'Andares',
    type: 'The Core',
    size: 48,
    color: '#334c6b', // Muted blue
    glowColor: 'rgba(51, 76, 107, 0.5)',
    position: { top: '50%', left: '45%' },
    icon: <Home size={22} className="opacity-80" />
  },
  {
    id: 'missoes',
    name: 'Missões',
    type: 'Patrols & Quests',
    size: 32,
    color: '#824949', // Muted crimson
    glowColor: 'rgba(130, 73, 73, 0.5)',
    position: { top: '35%', left: '60%' },
    icon: <Target size={16} className="opacity-80" />
  },
  {
    id: 'inventario',
    name: 'Inventário',
    type: 'The Vault',
    size: 36,
    color: '#8b693e', // Rust/mud
    glowColor: 'rgba(139, 105, 62, 0.5)',
    position: { top: '70%', left: '55%' },
    icon: <Box size={16} className="opacity-80" />
  },
  {
    id: 'pvp',
    name: 'Competitivo',
    type: 'Crucible',
    size: 38,
    color: '#703333', // Dark red
    glowColor: 'rgba(112, 51, 51, 0.5)',
    position: { top: '65%', left: '28%' },
    icon: <Sword size={18} className="opacity-80" />
  },
  {
    id: 'trocas',
    name: 'Trocas',
    type: 'Trading Outpost',
    size: 30,
    color: '#475569', // Slate
    glowColor: 'rgba(71, 85, 105, 0.5)',
    position: { top: '25%', left: '30%' },
    icon: <ArrowLeftRight size={14} className="opacity-80" />
  },
  {
    id: 'loja',
    name: 'Eververse',
    type: 'Emporium',
    size: 44,
    color: '#2b5f54', // Muted Teal
    glowColor: 'rgba(43, 95, 84, 0.5)',
    position: { top: '20%', left: '15%' },
    icon: <ShoppingCart size={20} className="opacity-80" />
  }
];

const HubDemo = () => {
  const [hoveredNode, setHoveredNode] = useState<PlanetProps | null>(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c121c] text-white selection:bg-white/20">
      
      {/* SAO 'Link Start' / ALO VR Data Room Background */}
      <div className="absolute inset-0 z-0 bg-[#020611] overflow-hidden">
        
        {/* Floating Data Rings (SAO System Menu aesthetic) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
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

        {/* Global Dark Vignette so center and top remains dark for the nodes */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply"
          style={{ background: 'radial-gradient(ellipse at center, transparent 10%, rgba(2, 6, 17, 1) 85%)' }}
        />
      </div>

      {/* Decorative Navigation Bar simulating D2 Director */}
      <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-start pt-8 px-12 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 border border-white/20 bg-white/5 flex items-center justify-center p-1 relative group pointer-events-auto cursor-pointer">
            <div className="absolute inset-0 border border-white/10 scale-110 group-hover:scale-105 transition-transform" />
            <User className="text-white/80 group-hover:text-white" size={28} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-[0.2em] font-mono">SEASON OF THE DEEP</h1>
            <p className="text-white/50 text-xs tracking-widest font-mono">SEASON RANK 42</p>
          </div>
        </div>

        <div className="flex gap-12 pt-2 items-center text-xs tracking-[0.3em] font-mono pointer-events-auto drop-shadow-md">
          <span className="cursor-pointer text-white/50 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all">STORE</span>
          <span className="cursor-pointer text-white/50 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all">QUESTS</span>
          <span className="cursor-pointer text-white border-b-2 border-white pb-2 drop-shadow-[0_0_10px_rgba(255,255,255,1)]">DESTINATIONS</span>
          <span className="cursor-pointer text-white/50 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all">ROSTER</span>
        </div>
        
        <div className="w-32" />
      </nav>

      {/* Connection Lines (Constellations/Routes) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {[
          { x1: '45%', y1: '50%', x2: '28%', y2: '65%' },
          { x1: '45%', y1: '50%', x2: '60%', y2: '35%' },
          { x1: '45%', y1: '50%', x2: '55%', y2: '70%' },
          { x1: '45%', y1: '50%', x2: '30%', y2: '25%' },
          { x1: '30%', y1: '25%', x2: '15%', y2: '20%' },
        ].map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke="rgba(0, 229, 255, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5 + (i * 0.1), ease: "easeOut" }}
          />
        ))}
      </svg>
      
      {/* Render all map nodes */}
      <div className="absolute inset-0 z-10">
        {mapNodesData.map((node) => (
          <div 
            key={node.id} 
            onMouseEnter={() => setHoveredNode(node)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <PlanetNode
              {...node}
              onClick={() => console.log('Navigating to', node.name)}
            />
          </div>
        ))}
      </div>

      {/* Tactical Destination Info (Bottom Left) */}
      <DestinationCard planet={hoveredNode} />
      
      {/* Bottom right instructions */}
      <div className="absolute bottom-12 right-12 text-white/40 text-xs font-mono tracking-[0.3em] font-medium pointer-events-none">
        PRESS [ESC] TO DISMISS
      </div>
    </div>
  );
};

export default HubDemo;

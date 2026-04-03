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
    color: '#334c6b',
    glowColor: 'rgba(0, 212, 255, 0.5)',
    planetImage: '/images/planets/Gemini_Generated_Image_m93eljm93eljm93e.png',
    position: { top: '50%', left: '45%' },
    icon: <Home size={22} className="opacity-80" />
  },
  {
    id: 'missoes',
    name: 'Missões',
    type: 'Patrols & Quests',
    size: 32,
    color: '#824949',
    glowColor: 'rgba(157, 0, 255, 0.5)',
    planetImage: '/images/planets/Gemini_Generated_Image_rz4uvprz4uvprz4u.png',
    position: { top: '35%', left: '60%' },
    icon: <Target size={16} className="opacity-80" />
  },
  {
    id: 'inventario',
    name: 'Inventário',
    type: 'The Vault',
    size: 36,
    color: '#8b693e',
    glowColor: 'rgba(26, 35, 50, 0.6)',
    planetImage: '/images/planets/Gemini_Generated_Image_lndtfxlndtfxlndt.png',
    position: { top: '70%', left: '55%' },
    icon: <Box size={16} className="opacity-80" />
  },
  {
    id: 'pvp',
    name: 'Competitivo',
    type: 'Crucible',
    size: 38,
    color: '#703333',
    glowColor: 'rgba(139, 0, 0, 0.6)',
    planetImage: '/images/planets/Gemini_Generated_Image_p23lzrp23lzrp23l.png',
    position: { top: '65%', left: '28%' },
    icon: <Sword size={18} className="opacity-80" />
  },
  {
    id: 'trocas',
    name: 'Trocas',
    type: 'Trading Outpost',
    size: 30,
    color: '#475569',
    glowColor: 'rgba(64, 224, 208, 0.5)',
    planetImage: '/images/planets/Gemini_Generated_Image_dqkvgrdqkvgrdqkv.png',
    position: { top: '25%', left: '30%' },
    icon: <ArrowLeftRight size={14} className="opacity-80" />
  },
  {
    id: 'loja',
    name: 'Eververse',
    type: 'Emporium',
    size: 44,
    color: '#2b5f54',
    glowColor: 'rgba(160, 130, 109, 0.6)',
    planetImage: '/images/planets/Gemini_Generated_Image_7bum2j7bum2j7bum.png',
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

        {/* Background giant planets */}
        <img src="/images/backgrounds/Gemini_Generated_Image_o6a9lbo6a9lbo6a9.png" alt="" draggable={false}
          className="absolute -top-32 -right-32 w-[520px] opacity-25 pointer-events-none select-none" />
        <img src="/images/backgrounds/Gemini_Generated_Image_arbykzarbykzarby.png" alt="" draggable={false}
          className="absolute -bottom-40 -left-40 w-[480px] opacity-20 pointer-events-none select-none" />
        <img src="/images/backgrounds/Gemini_Generated_Image_f73dxuf73dxuf73d.png" alt="" draggable={false}
          className="absolute top-1/2 -right-48 w-[360px] opacity-15 pointer-events-none select-none"
          style={{ transform: 'translateY(-50%)' }} />
        <img src="/images/backgrounds/Gemini_Generated_Image_f6sq7wf6sq7wf6sq.png" alt="" draggable={false}
          className="absolute -top-16 left-1/4 w-[200px] opacity-10 pointer-events-none select-none" />

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

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface PlanetProps {
  id: string;
  name: string;
  type: string;
  size: number;
  color: string;
  glowColor: string;
  texture?: string;
  position: { top: string; left: string };
  orbits?: number;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const PlanetNode: React.FC<PlanetProps> = ({
  size,
  color,
  position,
  onClick,
  icon
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Mapeamos size para algo razoável no painel plano (24 a 48px)
  const iconSize = Math.max(30, Math.min(50, size / 3));

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">

        {/* SAO Constant Spinning Data Rings */}
        <motion.div 
          className="absolute pointer-events-none rounded-full"
          style={{ 
            width: iconSize + 20, // Aumentado para criar a pequena lacuna
            height: iconSize + 20, 
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderLeftColor: 'rgba(0, 229, 255, 0.8)',
            borderRightColor: 'rgba(0, 229, 255, 0.8)'
          }}
          animate={{ rotate: 360, scale: isHovered ? 1.05 : 1, opacity: isHovered ? 1 : 0.6 }}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.2 } }}
        />
        <motion.div 
          className="absolute pointer-events-none rounded-full"
          style={{ 
            width: iconSize + 28, // Aumentado para acompanhar a lacuna 
            height: iconSize + 28, 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'rgba(0, 229, 255, 0.5)',
            borderBottomColor: 'rgba(0, 229, 255, 0.5)'
          }}
          animate={{ rotate: -360, scale: isHovered ? 1.1 : 1, opacity: isHovered ? 1 : 0.4 }}
          transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.2 } }}
        />

        {/* Hover Fast Lock-on Selector (Classic Destiny Rotating Cursor) */}
        <motion.div 
          className="absolute pointer-events-none rounded-full"
          style={{ width: iconSize + 36, height: iconSize + 36, border: '2px solid rgba(255,255,255,0.8)', borderStyle: 'dotted' }}
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            scale: isHovered ? 1 : 1.5, 
            rotate: isHovered ? 180 : 0 
          }}
          transition={{ 
            opacity: { duration: 0.2 },
            scale: { type: 'spring', damping: 20, stiffness: 300 },
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' }
          }}
        />
        
        {/* Inner lock-ring solid */}
        <motion.div 
          className="absolute rounded-full pointer-events-none border border-white/30"
          style={{ width: iconSize + 12, height: iconSize + 12 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Outer Hexagon border faintly always visible */}
        <div 
          className="absolute pointer-events-none"
          style={{
            width: iconSize + 8,
            height: iconSize + 8,
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        />

        {/* The Emblem Body (Hexagon Base - Flat military D2 style) */}
        <motion.div 
          className="relative flex items-center justify-center"
          style={{
            width: iconSize,
            height: iconSize,
            backgroundColor: color,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
            opacity: 0.95
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Faint inner texture/noise for the emblem */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'1\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }} />

          {/* Icon */}
          <div className="relative z-10 text-white drop-shadow-md flex items-center justify-center scale-75">
            {icon}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

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
  planetImage?: string; // path to PNG planet image
  position: { top: string; left: string };
  orbits?: number;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const PlanetNode: React.FC<PlanetProps> = ({
  size,
  color,
  glowColor,
  planetImage,
  position,
  onClick,
  icon,
  name,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const planetSize = Math.max(48, Math.min(96, size * 1.8));
  const ringInner  = planetSize + 16;
  const ringOuter  = planetSize + 26;
  const lockRing   = planetSize + 38;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">

        {/* Glow halo behind planet */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ width: planetSize, height: planetSize, background: glowColor, filter: 'blur(18px)' }}
          animate={{ opacity: isHovered ? 0.9 : 0.35, scale: isHovered ? 1.3 : 1 }}
          transition={{ duration: 0.35 }}
        />

        {/* SAO Spinning Data Rings */}
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: ringInner,
            height: ringInner,
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderLeftColor: 'rgba(0, 229, 255, 0.8)',
            borderRightColor: 'rgba(0, 229, 255, 0.8)',
          }}
          animate={{ rotate: 360, scale: isHovered ? 1.05 : 1, opacity: isHovered ? 1 : 0.5 }}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.2 } }}
        />
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: ringOuter,
            height: ringOuter,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTopColor: 'rgba(0, 229, 255, 0.5)',
            borderBottomColor: 'rgba(0, 229, 255, 0.5)',
          }}
          animate={{ rotate: -360, scale: isHovered ? 1.1 : 1, opacity: isHovered ? 1 : 0.35 }}
          transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.2 } }}
        />

        {/* Destiny Lock-on Selector on Hover */}
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{ width: lockRing, height: lockRing, border: '2px dotted rgba(255,255,255,0.75)' }}
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
          className="absolute rounded-full pointer-events-none border border-white/25"
          style={{ width: planetSize + 8, height: planetSize + 8 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Planet image or fallback hexagon */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ width: planetSize, height: planetSize }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
        >
          {planetImage ? (
            <img
              src={planetImage}
              alt={name}
              className="w-full h-full object-contain drop-shadow-2xl"
              style={{
                filter: isHovered ? `drop-shadow(0 0 12px ${glowColor})` : 'none',
                transition: 'filter 0.3s',
              }}
              draggable={false}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: color,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
              }}
            >
              <div className="text-white drop-shadow-md">{icon}</div>
            </div>
          )}

          {/* Icon badge overlay */}
          {icon && (
            <div
              className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(2,6,17,0.75)',
                border: '1px solid rgba(0,229,255,0.4)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div className="text-white/80 scale-75">{icon}</div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanetProps } from './PlanetNode';

interface DestinationCardProps {
  planet: PlanetProps | null;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ planet }) => {
  return (
    <AnimatePresence>
      {planet && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute left-12 bottom-12 z-50 pointer-events-none"
        >
          {/* Destiny Surface Map Style Typography */}
          <div className="flex flex-col">
            <h1 
              className="text-6xl font-extrabold uppercase text-[#ffffff] drop-shadow-lg"
              style={{ 
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '0.05em'
              }}
            >
              {planet.name}
            </h1>
            <p 
              className="text-[#a1a1aa] text-xl uppercase tracking-[0.2em] mt-2 font-medium"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {planet.type}
            </p>
            
            <div className="mt-6 flex items-center gap-4 text-xs font-mono text-white/40 tracking-[0.2em]">
              <span>[RECOMENDADO: NÍVEL 1+]</span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>ZONA TÁTICA ATIVA</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

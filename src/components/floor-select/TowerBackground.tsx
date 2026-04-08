import React from 'react';

export function TowerBackground() {
  return (
    <div className="fs-bg" style={{ overflow: 'hidden' }}>
      <div 
        style={{
          position: 'absolute',
          inset: '-20px', // slightly larger to hide blur edges
          backgroundImage: 'url(/images/aincrad.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(5px) brightness(0.6)',
          zIndex: 0,
        }}
      />
      {/* Optional dark overlay to ensure text is readable */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(6, 8, 10, 0.3), rgba(6, 8, 10, 0.8))',
          zIndex: 1,
        }}
      />
    </div>
  );
}

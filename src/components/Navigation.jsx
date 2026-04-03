import React from 'react';
import { Diamond, Menu, Fingerprint, Hexagon } from 'lucide-react';

const Navigation = () => {
  return (
    <>
      <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 100, pointerEvents: 'auto', opacity: 0.8, cursor: 'pointer' }}>
        <Diamond size={32} color="#ffffff" strokeWidth={1} />
      </div>

      <div style={{ position: 'absolute', top: '40px', right: '40px', zIndex: 100, pointerEvents: 'auto', opacity: 0.8, cursor: 'pointer' }}>
        <Menu size={32} color="#ffffff" strokeWidth={1} />
      </div>

      <div style={{ position: 'absolute', bottom: '40px', left: '40px', zIndex: 100, pointerEvents: 'auto', opacity: 0.8, cursor: 'pointer' }}>
        <Hexagon size={32} color="#ffffff" strokeWidth={1} />
      </div>

      <div style={{ position: 'absolute', bottom: '40px', right: '40px', zIndex: 100, pointerEvents: 'auto', opacity: 0.8, cursor: 'pointer' }}>
        <Fingerprint size={32} color="#ffffff" strokeWidth={1} />
      </div>
    </>
  );
};

export default Navigation;

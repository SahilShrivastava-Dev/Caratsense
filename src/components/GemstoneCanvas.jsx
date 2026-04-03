import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Octahedron, Line } from '@react-three/drei';
import * as THREE from 'three';

// The rotating 3D Gemstone wireframe
const Gemstone = () => {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
      // Gentle floating up and down
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <Octahedron ref={meshRef} args={[2, 0]} material-wireframe>
      <lineBasicMaterial attach="material" color="#ffffff" transparent opacity={0.6} linewidth={1} />
    </Octahedron>
  );
};

// The scanning laser scanline in 3D
const ScanningLaser = () => {
  const laserRef = useRef();

  useFrame((state) => {
    if (laserRef.current) {
      // Sine wave bounds from -2.5 to 2.5
      laserRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 2.5;
    }
  });

  // A very thin, glowing horizontal line
  return (
    <group ref={laserRef}>
      <mesh>
        <planeGeometry args={[6, 0.02]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.8} />
      </mesh>
      {/* Bloom effect using simple additional planes for glow */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[6, 0.1]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

const GemstoneCanvas = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <group>
          <Gemstone />
          <ScanningLaser />
        </group>
      </Canvas>
    </div>
  );
};

export default GemstoneCanvas;

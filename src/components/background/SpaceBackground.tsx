import { Canvas } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

function NebulaCloud({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh position={position}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial
          color="#9d4edd"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </Float>
  );
}

function SpaceScene() {
  return (
    <>
      <Stars
        radius={200}
        depth={100}
        count={5000}
        factor={6}
        saturation={0.5}
        fade
        speed={0.5}
      />
      <NebulaCloud position={[-40, 20, -80]} />
      <NebulaCloud position={[50, -15, -100]} />
      <NebulaCloud position={[0, 30, -120]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 50]} intensity={0.3} color="#00d9ff" />
    </>
  );
}

export function SpaceBackground() {
  return (
    <div
      className="fixed inset-0 -z-50"
      style={{ background: 'linear-gradient(180deg, #0a0e14 0%, #050810 100%)' }}
    >
      <Canvas
        camera={{
          position: [0, 0, 50],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true
        }}
      >
        <Suspense fallback={null}>
          <SpaceScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

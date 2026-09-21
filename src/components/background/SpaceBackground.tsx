import { Canvas } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { isBackdropOccluded, subscribeOcclusion } from '@/lib/ui/backdropOcclusion';

function NebulaCloud({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh position={position}>
        <sphereGeometry args={[15, 16, 16]} />
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
        count={1800}
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

/** The flat gradient the canvas sits on. It is what everyone actually sees on
 *  the hub and portal screens, which cover this layer with an opaque z-30
 *  surface, so it has to look right on its own. */
const BACKDROP = 'linear-gradient(180deg, #0a0e14 0%, #050810 100%)';

export function SpaceBackground() {
  // Render the starfield only once the page is idle, and never for someone who
  // asked for reduced motion. On a school Chromebook the WebGL context was
  // being created while the login screen was still painting, and it kept
  // running at full tilt behind the hub, which covers it completely.
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden);

  // Telas opacas (combate, hub) cobrem este canvas por inteiro. Sem este sinal
  // ele seguia desenhando a 60 fps embaixo delas — ver backdropOcclusion.ts.
  const [occluded, setOccluded] = useState(isBackdropOccluded);
  useEffect(() => subscribeOcclusion(setOccluded), []);

  useEffect(() => {
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => setEnabled(true), { timeout: 3000 });
    else timeoutId = setTimeout(() => setEnabled(true), 1200);

    return () => {
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  // Stop the render loop while the tab is in the background — a class leaves
  // this open in a tab all lesson.
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (!enabled) {
    return <div className="fixed inset-0 -z-50" style={{ background: BACKDROP }} />;
  }

  return (
    <div className="fixed inset-0 -z-50" style={{ background: BACKDROP }}>
      {/*
        Coberto por tela opaca: além de parar o render loop, o canvas sai da
        composição com `display: none`.

        Parar o loop sozinho não bastava. O canvas continuava no DOM, e o
        compositor seguia carregando uma textura de tela cheia a cada quadro
        mesmo sem nada novo sendo desenhado nela. Medido na tela de login,
        build de produção, CPU a 4×:

          como estava ......................... 27 fps
          só parando o render loop ............ 48 fps
          loop parado + fora da composição .... 60 fps

        `display: none` não destrói o contexto WebGL — a cena volta como
        estava quando a tela opaca desmonta. Por isso aqui, e não desmontando
        o <Canvas>, que recriaria o contexto a cada transição.
      */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: occluded ? 'none' : 'block',
      }}>
      <Canvas
        camera={{
          position: [0, 0, 50],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        // Uncapped DPR made a 2x/3x display render 4-9x the pixels for a
        // deliberately blurry starfield. 1.5 is indistinguishable here.
        dpr={[1, 1.5]}
        frameloop={visible && !occluded ? 'always' : 'never'}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'low-power',
        }}
      >
        <Suspense fallback={null}>
          <SpaceScene />
        </Suspense>
      </Canvas>
      </div>
    </div>
  );
}

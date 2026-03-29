import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function HexagonTunnel() {
  const meshesRef = useRef<THREE.InstancedMesh>(null);

  const { geometry, count } = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 0.5;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
    return { geometry, count: 150 };
  }, []);

  useFrame((state) => {
    if (!meshesRef.current) return;

    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const z = -i * 2;
      const angle = (i * Math.PI) / 10;
      const radius = 5 + Math.sin(i * 0.1) * 2;

      dummy.position.set(
        Math.cos(angle + time * 0.2) * radius,
        Math.sin(angle + time * 0.2) * radius,
        z + (time * 5) % 300
      );
      dummy.rotation.set(time * 0.5, time * 0.3, 0);
      dummy.scale.setScalar(0.5 + Math.sin(i * 0.5) * 0.3);
      dummy.updateMatrix();

      meshesRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshesRef.current.instanceMatrix.needsUpdate = true;
    state.camera.position.z -= 0.3;

    if (state.camera.position.z < -300) {
      state.camera.position.z = 0;
    }
  });

  return (
    <instancedMesh ref={meshesRef} args={[geometry, undefined, count]}>
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.6} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function Fragments() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color('#00d4ff');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 5;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius;
      positions[i3 + 2] = -Math.random() * 100;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] += 0.5;
      if (positions[i + 2] > 10) positions[i + 2] = -100;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function DiveEffect() {
  return (
    <div className="dive-effect">
      <Canvas camera={{ position: [0, 0, 0], fov: 75 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 0, 10]} intensity={1} color="#00d4ff" />
        <HexagonTunnel />
        <Fragments />
      </Canvas>
    </div>
  );
}

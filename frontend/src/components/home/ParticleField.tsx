"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Particles = ({ count = 5000 }) => {
  const points = useRef<THREE.Points>(null!);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime() * 0.1;
    points.current.rotation.y = time;
    points.current.rotation.x = time * 0.5;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#3b82f6"
        sizeAttenuation
        transparent
        opacity={0.4}
      />
    </points>
  );
};

export const ParticleField = () => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Particles />
      </Canvas>
    </div>
  );
};

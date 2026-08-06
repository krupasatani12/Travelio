import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';

/**
 * 3D Scene for the Home Hero — globe shifted to the right
 */
const AnimatedGlobe = () => {
  const sphereRef = useRef();
  const materialRef = useRef();
  const { viewport } = useThree();

  useFrame(({ clock }) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = clock.getElapsedTime() * 0.1;
      sphereRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
    if (materialRef.current) {
      materialRef.current.distort = 0.25 + Math.sin(clock.getElapsedTime() * 1.5) * 0.1;
    }
  });

  // Calculate position and scale based on viewport width to ensure zero text overlap
  const isMobile = viewport.width < 5.5;
  const isTablet = viewport.width >= 5.5 && viewport.width < 8;

  let posX = viewport.width * 0.33;
  let posY = 0.2;
  let scale = Math.min(1.65, viewport.width * 0.22);

  if (isMobile) {
    posX = viewport.width * 0.38;
    posY = -0.2;
    scale = Math.min(1.1, viewport.width * 0.25);
  } else if (isTablet) {
    posX = viewport.width * 0.35;
    posY = 0.1;
    scale = Math.min(1.35, viewport.width * 0.22);
  }

  return (
    /* Shift the sphere safely to the right side */
    <group position={[posX, posY, 0]}>
      <Sphere ref={sphereRef} args={[1, 100, 200]} scale={scale}>
        <MeshDistortMaterial
          ref={materialRef}
          color="#10b981"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
          transparent={true}
          opacity={0.6}
        />
      </Sphere>
    </group>
  );
};

const Hero3D = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#6366f1" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#10b981" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <AnimatedGlobe />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default Hero3D;

'use client';

import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerformanceMonitor,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { easing } from 'maath';
import { SkillItem, SkillCategory } from './data';
import { TileLayoutPoint } from './layouts';
import { Tile } from './Tile';
import { Token } from './Token';

interface SceneProps {
  skills: SkillItem[];
  layoutPoints: TileLayoutPoint[];
  currentIndex: number;
  targetIndex: number;
  moveMode: 'step' | 'jump';
  activeCategory: SkillCategory | 'All';
  isFlatView: boolean;
  rotateOffset: number;
  isReducedMotion: boolean;
  introStarted: boolean;
  onTileClick: (index: number) => void;
  onTokenStepComplete: (newIndex: number) => void;
}

function CameraRig({
  isFlatView,
  rotateOffset,
  isReducedMotion,
}: {
  isFlatView: boolean;
  rotateOffset: number;
  isReducedMotion: boolean;
}) {
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    // Responsive camera distance based on viewport aspect ratio
    const aspect = size.width / Math.max(1, size.height);
    const zoomMultiplier = aspect < 0.85 ? 1.45 : aspect < 1.1 ? 1.25 : 1.0;
    const radius = 23 * zoomMultiplier;

    if (isReducedMotion) {
      if (isFlatView) {
        camera.position.set(0, 22 * zoomMultiplier, 0.01);
      } else {
        const phi = (52 * Math.PI) / 180;
        const theta = (45 * Math.PI) / 180 + rotateOffset;
        camera.position.set(
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.cos(theta)
        );
      }
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      return;
    }

    const phi = isFlatView ? 0.001 : (52 * Math.PI) / 180;
    const theta = (45 * Math.PI) / 180 + rotateOffset;

    const targetX = isFlatView ? 0 : radius * Math.sin(phi) * Math.sin(theta);
    const targetY = isFlatView ? 22 * zoomMultiplier : radius * Math.cos(phi);
    const targetZ = isFlatView ? 0.01 : radius * Math.sin(phi) * Math.cos(theta);

    easing.damp3(camera.position, [targetX, targetY, targetZ], 0.25, delta);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={false}
      enablePan={false}
      minPolarAngle={isFlatView ? 0 : Math.PI / 6}
      maxPolarAngle={isFlatView ? Math.PI / 2 : (Math.PI * 70) / 180}
      enableDamping
      dampingFactor={0.05}
    />
  );
}

export default function Scene({
  skills,
  layoutPoints,
  currentIndex,
  targetIndex,
  moveMode,
  activeCategory,
  isFlatView,
  rotateOffset,
  isReducedMotion,
  introStarted,
  onTileClick,
  onTokenStepComplete,
}: SceneProps) {
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: 'high-performance',
      }}
      camera={{
        fov: 28,
        position: [14, 16, 16],
        near: 0.1,
        far: 100,
      }}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'pan-y' }}
    >
      <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />

      {/* Lighting Architecture */}
      <ambientLight intensity={0.4} />

      {/* Key directional light with soft shadow mapping */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0001}
      />

      {/* Subtle warm accent rim light */}
      <directionalLight position={[-12, 10, -12]} intensity={0.9} color="#f5643e" />

      {/* Fill light */}
      <directionalLight position={[0, -10, 10]} intensity={0.2} color="#ffffff" />

      {/* Studio / City HDRI Environment at low intensity */}
      <Environment preset="city" environmentIntensity={0.32} />

      {/* Camera Rig & OrbitControls */}
      <CameraRig
        isFlatView={isFlatView}
        rotateOffset={rotateOffset}
        isReducedMotion={isReducedMotion}
      />

      {/* Dark Glossy Board Slab */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, -0.28, 0]} receiveShadow>
          <boxGeometry args={[18, 0.55, 14]} />
          <meshPhysicalMaterial
            color="#0b0a08"
            roughness={0.35}
            metalness={0.12}
            clearcoat={0.9}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Faint grid lines on board surface */}
        <gridHelper
          args={[16.5, 18, '#26221c', '#151310']}
          position={[0, 0.001, 0]}
        />
      </group>

      {/* Contact Shadows on Board */}
      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.65}
        scale={18}
        blur={1.6}
        far={5}
        color="#000000"
      />

      {/* 37 Skill Tiles */}
      <group>
        {skills.map((skill, index) => {
          const pt = layoutPoints[index] ?? { x: 0, z: 0 };
          const isHovered = hoveredTileId === skill.id;
          const isActive = currentIndex === index;
          const isDimmed =
            activeCategory !== 'All' &&
            skill.category !== 'Special' &&
            skill.category !== activeCategory;

          return (
            <Tile
              key={skill.id}
              skill={skill}
              index={index}
              targetPos={[pt.x, 0, pt.z]}
              isHovered={isHovered}
              isActive={isActive}
              isDimmed={isDimmed}
              isReducedMotion={isReducedMotion}
              introStarted={introStarted}
              onHover={setHoveredTileId}
              onClick={onTileClick}
            />
          );
        })}
      </group>

      {/* Interactive Hopping Token */}
      <Token
        currentIndex={currentIndex}
        targetIndex={targetIndex}
        moveMode={moveMode}
        layoutPoints={layoutPoints}
        skills={skills}
        isReducedMotion={isReducedMotion}
        onStepComplete={onTokenStepComplete}
      />

      {/* Postprocessing: ACES Bloom & Vignette */}
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom
          mipmapBlur
          intensity={0.52}
          luminanceThreshold={0.72}
          luminanceSmoothing={0.3}
        />
        <Vignette eskil={false} offset={0.16} darkness={0.82} />
      </EffectComposer>
    </Canvas>
  );
}

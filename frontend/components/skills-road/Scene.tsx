'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { easing } from 'maath';
import { SkillItem, SkillCategory } from './data';
import { TileLayoutPoint, TILE_SPACING } from './layouts';
import { Tile } from './Tile';
import { Token } from './Token';

// Filter benign upstream Three.js deprecation notices and ANGLE HLSL precision warnings
if (typeof window !== 'undefined') {
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('THREE.Clock:') ||
      msg.includes('PCFSoftShadowMap') ||
      msg.includes('X4122') ||
      msg.includes('Program Info Log') ||
      msg.includes('cannot be represented accurately')
    ) {
      return;
    }
    origWarn.apply(console, args);
  };
}

function Board() {
  const shape = useMemo(() => {
    const halfWidth = 5.1;
    const halfDepth = 3.6;
    const radius = 0.25;
    const board = new THREE.Shape();
    board.moveTo(-halfWidth + radius, -halfDepth);
    board.lineTo(halfWidth - radius, -halfDepth);
    board.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + radius);
    board.lineTo(halfWidth, halfDepth - radius);
    board.quadraticCurveTo(halfWidth, halfDepth, halfWidth - radius, halfDepth);
    board.lineTo(-halfWidth + radius, halfDepth);
    board.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - radius);
    board.lineTo(-halfWidth, -halfDepth + radius);
    board.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + radius, -halfDepth);
    return board;
  }, []);

  return (
    <mesh position={[0, -0.455, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <extrudeGeometry args={[shape, { depth: 0.45, bevelEnabled: false, curveSegments: 8 }]} />
      <meshPhysicalMaterial color="#0b0a08" roughness={0.52} metalness={0.08} clearcoat={0.3} clearcoatRoughness={0.35} />
    </mesh>
  );
}

interface SceneProps {
  skills: SkillItem[];
  layoutPoints: TileLayoutPoint[];
  currentIndex: number;
  targetIndex: number;
  moveMode: 'step' | 'jump';
  activeCategory: SkillCategory | 'All';
  isFlatView: boolean;
  isReducedMotion: boolean;
  introStarted: boolean;
  isInView?: boolean;
  hoveredTileId: string | null;
  onTileHover: (id: string | null) => void;
  onTileClick: (index: number) => void;
  onTokenStepComplete: (newIndex: number) => void;
  onReady: () => void;
}

// Signal only after the canvas has had an opportunity to draw its first frame.
function FirstFrame({ onReady }: { onReady: () => void }) {
  const reported = useRef(false);
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    onReady();
  });
  return null;
}

function AnimateOnChange({ values }: { values: readonly unknown[] }) {
  const invalidate = useThree(state => state.invalidate);
  const until = useRef(0);
  useEffect(() => {
    until.current = performance.now() + 4000;
    invalidate();
  // values contains the scene inputs that can start an animation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate, ...values]);
  useFrame(() => {
    if (performance.now() < until.current) invalidate();
  });
  return null;
}

/**
 * Rectangular surface grid with exactly 1 row of empty surface tiles on all four sides.
 * Road span: X [-3.76, 3.76], Z [-2.35, 2.35]
 * Board Grid: X [-4.70, 4.70], Z [-3.29, 3.29]
 */
function BoardGrid() {
  const lineGeometry = useMemo(() => {
    const points: number[] = [];
    const minX = -4.70;
    const maxX = 4.70;
    const minZ = -3.29;
    const maxZ = 3.29;
    const step = TILE_SPACING; // 0.94

    // Vertical lines along Z (constant X)
    for (let x = minX; x <= maxX + 0.01; x += step) {
      points.push(x, 0.002, minZ, x, 0.002, maxZ);
    }
    // Horizontal lines along X (constant Z)
    for (let z = minZ; z <= maxZ + 0.01; z += step) {
      points.push(minX, 0.002, z, maxX, 0.002, z);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geom;
  }, []);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#2c2822" transparent opacity={0.85} />
    </lineSegments>
  );
}

function CameraRig({
  isFlatView,
  isReducedMotion,
}: {
  isFlatView: boolean;
  isReducedMotion: boolean;
}) {
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);
  const isTransitioning = useRef(false);
  const targetPos = useRef(new THREE.Vector3());
  const targetUp = useRef(new THREE.Vector3(0, 1, 0));
  const prevFlatView = useRef(isFlatView);
  const isUserInteracting = useRef(false);

  // Responsive zoom / height calculation based on aspect ratio
  const aspect = size.width / Math.max(1, size.height);
  const zoomMultiplier = aspect < 0.85 ? 1.35 : aspect < 1.1 ? 1.15 : 1.0;
  const isoRadius = 18.5 * zoomMultiplier;

  // Zoomed-in height for 90-degree zenith view so icons are clearly visible
  // Board is 10.2 x 7.2, FOV is 26 deg
  const flatHeight = Math.max(16.5, 23.5 / Math.max(0.42, aspect));

  // On mount, establish initial perspective
  useEffect(() => {
    if (isFlatView) {
      camera.position.set(0, flatHeight, 0);
      camera.up.set(0, 0, -1);
      camera.lookAt(0, 0, 0);
    } else {
      const phi = (52 * Math.PI) / 180;
      const theta = (45 * Math.PI) / 180;
      camera.position.set(
        isoRadius * Math.sin(phi) * Math.sin(theta),
        isoRadius * Math.cos(phi),
        isoRadius * Math.sin(phi) * Math.cos(theta)
      );
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
    }
  }, []);

  // Listen to OrbitControls events so user drag preserves custom angle in isometric view
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      isUserInteracting.current = true;
      isTransitioning.current = false;
    };
    const onEnd = () => {
      isUserInteracting.current = false;
    };

    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, []);

  // Programmatic Flat View transition
  useEffect(() => {
    if (prevFlatView.current !== isFlatView) {
      prevFlatView.current = isFlatView;
      isTransitioning.current = true;

      if (isFlatView) {
        targetPos.current.set(0, flatHeight, 0);
        targetUp.current.set(0, 0, -1);
      } else {
        const phi = (52 * Math.PI) / 180;
        const theta = (45 * Math.PI) / 180;
        targetPos.current.set(
          isoRadius * Math.sin(phi) * Math.sin(theta),
          isoRadius * Math.cos(phi),
          isoRadius * Math.sin(phi) * Math.cos(theta)
        );
        targetUp.current.set(0, 1, 0);
      }
    }
  }, [isFlatView, flatHeight, isoRadius]);

  useFrame((_, delta) => {
    // 1. Strict 90-degree straight top-down view (Zenith alignment)
    if (isFlatView) {
      if (isTransitioning.current) {
        if (isReducedMotion) {
          camera.position.copy(targetPos.current);
          camera.up.copy(targetUp.current);
          camera.lookAt(0, 0, 0);
          isTransitioning.current = false;
        } else {
          easing.damp3(camera.position, targetPos.current, 0.22, delta);
          easing.damp3(camera.up, targetUp.current, 0.22, delta);
          camera.lookAt(0, 0, 0);

          if (camera.position.distanceTo(targetPos.current) < 0.04) {
            camera.position.copy(targetPos.current);
            camera.up.set(0, 0, -1);
            camera.lookAt(0, 0, 0);
            isTransitioning.current = false;
          }
        }
      } else {
        // Firmly pin camera at exact 90-degree straight-down perpendicular position
        camera.position.set(0, flatHeight, 0);
        camera.up.set(0, 0, -1);
        camera.lookAt(0, 0, 0);
      }
      return;
    }

    // 2. Isometric view: let user orbit freely and retain release position
    if (isUserInteracting.current) {
      return;
    }

    // 3. Transitioning back from Flat View to Isometric
    if (isTransitioning.current) {
      if (isReducedMotion) {
        camera.position.copy(targetPos.current);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        isTransitioning.current = false;
        return;
      }

      easing.damp3(camera.position, targetPos.current, 0.22, delta);
      easing.damp3(camera.up, targetUp.current, 0.22, delta);
      camera.lookAt(0, 0, 0);

      if (camera.position.distanceTo(targetPos.current) < 0.04) {
        camera.position.copy(targetPos.current);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isFlatView && !isTransitioning.current}
      enableZoom={false}
      enablePan={false}
      enableRotate={!isFlatView}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={(Math.PI * 72) / 180}
      enableDamping
      dampingFactor={0.06}
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
  isReducedMotion,
  introStarted,
  isInView = true,
  hoveredTileId,
  onTileHover,
  onTileClick,
  onTokenStepComplete,
  onReady,
}: SceneProps) {
  const [dpr, setDpr] = useState(1.25);
  const [firstDrawn, setFirstDrawn] = useState(false);
  const handleReady = useCallback(() => {
    setFirstDrawn(true);
    onReady();
  }, [onReady]);

  return (
    <Canvas
      frameloop={isInView || !firstDrawn ? 'demand' : 'never'}
      dpr={dpr}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: 'high-performance',
      }}
      camera={{
        fov: 26,
        position: [14, 16, 16],
        near: 0.1,
        far: 100,
      }}
      className={`w-full h-full ${isFlatView ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      style={{ touchAction: 'pan-y' }}
    >
      <FirstFrame onReady={handleReady} />
      <AnimateOnChange values={[layoutPoints, currentIndex, targetIndex, activeCategory, isFlatView, hoveredTileId, introStarted, isInView]} />
      <PerformanceMonitor onIncline={() => setDpr(1.25)} onDecline={() => setDpr(1)} />
      <AdaptiveDpr />

      {/* Lighting Architecture */}
      <ambientLight intensity={0.45} />

      {/* Dynamic Key directional light casting real-time soft shadows that match tile movement */}
      <directionalLight
        position={[6, 20, 6]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-bias={-0.0001}
      />

      {/* Warm accent rim light */}
      <directionalLight position={[-10, 10, -10]} intensity={0.7} color="#f5643e" />

      {/* Subtle fill light */}
      <directionalLight position={[0, -10, 10]} intensity={0.2} color="#ffffff" />

      {/* Studio / City HDRI Environment at low intensity */}
      <Environment preset="city" environmentIntensity={0.32} />

      {/* Camera Rig: Locked in Flat View, orbit with drag retention in Isometric */}
      <CameraRig
        isFlatView={isFlatView}
        isReducedMotion={isReducedMotion}
      />

      {/* Dark Glossy Board Slab with shadows (with 1 row margin of surface tiles on all 4 sides) */}
      <group position={[0, 0, 0]}>
        <Board />

        {/* Faint rectangular grid lines with exactly 1 row margin on all 4 sides */}
        <BoardGrid />
      </group>

      {/* Skill Tiles with real-time shadow casting (pure meshes without DOM roots) */}
      <group>
        {skills.map((skill, index) => {
          const pt = layoutPoints[index] ?? { x: 0, z: 0 };
          const isHovered = hoveredTileId === skill.id;
          const isActive = currentIndex === index;
          const isDimmed =
            activeCategory !== 'All' &&
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
              onHover={onTileHover}
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
        <Bloom mipmapBlur intensity={0.52} luminanceThreshold={0.72} luminanceSmoothing={0.3} />
        <Vignette eskil={false} offset={0.16} darkness={0.82} />
      </EffectComposer>
    </Canvas>
  );
}

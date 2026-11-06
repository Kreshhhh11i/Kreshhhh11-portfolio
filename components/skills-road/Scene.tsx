'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerformanceMonitor, Html } from '@react-three/drei';
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
  onTileClick: (index: number) => void;
  onTokenStepComplete: (newIndex: number) => void;
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

function FloatingLabel({
  skill,
  targetPoint,
  isFlatView,
  visible,
}: {
  skill: SkillItem | undefined;
  targetPoint: { x: number; z: number };
  isFlatView: boolean;
  visible: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(targetPoint.x, 0, targetPoint.z));

  const targetY = ((skill?.height ?? 0.38) / 2) + (isFlatView ? 0.35 : 0.68);
  const targetZ = targetPoint.z + (isFlatView ? -0.92 : -0.15);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    easing.damp(posRef.current, 'x', targetPoint.x, 0.16, delta);
    easing.damp(posRef.current, 'y', targetY, 0.16, delta);
    easing.damp(posRef.current, 'z', targetZ, 0.16, delta);
    groupRef.current.position.set(posRef.current.x, posRef.current.y, posRef.current.z);
  });

  return (
    <group ref={groupRef} position={[targetPoint.x, targetY, targetZ]}>
      <Html
        center
        distanceFactor={14}
        style={{
          pointerEvents: 'none',
          transition: 'opacity 0.18s ease',
          opacity: visible && skill ? 1 : 0,
        }}
      >
        {skill && (
          <div className="flex flex-col items-center pointer-events-none transition-all duration-200">
            <div className="px-2.5 py-1 rounded-full bg-[#14120f]/95 border border-[var(--line)] shadow-xl backdrop-blur-md text-[#f6eddc] flex items-center gap-1.5 whitespace-nowrap text-xs font-mono font-medium">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: skill.color }}
              />
              <span className="text-[#f6eddc] font-semibold">{skill.name}</span>
              <span className="text-[10px] text-[var(--muted)] capitalize">
                • {skill.level}
              </span>
            </div>
            {/* Tiny downward notch pointing to the tile */}
            <div className="w-1.5 h-1.5 rotate-45 bg-[#14120f] border-r border-b border-[var(--line)] -mt-1" />
          </div>
        )}
      </Html>
    </group>
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
  onTileClick,
  onTokenStepComplete,
}: SceneProps) {
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [dpr, setDpr] = useState(1.5);

  // Single persistent floating label target calculation (never mounts/unmounts during hover/hops)
  const hoveredIndex = hoveredTileId ? skills.findIndex((s) => s.id === hoveredTileId) : -1;
  const isHoveredValid =
    hoveredIndex !== -1 && (activeCategory === 'All' || skills[hoveredIndex]?.category === activeCategory);
  const labelIndex = isHoveredValid ? hoveredIndex : currentIndex;
  const labelSkill = skills[labelIndex];
  const labelPoint = layoutPoints[labelIndex] ?? { x: 0, z: 0 };
  const labelVisible = Boolean(labelSkill);

  return (
    <Canvas
      shadows="percentage"
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
      <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />

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
        <mesh position={[0, -0.23, 0]} receiveShadow>
          <boxGeometry args={[10.2, 0.45, 7.2]} />
          <meshPhysicalMaterial
            color="#0b0a08"
            roughness={0.52}
            metalness={0.08}
            clearcoat={0.3}
            clearcoatRoughness={0.35}
          />
        </mesh>

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

      {/* Single persistent floating label: glides smoothly, never unmounts, avoids React 19 DOM race conditions */}
      <FloatingLabel
        skill={labelSkill}
        targetPoint={labelPoint}
        isFlatView={isFlatView}
        visible={labelVisible}
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

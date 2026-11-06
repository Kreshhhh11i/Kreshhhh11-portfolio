'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { SkillItem } from './data';
import { TileLayoutPoint } from './layouts';

interface TokenProps {
  currentIndex: number;
  targetIndex: number;
  moveMode: 'step' | 'jump';
  layoutPoints: TileLayoutPoint[];
  skills: SkillItem[];
  isReducedMotion: boolean;
  onStepComplete?: (newIndex: number) => void;
}

export function Token({
  currentIndex,
  targetIndex,
  moveMode,
  layoutPoints,
  skills,
  isReducedMotion,
  onStepComplete,
}: TokenProps) {
  const meshRef = useRef<THREE.Group>(null);
  const sphereMeshRef = useRef<THREE.Mesh>(null);
  const shadowMeshRef = useRef<THREE.Mesh>(null);

  // High-resolution "K" monogram decal
  const kTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 256, 256);

    // Warm dark backing
    ctx.fillStyle = '#191714';
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // Accent orange outer ring
    ctx.strokeStyle = '#f5643e';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.stroke();

    // Bright cream "K"
    ctx.fillStyle = '#f6eddc';
    ctx.font = 'bold 136px Geist, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('K', 128, 134);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Soft contact shadow texture
  const shadowTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  const animRef = useRef({
    pos: new THREE.Vector3(),
    currentTileIndex: currentIndex,
    targetTileIndex: targetIndex,
    stepProgress: 1.0,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    squashTimer: 0,
    hopHeight: 0.72,
    hopSpeed: 5.6,
  });

  useEffect(() => {
    animRef.current.targetTileIndex = targetIndex;
  }, [targetIndex]);

  useEffect(() => {
    if (layoutPoints[currentIndex]) {
      const tile = layoutPoints[currentIndex];
      const skill = skills[currentIndex];
      const tileTopY = skill?.height ?? 0.38;
      animRef.current.pos.set(tile.x, tileTopY + 0.25, tile.z);
      animRef.current.currentTileIndex = currentIndex;
    }
  }, [layoutPoints, currentIndex, skills]);

  useFrame((_, delta) => {
    if (!meshRef.current || !sphereMeshRef.current || !shadowMeshRef.current) return;

    const state = animRef.current;

    if (isReducedMotion) {
      const targetPoint = layoutPoints[targetIndex];
      const targetSkill = skills[targetIndex];
      if (targetPoint && targetSkill) {
        const targetTopY = targetSkill.height + 0.25;
        meshRef.current.position.set(targetPoint.x, targetTopY, targetPoint.z);
        shadowMeshRef.current.position.set(targetPoint.x, targetSkill.height + 0.005, targetPoint.z);
        sphereMeshRef.current.scale.set(1, 1, 1);
      }
      return;
    }

    // Determine next hop target
    if (state.stepProgress >= 1.0) {
      if (state.currentTileIndex !== state.targetTileIndex) {
        let nextIdx = state.targetTileIndex;
        if (moveMode === 'step') {
          nextIdx =
            state.currentTileIndex < state.targetTileIndex
              ? state.currentTileIndex + 1
              : state.currentTileIndex - 1;
        }

        const fromPt = layoutPoints[state.currentTileIndex];
        const fromSkill = skills[state.currentTileIndex];
        const toPt = layoutPoints[nextIdx];
        const toSkill = skills[nextIdx];

        if (fromPt && toPt && fromSkill && toSkill) {
          state.fromPos.set(fromPt.x, fromSkill.height + 0.25, fromPt.z);
          state.toPos.set(toPt.x, toSkill.height + 0.25, toPt.z);

          const dist = Math.hypot(toPt.x - fromPt.x, toPt.z - fromPt.z);
          if (moveMode === 'jump') {
            state.hopHeight = Math.min(2.2, 0.8 + dist * 0.16);
            state.hopSpeed = Math.max(2.6, 4.8 - dist * 0.12);
          } else {
            state.hopHeight = 0.72;
            state.hopSpeed = 5.6;
          }

          state.stepProgress = 0;
          state.currentTileIndex = nextIdx;
          onStepComplete?.(nextIdx);
        }
      }
    }

    // Active hop animation
    if (state.stepProgress < 1.0) {
      state.stepProgress += delta * state.hopSpeed;
      const t = Math.min(1.0, state.stepProgress);

      // Horizontal linear interpolation
      state.pos.x = THREE.MathUtils.lerp(state.fromPos.x, state.toPos.x, t);
      state.pos.z = THREE.MathUtils.lerp(state.fromPos.z, state.toPos.z, t);

      // Parabolic vertical arc: 4 * h * t * (1 - t)
      const baseHeight = THREE.MathUtils.lerp(state.fromPos.y, state.toPos.y, t);
      const arc = 4 * state.hopHeight * t * (1 - t);
      state.pos.y = baseHeight + arc;

      // In-flight stretch and landing squash
      if (t < 0.88) {
        const stretch = Math.sin(t * Math.PI) * 0.30;
        sphereMeshRef.current.scale.set(1 - stretch * 0.45, 1 + stretch, 1 - stretch * 0.45);
      } else {
        state.squashTimer = 0.14;
      }

      // Dynamic shadow scale & opacity
      const shadowScale = THREE.MathUtils.lerp(1.25, 0.7, arc / state.hopHeight);
      const shadowOpacity = THREE.MathUtils.lerp(0.85, 0.22, arc / state.hopHeight);
      shadowMeshRef.current.scale.set(shadowScale, shadowScale, shadowScale);
      (shadowMeshRef.current.material as THREE.MeshBasicMaterial).opacity = shadowOpacity;
      shadowMeshRef.current.position.set(state.pos.x, baseHeight - 0.245, state.pos.z);
    } else {
      // Idle on current tile
      if (state.squashTimer > 0) {
        state.squashTimer -= delta;
        sphereMeshRef.current.scale.set(1.22, 0.72, 1.22);
      } else {
        easing.damp3(sphereMeshRef.current.scale, [1, 1, 1], 0.14, delta);
      }

      const currPt = layoutPoints[state.currentTileIndex];
      const currSkill = skills[state.currentTileIndex];
      if (currPt && currSkill) {
        const activeLift = 0.18;
        const targetTileY = currSkill.height + activeLift + 0.25;
        easing.damp(state.pos, 'x', currPt.x, 0.2, delta);
        easing.damp(state.pos, 'y', targetTileY, 0.2, delta);
        easing.damp(state.pos, 'z', currPt.z, 0.2, delta);

        shadowMeshRef.current.position.set(currPt.x, currSkill.height + activeLift + 0.005, currPt.z);
        (shadowMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85;
        shadowMeshRef.current.scale.set(1, 1, 1);
      }
    }

    meshRef.current.position.copy(state.pos);
  });

  return (
    <>
      <group ref={meshRef}>
        {/* Token Sphere Body */}
        <mesh ref={sphereMeshRef} castShadow receiveShadow>
          <sphereGeometry args={[0.23, 32, 32]} />
          <meshPhysicalMaterial
            color="#f5643e"
            roughness={0.18}
            metalness={0.8}
            clearcoat={1}
            clearcoatRoughness={0.1}
            reflectivity={0.95}
          />
        </mesh>

        {/* Monogram Medallion on Top Facing Camera */}
        {kTexture && (
          <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2.4, 0, 0]}>
            <circleGeometry args={[0.15, 32]} />
            <meshBasicMaterial
              map={kTexture}
              transparent
              toneMapped={false}
            />
          </mesh>
        )}

        {/* Ambient Warm Accent Point Light */}
        <pointLight
          position={[0, 0.08, 0]}
          color="#f5643e"
          intensity={2.0}
          distance={2.4}
          decay={2}
        />
      </group>

      {/* Dynamic Contact Shadow Plane on Top of Current Tile */}
      <mesh ref={shadowMeshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.65, 0.65]} />
        {shadowTexture && (
          <meshBasicMaterial
            map={shadowTexture}
            transparent
            depthWrite={false}
          />
        )}
      </mesh>
    </>
  );
}

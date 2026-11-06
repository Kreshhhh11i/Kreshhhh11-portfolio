'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { easing } from 'maath';
import { SkillItem } from './data';
import { useIconTexture } from './useIconTexture';

interface TileProps {
  skill: SkillItem;
  index: number;
  targetPos: [number, number, number]; // [x, 0, z]
  isHovered: boolean;
  isActive: boolean;
  isDimmed: boolean;
  isReducedMotion: boolean;
  introStarted: boolean;
  onHover: (id: string | null) => void;
  onClick: (index: number) => void;
}

const DIMMED_COLOR = new THREE.Color('#141418');
const NORMAL_COLOR = new THREE.Color('#0b0b0d');

export function Tile({
  skill,
  index,
  targetPos,
  isHovered,
  isActive,
  isDimmed,
  isReducedMotion,
  introStarted,
  onHover,
  onClick,
}: TileProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const iconMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  // When dimmed: uses pure monochrome grey texture; when active: uses vibrant color aura
  const texture = useIconTexture(skill.id, isDimmed);

  // Initial drop-in intro state
  const initialY = introStarted ? skill.height / 2 : 6 + index * 0.1;

  // Track position and opacity in ref for frame-rate independent interpolation
  const posRef = useRef(new THREE.Vector3(targetPos[0], initialY, targetPos[2]));
  const opacityRef = useRef(isDimmed ? 0.45 : 1.0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isReducedMotion) {
      const lift = isActive ? 0.2 : isDimmed ? -0.05 : 0.03;
      groupRef.current.position.set(
        targetPos[0],
        skill.height / 2 + lift,
        targetPos[2]
      );
      if (bodyMaterialRef.current) {
        bodyMaterialRef.current.color.copy(isDimmed ? DIMMED_COLOR : NORMAL_COLOR);
        bodyMaterialRef.current.opacity = isDimmed ? 0.45 : 1.0;
        bodyMaterialRef.current.transparent = isDimmed;
      }
      if (iconMaterialRef.current) {
        iconMaterialRef.current.opacity = isDimmed ? 0.42 : 1.0;
        iconMaterialRef.current.transparent = isDimmed;
      }
      return;
    }

    // 1. Horizontal Position damp
    easing.damp(posRef.current, 'x', targetPos[0], 0.22, delta);
    easing.damp(posRef.current, 'z', targetPos[2], 0.22, delta);

    // 2. Parabolic arc when traveling horizontally during morph
    const dx = targetPos[0] - posRef.current.x;
    const dz = targetPos[2] - posRef.current.z;
    const distXZ = Math.hypot(dx, dz);
    const arcLift = Math.min(1.2, distXZ * 0.4);

    // 3. Hover / Active / Dim Lift:
    // Enhanced category tiles stand taller, greyed-out tiles sit low on the board
    const baseHeightY = skill.height / 2;
    let extraLift = 0;
    if (isActive) {
      extraLift = 0.22;
    } else if (isHovered && !isDimmed) {
      extraLift = 0.08;
    } else if (isDimmed) {
      extraLift = -0.05;
    } else {
      extraLift = 0.03;
    }

    const destY = baseHeightY + extraLift + arcLift;
    easing.damp(posRef.current, 'y', destY, 0.18, delta);

    groupRef.current.position.set(
      posRef.current.x,
      posRef.current.y,
      posRef.current.z
    );

    // 4. Smooth opacity & color lerp: selected category 1.0, greyed-out tiles 0.45
    const targetOpacity = isDimmed ? 0.45 : 1.0;
    easing.damp(opacityRef, 'current', targetOpacity, 0.22, delta);

    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.color.lerp(isDimmed ? DIMMED_COLOR : NORMAL_COLOR, delta * 6);
      bodyMaterialRef.current.opacity = opacityRef.current;
      bodyMaterialRef.current.transparent = opacityRef.current < 0.98;
      bodyMaterialRef.current.clearcoat = isDimmed ? 0.05 : 1.0;
      bodyMaterialRef.current.roughness = isDimmed ? 0.58 : 0.28;
    }

    if (iconMaterialRef.current) {
      const iconTargetOp = isDimmed ? 0.42 : 1.0;
      iconMaterialRef.current.opacity = iconTargetOp;
      iconMaterialRef.current.transparent = isDimmed;
      // No hover bloom glow; subtle boost on active token tile
      const emissiveBoost = isActive ? 1.3 : isDimmed ? 0.8 : 1.05;
      iconMaterialRef.current.color.setScalar(emissiveBoost);
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        if (isDimmed) return;
        e.stopPropagation();
        onHover(skill.id);
      }}
      onPointerOut={() => {
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }}
    >
      {/* Tile Physical Rounded Box (castShadow active only on clearly visible tiles) */}
      <RoundedBox
        args={[0.72, skill.height, 0.72]}
        radius={0.05}
        smoothness={4}
        castShadow={!isDimmed}
        receiveShadow
      >
        <meshPhysicalMaterial
          ref={bodyMaterialRef}
          color="#0b0b0d"
          roughness={0.28}
          metalness={0.15}
          clearcoat={isDimmed ? 0.05 : 1}
          clearcoatRoughness={0.15}
        />
      </RoundedBox>

      {/* Top Face Canvas Icon */}
      {texture && (
        <mesh
          position={[0, skill.height / 2 + 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.70, 0.70]} />
          <meshBasicMaterial
            ref={iconMaterialRef}
            map={texture}
            transparent
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

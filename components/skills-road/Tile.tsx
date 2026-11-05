'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import { easing } from 'maath';
import { SkillItem, LEVEL_HEIGHTS } from './data';
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

  const texture = useIconTexture(skill.iconName, skill.color);

  // Initial drop-in intro state
  const introDelay = index * 0.028;
  const initialY = introStarted ? skill.height / 2 : 7 + index * 0.12;

  // Track position in ref for frame-rate independent interpolation
  const posRef = useRef(new THREE.Vector3(targetPos[0], initialY, targetPos[2]));
  const opacityRef = useRef(1.0);

  // Staggered morph delay offset
  const morphDelayRef = useRef(index * 0.03);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isReducedMotion) {
      const lift = isActive ? 0.25 : isHovered ? 0.14 : isDimmed ? -0.06 : 0;
      groupRef.current.position.set(
        targetPos[0],
        skill.height / 2 + lift,
        targetPos[2]
      );
      if (bodyMaterialRef.current) {
        bodyMaterialRef.current.opacity = isDimmed ? 0.2 : 1.0;
        bodyMaterialRef.current.transparent = isDimmed;
      }
      if (iconMaterialRef.current) {
        iconMaterialRef.current.opacity = isDimmed ? 0.25 : 1.0;
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
    const arcLift = Math.min(1.4, distXZ * 0.45);

    // 3. Hover / Active / Dim Lift
    const baseHeightY = skill.height / 2;
    let extraLift = 0;
    if (isActive) {
      extraLift = 0.26;
    } else if (isHovered) {
      extraLift = 0.15;
    } else if (isDimmed) {
      extraLift = -0.05;
    }

    const destY = baseHeightY + extraLift + arcLift;
    easing.damp(posRef.current, 'y', destY, 0.18, delta);

    groupRef.current.position.set(
      posRef.current.x,
      posRef.current.y,
      posRef.current.z
    );

    // 4. Opacity damp for filter transitions
    const targetOpacity = isDimmed ? 0.22 : 1.0;
    easing.damp(opacityRef, 'current', targetOpacity, 0.2, delta);

    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.opacity = opacityRef.current;
      bodyMaterialRef.current.transparent = opacityRef.current < 0.98;
    }

    if (iconMaterialRef.current) {
      iconMaterialRef.current.opacity = Math.max(0.3, opacityRef.current);
      iconMaterialRef.current.transparent = opacityRef.current < 0.98;
      // Boost luminance on hover/active
      const emissiveBoost = isActive ? 1.6 : isHovered ? 1.3 : 1.0;
      iconMaterialRef.current.color.setScalar(emissiveBoost);
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
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
      {/* Tile Physical Rounded Box */}
      <RoundedBox
        args={[0.92, skill.height, 0.92]}
        radius={0.06}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          ref={bodyMaterialRef}
          color="#0b0b0d"
          roughness={0.28}
          metalness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </RoundedBox>

      {/* Top Face Canvas Icon & Emissive Inset Rim */}
      {texture && (
        <mesh
          position={[0, skill.height / 2 + 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial
            ref={iconMaterialRef}
            map={texture}
            transparent
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Floating 3D Tooltip Label on Hover or Active */}
      {(isHovered || isActive) && (
        <Html
          position={[0, skill.height / 2 + (isActive ? 0.88 : 0.44), 0]}
          center
          distanceFactor={14}
          style={{ pointerEvents: 'none' }}
        >
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
            {/* Tiny downward notch */}
            <div className="w-1.5 h-1.5 rotate-45 bg-[#14120f] border-r border-b border-[var(--line)] -mt-1" />
          </div>
        </Html>
      )}
    </group>
  );
}

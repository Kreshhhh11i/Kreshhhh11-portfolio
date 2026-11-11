import React from 'react';

export interface LanyardProps {
  frontImage?: string;
  backImage?: string;
  strapImage?: string;
  imageFit?: 'cover' | 'contain';
  cardColor?: string;
  strapColor?: string;
  orientation?: 'portrait' | 'landscape';
  finish?: 'glossy' | 'matte' | 'holographic' | 'metallic';
  cornerRadius?: number;
  size?: number;
  strapLength?: number;
  strapWidth?: number;
  gravity?: number;
  damping?: number;
  elasticity?: number;
  breeze?: number;
  anchor?: 'left' | 'center' | 'right' | number;
  metal?: 'graphite' | 'silver' | 'gold';
  interactive?: boolean;
  intro?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare const Lanyard: React.ComponentType<LanyardProps>;
export default Lanyard;


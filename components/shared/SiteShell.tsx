'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import DotGrid from '@/components/shared/DotGrid';
import { Navbar } from '@/components/Navbar/Navbar';
import { OpeningSequence } from '@/components/shared/OpeningSequence';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/signatures') return <>{children}</>;
  return <OpeningSequence>
    <DotGrid />
    <Navbar />
    <div className="relative z-10 flex-1 pt-14 sm:pt-16">{children}</div>
  </OpeningSequence>;
}

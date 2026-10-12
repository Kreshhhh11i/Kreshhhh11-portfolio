"use client";

import React, { useState, useEffect } from "react";
import { CircularCarousel, CarouselItem } from "@/components/ui/circular-carousel";
import { ProfileCard } from "@/components/ui/profile-card";

const photo = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

const PHOTOGRAPHY_ITEMS: CarouselItem[] = [
  {
    src: photo("photo-1506744038136-46273834b3fb"),
    alt: "Mist drifting through a mountain valley",
    title: "Misty Valleys",
    subtitle: "Highlands / Landscape"
  },
  {
    src: photo("photo-1486406146926-c627a92ad1ab"),
    alt: "Glass towers seen from street level",
    title: "Concrete Monoliths",
    subtitle: "City / Architecture"
  },
  {
    src: photo("photo-1519681393784-d120267933ba"),
    alt: "The Milky Way above snowy peaks",
    title: "Midnight Cosmos",
    subtitle: "Long Exposure / Sky"
  },
  {
    src: photo("photo-1493246507139-91e8fad9978e"),
    alt: "Mountains mirrored in a still alpine lake",
    title: "Alpine Mirror",
    subtitle: "Wilderness / Nature"
  },
  {
    src: photo("photo-1485968579580-b6d095142e6e"),
    alt: "Solitary figure on a rainy city street",
    title: "Urban Cadence",
    subtitle: "Street / Moments"
  },
  {
    src: photo("photo-1502680390469-be75c86b636f"),
    alt: "A surfer carving inside an emerald wave",
    title: "Emerald Swell",
    subtitle: "Action / Ocean"
  },
  {
    src: photo("photo-1511818966892-d7d671e672a2"),
    alt: "Angular geometric skyscraper against clouds",
    title: "Glass Horizons",
    subtitle: "Structure / Design"
  },
  {
    src: photo("photo-1509631179647-0177331693ae"),
    alt: "Editorial portrait with cinematic lighting",
    title: "Raw Expression",
    subtitle: "Studio / Portrait"
  }
];

const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const ApertureIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
    <line x1="9.69" y1="8" x2="21.17" y2="8" />
    <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
    <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
    <line x1="14.31" y1="16" x2="2.83" y2="16" />
    <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
  </svg>
);

export function PhotographyShowcase() {
  const [zoomedItem, setZoomedItem] = useState<CarouselItem | null>(null);
  const [displayItem, setDisplayItem] = useState<CarouselItem | null>(null);

  const handleOpenZoom = (item: CarouselItem) => {
    setDisplayItem(item);
    setZoomedItem(item);
  };

  const handleCloseZoom = () => {
    setZoomedItem(null);
  };

  // Keep card rendered for 500ms so exit transition runs with full smoothness
  useEffect(() => {
    if (!zoomedItem && displayItem) {
      const timer = setTimeout(() => {
        setDisplayItem(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [zoomedItem, displayItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseZoom();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="group relative w-full p-6 sm:p-8 border border-[var(--dashed-borders)] border-dashed bg-transparent rounded-sm font-mono text-[var(--secondary-text)] flex flex-col gap-6 transition-colors duration-300 hover:border-[var(--secondary-text)]">
      {/* Corner Accents with Glow */}
      <div className="corner-accent absolute top-[-2px] left-[-2px] w-3 h-3 border-t-2 border-l-2 border-[var(--primary-text)] opacity-40 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]" />
      <div className="corner-accent absolute top-[-2px] right-[-2px] w-3 h-3 border-t-2 border-r-2 border-[var(--primary-text)] opacity-40 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]" />
      <div className="corner-accent absolute bottom-[-2px] left-[-2px] w-3 h-3 border-b-2 border-l-2 border-[var(--primary-text)] opacity-40 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]" />
      <div className="corner-accent absolute bottom-[-2px] right-[-2px] w-3 h-3 border-b-2 border-r-2 border-[var(--primary-text)] opacity-40 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]" />

      {/* Header */}
      <div className="flex justify-between items-center text-xs tracking-wider border-b border-[var(--dashed-borders)] border-dashed pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--accent)]">
            <CameraIcon />
          </span>
          <span className="font-bold text-[var(--primary-text)] text-sm sm:text-base">
            BEHIND THE LENS
          </span>
          <span className="text-[10px] hidden sm:inline-block px-2 py-0.5 rounded-full border border-[var(--dashed-borders)] text-[var(--secondary-text)]">
            35MM / FRAMES
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          <ApertureIcon />
          <span className="text-[var(--secondary-text)]">DRAG 3D RING</span>
        </div>
      </div>

      {/* Circular Carousel Stage */}
      <div className="relative w-full h-[400px] sm:h-[460px] overflow-hidden rounded-sm bg-[var(--background)]">
        <CircularCarousel
          items={PHOTOGRAPHY_ITEMS}
          preset="orbit"
          intro="rise"
          cardWidth={200}
          aspectRatio={0.75}
          gap={20}
          tilt={-14}
          speed={9}
          captions={!zoomedItem}
          draggable={!zoomedItem}
          pauseOnHover={true}
          autoplay={zoomedItem ? "off" : "drift"}
          fadeColor="var(--background)"
          cornerRadius={8}
          onItemClick={(item) => handleOpenZoom(item)}
        />
      </div>

      {/* Smooth Zoom Focus View with React Bits ProfileCard */}
      <div
        onClick={handleCloseZoom}
        className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-3 sm:p-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer select-none rounded-sm ${zoomedItem
            ? "opacity-100 pointer-events-auto bg-black/80 backdrop-blur-md"
            : "opacity-0 pointer-events-none bg-black/0"
          }`}
        aria-label="Click to return to circling gallery"
      >
        <div
          className={`relative flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform ${zoomedItem
              ? "scale-100 translate-y-0 opacity-100"
              : "scale-[0.70] translate-y-6 opacity-0"
            }`}
        >
          {displayItem && (
            <ProfileCard
              avatarUrl={displayItem.src}
              name={displayItem.title}
              title={displayItem.subtitle}
              handle="srikesh.raw"
              status="Shot on Nothing 4a"
              statusColor="#f5643e"
              contactText=""
              theme="dark"
              radius={16}
              holo={0.8}
              glare={0.55}
              enableTilt={true}
              tiltStrength={14}
              parallax={8}
              enableMobileTilt={true}
              intro={false}
              showUserInfo={true}
            />
          )}

          {/* Dismiss button & instruction */}
          <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-[var(--secondary-text)]">
            <button
              onClick={handleCloseZoom}
              className="px-3.5 py-1.5 rounded-full border border-[var(--dashed-borders)] hover:border-[var(--primary-text)] hover:text-[var(--primary-text)] bg-[var(--background)]/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="18" x2="18" y2="6"></line>
              </svg>
              <span>Click to resume circling</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--dashed-borders)] border-dashed">
        <div className="flex items-center gap-2 text-[11px] text-[var(--secondary-text)]">
          <span>@NOTHING 4A</span>
        </div>
        <div className="text-[11px] text-[var(--secondary-text)] flex items-center gap-2">
          <span>OFF-KEYBOARD MOMENTS</span>
        </div>
      </div>
    </div>
  );
}

export default PhotographyShowcase;

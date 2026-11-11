"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { CircularCarousel, CarouselItem } from "@/components/ui/circular-carousel";
import { ProfileCard } from "@/components/ui/profile-card";
import { ScrollWordReveal } from "@/components/motion/ScrollWordReveal";
import "./photography-gallery.css";

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

export function PhotographyShowcase({ photos }: { photos: CarouselItem[] }) {
  const [zoomedItem, setZoomedItem] = useState<CarouselItem | null>(null);
  const [displayItem, setDisplayItem] = useState<CarouselItem | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryClosing, setGalleryClosing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CarouselItem | null>(null);
  const [photoClosing, setPhotoClosing] = useState(false);
  const galleryRef = useRef<HTMLDialogElement>(null);
  const galleryButtonRef = useRef<HTMLButtonElement>(null);
  const photoButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const delay = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240;
  const closePhoto = () => {
    if (photoClosing) return;
    setPhotoClosing(true);
    photoTimer.current = setTimeout(() => { setSelectedPhoto(null); setPhotoClosing(false); photoButtonRef.current?.focus(); }, delay());
  };
  const closeGallery = () => {
    if (galleryClosing) return;
    setGalleryClosing(true);
    closeTimer.current = setTimeout(() => { galleryRef.current?.close(); setGalleryOpen(false); setGalleryClosing(false); setSelectedPhoto(null); }, delay());
  };
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); if (photoTimer.current) clearTimeout(photoTimer.current); }, []);

  useEffect(() => {
    const dialog = galleryRef.current;
    if (!galleryOpen || !dialog) return;
    const returnFocus = galleryButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { if (dialog.open) dialog.close(); document.body.style.overflow = previousOverflow; returnFocus?.focus(); };
  }, [galleryOpen]);

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
    <div className="content-frame group w-full h-full min-h-[560px] md:min-h-0 p-6 sm:p-8 bg-transparent font-mono text-[var(--secondary-text)] flex flex-col justify-between gap-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-2 text-xs tracking-wider border-b border-[var(--dashed-borders)] border-dashed pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--accent)]">
            <CameraIcon />
          </span>
          <h3 className="font-ivyora italic font-normal tracking-normal text-[var(--primary-text)] text-lg sm:text-xl leading-tight">
            <ScrollWordReveal text="Behind the lens" />
          </h3>
          <span className="text-[10px] hidden sm:inline-block px-2 py-0.5 rounded-full border border-[var(--dashed-borders)] text-[var(--secondary-text)]">
            35MM / FRAMES
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] sm:text-xs">
          <ApertureIcon />
          <span className="text-[var(--secondary-text)]">DRAG 3D RING</span>
        </div>
      </div>

      {/* Circular Carousel Stage */}
      <div className="photography-carousel relative w-full flex-1 min-h-[300px] md:min-h-[500px] overflow-hidden rounded-sm bg-[var(--background)]">
        {photos.length ? <CircularCarousel
          items={photos.slice(0, 8)}
          preset="orbit"
          intro="rise"
          cardWidth={200}
          aspectRatio={0.8}
          gap={20}
          tilt={-14}
          speed={9}
          captions={!zoomedItem}
          draggable={!zoomedItem}
          pauseOnHover={true}
          autoplay={zoomedItem || galleryOpen ? "off" : "drift"}
          fadeColor="var(--background)"
          cornerRadius={14}
          onItemClick={(item) => handleOpenZoom(item)}
        /> : <div className="flex h-full min-h-[440px] items-center justify-center text-xs text-[var(--secondary-text)]">Photos coming soon.</div>}
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
          className={`photo-profile relative flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform ${zoomedItem
              ? "scale-100 translate-y-0 opacity-100"
              : "scale-[0.70] translate-y-6 opacity-0"
            }`}
        >
          {displayItem && (
            <ProfileCard
              avatarUrl={displayItem.src}
              name={displayItem.title}
              title={displayItem.subtitle ?? ""}
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
              parallax={0}
              enableMobileTilt={true}
              intro={false}
              showUserInfo={true}
            />
          )}

          {/* Dismiss button & instruction */}
          <div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-[var(--primary-text)]">
            <button
              onClick={handleCloseZoom}
              className="px-4 py-2 rounded-full border border-[var(--dashed-borders)] hover:border-[var(--primary-text)] bg-[var(--background)]/90 transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
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
          <button ref={galleryButtonRef} type="button" onClick={() => setGalleryOpen(true)} className="cursor-pointer underline underline-offset-4 hover:text-[var(--primary-text)]">View gallery <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <dialog ref={galleryRef} aria-labelledby="photo-gallery-title" onClose={() => setGalleryOpen(false)} onCancel={event => { event.preventDefault(); if (selectedPhoto) closePhoto(); else closeGallery(); }} onClick={event => { if (event.target === event.currentTarget) { if (selectedPhoto) closePhoto(); else closeGallery(); } }} data-closing={galleryClosing || undefined} className="photo-gallery m-auto w-[min(92vw,850px)] max-h-[min(85vh,760px)] rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--ink)] sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4"><div><h3 id="photo-gallery-title" className="font-ivyora text-2xl italic">Photo gallery</h3><p className="mt-1 text-sm text-[var(--muted)]">Moments behind the lens.</p></div><button type="button" onClick={closeGallery} aria-label="Close photo gallery" className="h-10 w-10 cursor-pointer rounded-full border border-[var(--line)] text-xl">×</button></div>
        {photos.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map(photo => <button key={photo.src} type="button" onClick={event => { photoButtonRef.current = event.currentTarget; setSelectedPhoto(photo); }} aria-label={`View ${photo.alt || "photograph"}`} className="relative aspect-[4/5] cursor-pointer overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"><Image src={photo.src} alt={photo.alt || "Photograph"} fill sizes="(max-width: 640px) 44vw, 260px" className="object-cover" /></button>)}</div> : <p className="py-10 text-center text-sm text-[var(--muted)]">Photos coming soon.</p>}
        {selectedPhoto && <div className="photo-lightbox" data-closing={photoClosing || undefined} role="group" aria-label="Enlarged photo" onClick={closePhoto}><button type="button" autoFocus onClick={event => { event.stopPropagation(); closePhoto(); }} aria-label="Close enlarged photo" className="photo-lightbox-close">×</button><div className="photo-lightbox-image" onClick={event => event.stopPropagation()}>{/* Preserve the image's intrinsic proportions so rounding follows its actual edges. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedPhoto.src} alt={selectedPhoto.alt || "Photograph"} decoding="async" />
        </div></div>}
      </dialog>
    </div>
  );
}

export default PhotographyShowcase;

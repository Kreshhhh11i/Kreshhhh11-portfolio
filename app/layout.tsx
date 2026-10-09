import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SRIKESH TR | Software Developer",
  description: "Portfolio of Srikesh TR, Software Developer.",
};

import DotGrid from "@/components/shared/DotGrid";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[var(--primary-text)] font-sans">
        <DotGrid />
        <div className="relative z-10 flex-1">{children}</div>
      </body>
    </html>
  );
}

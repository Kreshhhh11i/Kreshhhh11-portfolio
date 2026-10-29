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
import { Navbar } from "@/components/Navbar/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("portfolio-theme")||(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t);if(t==="light")document.documentElement.classList.add("light");else document.documentElement.classList.remove("light");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col text-[var(--ink)] bg-[var(--bg)] font-sans overflow-x-hidden">
        <DotGrid />
        <Navbar />
        <div className="relative z-10 flex-1 pt-14 sm:pt-16 pb-32 sm:pb-24">{children}</div>
      </body>
    </html>
  );
}

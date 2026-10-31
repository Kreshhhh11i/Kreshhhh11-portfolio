import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "block",
  preload: true,
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "block",
  preload: true,
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
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("portfolio-theme")||"dark";document.documentElement.setAttribute("data-theme",t);if(t==="light")document.documentElement.classList.add("light");else document.documentElement.classList.remove("light");var isMobile=window.innerWidth<=1000;if(isMobile)document.documentElement.setAttribute("data-mobile","true");var c=sessionStorage.getItem("nav:compact");var isCompact=isMobile||(c!==null?(c==="true"||c==="1"):(window.scrollY>80));document.documentElement.setAttribute("data-nav",isCompact?"compact":"expanded");var a=sessionStorage.getItem("nav:active");document.documentElement.setAttribute("data-nav-active",a||"home");}catch(e){}})();`,
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

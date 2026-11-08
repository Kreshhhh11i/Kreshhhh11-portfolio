import { Hero } from "@/components/hero/hero";
import { PhotographyShowcase } from "@/components/photography/photography-showcase";
import { SigningBox } from "@/components/SigningBox";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import ProjectsSwap from "@/components/projects/ProjectsSwap";
import { SkillsRoad } from "@/components/skills-road/SkillsRoad";
import { DeveloperQuotes } from "@/components/contact/DeveloperQuotes";
import { ViewCount } from "@/components/contact/ViewCount";

export default function Home() {
  return (
    <>
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full mx-auto flex flex-col gap-12 md:gap-20 lg:gap-8 px-4 md:px-12 lg:px-24 xl:px-32">
        {/* Section: Home */}
        <section id="home" className="scroll-mt-24 relative z-30 lg:z-auto">
          <Hero />
        </section>

        {/* Section: Experience */}
        <section id="experience" className="scroll-mt-24 w-full relative z-10">
          <div id="exp" className="absolute -top-24 pointer-events-none" />
          <ExperienceSection />
        </section>

        {/* Section: Projects (also aliased as work) */}
        <section id="projects" className="scroll-mt-24 w-full flex flex-col gap-6 relative transition-all duration-300">
          <div id="work" className="absolute -top-24 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--accent)] font-semibold">03 / PROJECTS</span>
              <h2 className="font-sans font-bold text-xl md:text-2xl text-[var(--ink)] tracking-tight">
                Things I Shipped
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--muted)] hidden sm:inline">feat: things I shipped</span>
          </div>

          <ProjectsSwap />
        </section>

        {/* Section: Skills (also aliased as stack) */}
        <section id="skills" className="scroll-mt-24 w-full max-w-full overflow-hidden flex flex-col gap-6 relative">
          <div id="stack" className="absolute -top-24 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <h2 className="font-mono text-xs text-[var(--accent)] font-semibold">04 / SKILLS</h2>
            <span className="font-mono text-xs text-[var(--muted)]">MY TECH STACK / 2026</span>
          </div>

          <SkillsRoad />
        </section>

        {/* Section: Playground (also aliased as log) */}
        <section id="playground" className="scroll-mt-24 w-full flex flex-col gap-6 relative">
          <div id="log" className="absolute -top-24 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--accent)] font-semibold">05 / PLAYGROUND</span>
              <h2 className="font-sans font-bold text-xl md:text-2xl text-[var(--ink)] tracking-tight">
                Activity & Visual Log
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--muted)] hidden sm:inline">lab: interactive space</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
            <PhotographyShowcase />
            <SigningBox />
          </div>
        </section>

        {/* Section: Contact */}
        <section id="contact" className="scroll-mt-24 w-full flex flex-col gap-6 pb-12">
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--accent)] font-semibold">06 / CONTACT</span>
              <h2 className="font-sans font-bold text-xl md:text-2xl text-[var(--ink)] tracking-tight">
                Let&apos;s Build
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--muted)] hidden sm:inline">merge: let&apos;s build</span>
          </div>

          <div className="content-frame group bg-[var(--panel)]/40 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
              <div className="max-w-2xl">
                <h3 className="text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.15] tracking-tight text-[var(--ink)]">
                  Good work starts with a <span className="font-ivyora italic font-normal tracking-normal">conversation.</span>
                </h3>
                <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-[var(--muted)]">
                  Have a role, a project, or an idea in mind? I&apos;d love to hear about it.
                </p>
              </div>
              <div className="flex w-full min-[425px]:w-auto flex-wrap items-center gap-3 lg:shrink-0">
                <a
                  href="mailto:contact@srikesh.dev"
                  className="group/contact inline-flex h-11 w-full min-[425px]:w-[164px] items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--ink)] px-3 text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap text-[var(--bg)] transition-opacity hover:opacity-85"
                >
                  Send an email
                  <span aria-hidden="true" className="text-sm motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/contact:translate-x-1">↗</span>
                </a>
                <a
                  href="https://github.com/Kreshhhh11i"
                  target="_blank"
                  rel="noreferrer"
                  className="group/github inline-flex h-11 w-full min-[425px]:w-[164px] items-center justify-center gap-2 rounded-full border border-[var(--line)] px-3 text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap text-[var(--ink)] transition-colors hover:border-[var(--muted)] hover:bg-[var(--line)]/30"
                >
                  GitHub
                  <span aria-hidden="true" className="text-sm motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/github:translate-x-1">↗</span>
                </a>
              </div>
            </div>
            <div className="mt-8 border-t border-[var(--line)] pt-4 font-mono text-[11px] sm:text-xs text-[var(--muted)]">
              Chennai, India <span aria-hidden="true" className="mx-1.5">·</span> Remote / hybrid friendly
            </div>
          </div>
          <DeveloperQuotes />
        </section>
      </div>
    </main>
    <footer className="w-full px-4 md:px-12 lg:px-24 xl:px-32 pb-36 sm:pb-24">
      <div className="flex items-end justify-between gap-4 border-t border-[var(--line)] py-8 sm:py-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-[var(--muted)]">
            <p><span className="font-sans text-base font-medium">&copy;</span> 2026 Srikesh TR</p>
            <ViewCount />
          </div>
          <nav aria-label="Social links" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-xs sm:text-sm text-[var(--muted)]">
            <a href="https://github.com/Kreshhhh11i" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">GitHub</a>
            <a href="https://www.linkedin.com/in/srikresh11" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">LinkedIn</a>
            <a href="https://leetcode.com/u/kresh11i/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">LeetCode</a>
            <a href="https://www.instagram.com/kreshhhh11/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">Instagram</a>
          </nav>
        </div>
        <a href="#home" aria-label="Back to top" className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] transition-colors hover:border-[var(--muted)] hover:bg-[var(--panel)]">
          <svg className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </a>
      </div>
    </footer>
    </>
  );
}

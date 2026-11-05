import { Hero } from "@/components/hero/hero";
import { PhotographyShowcase } from "@/components/photography/photography-showcase";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import ProjectsSwap from "@/components/projects/ProjectsSwap";
import { SkillsRoad } from "@/components/skills-road/SkillsRoad";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full mx-auto flex flex-col gap-12 md:gap-20 lg:gap-8 pb-36 sm:pb-24 px-4 md:px-12 lg:px-24 xl:px-32">
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
            <span className="font-mono text-xs text-[var(--accent)] font-semibold">04 / SKILLS</span>
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

          <div className="w-full">
            <PhotographyShowcase />
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

          <div className="p-8 border border-[var(--line)] border-dashed rounded-sm bg-[var(--panel)]/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <h3 className="text-lg md:text-xl font-bold text-[var(--ink)]">
                Available for full-time SDE roles & high-impact projects.
              </h3>
              <p className="text-sm text-[var(--muted)] font-mono">
                Chennai, India &bull; Remote / Hybrid friendly
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="mailto:contact@srikesh.dev"
                className="px-6 py-2.5 rounded-full bg-[var(--ink)] text-[var(--bg)] font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
              >
                Send Email
              </a>
              <a
                href="https://github.com/Kreshhhh11i"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 rounded-full border border-[var(--line)] text-[var(--ink)] font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[var(--line)]/40 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

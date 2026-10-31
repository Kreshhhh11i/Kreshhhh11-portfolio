import { Hero } from "@/components/hero/hero";
import { PhotographyShowcase } from "@/components/photography/photography-showcase";
import { ExperienceSection } from "@/components/experience/ExperienceSection";

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-[var(--line)] border-dashed rounded-sm bg-[var(--panel)]/40 hover:border-[var(--muted)] transition-colors flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
                  <span>FULL-STACK PERN</span>
                  <span className="text-[var(--accent)]">ACTIVE</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)]">HelpDeskr</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Enterprise-grade IT ticketing and support automation platform built with Next.js, Node.js, Express, and PostgreSQL with real-time updates.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[var(--muted)]">
                <span className="px-2 py-0.5 border border-[var(--line)] rounded">Next.js</span>
                <span className="px-2 py-0.5 border border-[var(--line)] rounded">PostgreSQL</span>
                <span className="px-2 py-0.5 border border-[var(--line)] rounded">Express</span>
              </div>
            </div>

            <div className="p-6 border border-[var(--line)] border-dashed rounded-sm bg-[var(--panel)]/40 hover:border-[var(--muted)] transition-colors flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
                  <span>PERFORMANCE LAB</span>
                  <span className="text-[var(--accent)]">SHIPPED</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Kresh Portfolio</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Engineered interactive developer workspace with zero-gravity atom cards, 3D photography ring, Commit Graph navigation, and GitHub telemetry.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[var(--muted)]">
                <span className="px-2 py-0.5 border border-[var(--line)] rounded">React 19</span>
                <span className="px-2 py-0.5 border border-[var(--line)] rounded">Tailwind CSS</span>
                <span className="px-2 py-0.5 border border-[var(--line)] rounded">TypeScript</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Skills (also aliased as stack) */}
        <section id="skills" className="scroll-mt-24 w-full flex flex-col gap-6 relative">
          <div id="stack" className="absolute -top-24 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--accent)] font-semibold">04 / SKILLS</span>
              <h2 className="font-sans font-bold text-xl md:text-2xl text-[var(--ink)] tracking-tight">
                Tools I Reach For
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--muted)] hidden sm:inline">chore: tools I reach for</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"].map((tech) => (
              <div
                key={tech}
                className="p-4 border border-[var(--line)] border-dashed rounded-sm bg-[var(--panel)]/30 hover:border-[var(--muted)] transition-colors flex flex-col items-center justify-center text-center gap-1.5"
              >
                <span className="font-sans font-semibold text-sm text-[var(--ink)]">{tech}</span>
                <span className="font-mono text-[10px] text-[var(--muted)]">CORE</span>
              </div>
            ))}
          </div>
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

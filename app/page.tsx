import { Hero } from "@/components/hero/hero";
import { PhotographyShowcase } from "@/components/photography/photography-showcase";
import { SigningBox } from "@/components/SigningBox";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import ProjectsSwap from "@/components/projects/ProjectsSwap";
import { ProjectSectionHeading } from "@/components/projects/ProjectSectionHeading";
import { SkillsRoad } from "@/components/skills-road/SkillsRoad";
import { DeveloperQuotes } from "@/components/contact/DeveloperQuotes";
import { ViewCount } from "@/components/contact/ViewCount";
import { ScrollWordReveal } from "@/components/motion/ScrollWordReveal";
import { Reveal } from "@/components/motion/Reveal";
import { ActionReveal } from "@/components/motion/ActionReveal";
import { SectionFade } from "@/components/motion/SectionFade";
import { SectionLabel } from "@/components/motion/SectionLabel";
import { readdirSync } from "node:fs";
import path from "node:path";

export default function Home() {
  const photos = readdirSync(path.join(process.cwd(), "public", "photos"))
    .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => {
      const title = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      return { src: `/photos/${encodeURIComponent(name)}`, alt: title, title, subtitle: "Photography" };
    });
  return (
    <>
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full mx-auto flex flex-col gap-12 md:gap-20 lg:gap-8 px-4 md:px-12 lg:px-24 xl:px-32">
        {/* Section: Home */}
        <SectionFade id="home" className="scroll-mt-24 relative z-30 lg:z-auto">
          <Hero />
        </SectionFade>

        {/* Section: Experience */}
        <SectionFade id="experience" className="scroll-mt-24 w-full relative z-10">
          <div id="exp" className="absolute -top-24 pointer-events-none" />
          <ExperienceSection />
        </SectionFade>

        {/* Section: Projects (also aliased as work) */}
        <SectionFade id="projects" className="scroll-mt-24 w-full flex flex-col gap-6 relative transition-all duration-300">
          <div id="work" className="absolute -top-24 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <ProjectSectionHeading />
          </div>

          <Reveal><ProjectsSwap /></Reveal>
        </SectionFade>

        {/* Section: Skills (also aliased as stack) */}
        <SectionFade id="skills" className="scroll-mt-24 w-full max-w-full overflow-hidden flex flex-col gap-6 relative">
          <div id="stack" className="absolute -top-24 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <h2 className="font-ivyora italic font-normal text-xl md:text-2xl text-[var(--ink)]"><ScrollWordReveal text="Tools I Work With" /></h2>
            <SectionLabel className="ml-4 text-right font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--muted)]">Skills</SectionLabel>
          </div>

          <Reveal><SkillsRoad /></Reveal>
        </SectionFade>

        {/* Section: Playground (also aliased as log) */}
        <SectionFade id="playground" className="scroll-mt-24 w-full flex flex-col gap-6 relative">
          <div id="log" className="absolute -top-24 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <h2 className="font-ivyora italic font-normal text-xl md:text-2xl text-[var(--ink)]">
              <ScrollWordReveal text="Beyond the code" />
            </h2>
            <SectionLabel className="ml-4 text-right font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--muted)]">Playground</SectionLabel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
            <Reveal className="min-w-0 h-full"><PhotographyShowcase photos={photos} /></Reveal>
            <Reveal className="min-w-0 h-full"><SigningBox /></Reveal>
          </div>
        </SectionFade>

        {/* Section: Contact */}
        <SectionFade id="contact" className="scroll-mt-24 w-full flex flex-col gap-6 pb-12">
          <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
            <h2 className="font-ivyora italic font-normal text-xl md:text-2xl text-[var(--ink)]">
              <ScrollWordReveal text="Let's Build" />
            </h2>
            <SectionLabel className="ml-4 text-right font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--muted)]">Contact</SectionLabel>
          </div>

          <Reveal className="content-frame group bg-[var(--panel)]/40 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
              <div className="max-w-2xl">
                <h3 className="text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.15] tracking-tight text-[var(--ink)]">
                  <ScrollWordReveal text="Good work starts with a" /> <span className="font-ivyora italic font-normal tracking-normal"><ScrollWordReveal text="Conversation." delay={0.25} /></span>
                </h3>
                <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-[var(--muted)]">
                  <ScrollWordReveal text="Have a role, a project, or an idea in mind? I'd love to hear about it." delay={0.2} />
                </p>
              </div>
              <div className="flex w-full min-[425px]:w-auto flex-wrap items-center gap-3 lg:shrink-0">
                <ActionReveal
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=srikresh11%40gmail.com&su=Portfolio%20inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/contact inline-flex h-11 w-full min-[425px]:w-[164px] items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--ink)] px-3 text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap text-[var(--bg)] transition-opacity hover:opacity-85"
                >
                  Send an email
                  <svg aria-hidden="true" className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/contact:rotate-45" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="19" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </ActionReveal>
                <ActionReveal index={1}
                  href="https://github.com/Kreshhhh11i"
                  target="_blank"
                  rel="noreferrer"
                  className="group/github inline-flex h-11 w-full min-[425px]:w-[164px] items-center justify-center gap-2 rounded-full border border-[var(--line)] px-3 text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap text-[var(--ink)] transition-colors hover:border-[var(--muted)] hover:bg-[var(--line)]/30"
                >
                  GitHub
                  <svg aria-hidden="true" className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/github:rotate-45" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="19" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </ActionReveal>
              </div>
            </div>
            <div className="mt-8 border-t border-[var(--line)] pt-4 font-mono text-[11px] sm:text-xs text-[var(--muted)]">
              Chennai, India <span aria-hidden="true" className="mx-1.5">·</span> Remote / hybrid friendly
            </div>
          </Reveal>
          <Reveal><DeveloperQuotes /></Reveal>
        </SectionFade>
      </div>
    </main>
    <footer className="w-full px-4 md:px-12 lg:px-24 xl:px-32">
      <Reveal className="flex items-end justify-between gap-4 border-t border-[var(--line)] py-8 sm:py-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-[var(--muted)]">
            <p><span className="font-sans text-base font-medium">&copy;</span> 2026 Srikesh TR</p>
            <ViewCount />
          </div>
          <nav aria-label="Social links" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-xs sm:text-sm text-[var(--muted)]">
            <ActionReveal href="https://github.com/Kreshhhh11i" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">GitHub</ActionReveal>
            <ActionReveal index={1} href="https://www.linkedin.com/in/srikresh11" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">LinkedIn</ActionReveal>
            <ActionReveal index={2} href="https://leetcode.com/u/kresh11i/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">LeetCode</ActionReveal>
            <ActionReveal index={3} href="https://www.instagram.com/kreshhhh11/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">Instagram</ActionReveal>
          </nav>
        </div>
        <ActionReveal href="#home" aria-label="Back to top" className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] transition-colors hover:border-[var(--muted)] hover:bg-[var(--panel)]">
          <svg className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </ActionReveal>
      </Reveal>
    </footer>
    </>
  );
}

import { Hero } from "@/components/hero/hero";
import { GitHubHeatmap } from "@/components/github/heatmap";
import { PhotographyShowcase } from "@/components/photography/photography-showcase";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full mx-auto flex flex-col gap-8 md:gap-16 lg:gap-24 pb-24 px-4 md:px-12 lg:px-24 xl:px-32">
        <Hero />
        
        <section className="w-full grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <GitHubHeatmap />
          <PhotographyShowcase />
        </section>
      </div>
    </main>
  );
}

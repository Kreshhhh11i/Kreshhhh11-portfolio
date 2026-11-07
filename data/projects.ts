export type ProjectKind =
  | "FULL-STACK PERN"
  | "PERFORMANCE LAB"
  | "SUPPORT WORKSPACE"
  | string;

export type ProjectStatus = "ACTIVE" | "SHIPPED" | "BUILDING";

export interface Project {
  slug: string;
  name: string;
  kind: ProjectKind;
  status: ProjectStatus;
  description: string;
  tags: string[];
  liveUrl: string;
  repoUrl: string;
  cover?: string;
}

export const projects: Project[] = [
  {
    slug: "Relay",
    name: "Relay",
    kind: "FULL-STACK PERN",
    status: "ACTIVE",
    description:
      "Enterprise-grade IT ticketing and support automation platform built with Next.js, Node.js, Express, and PostgreSQL with real-time updates.",
    tags: ["Next.js", "PostgreSQL", "Express"],
    liveUrl: "https://github.com/Kreshhhh11i",
    repoUrl: "https://github.com/Kreshhhh11i",
  },
  {
    slug: "Sk-Tailoring",
    name: "Sk-Tailoring",
    kind: "Client ",
    status: "SHIPPED",
    description:
      "Engineered interactive developer workspace with zero-gravity atom cards, 3D photography ring, Commit Graph navigation, and GitHub telemetry.",
    tags: ["React", "Tailwind CSS", "TypeScript"],
    liveUrl: "https://github.com/Kreshhhh11i",
    repoUrl: "https://github.com/Kreshhhh11i",
  },
  {
    slug: "Sprintly",
    name: "Sprintly",
    kind: "Productivity",
    status: "BUILDING",
    description:
      "A support workspace with a React frontend, an Express API and Supabase Postgres.",
    tags: ["React", "Express", "Supabase"],
    liveUrl: "https://github.com/Kreshhhh11i",
    repoUrl: "https://github.com/Kreshhhh11i",
  },
];


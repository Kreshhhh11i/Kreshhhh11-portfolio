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
  liveUrl?: string;
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
      "A support-ticketing platform with real-time updates.",
    tags: ["React 19", "Tailwind CSS", "Node.js", "Express", "JWT", "Supabase"],
    cover: "/images/projects/relay.png",
    liveUrl: "https://relay-tms.vercel.app/",
    repoUrl: "https://github.com/Devster11/RELAY",
  },
  {
    slug: "Sk-Tailoring",
    name: "Sk-Tailoring",
    kind: "Client ",
    status: "SHIPPED",
    description:
      "A client project built with React and Tailwind CSS.",
    tags: ["React 19", "Tailwind CSS"],
    cover: "/images/projects/sktailoring.png",
    liveUrl: "https://sktailoring.vercel.app/",
    repoUrl: "https://github.com/Devster11/SK-TAILORING",
  },
  {
    slug: "Sprintly",
    name: "Sprintly",
    kind: "Productivity",
    status: "BUILDING",
    description:
      "Something new is taking shape. Stay curious.",
    tags: ["React", "Express", "Supabase"],
    cover: "/images/projects/sprintly.png",
    repoUrl: "https://github.com/Kreshhhh11i/Sprintly",
  },
];


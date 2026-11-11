export type Experience = {
  company: string;
  initials: string;
  logo?: string;
  hash?: string;
  role: string;
  start: string;
  end: string;
  branch: string;
  shortBranch?: string;
  points: string[];
  stack: string[];
};

export const experiences: Experience[] = [
  {
    company: "Virdhi Tech Lab Pvt Ltd",
    initials: "VTL",
    logo: "/images/virdhi-tech-lab.png",
    hash: "a41d7e9",
    role: "AI Prompt Engineer Intern",
    start: "Jun 2026",
    end: "Jun 2026",
    branch: "feat/prompt",
    shortBranch: "feat/prompt",
    points: [
      "Designed and refined prompts for AI applications based on project requirements.",
      "Reviewed AI responses for accuracy and relevance, then adjusted prompts to improve them.",
      "Compared different prompt approaches to find what worked best for each task.",
    ],
    stack: ["Prompt Engineering", "HTML", "CSS"],
  },
];

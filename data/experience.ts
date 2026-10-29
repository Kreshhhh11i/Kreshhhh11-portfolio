export type Experience = {
  company: string;
  initials: string;
  hash?: string;
  role: string;
  start: string;
  end: string;
  branch: string;
  points: string[];
  stack: string[];
};

export const experiences: Experience[] = [
  {
    company: "Virdhi Tech Lab Pvt Ltd",
    initials: "VTL",
    hash: "a41d7e9",
    role: "AI Prompt Engineer Intern",
    start: "Jun 2026",
    end: "Jun 2026",
    branch: "feat/prompt-engineering",
    points: [
      "Designed, tested and refined prompts for a range of AI applications.",
      "Created structured prompts and analyzed AI-generated responses for accuracy and relevance.",
      "Compared prompt approaches and optimized them against project requirements.",
    ],
    stack: ["Prompt Engineering", "HTML", "CSS"],
  },
];

export const NAV = [
  { id: "home",       label: "Home",       hash: "a1f3c9e", msg: "init: say hello" },
  { id: "exp",        label: "Exp",        hash: "7be20d4", msg: "work: journey & roles" },
  { id: "projects",   label: "Projects",   hash: "f4b108c", msg: "feat: things I shipped" },
  { id: "skills",     label: "Skills",     hash: "c04e8a1", msg: "chore: tools I reach for" },
  { id: "playground", label: "Playground", hash: "5d9b72f", msg: "lab: interactive space" },
  { id: "contact",    label: "Contact",    hash: "e6a1b30", msg: "merge: let’s build" },
] as const;

export type NavItem = (typeof NAV)[number];

export const NAV = [
  { id: "home",    label: "Home",    hash: "a1f3c9e", msg: "init: say hello" },
  { id: "work",    label: "Work",    hash: "7be20d4", msg: "feat: things I shipped" },
  { id: "stack",   label: "Stack",   hash: "c04e8a1", msg: "chore: tools I reach for" },
  { id: "log",     label: "Log",     hash: "5d9b72f", msg: "docs: what I am learning" },
  { id: "contact", label: "Contact", hash: "e6a1b30", msg: "merge: let’s build" },
] as const;

export type NavItem = (typeof NAV)[number];

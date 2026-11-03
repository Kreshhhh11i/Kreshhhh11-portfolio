import React from "react";
import {
  ReactIcon,
  NextIcon,
  TypeScriptIcon,
  JavaScriptIcon,
  TailwindIcon,
  NodeIcon,
  PostgresIcon,
  SupabaseIcon,
  DockerIcon,
  GitIcon,
  GitHubIcon,
  RedisIcon,
  PythonIcon,
  GsapIcon,
  ThreeIcon,
  FigmaIcon,
  ExpressIcon,
  VercelIcon,
  HTMLIcon,
  CSSIcon,
  MongoIcon,
  MysqlIcon,
  FirebaseIcon,
  FastApiIcon,
  SocketIoIcon,
  LinuxIcon,
  NpmIcon,
  PostmanIcon,
  FramerMotionIcon,
  WebGLIcon,
  IconProps,
} from "@/components/skills/TechIcons";

export type ArcCategory =
  | "All"
  | "Frontend"
  | "Backend"
  | "Databases"
  | "DevOps"
  | "Creative";

export interface SkillArcItem {
  id: string;
  name: string;
  category: ArcCategory;
  color: string;
  glowColor: string;
  badge: string;
  tagline: string;
  description: string;
  IconComponent: React.FC<IconProps>;
}

export const SKILL_ARC_CATEGORIES: ArcCategory[] = [
  "All",
  "Frontend",
  "Backend",
  "Databases",
  "DevOps",
  "Creative",
];

export const CATEGORY_DESCRIPTIONS: Record<
  ArcCategory,
  { headline: string; subtitle: string }
> = {
  All: {
    headline: "My Skills",
    subtitle:
      "A collection of technologies I use to build, ship and bring ideas to life.",
  },
  Frontend: {
    headline: "Frontend Architecture",
    subtitle:
      "Crafting type-safe, accessible user interfaces with concurrent rendering, reactive state machines, and micro-interactions.",
  },
  Backend: {
    headline: "Backend Services",
    subtitle:
      "Designing high-throughput API microservices, WebSocket streams, and secure serverless computing layers.",
  },
  Databases: {
    headline: "Data Architecture",
    subtitle:
      "Structuring relational schemas, indexed query optimizations, realtime CDC pipelines, and sub-millisecond cache layers.",
  },
  DevOps: {
    headline: "DevOps & Infrastructure",
    subtitle:
      "Automating multi-stage container builds, edge serverless distribution, zero-downtime rollouts, and version control hygiene.",
  },
  Creative: {
    headline: "Creative Development",
    subtitle:
      "Blending creative engineering with WebGL canvas shaders, SVG timeline choreographies, and polished design systems.",
  },
};

export const ALL_SKILLS_RECORD: Record<string, SkillArcItem> = {
  git: {
    id: "git",
    name: "Git",
    category: "DevOps",
    color: "#F05032",
    glowColor: "rgba(240, 80, 50, 0.85)",
    badge: "VERSION CONTROL // TRUNK HYGIENE",
    tagline: "Atomic Commits & Interactive Rebasing",
    description:
      "Branch protection workflows, atomic commit histories, interactive rebase hygiene, and distributed version control.",
    IconComponent: GitIcon,
  },
  tailwind: {
    id: "tailwind",
    name: "Tailwind CSS",
    category: "Frontend",
    color: "#38BDF8",
    glowColor: "rgba(56, 189, 248, 0.8)",
    badge: "DESIGN TOKENS // PRODUCTION UI",
    tagline: "Utility Architecture & Systematic Tokens",
    description:
      "Composing fluid typographic scales, responsive fluid grids, hardware-accelerated transitions, and systematic design tokens.",
    IconComponent: TailwindIcon,
  },
  typescript: {
    id: "typescript",
    name: "TypeScript",
    category: "Frontend",
    color: "#3178C6",
    glowColor: "rgba(49, 120, 198, 0.85)",
    badge: "TYPE SYSTEM // COMPILE GUARANTEES",
    tagline: "Generics & End-to-End Type Safety",
    description:
      "Eliminating runtime edge cases with strict compiler checks, generative inference, conditional types, and full-stack contracts.",
    IconComponent: TypeScriptIcon,
  },
  javascript: {
    id: "javascript",
    name: "JavaScript",
    category: "Frontend",
    color: "#F7DF1E",
    glowColor: "rgba(247, 223, 30, 0.85)",
    badge: "LANGUAGE // ES2024+ STANDARDS",
    tagline: "Event Loop, Closures & Functional Primitives",
    description:
      "Deep fluency with browser execution contexts, prototype chains, memory profiling, asynchronous iteration, and web APIs.",
    IconComponent: JavaScriptIcon,
  },
  nextjs: {
    id: "nextjs",
    name: "Next.js",
    category: "Frontend",
    color: "#FFFFFF",
    glowColor: "rgba(255, 255, 255, 0.75)",
    badge: "FULL-STACK // APP ROUTER",
    tagline: "Server Components & Edge Runtime",
    description:
      "Harnessing App Router conventions, React Server Components, Turbopack bundling, ISR caching, and edge middleware.",
    IconComponent: NextIcon,
  },
  react: {
    id: "react",
    name: "React",
    category: "Frontend",
    color: "#61DAFB",
    glowColor: "rgba(97, 218, 251, 0.8)",
    badge: "CORE ENGINE // REACTIVE UI",
    tagline: "Concurrent Mode & State Architectures",
    description:
      "Building modular component hierarchies, custom hooks abstractions, concurrent rendering pipelines, and resilient UI state machines.",
    IconComponent: ReactIcon,
  },
  python: {
    id: "python",
    name: "Python",
    category: "Backend",
    color: "#3776AB",
    glowColor: "rgba(55, 118, 171, 0.85)",
    badge: "LANGUAGE // SCRIPTS & AUTOMATION",
    tagline: "Data Transformations & Automation Pipelines",
    description:
      "Developing data ingestion pipelines, automated scrapers, backend API services, and utility scripting toolchains.",
    IconComponent: PythonIcon,
  },
  nodejs: {
    id: "nodejs",
    name: "Node.js",
    category: "Backend",
    color: "#5FA04E",
    glowColor: "rgba(95, 160, 78, 0.8)",
    badge: "RUNTIME // EVENT-DRIVEN I/O",
    tagline: "Asynchronous Concurrency & Worker Threads",
    description:
      "Developing high-throughput microservices, non-blocking network sockets, streams processing, and background worker pipelines.",
    IconComponent: NodeIcon,
  },
  postgres: {
    id: "postgres",
    name: "PostgreSQL",
    category: "Databases",
    color: "#4169E1",
    glowColor: "rgba(65, 105, 225, 0.85)",
    badge: "RELATIONAL // ACID PERSISTENCE",
    tagline: "Index Optimization & Schema Architecture",
    description:
      "Authoring normalized schemas, complex join queries, indexed execution plans, transactional integrity, and connection pools.",
    IconComponent: PostgresIcon,
  },
  docker: {
    id: "docker",
    name: "Docker",
    category: "DevOps",
    color: "#2496ED",
    glowColor: "rgba(36, 150, 237, 0.85)",
    badge: "CONTAINERIZATION // DEV-PROD PARITY",
    tagline: "Multi-Stage Builds & Isolated Environments",
    description:
      "Standardizing dev setups, authoring lightweight multi-stage Dockerfiles, managing container networks, and production isolation.",
    IconComponent: DockerIcon,
  },
  github: {
    id: "github",
    name: "GitHub",
    category: "DevOps",
    color: "#F2E9D8",
    glowColor: "rgba(242, 233, 216, 0.75)",
    badge: "COLLABORATION // CI/CD ACTIONS",
    tagline: "Automated Workflows & Code Reviews",
    description:
      "Authoring GitHub Actions CI/CD pipelines, release automated workflows, pull request reviews, and security secret scanning.",
    IconComponent: GitHubIcon,
  },
  supabase: {
    id: "supabase",
    name: "Supabase",
    category: "Databases",
    color: "#3ECF8E",
    glowColor: "rgba(62, 207, 142, 0.85)",
    badge: "REALTIME // MANAGED POSTGRES",
    tagline: "Row-Level Security & Live Subscriptions",
    description:
      "Configuring granular RLS policies, PostgreSQL extensions, auth authorization handshakes, and reactive WebSocket broadcasting.",
    IconComponent: SupabaseIcon,
  },
  redis: {
    id: "redis",
    name: "Redis",
    category: "Databases",
    color: "#FF4438",
    glowColor: "rgba(255, 68, 56, 0.85)",
    badge: "IN-MEMORY // SUB-MILLISECOND SPEED",
    tagline: "Distributed Locks, Pub/Sub & Caching",
    description:
      "Implementing ephemeral session storage, rate-limiting algorithms, atomic distributed locks, and message pub/sub queues.",
    IconComponent: RedisIcon,
  },
  mongodb: {
    id: "mongodb",
    name: "MongoDB",
    category: "Databases",
    color: "#47A248",
    glowColor: "rgba(71, 162, 72, 0.85)",
    badge: "DOCUMENTS // FLEXIBLE DATA",
    tagline: "Aggregation Pipelines & Schema Flexibility",
    description:
      "Designing document data models, compound indexing strategies, and high-performance analytical aggregation pipelines.",
    IconComponent: MongoIcon,
  },
  mysql: {
    id: "mysql",
    name: "MySQL",
    category: "Databases",
    color: "#00758F",
    glowColor: "rgba(0, 117, 143, 0.85)",
    badge: "SQL // ENTERPRISE DATA",
    tagline: "Relational Queries & Replications",
    description:
      "High-availability transactional storage, indexed query optimization, replication clustering, and schema design.",
    IconComponent: MysqlIcon,
  },
  firebase: {
    id: "firebase",
    name: "Firebase",
    category: "Databases",
    color: "#FFA000",
    glowColor: "rgba(255, 160, 0, 0.85)",
    badge: "REALTIME // CLOUD STORE",
    tagline: "NoSQL Cloud Sync & Serverless Auth",
    description:
      "Leveraging Firestore realtime synchronization, Firebase Authentication, Cloud Storage, and edge Cloud Functions.",
    IconComponent: FirebaseIcon,
  },
  express: {
    id: "express",
    name: "Express.js",
    category: "Backend",
    color: "#FFFFFF",
    glowColor: "rgba(255, 255, 255, 0.75)",
    badge: "BACKEND // REST PROTOCOLS",
    tagline: "Modular Middleware & API Endpoints",
    description:
      "Building clean RESTful API routing architectures, rate-limit middleware, CORS configurations, and validation pipelines.",
    IconComponent: ExpressIcon,
  },
  fastapi: {
    id: "fastapi",
    name: "FastAPI",
    category: "Backend",
    color: "#059669",
    glowColor: "rgba(5, 150, 105, 0.85)",
    badge: "PYTHON // ASYNC REST",
    tagline: "Async Concurrency & Auto OpenAPI Docs",
    description:
      "High-performance asynchronous Python REST APIs backed by Pydantic type validation and automatic Swagger documentation.",
    IconComponent: FastApiIcon,
  },
  socketio: {
    id: "socketio",
    name: "Socket.IO",
    category: "Backend",
    color: "#FFFFFF",
    glowColor: "rgba(255, 255, 255, 0.75)",
    badge: "WEBSOCKETS // REALTIME DUPLEX",
    tagline: "Bi-Directional Event Broadcasting",
    description:
      "Architecting low-latency duplex event channels, room multiplexing, heartbeat reconnections, and realtime synchronization.",
    IconComponent: SocketIoIcon,
  },
  vercel: {
    id: "vercel",
    name: "Vercel",
    category: "DevOps",
    color: "#FFFFFF",
    glowColor: "rgba(255, 255, 255, 0.75)",
    badge: "EDGE CLOUD // SERVERLESS CDN",
    tagline: "Instant Deployments & Global Edge Network",
    description:
      "Deploying high-performance edge serverless endpoints, instant branch previews, custom domain DNS, and automated CDN caching.",
    IconComponent: VercelIcon,
  },
  linux: {
    id: "linux",
    name: "Linux",
    category: "DevOps",
    color: "#FCC624",
    glowColor: "rgba(252, 198, 36, 0.85)",
    badge: "OS // UNIX ENVIRONMENT",
    tagline: "Shell Scripting, Systemd & Permissions",
    description:
      "Configuring Unix servers, Bash automation scripts, SSH access protocols, systemd service daemons, and process monitoring.",
    IconComponent: LinuxIcon,
  },
  npm: {
    id: "npm",
    name: "npm",
    category: "DevOps",
    color: "#CB3837",
    glowColor: "rgba(203, 56, 55, 0.85)",
    badge: "PACKAGE MANAGER // DEPENDENCIES",
    tagline: "Workspace Monorepos & Semver Publishing",
    description:
      "Managing complex monorepo package graphs, semver publishing pipelines, security vulnerability audits, and build scripts.",
    IconComponent: NpmIcon,
  },
  postman: {
    id: "postman",
    name: "Postman",
    category: "DevOps",
    color: "#FF6C37",
    glowColor: "rgba(255, 108, 55, 0.85)",
    badge: "TESTING // API CONTRACTS",
    tagline: "Automated Test Suites & API Mocking",
    description:
      "Authoring automated API test assertions, pre-request scripts, mock servers, and collaborative team API documentation.",
    IconComponent: PostmanIcon,
  },
  gsap: {
    id: "gsap",
    name: "GSAP",
    category: "Creative",
    color: "#88CE02",
    glowColor: "rgba(136, 206, 2, 0.85)",
    badge: "PHYSICS MOTION // TIMELINE ENGINE",
    tagline: "SVG Path Tweening & 60fps Micro-Motion",
    description:
      "Orchestrating hardware-accelerated motion sequences, SVG vector tweening, scroll-linked choreography, and micro-interactions.",
    IconComponent: GsapIcon,
  },
  threejs: {
    id: "threejs",
    name: "Three.js",
    category: "Creative",
    color: "#E2E8F0",
    glowColor: "rgba(226, 232, 240, 0.75)",
    badge: "WEBGL // 3D SPATIAL COMPUTING",
    tagline: "Scene Graphs, Shaders & 3D Lighting",
    description:
      "Creating interactive 3D WebGL canvases, custom GLSL shaders, camera controls, ambient illumination, and physical materials.",
    IconComponent: ThreeIcon,
  },
  figma: {
    id: "figma",
    name: "Figma",
    category: "Creative",
    color: "#F24E1E",
    glowColor: "rgba(242, 78, 30, 0.85)",
    badge: "DESIGN // VECTOR SYSTEMS",
    tagline: "Design Tokens, Autolayout & Prototyping",
    description:
      "Formulating design systems with autolayout constraints, variable color tokens, responsive variants, and prototypes.",
    IconComponent: FigmaIcon,
  },
  framermotion: {
    id: "framermotion",
    name: "Framer Motion",
    category: "Creative",
    color: "#0055FF",
    glowColor: "rgba(0, 85, 255, 0.85)",
    badge: "REACT MOTION // GESTURAL ANIMATION",
    tagline: "Layout Animations & Spring Physics",
    description:
      "Composing declarative spring animations, gesture recognition drag physics, layout cross-fading, and entry transitions.",
    IconComponent: FramerMotionIcon,
  },
  webgl: {
    id: "webgl",
    name: "WebGL",
    category: "Creative",
    color: "#990000",
    glowColor: "rgba(153, 0, 0, 0.85)",
    badge: "GRAPHICS // GPU ACCELERATION",
    tagline: "Hardware Acceleration & Custom Shaders",
    description:
      "Direct GPU rendering pipelines, custom vertex and fragment shaders, post-processing filters, and procedural effects.",
    IconComponent: WebGLIcon,
  },
  html5: {
    id: "html5",
    name: "HTML5",
    category: "Frontend",
    color: "#E34F26",
    glowColor: "rgba(227, 79, 38, 0.85)",
    badge: "STANDARDS // SEMANTIC FOUNDATION",
    tagline: "Accessibility & Modern Web Standards",
    description:
      "Architecting WCAG-compliant DOM hierarchies, semantic layout scaffolding, micro-data schemas, and rich multimedia.",
    IconComponent: HTMLIcon,
  },
  css3: {
    id: "css3",
    name: "CSS3",
    category: "Frontend",
    color: "#1572B6",
    glowColor: "rgba(21, 114, 182, 0.85)",
    badge: "LAYOUT // MODERN SPECIFICATIONS",
    tagline: "Container Queries, Subgrid & Keyframes",
    description:
      "Leveraging CSS custom properties, container queries, CSS subgrid, complex compositing blend-modes, and CSS transforms.",
    IconComponent: CSSIcon,
  },
};

// Exact sequence matching the user's reference image for All, and balanced sets for each category
export const CATEGORY_SKILLS_MAP: Record<ArcCategory, string[]> = {
  All: [
    "git",
    "tailwind",
    "typescript",
    "javascript",
    "nextjs",
    "react",
    "python",
    "nodejs",
    "postgres",
    "docker",
    "github",
  ],
  Frontend: [
    "react",
    "nextjs",
    "javascript",
    "typescript",
    "html5",
    "css3",
    "tailwind",
    "gsap",
  ],
  Backend: [
    "nodejs",
    "python",
    "express",
    "fastapi",
    "postgres",
    "redis",
    "supabase",
    "socketio",
  ],
  Databases: [
    "postgres",
    "mongodb",
    "mysql",
    "redis",
    "supabase",
    "firebase",
  ],
  DevOps: [
    "git",
    "github",
    "docker",
    "vercel",
    "linux",
    "npm",
    "postman",
  ],
  Creative: [
    "gsap",
    "threejs",
    "figma",
    "framermotion",
    "webgl",
    "tailwind",
  ],
};

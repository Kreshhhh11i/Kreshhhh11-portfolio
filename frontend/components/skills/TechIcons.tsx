import React from "react";

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const ReactIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#react-clip-a)" fill="none">
      <path
        fill="#61dafb"
        d="M50.307 58.816a8.816 8.816 0 1 0 0-17.632 8.816 8.816 0 0 0 0 17.632"
      />
      <path
        fill="none"
        stroke="#61dafb"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M97.613 50c0 9.976-21.18 18.063-47.306 18.063C24.18 68.063 3 59.976 3 50s21.18-18.062 47.307-18.062c26.126 0 47.306 8.086 47.306 18.062Z"
      />
      <path
        fill="none"
        stroke="#61dafb"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M73.96 90.969c-8.64 4.988-26.233-9.311-39.296-31.938s-16.65-45.012-8.01-50c8.638-4.988 26.232 9.311 39.295 31.938s16.65 45.012 8.01 50Z"
      />
      <path
        fill="none"
        stroke="#61dafb"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M26.653 90.969c-8.639-4.988-5.052-27.374 8.011-50S65.321 4.043 73.96 9.03c8.64 4.988 5.053 27.374-8.01 50-13.065 22.628-30.659 36.927-39.298 31.94Z"
      />
    </g>
    <defs>
      <clipPath id="react-clip-a">
        <path fill="#fff" d="M0 0h100v100H0z" />
      </clipPath>
    </defs>
  </svg>
);

export const NextIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 180 180" className={className} fill="none">
    <mask height="180" id="mask0_next" maskUnits="userSpaceOnUse" width="180" x="0" y="0" style={{ maskType: "alpha" }}>
      <circle cx="90" cy="90" fill="#000" r="90" />
    </mask>
    <g mask="url(#mask0_next)">
      <circle cx="90" cy="90" fill="#000" r="90" stroke="#fff" strokeWidth="6" />
      <path
        d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.16 149.508 157.52Z"
        fill="url(#paint0_linear_next)"
      />
      <rect fill="url(#paint1_linear_next)" height="72" width="12" x="115" y="54" />
    </g>
    <defs>
      <linearGradient id="paint0_linear_next" gradientUnits="userSpaceOnUse" x1="109" x2="144.5" y1="116.5" y2="160.5">
        <stop stopColor="#fff" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="paint1_linear_next" gradientUnits="userSpaceOnUse" x1="121" x2="120.799" y1="54" y2="106.875">
        <stop stopColor="#fff" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

export const TypeScriptIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
    <rect width="128" height="128" rx="16" fill="#3178C6" />
    <path
      d="M38.5 73.1v34.4h-12V73.1h-14v-9.7h40.1v9.7h-14.1zm59.2 12.8c0 3.7-1.3 6.6-4 8.7-2.7 2.1-6.6 3.2-11.8 3.2-4.1 0-7.8-.7-11.2-2.1-3.4-1.4-6-3.4-7.8-6.1l7.8-6.4c2.5 3.4 5.9 5.2 10.3 5.2 2.3 0 4.1-.5 5.3-1.4 1.2-.9 1.8-2.1 1.8-3.6 0-1.2-.5-2.2-1.4-3-1-.8-2.6-1.5-4.8-2.1l-6.8-1.9c-4.4-1.2-7.7-2.9-9.8-5.2-2.1-2.3-3.2-5.4-3.2-9.2 0-3.6 1.4-6.6 4.1-8.9 2.7-2.3 6.4-3.5 11.1-3.5 3.8 0 7.2.7 10.1 2.1 2.9 1.4 5.2 3.4 6.8 5.8l-7.6 6c-2.1-2.9-5-4.3-8.6-4.3-2.1 0-3.7.4-4.8 1.3-1.1.9-1.6 1.9-1.6 3.2 0 1.1.5 2 1.4 2.8.9.7 2.4 1.4 4.5 2l6.8 1.9c4.8 1.4 8.2 3.2 10.4 5.4 2.2 2.3 3.3 5.4 3.3 8.9z"
      fill="#FFFFFF"
    />
  </svg>
);

export const JavaScriptIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
    <rect width="128" height="128" rx="16" fill="#F7DF1E" />
    <path
      d="M74.8 99.8c2.4 3.9 5.5 6.4 10.3 6.4 4.4 0 7.2-2.2 7.2-5.3 0-3.7-2.9-5-7.8-7.2l-2.7-1.2c-7.8-3.3-13-7.5-13-16.4 0-8.2 6.3-14.4 16.2-14.4 7 0 12 2.4 15.6 8.7l-7.9 5.1c-1.8-3.2-3.7-4.4-7.7-4.4-3.6 0-5.8 2.2-5.8 4.9 0 3.3 2.3 4.6 6.8 6.6l2.7 1.2c9.2 4 14.8 8.1 14.8 17.2 0 9.8-7.7 15.2-18.3 15.2-10.3 0-16.9-4.8-20.1-11.9l9.7-4.9zm-38.3 2.7c1.7 2.9 3.3 5.3 7 5.3 3.6 0 5.9-1.5 5.9-7.1V62.4h12.1v38.4c0 11.9-7 17.2-16.9 17.2-7.5 0-12.1-3.8-15.1-9.9l7-5.6z"
      fill="#000000"
    />
  </svg>
);

export const TailwindIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none">
    <path
      d="M24 13.5C21.6 10.5 18.6 9 15 9C9.6 9 6.6 13.5 6 18C8.4 15 11.4 13.5 15 13.5C18.6 13.5 21 15.9 22.5 18C24.3 20.52 26.1 22.5 30 22.5C32.4 22.5 34.5 21.6 36.3 19.8C38.1 18 39.3 15.3 42 9C39.6 12 36.6 13.5 33 13.5C29.4 13.5 27 11.1 25.5 9C24.9 8.16 24.42 7.38 24 6.72V13.5ZM12 27C9.6 24 6.6 22.5 3 22.5C-2.4 22.5 -5.4 27 -6 31.5C-3.6 28.5 -0.6 27 3 27C6.6 27 9 29.4 10.5 31.5C12.3 34.02 14.1 36 18 36C20.4 36 22.5 35.1 24.3 33.3C26.1 31.5 27.3 28.8 30 22.5C27.6 25.5 24.6 27 21 27C17.4 27 15 24.6 13.5 22.5C12.9 21.66 12.42 20.88 12 20.22V27Z"
      transform="translate(3, 4)"
      fill="#38BDF8"
    />
  </svg>
);

export const NodeIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
    <path
      d="M64 8.7L11.5 39v60.6L64 129.9l52.5-30.3V39L64 8.7zm0 14.8l41.6 24v48L64 119.5l-41.6-24V47.5L64 23.5z"
      fill="#5FA04E"
    />
    <path
      d="M64 45.4c-12.7 0-21.4 7.6-21.4 18.5 0 16.4 19.8 14.4 19.8 23.4 0 3.7-3.1 5.7-7.7 5.7-6.2 0-11.8-3.4-15.6-8.5l-6.4 6.8c5.4 7 13.5 11.2 22.4 11.2 13.5 0 22.4-7.6 22.4-18.8 0-16.8-19.8-14.7-19.8-23.4 0-3.4 2.8-5.3 6.9-5.3 5.4 0 10.5 2.6 14.1 6.8l6.1-7.1c-5-5.7-12.2-9.3-20.8-9.3z"
      fill="#FFFFFF"
    />
  </svg>
);

export const PostgresIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
    <path
      d="M64 12C35.3 12 12 35.3 12 64s23.3 52 52 52 52-23.3 52-52S92.7 12 64 12zm25.5 73.8c-2.4 4.5-6.5 8-11.6 9.8-2.6.9-5.4 1.4-8.2 1.4-3.8 0-7.5-.8-10.8-2.5-4.7-2.3-8.3-6.1-10.4-10.9-1.5-3.5-2.2-7.3-2.2-11.2 0-3.6.6-7.2 1.9-10.5 2-5 5.5-9.1 10-11.7 3.6-2.1 7.7-3.2 11.9-3.2 3.2 0 6.3.7 9.2 2 4.9 2.3 8.7 6.2 10.9 11.1 1.6 3.6 2.4 7.5 2.4 11.5 0 4.7-.9 9.3-3.1 13.7z"
      fill="#336791"
    />
    <path
      d="M69.8 45.2c-1.8-.8-3.8-1.2-5.8-1.2-3.1 0-6.1.9-8.6 2.5-3.3 2.1-5.8 5.2-7.2 8.9-.9 2.5-1.4 5.2-1.4 7.9 0 2.9.5 5.7 1.6 8.3 1.5 3.6 4.1 6.4 7.5 8.1 2.4 1.2 5.1 1.9 7.9 1.9 2.1 0 4.1-.4 6-1.1 3.7-1.4 6.7-4 8.4-7.5 1.5-3.1 2.3-6.5 2.3-10 0-3.1-.6-6.1-1.8-8.9-1.6-3.8-4.5-6.8-8.9-8.9z"
      fill="#4169E1"
    />
    <circle cx="58" cy="58" r="4" fill="#FFFFFF" />
    <circle cx="70" cy="58" r="4" fill="#FFFFFF" />
  </svg>
);

export const SupabaseIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 109 113" className={className} fill="none">
    <path
      d="M63.7 110.3c-2.7 3.6-8.5 2.1-9.1-2.4L44.8 40.5h48.3c7.5 0 11.6 8.7 6.8 14.5L63.7 110.3z"
      fill="url(#paint0_linear_supabase)"
    />
    <path
      d="M45.1 2.7c2.7-3.6 8.5-2.1 9.1 2.4l9.8 67.4H15.7c-7.5 0-11.6-8.7-6.8-14.5L45.1 2.7z"
      fill="#3ECF8E"
    />
    <defs>
      <linearGradient id="paint0_linear_supabase" x1="44.8" y1="40.5" x2="84.5" y2="108.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#249361" />
        <stop offset="1" stopColor="#3ECF8E" />
      </linearGradient>
    </defs>
  </svg>
);

export const DockerIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
    <rect x="36" y="44" width="12" height="11" rx="1.5" fill="#2496ED" />
    <rect x="52" y="44" width="12" height="11" rx="1.5" fill="#2496ED" />
    <rect x="68" y="44" width="12" height="11" rx="1.5" fill="#2496ED" />
    <rect x="20" y="58" width="12" height="11" rx="1.5" fill="#2496ED" />
    <rect x="36" y="58" width="12" height="11" rx="1.5" fill="#2496ED" />
    <rect x="52" y="58" width="12" height="11" rx="1.5" fill="#2496ED" />
    <rect x="68" y="58" width="12" height="11" rx="1.5" fill="#2496ED" />
    <rect x="84" y="58" width="12" height="11" rx="1.5" fill="#2496ED" />
    <path
      d="M123.5 68.5c-2.5-1.7-8-1.5-12.4.5-1.2-7.5-6.8-12.8-14-13.8l-1.5-.2-.8 1.3c-3.1 5-2.8 11.2-.5 16.5-1.8 1-4.2 1.8-6.8 2.2H8.5c-1.5 6.3 0 13.5 4.3 19 8.2 10.3 22.3 16 41.5 16 32.5 0 57.2-13.8 66.8-38 1.2-.5 2.5-1.1 3.5-1.8 2.2-1.6 3.1-3.6 3.1-4.7-.2-.2-.5-1.3-4.2-2.1v5.1z"
      fill="#2496ED"
    />
  </svg>
);

export const GitIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
    <path
      d="M124.7 57.5L70.5 3.3c-4.4-4.4-11.5-4.4-15.9 0L3.3 54.6c-4.4 4.4-4.4 11.5 0 15.9l54.2 54.2c4.4 4.4 11.5 4.4 15.9 0l51.3-51.3c4.4-4.4 4.4-11.5 0-15.9z"
      fill="#F05032"
    />
    <path
      d="M87.5 59.8c-2.4-2.4-5.8-3.4-9.1-2.8L66.7 45.3v-5.2c2.5-1.4 4.2-4.1 4.2-7.2 0-4.6-3.7-8.3-8.3-8.3s-8.3 3.7-8.3 8.3c0 3.2 1.8 6 4.5 7.3v27.2c-2.7 1.4-4.5 4.1-4.5 7.3 0 4.6 3.7 8.3 8.3 8.3 3.5 0 6.5-2.2 7.7-5.3l12.7 7.4c-.1.7-.2 1.4-.2 2.2 0 4.6 3.7 8.3 8.3 8.3s8.3-3.7 8.3-8.3c.1-4.6-3.6-8.4-8.1-8.4-3.5 0-6.5 2.2-7.7 5.3L59.2 75.8c.2-.7.3-1.4.3-2.1v-23l11.4 11.4c-.2.8-.3 1.7-.3 2.6 0 4.6 3.7 8.3 8.3 8.3s8.3-3.7 8.3-8.3c0-1.8-.7-3.6-1.7-4.9z"
      fill="#FFFFFF"
    />
  </svg>
);

export const GitHubIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="#F2E9D8">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const RedisIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
    <path
      d="M117.8 72.4L68.5 94.6c-2.9 1.3-6.2 1.3-9.1 0L10.2 72.4c-3.1-1.4-3.1-5.8 0-7.2l49.2-22.2c2.9-1.3 6.2-1.3 9.1 0l49.3 22.2c3.1 1.4 3.1 5.8 0 7.2z"
      fill="#D82C20"
    />
    <path
      d="M10.2 72.4l49.2 22.2c2.9 1.3 6.2 1.3 9.1 0l49.3-22.2v16.1c0 2.2-1.3 4.2-3.3 5.1l-47.5 21.4c-2.9 1.3-6.2 1.3-9.1 0L13.5 93.6c-2-1-3.3-3-3.3-5.1V72.4z"
      fill="#A3241A"
    />
    <path
      d="M117.8 45.4L68.5 67.6c-2.9 1.3-6.2 1.3-9.1 0L10.2 45.4c-3.1-1.4-3.1-5.8 0-7.2l49.2-22.2c2.9-1.3 6.2-1.3 9.1 0l49.3 22.2c3.1 1.4 3.1 5.8 0 7.2z"
      fill="#FF4438"
    />
    <ellipse cx="64" cy="42" rx="14" ry="6" fill="#FFFFFF" fillOpacity="0.3" />
  </svg>
);

export const PythonIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
    <path
      d="M63.4 10.5c-26.6 0-25 11.5-25 11.5l.03 11.9h25.4v3.6H26.3S10.5 35.7 10.5 63.4c0 27.7 13.8 26.6 13.8 26.6h8.2v-11.5s-.4-13.8 13.5-13.8h23.2s12.9.2 12.9-12.6V24s1.7-13.5-22.7-13.5zm-13.6 7.3c2.5 0 4.6 2.1 4.6 4.6s-2.1 4.6-4.6 4.6-4.6-2.1-4.6-4.6 2.1-4.6 4.6-4.6z"
      fill="#3776AB"
    />
    <path
      d="M64.6 117.5c26.6 0 25-11.5 25-11.5l-.03-11.9H64.2v-3.6h37.5s15.8 1.8 15.8-25.9c0-27.7-13.8-26.6-13.8-26.6h-8.2v11.5s.4 13.8-13.5 13.8H48.8s-12.9-.2-12.9 12.6V104s-1.7 13.5 22.7 13.5zm13.6-7.3c-2.5 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2.1 4.6-4.6 4.6z"
      fill="#FFD43B"
    />
  </svg>
);

export const GsapIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none">
    <circle cx="50" cy="50" r="46" fill="#141414" stroke="#88CE02" strokeWidth="4" />
    <path
      d="M50 20C33.4 20 20 33.4 20 50s13.4 30 30 30c14.2 0 26-9.9 29.1-23.1h-16c-2.4 5.3-7.8 9-14.1 9-8.8 0-16-7.2-16-16s7.2-16 16-16c5.3 0 10 2.6 12.9 6.6L73 29.7C67.6 23.8 59.2 20 50 20z"
      fill="#88CE02"
    />
    <circle cx="68" cy="50" r="7" fill="#88CE02" />
  </svg>
);

export const ThreeIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
    <path
      d="M64 12L16 96h96L64 12zm0 24l32 56H32l32-56z"
      fill="#FFFFFF"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M64 36v56M32 92l64-56M96 92L32 36" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
  </svg>
);

export const FigmaIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 38 57" className={className} fill="none">
    <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE" />
    <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83" />
    <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262" />
    <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E" />
    <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF" />
  </svg>
);

export const ExpressIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none">
    <text x="50" y="62" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace" fontWeight="900" fontSize="36" letterSpacing="-2">
      ex
    </text>
  </svg>
);

export const VercelIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 116 100" className={className} fill="none">
    <path d="M58 0L115.154 99H0.846176L58 0Z" fill="#FFFFFF" />
  </svg>
);

export const HTMLIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
    <path d="M19.2 112.5L9.6 5h108.8l-9.6 107.5L64 123l-44.8-10.5z" fill="#E34F26" />
    <path d="M64 114.7l37-10.2 8-90H64v100.2z" fill="#EF652A" />
    <path d="M64 53.6H44.8l-1.4-15.6H64V24H27.8l4.2 46.1H64v-16.5zm0 33.2l-.3.1-15.5-4.2-1-11.2H33.2l2 22.3L64 97.4V86.8z" fill="#ECECEC" />
    <path d="M64 53.6h19.2l-1.8 20.3L64 78.1v16.5l28.8-8 3.8-43H64v10zm0-29.6v14h34.6l1.2-14H64z" fill="#FFFFFF" />
  </svg>
);

export const CSSIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none">
    <path d="M19.2 112.5L9.6 5h108.8l-9.6 107.5L64 123l-44.8-10.5z" fill="#1572B6" />
    <path d="M64 114.7l37-10.2 8-90H64v100.2z" fill="#33A9DC" />
    <path d="M64 53.6H44.8l-1.4-15.6H64V24H27.8l4.2 46.1H64v-16.5zm0 33.2l-.3.1-15.5-4.2-1-11.2H33.2l2 22.3L64 97.4V86.8z" fill="#ECECEC" />
    <path d="M64 53.6h19.2l-1.8 20.3L64 78.1v16.5l28.8-8 3.8-43H64v10zm0-29.6v14h34.6l1.2-14H64z" fill="#FFFFFF" />
  </svg>
);

export const MongoIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M12.001 0C11.516 0 10.33 3.193 10.126 4.502c-.893 4.608.435 8.666 3.253 12.164.779.972 1.666 1.884 2.584 2.766-.994-2.887-1.325-6.04-.694-9.112.502-2.474 1.708-4.787 3.21-6.877C17.202 2.115 14.54.265 12.001 0zm-.375 23.957c.394.394.858.043.858-.291V16.92c-1.57-1.405-2.825-3.08-3.69-4.945-.968-2.091-1.399-4.394-1.258-6.702-1.92 2.378-3.13 5.378-3.344 8.528-.352 5.176 3.447 9.878 7.434 10.156z"
      fill="#47A248"
    />
  </svg>
);

export const MysqlIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="#00758F">
    <path d="M16.98 13.91c-.42-.09-.85-.14-1.28-.14-1.55 0-2.97.68-3.95 1.76-.73.81-1.18 1.87-1.24 3.02-.02.44.04.88.18 1.29-.63-.22-1.22-.56-1.74-.99-1.25-1.04-1.98-2.58-1.98-4.22 0-2.45 1.62-4.62 3.99-5.32 1.05-.31 2.16-.31 3.21 0 1.94.57 3.42 2.14 3.81 4.1.04.22.06.44.06.66-.35-.09-.71-.14-1.06-.16zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

export const FirebaseIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <path d="M4.68 18.23l6.23-11.53c.47-.87 1.73-.87 2.2 0l6.21 11.53H4.68z" fill="#FFA000" />
    <path d="M12 2.14c-.45-.85-1.68-.85-2.13 0L3.12 15.11l8.88-12.97z" fill="#FFCA28" />
    <path d="M12 14.88l-4.14 7.64c-.39.72.13 1.6.95 1.6h6.38c.82 0 1.34-.88.95-1.6L12 14.88z" fill="#F57C00" />
  </svg>
);

export const FastApiIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="#059669">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.2 4.8l-1.8 6h3.6l-4.2 8.4 1.8-6H9l4.2-8.4z" />
  </svg>
);

export const SocketIoIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="10" stroke="#010101" strokeWidth="2" fill="#FFFFFF" />
    <path d="M9 13.5L12 7.5L15 13.5H12.5L14 16.5L11 10.5L9.5 13.5H9Z" fill="#010101" />
  </svg>
);

export const LinuxIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="#FCC624">
    <path d="M12 2c-3.3 0-6 2.7-6 6v4c0 3.3 2.7 6 6 6s6-2.7 6-6V8c0-3.3-2.7-6-6-6zm0 18c-4.4 0-8 1.8-8 4v1h16v-1c0-2.2-3.6-4-8-4z" />
    <circle cx="9.5" cy="8.5" r="1.5" fill="#000000" />
    <circle cx="14.5" cy="8.5" r="1.5" fill="#000000" />
    <path d="M11 11h2l-1 2-1-2z" fill="#FFA500" />
  </svg>
);

export const NpmIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="#CB3837">
    <path d="M0 0v24h24V0H0zm19.5 19.5h-4.5V9h-3v10.5H4.5V4.5h15v15z" />
  </svg>
);

export const PostmanIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="#FF6C37">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.75 4.5a2.25 2.25 0 110 4.5 2.25 2.25 0 010-4.5zM7.5 16.5l3.5-3.5 1.5 1.5-3.5 3.5-1.5-1.5zm9 0l-3.5-3.5 1.5-1.5 3.5 3.5-1.5 1.5z" />
  </svg>
);

export const FramerMotionIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="#0055FF">
    <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
  </svg>
);

export const WebGLIcon: React.FC<IconProps> = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="#990000">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#990000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

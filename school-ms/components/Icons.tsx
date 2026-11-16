import React from "react";

type P = { size?: number; stroke?: number; className?: string };
const base = (props: P) => ({
  width: props.size ?? 18,
  height: props.size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: props.stroke ?? 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: props.className,
});

export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /><path d="M9.5 20v-5.5h5V20" /></svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M2.8 20c.6-3.4 3.1-5.4 6.2-5.4S14.6 16.6 15.2 20" /><path d="M16 5.4a3 3 0 0 1 0 5.6" /><path d="M17.6 14.9c2.1.6 3.4 2.4 3.7 5.1" /></svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}><rect x="3.2" y="3.2" width="7" height="7" rx="2" /><rect x="13.8" y="3.2" width="7" height="7" rx="2" /><rect x="3.2" y="13.8" width="7" height="7" rx="2" /><rect x="13.8" y="13.8" width="7" height="7" rx="2" /></svg>
);
export const IconBriefcase = (p: P) => (
  <svg {...base(p)}><rect x="2.8" y="7.5" width="18.4" height="12.5" rx="3" /><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" /><path d="M3 12.5h18" /></svg>
);
export const IconCheckSquare = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M8 12.2l2.6 2.6L16.2 9" /></svg>
);
export const IconBook = (p: P) => (
  <svg {...base(p)}><path d="M4 5.2A2 2 0 0 1 6 3.2h5v17.6H6a2 2 0 0 0-2 2z" /><path d="M20 5.2a2 2 0 0 0-2-2h-5v17.6h5a2 2 0 0 1 2 2z" /></svg>
);
export const IconFile = (p: P) => (
  <svg {...base(p)}><path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z" /><path d="M14 3v5h5" /><path d="M8.5 13h7M8.5 16.5h4.5" /></svg>
);
export const IconWallet = (p: P) => (
  <svg {...base(p)}><rect x="2.8" y="6" width="18.4" height="13" rx="3.4" /><path d="M2.8 10.5h18.4" /><circle cx="17" cy="15" r="1.2" fill="currentColor" stroke="none" /><path d="M6 6V5a2 2 0 0 1 2.6-1.9l8 2.4" /></svg>
);
export const IconMegaphone = (p: P) => (
  <svg {...base(p)}><path d="M4 10v4a2 2 0 0 0 2 2h1.5l7 4.2V3.8l-7 4.2H6a2 2 0 0 0-2 2z" /><path d="M18 8.6a4.4 4.4 0 0 1 0 6.8" /><path d="M7.5 16v3.4a1.8 1.8 0 0 0 3.4.7" /></svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M4.4 7.5l2.1 1.2M17.5 15.3l2.1 1.2M4.4 16.5l2.1-1.2M17.5 8.7l2.1-1.2" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconChevronDown = (p: P) => (<svg {...base(p)}><path d="M6 9.5l6 6 6-6" /></svg>);
export const IconChevronRight = (p: P) => (<svg {...base(p)}><path d="M9.5 6l6 6-6 6" /></svg>);
export const IconArrowRight = (p: P) => (<svg {...base(p)}><path d="M4 12h15" /><path d="M13.5 6.5L20 12l-6.5 5.5" /></svg>);
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7" /></svg>);
export const IconX = (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconTrend = (p: P) => (<svg {...base(p)}><path d="M3.5 16.5l5.5-6 4 3.5 7.5-8" /><path d="M15 6h5.5v5.5" /></svg>);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}><rect x="3.2" y="5" width="17.6" height="16" rx="3" /><path d="M3.2 10h17.6M8 3v4M16 3v4" /></svg>
);
export const IconPrint = (p: P) => (
  <svg {...base(p)}><path d="M7 8V3.5h10V8" /><rect x="3.5" y="8" width="17" height="7.5" rx="2.2" /><path d="M7 15.5V21h10v-5.5" /></svg>
);
export const IconPhone = (p: P) => (
  <svg {...base(p)}><path d="M6.4 3.5h3l1.4 4-2 1.4a11 11 0 0 0 5.3 5.3l1.4-2 4 1.4v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.4 5.7a2 2 0 0 1 2-2.2z" /></svg>
);
export const IconMail = (p: P) => (
  <svg {...base(p)}><rect x="2.8" y="5" width="18.4" height="14" rx="3" /><path d="M3.4 7.5L12 13l8.6-5.5" /></svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>
);
export const IconStar = (p: P) => (
  <svg {...base(p)}><path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.9-5.2 2.9 1-5.9L3.5 9.8l5.9-.9z" /></svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}><path d="M9.5 20H6a2.5 2.5 0 0 1-2.5-2.5v-11A2.5 2.5 0 0 1 6 4h3.5" /><path d="M15 8.5l4 3.5-4 3.5" /><path d="M19 12H9" /></svg>
);
export const IconSparkle = (p: P) => (
  <svg {...base(p)}><path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8z" /><path d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" /></svg>
);
export const IconClock = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.6" /><path d="M12 7.5V12l3.2 2" /></svg>);
export const IconCrayon = (p: P) => (
  <svg {...base(p)}><path d="M9 3.2h6l1.2 3.3H7.8z" /><rect x="7.8" y="6.5" width="8.4" height="2.6" rx="0.6" /><path d="M8.6 9.1h6.8v7.2L12 20.6l-3.4-4.3z" /></svg>
);

export function Logo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect width="44" height="44" rx="13" fill="#fff" />
      <rect x="8" y="9" width="7.5" height="26" rx="3" fill="#f97316" transform="rotate(-10 11.75 22)" />
      <rect x="18.4" y="7" width="7.5" height="28" rx="3" fill="#2563eb" transform="rotate(4 22.15 21)" />
      <rect x="28.6" y="10" width="7.5" height="24" rx="3" fill="#14161a" transform="rotate(13 32.35 22)" />
    </svg>
  );
}

export function IconKey({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="4.2" />
      <path d="M11 11l8.5 8.5M16 16l2.2-2.2M18.6 18.6l2.2-2.2" />
    </svg>
  );
}

export function IconTrash({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9.5 7V5.6A1.6 1.6 0 0 1 11.1 4h1.8A1.6 1.6 0 0 1 14.5 5.6V7" />
      <path d="M6.5 7l.8 11.4A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.6L17.5 7" />
    </svg>
  );
}

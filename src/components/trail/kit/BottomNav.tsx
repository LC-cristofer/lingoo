import Link from "next/link";
import type { ReactNode } from "react";

type Tab = "trilha" | "memoria" | "album";

type BottomNavProps = { active: Tab; /** Cards ready today: a coral badge on Memória when above 0. */ memoryDue?: number };

const TrailIcon = (
  <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
    <path d="M9 28 C9 20 23 22 23 14 C23 8 14 9 14 4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <circle cx="9" cy="28" r="3.5" fill="currentColor" />
    <circle cx="14" cy="4" r="3.5" fill="currentColor" />
  </svg>
);
const MemoryIcon = (
  <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
    <rect x="9" y="3" width="18" height="23" rx="4" fill="none" stroke="currentColor" strokeWidth="3.4" transform="rotate(10 18 14)" />
    <rect x="4" y="7" width="18" height="23" rx="4" fill="currentColor" />
    <path d="M10 15 a3 3 0 1 1 4 3 v2" stroke="var(--cream)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
  </svg>
);
const AlbumIcon = (
  <svg viewBox="-20 -18 40 36" width="30" height="27" aria-hidden="true">
    <path d="M-17 -12 q9 -4 17 2 q8 -6 17 -2 v24 q-9 -4 -17 2 q-8 -6 -17 -2z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M0 -10 v24" stroke="currentColor" strokeWidth="3" />
  </svg>
);

/** The three tabs, always in this order: Trilha, Memória, Álbum. */
export function BottomNav({ active, memoryDue = 0 }: BottomNavProps) {
  const tabs: { id: Tab; href: string; label: string; icon: ReactNode }[] = [
    { id: "trilha", href: "/mapa", label: "Trilha", icon: TrailIcon },
    { id: "memoria", href: "/memoria", label: "Memória", icon: MemoryIcon },
    { id: "album", href: "/album", label: "Álbum", icon: AlbumIcon },
  ];
  return (
    <nav aria-label="Navegação" className="k-nav">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={active === t.id ? "page" : undefined}
          className={`k-tab min-h-16 ${active === t.id ? "is-active" : ""} ${active === t.id && t.id === "memoria" ? "is-sky" : ""}`}
        >
          {t.icon}
          {t.label}
          {t.id === "memoria" && memoryDue > 0 ? <span className="k-badge">{memoryDue}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

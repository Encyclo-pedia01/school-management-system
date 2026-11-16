"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { classById, feeTotals, fullName, termProgress } from "@/lib/derive";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";
import { IconArrowRight, IconX } from "./Icons";
import {
  IconBook,
  IconBriefcase,
  IconCalendar,
  IconKey,
  IconCheckSquare,
  IconChevronDown,
  IconFile,
  IconGrid,
  IconHome,
  IconMegaphone,
  IconSearch,
  IconSettings,
  IconUsers,
  IconWallet,
  Logo,
} from "./Icons";
import { Avatar, Toasts } from "./ui";
import TopProgress from "./TopProgress";
import { SkRows } from "./Skeleton";

interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", short: "Home", icon: <IconHome size={17} />, roles: ["admin", "teacher", "parent"] }],
  },
  {
    group: "People",
    items: [
      { href: "/students", label: "Students", short: "Pupils", icon: <IconUsers size={17} />, roles: ["admin", "teacher"] },
      { href: "/classes", label: "Classes", short: "Classes", icon: <IconGrid size={17} />, roles: ["admin", "teacher"] },
      { href: "/staff", label: "Staff", short: "Staff", icon: <IconBriefcase size={17} />, roles: ["admin"] },
    ],
  },
  {
    group: "Academics",
    items: [
      { href: "/attendance", label: "Attendance", short: "Register", icon: <IconCheckSquare size={17} />, roles: ["admin", "teacher", "parent"] },
      { href: "/exams", label: "Exams & Scores", short: "Scores", icon: <IconBook size={17} />, roles: ["admin", "teacher"] },
      { href: "/reports", label: "Report Cards", short: "Reports", icon: <IconFile size={17} />, roles: ["admin", "teacher", "parent"] },
    ],
  },
  {
    group: "Finance & Comms",
    items: [
      { href: "/fees", label: "Fees", short: "Fees", icon: <IconWallet size={17} />, roles: ["admin", "parent"] },
      { href: "/announcements", label: "Announcements", short: "Notices", icon: <IconMegaphone size={17} />, roles: ["admin", "teacher", "parent"] },
      { href: "/settings", label: "School setup", short: "Setup", icon: <IconSettings size={17} />, roles: ["admin"] },
    ],
  },
];

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  parent: "Parent",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { state, persona, ready, session, signOut, toasts } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const prog = termProgress(state);
  const school = state.school;

  const roleWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!roleOpen) return;
    const onDown = (e: MouseEvent) => {
      if (roleWrapRef.current && !roleWrapRef.current.contains(e.target as Node)) setRoleOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRoleOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [roleOpen]);

  useEffect(() => {
    // wait for localStorage hydration before deciding where to send people
    if (!ready) return;
    if (!state.setupComplete) router.replace("/setup");
    else if (!session) router.replace("/login");
  }, [ready, state.setupComplete, session, router]);

  /* close the phone sheets whenever the route changes */
  useEffect(() => {
    setMoreOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const groups = useMemo(
    () =>
      NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(persona.role)) })).filter(
        (g) => g.items.length > 0,
      ),
    [persona.role],
  );

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  /* bottom bar: four primary tabs + More (everything else lives in the sheet) */
  /* four tabs a person actually opens every day, then "More" for the rest */
  /* Home · Pupils · Register · Fees, then "More" holds the rest */
  const PRIMARY_ORDER = ["/dashboard", "/students", "/attendance", "/fees", "/reports", "/exams"];
  const primaryTabs = useMemo(
    () =>
      flat
        .filter((i) => PRIMARY_ORDER.includes(i.href))
        .sort((a, b) => PRIMARY_ORDER.indexOf(a.href) - PRIMARY_ORDER.indexOf(b.href))
        .slice(0, 4),
    [flat],
  );
  const overflowTabs = useMemo(() => flat.filter((i) => !primaryTabs.some((t) => t.href === i.href)), [flat, primaryTabs]);

  const pupilCount = state.students.filter((s) => s.status === "Active").length;
  const arrears = feeTotals(state).arrearsCount;

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.toLowerCase();
    return [
      ...state.students
        .filter((s) => fullName(s).toLowerCase().includes(term) || s.admissionNo.toLowerCase().includes(term))
        .slice(0, 5)
        .map((s) => ({ id: s.id, label: fullName(s), sub: classById(state, s.classId)?.name ?? "—", href: `/students?q=${encodeURIComponent(fullName(s))}`, kind: "Pupil" })),
      ...state.staff
        .filter((s) => s.name.toLowerCase().includes(term))
        .slice(0, 3)
        .map((s) => ({ id: s.id, label: s.name, sub: s.role, href: `/staff`, kind: "Staff" })),
    ];
  }, [q, state]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="shell">
      <TopProgress />

      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <Logo size={36} />
          <div className="brand-text">
            <div className="brand-name">{school.name || "Your school"}</div>
            <div className="brand-sub">{school.shortName || "Setup in progress"}</div>
          </div>
        </Link>

        {groups.map((g) => (
          <div key={g.group}>
            <div className="nav-group-label">{g.group}</div>
            {g.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className={"nav-item" + (active ? " active" : "")}>
                  <span className="ico">{item.icon}</span>
                  {item.label}
                  {item.href === "/students" && pupilCount > 0 && <span className="nav-badge">{pupilCount}</span>}
                  {item.href === "/fees" && arrears > 0 && <span className="nav-badge">{arrears}</span>}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="sidebar-foot">
          <div className="term-card">
            <div className="t-label">Current term</div>
            <div className="t-value">
              {prog.term.name}
              {prog.term.year ? ` · ${prog.term.year}` : ""}
            </div>
            <div className="t-days">{prog.term.end ? `${prog.daysLeft} days to close` : "Set your term in School setup"}</div>
            <div className="progress" style={{ marginTop: 9, background: "#2c3038", height: 6 }}>
              <span style={{ width: `${prog.pct}%`, background: "#f97316" }} />
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="mobile-brand">
            <Logo size={28} />
            <span
              style={{
                fontWeight: 900, fontSize: 13, maxWidth: 150, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {school.shortName || school.name || "School"}
            </span>
          </span>

          <div className="search">
            <IconSearch size={16} />
            <input placeholder="Search pupils, staff, admission numbers…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="topbar-right">
            <button className="icon-btn only-phone" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <IconSearch size={18} />
            </button>

            <div className="term-chip">
              <IconCalendar size={14} />
              {prog.term.name}
              {prog.term.end ? ` · ${prog.daysLeft} days left` : ""}
            </div>

            <div className="role-switch" ref={roleWrapRef}>
              <button className="role-btn" onClick={() => setRoleOpen((v) => !v)}>
                <Avatar name={persona.name} size={28} />
                <span className="chip-text" style={{ lineHeight: 1.15, textAlign: "left" }}>
                  <span className="chip-name">
                    {persona.name.replace(/^(Mrs\.|Mr\.|Ms\.|Dr\.)\s/, "")}
                  </span>
                  <span className="chip-role" style={{ fontSize: 10.5, color: "var(--orange-dk)", fontWeight: 800 }}>
                    {ROLE_LABEL[persona.role]}
                  </span>
                </span>
                <IconChevronDown size={14} />
              </button>

              {roleOpen && (
                <>
                  <div className="role-menu fade-in" style={{ zIndex: 60 }}>
                    <div className="role-menu-label">Signed in as</div>
                    <div style={{ padding: "0 10px 10px" }}>
                      <div style={{ fontWeight: 900, fontSize: 13.5 }}>{persona.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700, marginTop: 2 }}>
                        {ROLE_LABEL[persona.role]} · {session?.login}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700, marginTop: 2 }}>{persona.title}</div>
                    </div>
                    <div style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                      <Link href="/account" className="role-option" onClick={() => setRoleOpen(false)}>
                        <span style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--cream-2)", color: "var(--orange-dk)", fontWeight: 900, fontSize: 11 }}>
                          K
                        </span>
                        <span>
                          <span className="ro-name">Change my access key</span>
                          <span className="ro-desc">Keep your sign-in private</span>
                        </span>
                      </Link>
                      <button
                        className="role-option"
                        onClick={() => {
                          setRoleOpen(false);
                          signOut();
                          router.replace("/login");
                        }}
                      >
                        <span style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", background: "#fdecea", color: "#b3261e", fontWeight: 900, fontSize: 11 }}>
                          <IconArrowRight size={14} />
                        </span>
                        <span>
                          <span className="ro-name">Sign out</span>
                          <span className="ro-desc">Return to the sign-in screen</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {results.length > 0 && (
            <div
              className="search-drop"
              style={{
                position: "absolute", top: "calc(100% - 4px)", left: 26, width: 420, background: "#fff",
                border: "1px solid var(--line-2)", borderRadius: 16, boxShadow: "var(--shadow-lg)", padding: 6, zIndex: 40,
              }}
            >
              {results.map((r) => (
                <Link
                  key={r.kind + r.id}
                  href={r.href}
                  onClick={() => setQ("")}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 11 }}
                >
                  <Avatar name={r.label} size={28} />
                  <span>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 13 }}>{r.label}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)" }}>{r.sub}</span>
                  </span>
                  <span className="badge badge-grey" style={{ marginLeft: "auto" }}>{r.kind}</span>
                </Link>
              ))}
            </div>
          )}
        </header>

        <main className="page">
          {ready ? (
            children
          ) : (
            <div className="card card-pad" style={{ marginTop: 4 }}>
              <SkRows rows={8} />
            </div>
          )}
        </main>
      </div>

      {/* ---------------- phone: bottom tab bar ---------------- */}
      <nav className="tabbar" aria-label="Main">
        {primaryTabs.map((t) => (
          <Link key={t.href} href={t.href} className={"tab" + (isActive(t.href) ? " on" : "")}>
            <span className="tab-ico">{t.icon}</span>
            <span className="tab-label">{t.short}</span>
          </Link>
        ))}
        <button className={"tab" + (moreOpen ? " on" : "")} onClick={() => setMoreOpen(true)} aria-label="More">
          <span className="tab-ico">
            <IconGrid size={17} />
          </span>
          <span className="tab-label">More</span>
        </button>
      </nav>

      {/* ---------------- phone: more sheet ---------------- */}
      {moreOpen && (
        <div className="sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <div className="sheet-head">
              <div>
                <div className="eyebrow">Everything else</div>
                <h3 style={{ fontSize: 17, marginTop: 3 }}>{school.shortName || school.name || "Your school"}</h3>
              </div>
              <button className="icon-btn" onClick={() => setMoreOpen(false)} aria-label="Close">
                <IconX size={18} />
              </button>
            </div>
            <div className="sheet-grid">
              {overflowTabs.map((t) => (
                <Link key={t.href} href={t.href} className="sheet-tile" onClick={() => setMoreOpen(false)}>
                  <span className="sheet-ico">{t.icon}</span>
                  <span>{t.label}</span>
                </Link>
              ))}
              <Link href="/account" className="sheet-tile" onClick={() => setMoreOpen(false)}>
                <span className="sheet-ico">
                  <IconKey size={17} />
                </span>
                <span>My account</span>
              </Link>
            </div>
            <div className="sheet-foot">
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>
                Signed in as {persona.name} · {ROLE_LABEL[persona.role]}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setMoreOpen(false);
                  signOut();
                  router.replace("/login");
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- phone: search sheet ---------------- */}
      {searchOpen && (
        <div className="sheet-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="sheet sheet-tall" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <div className="sheet-head">
              <div style={{ flex: 1 }}>
                <div className="search sheet-search">
                  <IconSearch size={16} />
                  <input
                    autoFocus
                    placeholder="Search pupils, staff, admission numbers…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSearchOpen(false)} aria-label="Close">
                <IconX size={18} />
              </button>
            </div>
            <div style={{ overflowY: "auto", paddingBottom: 10 }}>
              {results.length > 0 ? (
                results.map((r) => (
                  <Link
                    key={r.kind + r.id}
                    href={r.href}
                    onClick={() => {
                      setQ("");
                      setSearchOpen(false);
                    }}
                    className="list-row"
                  >
                    <Avatar name={r.label} size={32} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 800, fontSize: 13.5 }}>{r.label}</span>
                      <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>{r.sub}</span>
                    </span>
                    <span className="badge badge-grey">{r.kind}</span>
                  </Link>
                ))
              ) : (
                <div style={{ padding: "18px 4px", fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>
                  {q.trim() ? "Nothing matches that search." : "Type a name, admission number or staff name."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}

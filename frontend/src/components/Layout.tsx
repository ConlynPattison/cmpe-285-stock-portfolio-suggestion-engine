import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const FolioLogo = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="10" fill="url(#logoGrad)" />
    <path
      d="M7 26 L13 17 L19 20.5 L28 10"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="28" cy="10" r="2.5" fill="white" />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

const NavIcon = ({ path }: { path: string }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
    <path d={path} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
    isActive
      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Initials from display name
  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-900">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <FolioLogo />
            <div>
              <div className="text-lg font-bold leading-tight tracking-tight text-slate-900">
                Folio
              </div>
              <div className="text-[11px] font-medium text-slate-400 tracking-wide">
                Smart investing, simplified
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              <NavIcon path="M2 10 L7.5 3 L13 10 M4.5 8v5h6V8" />
              Build Portfolio
            </NavLink>
            <NavLink to="/portfolios" className={navLinkClass}>
              <NavIcon path="M2 3h11M2 7.5h8M2 12h5" />
              My Portfolios
            </NavLink>

            {/* User + sign out */}
            <div className="ml-3 flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
              <span className="hidden text-sm font-medium text-slate-700 sm:block">
                {user?.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M9 2H12.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9M6 10.5L9.5 7.5 6 4.5M9.5 7.5H2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:block">Sign out</span>
              </button>
            </div>
          </nav>        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FolioLogo />
              <div>
                <span className="text-sm font-semibold text-slate-800">Folio</span>
                <span className="ml-2 text-xs text-slate-400">CMPE 285 · Smart Portfolio Engine</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              For educational use only. Not financial advice. Market data via Yahoo Finance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

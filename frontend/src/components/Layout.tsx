import { NavLink, Outlet } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-2 text-sm font-medium transition",
    isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-base font-semibold text-white">
              P
            </div>
            <div>
              <div className="text-base font-semibold leading-tight text-slate-900">
                Portfolio Suggestion Engine
              </div>
              <div className="text-xs text-slate-500">CMPE 285 final project</div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              Create
            </NavLink>
            <NavLink to="/portfolios" className={navLinkClass}>
              View Portfolios
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-4 text-xs text-slate-500">
          For educational use. Not investment advice.
        </div>
      </footer>
    </div>
  );
}

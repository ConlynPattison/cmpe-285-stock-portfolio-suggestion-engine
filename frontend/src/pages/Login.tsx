import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const FolioLogo = () => (
  <svg width="48" height="48" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="10" fill="url(#loginLogoGrad)" />
    <path
      d="M7 26 L13 17 L19 20.5 L28 10"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="28" cy="10" r="2.5" fill="white" />
    <defs>
      <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-indigo-400/10 blur-3xl" />
        {/* subtle grid */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <FolioLogo />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome to Folio</h1>
            <p className="mt-1.5 text-sm text-indigo-200/70">
              Smart investing, simplified. Sign in to continue.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-indigo-100">
                  Email address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-indigo-300/60">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:border-indigo-400 focus:bg-white/15 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-indigo-100">
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-indigo-300/60">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-12 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:border-indigo-400 focus:bg-white/15 focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3.5 flex items-center text-indigo-300/50 transition hover:text-indigo-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  <svg className="shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-700/40 transition-all duration-150 hover:bg-indigo-500 active:scale-95 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

          </div>

          {/* Footer strip */}
          <div className="border-t border-white/5 bg-white/[0.02] px-8 py-4 text-center text-xs text-indigo-300/40">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-indigo-300 transition hover:text-white">
              Create one
            </Link>
            <span className="mx-2 opacity-30">·</span>
            For educational use only · CMPE 285
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Strategies", value: "5" },
            { label: "Live data", value: "Real-time" },
            { label: "Holdings tracked", value: "25+" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-white/5 px-3 py-4 backdrop-blur-sm">
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="mt-0.5 text-xs text-indigo-300/60">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

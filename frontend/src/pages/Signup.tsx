import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { PASSWORD_RULES, useAuth } from "../context/AuthContext";

// ─── Shared logo (same as Login) ─────────────────────────────────────────────

const FolioLogo = () => (
  <svg width="48" height="48" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="10" fill="url(#signupLogoGrad)" />
    <path d="M7 26 L13 17 L19 20.5 L28 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="28" cy="10" r="2.5" fill="white" />
    <defs>
      <linearGradient id="signupLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

// ─── Password strength ────────────────────────────────────────────────────────

function usePasswordStrength(password: string) {
  return useMemo(() => {
    const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
    const pct = (passed / PASSWORD_RULES.length) * 100;
    if (passed === 0) return { score: 0, label: "",          color: "bg-white/10",     pct };
    if (passed <= 2)  return { score: 1, label: "Weak",      color: "bg-rose-500",     pct };
    if (passed <= 4)  return { score: 2, label: "Fair",      color: "bg-amber-400",    pct };
    if (passed === 5) return { score: 3, label: "Good",      color: "bg-indigo-400",   pct };
    return               { score: 4, label: "Strong",     color: "bg-emerald-400",  pct };
  }, [password]);
}

// ─── Eye icon ─────────────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirm,         setConfirm]         = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [agreed,          setAgreed]          = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [touched,         setTouched]         = useState(false); // show rules after first keystroke

  const strength = usePasswordStrength(password);
  const rules    = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) }));
  const allRulesPassed = rules.every((r) => r.passed);
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = name.trim() && email.trim() && allRulesPassed && passwordsMatch && agreed && !isLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) { setError("Passwords do not match."); return; }
    if (!agreed)          { setError("You must accept the terms to continue."); return; }
    setError(null);
    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sgrid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <FolioLogo />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Create your account</h1>
            <p className="mt-1.5 text-sm text-indigo-200/70">
              Join Folio and start building your portfolio today.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Full name */}
              <div>
                <label htmlFor="su-name" className="mb-1.5 block text-sm font-medium text-indigo-100">
                  Full name
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-indigo-300/60">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="su-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    placeholder="Jane Smith"
                    className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:border-indigo-400 focus:bg-white/15 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="su-email" className="mb-1.5 block text-sm font-medium text-indigo-100">
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
                    id="su-email"
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
                <label htmlFor="su-password" className="mb-1.5 block text-sm font-medium text-indigo-100">
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
                    id="su-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setTouched(true); setError(null); }}
                    placeholder="Create a strong password"
                    className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-12 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:border-indigo-400 focus:bg-white/15 focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3.5 flex items-center text-indigo-300/50 transition hover:text-indigo-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>

                {/* Strength bar */}
                {touched && password.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1,2,3,4].map((seg) => (
                          <div key={seg} className={[
                            "h-1 w-10 rounded-full transition-all duration-300",
                            strength.score >= seg ? strength.color : "bg-white/10",
                          ].join(" ")} />
                        ))}
                      </div>
                      {strength.label && (
                        <span className={[
                          "text-xs font-medium",
                          strength.score <= 1 ? "text-rose-400"
                          : strength.score === 2 ? "text-amber-400"
                          : strength.score === 3 ? "text-indigo-400"
                          : "text-emerald-400",
                        ].join(" ")}>{strength.label}</span>
                      )}
                    </div>

                    {/* Rule checklist */}
                    <ul className="grid grid-cols-1 gap-1 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                      {rules.map((rule) => (
                        <li key={rule.id} className="flex items-center gap-2 text-xs">
                          {rule.passed ? (
                            <svg className="shrink-0 text-emerald-400" width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5.5" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1"/>
                              <path d="M3.5 6l2 2 3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg className="shrink-0 text-white/20" width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1"/>
                            </svg>
                          )}
                          <span className={rule.passed ? "text-emerald-300/90" : "text-indigo-300/50"}>
                            {rule.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="su-confirm" className="mb-1.5 block text-sm font-medium text-indigo-100">
                  Confirm password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-indigo-300/60">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="su-confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                    placeholder="Re-enter your password"
                    className={[
                      "w-full rounded-xl border bg-white/10 py-3 pl-10 pr-12 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:ring-2",
                      confirm.length > 0
                        ? passwordsMatch
                          ? "border-emerald-500/50 focus:border-emerald-400 focus:ring-emerald-500/20"
                          : "border-rose-500/50 focus:border-rose-400 focus:ring-rose-500/20"
                        : "border-white/10 focus:border-indigo-400 focus:ring-indigo-500/30",
                    ].join(" ")}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3.5 flex items-center text-indigo-300/50 transition hover:text-indigo-200"
                    aria-label={showConfirm ? "Hide password" : "Show password"}>
                    <EyeIcon visible={showConfirm} />
                  </button>
                  {confirm.length > 0 && (
                    <span className="absolute inset-y-0 right-10 flex items-center">
                      {passwordsMatch
                        ? <svg className="text-emerald-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 7l2 2 3-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg className="text-rose-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      }
                    </span>
                  )}
                </div>
                {confirm.length > 0 && !passwordsMatch && (
                  <p className="mt-1.5 text-xs text-rose-400">Passwords do not match.</p>
                )}
              </div>

              {/* Terms checkbox */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                <div
                  onClick={() => setAgreed((v) => !v)}
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition",
                    agreed ? "border-indigo-500 bg-indigo-600" : "border-white/20 bg-transparent",
                  ].join(" ")}
                >
                  {agreed && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-xs leading-relaxed text-indigo-200/70">
                  I understand this is an educational tool, not financial advice. I agree to keep
                  my credentials secure and not share account access with others.
                </span>
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  <svg className="shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-700/40 transition-all duration-150 hover:bg-indigo-500 active:scale-95 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round"/>
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
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
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-indigo-300 hover:text-white transition">
              Sign in
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-indigo-300/40">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L1.5 3v3.5C1.5 9.1 3.5 11 6 11s4.5-1.9 4.5-4.5V3L6 1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
            <path d="M4 6l1.5 1.5 2.5-3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Passwords hashed with SHA-256 · Stored locally · Educational use only
        </div>
      </div>
    </div>
  );
}

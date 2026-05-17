import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  name: string;
  email: string;
}

interface StoredUser extends User {
  passwordHash: string; // hex-encoded SHA-256
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Password rules (financial-grade) ────────────────────────────────────────

export interface PasswordRule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length",    label: "At least 10 characters",           test: (p) => p.length >= 10 },
  { id: "upper",     label: "One uppercase letter (A–Z)",        test: (p) => /[A-Z]/.test(p) },
  { id: "lower",     label: "One lowercase letter (a–z)",        test: (p) => /[a-z]/.test(p) },
  { id: "digit",     label: "One number (0–9)",                  test: (p) => /\d/.test(p) },
  { id: "special",   label: "One special character (!@#$%^&*)",  test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
  { id: "noSpaces",  label: "No spaces",                         test: (p) => !/\s/.test(p) },
];

export function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return `Password must meet: ${rule.label.toLowerCase()}.`;
  }
  return null;
}

// ─── Crypto helpers ───────────────────────────────────────────────────────────

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const SESSION_KEY = "folio_session";   // currently logged-in user (name + email only)
const USERS_KEY   = "folio_users";     // all registered accounts

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const register = useCallback(async (name: string, email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 700)); // simulate latency

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName  = name.trim();

    if (!trimmedName) throw new Error("Full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) throw new Error("Enter a valid email address.");

    const pwError = validatePassword(password);
    if (pwError) throw new Error(pwError);

    const users = loadUsers();
    if (users.some((u) => u.email === trimmedEmail)) {
      throw new Error("An account with this email already exists. Please sign in.");
    }

    const passwordHash = await sha256hex(password);
    const newUser: StoredUser = { name: trimmedName, email: trimmedEmail, passwordHash };
    saveUsers([...users, newUser]);

    const session: User = { name: trimmedName, email: trimmedEmail };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) throw new Error("Email and password are required.");

    const users = loadUsers();
    const found = users.find((u) => u.email === trimmedEmail);

    // Compute hash even when user not found to prevent timing attacks
    const inputHash = await sha256hex(password);

    if (!found || found.passwordHash !== inputHash) {
      throw new Error("Incorrect email or password.");
    }

    const session: User = { name: found.name, email: found.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

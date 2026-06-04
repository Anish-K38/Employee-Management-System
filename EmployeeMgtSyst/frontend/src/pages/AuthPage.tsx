import { useState } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../hooks/useAuth";
import { api } from "../hooks/useAuth";

// ── Minimal inline validation ──────────────────────────────────────────────
const validateEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address";

type Panel = "login" | "forgot";

export default function AuthPage() {
  const { login, loading, error, setError } = useAuth();

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  // Panel state (login / forgot password)
  const [panel, setPanel] = useState<Panel>("login");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailErr, setForgotEmailErr] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // ── Sign-In submit ─────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const eErr = validateEmail(email);
    const pErr = password.trim() === "" ? "Password is required" : "";
    setEmailErr(eErr);
    setPasswordErr(pErr);
    if (eErr || pErr) return;

    await login(email, password, rememberMe);
  };

  // ── Forgot password submit ─────────────────────────────────────────────
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(forgotEmail);
    setForgotEmailErr(err);
    if (err) return;

    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotSent(true);
    } catch {
      setForgotSent(true); // Never reveal whether email exists
    } finally {
      setForgotLoading(false);
    }
  };

  const switchPanel = (p: Panel) => {
    setPanel(p);
    setError(null);
    setForgotSent(false);
    setForgotEmail("");
    setForgotEmailErr("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Background orbs */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--primary)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "var(--accent)" }}
      />

      <ThemeToggle />

      {/* Header */}
      <div className="flex flex-col items-center mb-8 z-10">
        <div
          className="rounded-2xl p-3.5 mb-4 shadow-lg"
          style={{
            background: "var(--primary)",
            boxShadow: "0 8px 32px color-mix(in srgb, var(--primary) 40%, transparent)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h1
          className="text-4xl font-bold mb-1 tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          LeaveFlow
        </h1>
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          HR Management Portal
        </p>
      </div>

      {/* ── Card ────────────────────────────────────────────────────────── */}
      <div
        className="glass-card rounded-2xl w-full max-w-md z-10 overflow-hidden"
        style={{ minHeight: "320px" }}
      >
        {/* ── Login Panel ─────────────────────────────────────────────── */}
        <div
          className="transition-all duration-300 ease-in-out"
          style={{ display: panel === "login" ? "block" : "none" }}
        >
          {/* Card header */}
          <div
            className="px-8 pt-8 pb-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Welcome back
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSignIn} className="px-8 py-6 flex flex-col gap-5" noValidate>
            {/* Global error */}
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "color-mix(in srgb, var(--destructive) 12%, transparent)",
                  color: "var(--destructive)",
                  border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="auth-email"
                className="text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Work Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailErr) setEmailErr(validateEmail(e.target.value));
                }}
                onBlur={() => setEmailErr(validateEmail(email))}
                placeholder="you@company.com"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                style={{
                  color: "var(--foreground)",
                  boxShadow: emailErr ? "0 0 0 2px var(--destructive)" : undefined,
                }}
                aria-invalid={!!emailErr}
                aria-describedby="email-error"
              />
              {emailErr && (
                <p id="email-error" className="text-xs mt-0.5" style={{ color: "var(--destructive)" }}>
                  {emailErr}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-password"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchPanel("forgot")}
                  className="text-xs font-medium transition-colors hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordErr) setPasswordErr("");
                  }}
                  onBlur={() =>
                    setPasswordErr(password.trim() === "" ? "Password is required" : "")
                  }
                  placeholder="••••••••"
                  className="glass-input w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
                  style={{
                    color: "var(--foreground)",
                    boxShadow: passwordErr ? "0 0 0 2px var(--destructive)" : undefined,
                  }}
                  aria-invalid={!!passwordErr}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordErr && (
                <p id="password-error" className="text-xs mt-0.5" style={{ color: "var(--destructive)" }}>
                  {passwordErr}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-[var(--primary)]"
              />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Remember me for 30 days
              </span>
            </label>

            {/* Sign In button */}
            <button
              id="sign-in-button"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--deepblue))",
                boxShadow: "0 4px 20px color-mix(in srgb, var(--primary) 35%, transparent)",
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Forgot Password Panel ────────────────────────────────────── */}
        <div
          className="transition-all duration-300 ease-in-out"
          style={{ display: panel === "forgot" ? "block" : "none" }}
        >
          <div
            className="px-8 pt-8 pb-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Reset your password
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              We'll send a reset link to your work email
            </p>
          </div>

          <div className="px-8 py-6">
            {forgotSent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: "var(--foreground)" }}>Check your inbox</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    If an account with that email exists, we've sent password reset instructions.
                  </p>
                </div>
                <button
                  onClick={() => switchPanel("login")}
                  className="text-sm font-medium transition-colors hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="forgot-email"
                    className="text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Work Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    autoComplete="email"
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotEmailErr) setForgotEmailErr(validateEmail(e.target.value));
                    }}
                    placeholder="you@company.com"
                    className="glass-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    style={{ color: "var(--foreground)" }}
                  />
                  {forgotEmailErr && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--destructive)" }}>
                      {forgotEmailErr}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--deepblue))",
                    boxShadow: "0 4px 20px color-mix(in srgb, var(--primary) 35%, transparent)",
                  }}
                >
                  {forgotLoading ? (
                    <>
                      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => switchPanel("login")}
                  className="text-sm font-medium transition-colors hover:underline text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  ← Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Help button */}
      <button
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
        aria-label="Help"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
    </div>
  );
}

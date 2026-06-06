import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getStoredUser, clearAuth } from "../hooks/useAuth";
import { ThemeToggle } from "../components/ThemeToggle";
import { useToast } from "../hooks/useToast";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { toast } = useToast();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!currentPassword) e.current = "Current password is required";
    if (newPassword.length < 6) e.new = "Must be at least 6 characters";
    if (newPassword !== confirmPassword) e.confirm = "Passwords do not match";
    if (newPassword === currentPassword)
      e.new = "New password must be different from current password";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setSuccess(true);
      toast("Password changed successfully", "success");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to change password. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Update stored user to clear mustChangePassword flag
    const stored = getStoredUser();
    if (stored) {
      stored.mustChangePassword = false;
      const storage = localStorage.getItem("lf_user") ? localStorage : sessionStorage;
      storage.setItem("lf_user", JSON.stringify(stored));
    }
    const roleMap: Record<string, string> = {
      employee: "/employee/dashboard",
      supervisor: "/supervisor/dashboard",
      admin: "/admin/dashboard",
      super_admin: "/super-admin/dashboard",
    };
    navigate(roleMap[user?.role ?? "employee"] ?? "/employee/dashboard");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Background orb */}
      <div
        className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--primary)" }}
      />

      <ThemeToggle />

      {/* Header */}
      <div className="flex flex-col items-center mb-8 z-10">
        <div
          className="rounded-2xl p-3.5 mb-4"
          style={{
            background: "var(--primary)",
            boxShadow: "0 8px 32px color-mix(in srgb, var(--primary) 40%, transparent)",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-1 tracking-tight" style={{ color: "var(--foreground)" }}>
          LeaveFlow
        </h1>

      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl w-full max-w-md z-10">
        {/* Card Header */}
        <div
          className="px-8 pt-8 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--orange) 15%, transparent)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--orange)" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Set your password
            </h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {user?.name ? `Welcome, ${user.name}! ` : ""}
            Your account requires a new password before you can continue.
          </p>
        </div>

        <div className="px-8 py-6">
          {success ? (
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
                <p className="font-semibold mb-1 text-lg" style={{ color: "var(--foreground)" }}>
                  Password changed!
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Your account is now secured. Click below to go to your dashboard.
                </p>
              </div>
              <button
                onClick={handleContinue}
                className="w-full py-3.5 rounded-xl text-white font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--deepblue))",
                  boxShadow: "0 4px 20px color-mix(in srgb, var(--primary) 35%, transparent)",
                }}
              >
                Go to Dashboard →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cp-current" className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Current (Temporary) Password
                </label>
                <div className="relative">
                  <input
                    id="cp-current"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); if (errors.current) setErrors({ ...errors, current: "" }); }}
                    placeholder="••••••••"
                    className="glass-input w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
                    style={{ color: "var(--foreground)", boxShadow: errors.current ? "0 0 0 2px var(--destructive)" : undefined }}
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "var(--text-muted)" }} aria-label="Toggle visibility">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showCurrent ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
                {errors.current && <p className="text-xs" style={{ color: "var(--destructive)" }}>{errors.current}</p>}
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cp-new" className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="cp-new"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); if (errors.new) setErrors({ ...errors, new: "" }); }}
                    placeholder="At least 6 characters"
                    className="glass-input w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
                    style={{ color: "var(--foreground)", boxShadow: errors.new ? "0 0 0 2px var(--destructive)" : undefined }}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "var(--text-muted)" }} aria-label="Toggle visibility">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showNew ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
                {errors.new && <p className="text-xs" style={{ color: "var(--destructive)" }}>{errors.new}</p>}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cp-confirm" className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Confirm New Password
                </label>
                <input
                  id="cp-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirm) setErrors({ ...errors, confirm: "" }); }}
                  placeholder="••••••••"
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  style={{ color: "var(--foreground)", boxShadow: errors.confirm ? "0 0 0 2px var(--destructive)" : undefined }}
                />
                {errors.confirm && <p className="text-xs" style={{ color: "var(--destructive)" }}>{errors.confirm}</p>}
              </div>

              <button
                id="change-password-button"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-1"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--deepblue))",
                  boxShadow: "0 4px 20px color-mix(in srgb, var(--primary) 35%, transparent)",
                }}
              >
                {loading ? (
                  <><svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Saving…</>
                ) : (
                  "Set New Password"
                )}
              </button>

              <button
                type="button"
                onClick={() => { clearAuth(); navigate("/login"); }}
                className="text-sm text-center transition-colors hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                Sign out and log in with a different account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

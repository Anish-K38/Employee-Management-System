import { useState, useEffect } from "react";
import { X, User as UserIcon, Building2, UserCheck, Mail, Shield, ShieldCheck } from "lucide-react";
import { api } from "../hooks/useAuth";

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: { _id: string; name: string };
  supervisorId?: { _id: string; name: string };
  createdBy?: { _id: string; name: string; role: string };
}

export function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get("/auth/me")
        .then((res) => {
          setProfile(res.data);
        })
        .catch((err) => {
          console.error("Failed to load profile", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <UserIcon size={24} style={{ color: "var(--primary)" }} />
          User Profile
        </h2>

        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Loading profile...
          </div>
        ) : profile ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--deepblue)] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>{profile.name}</h3>
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize mt-1" 
                      style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                  {profile.role.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Email Address</p>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{profile.email}</p>
                </div>
              </div>

              {profile.departmentId && (
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="mt-0.5" style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Department / Team</p>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{profile.departmentId.name}</p>
                  </div>
                </div>
              )}

              {profile.supervisorId && (
                <div className="flex items-start gap-3">
                  <UserCheck size={18} className="mt-0.5" style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Supervisor</p>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{profile.supervisorId.name}</p>
                  </div>
                </div>
              )}

              {profile.createdBy && (
                <div className="flex items-start gap-3">
                  {profile.createdBy.role === "super_admin" ? (
                    <ShieldCheck size={18} className="mt-0.5" style={{ color: "var(--text-secondary)" }} />
                  ) : (
                    <Shield size={18} className="mt-0.5" style={{ color: "var(--text-secondary)" }} />
                  )}
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Created By</p>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {profile.createdBy.name} 
                      <span className="text-xs ml-1 opacity-70">
                        ({profile.createdBy.role?.replace("_", " ") || "Admin"})
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-red-500">
            Failed to load profile data.
          </div>
        )}
      </div>
    </div>
  );
}

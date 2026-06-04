import { useState, useEffect } from "react";
import { api } from "../../hooks/useAuth";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: {
    name: string;
  };
}

export default function SupervisorTeam() {
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await api.get("/users");
        setTeam(data);
      } catch (err) {
        console.error("Failed to fetch team", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading) {
    return <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading team members...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>My Team</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {team.length} direct reportees
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Employee</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Email</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Department</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {team.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No team members assigned to you yet</td>
              </tr>
            ) : (
              team.map((user) => (
                <tr key={user._id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--deepblue)] flex items-center justify-center text-white font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {user.email}
                  </td>
                  <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {user.departmentId?.name || "N/A"}
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider" style={{ 
                      borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)", 
                      color: "var(--primary)",
                      backgroundColor: "color-mix(in srgb, var(--primary) 5%, transparent)"
                    }}>
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

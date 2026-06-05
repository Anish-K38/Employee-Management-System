import { useState, useEffect, useCallback } from "react";
import { api, useAuth } from "../../hooks/useAuth";
import { Users, Plus, Edit2, Trash2, KeyRound, Building2, UserCheck, Search } from "lucide-react";

interface SupervisorItem {
  _id: string;
  name: string;
  email: string;
  departmentId: { _id: string; name: string } | null;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  departmentId: { _id: string; name: string } | null;
  supervisorId: { _id: string; name: string } | null;
}

interface Department {
  _id: string;
  name: string;
}

export default function UserManagement() {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "super_admin";
  const isAdmin = authUser?.role === "admin";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [departmentId, setDepartmentId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  // ── Data fetching ──────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get("/users"),
        api.get("/departments"),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch supervisors scoped to a specific department
  const fetchSupervisors = useCallback(async (deptId: string) => {
    if (!deptId) {
      setSupervisors([]);
      return;
    }
    try {
      const { data } = await api.get(`/users/supervisors?departmentId=${deptId}`);
      setSupervisors(data);
    } catch {
      setSupervisors([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch supervisors whenever the selected department changes in the form
  useEffect(() => {
    if (isModalOpen) {
      fetchSupervisors(departmentId);
      // Clear supervisor selection if department changes
      setSupervisorId("");
    }
  }, [departmentId, isModalOpen, fetchSupervisors]);

  // ── Modal helpers ──────────────────────────────────────────
  const openCreateModal = () => {
    setIsEditing(false);
    setName("");
    setEmail("");
    setRole("employee");
    // Pre-select department if admin (locked to their dept)
    const preDept = isAdmin && authUser?.departmentId ? authUser.departmentId : "";
    setDepartmentId(preDept);
    setSupervisorId("");
    setSubmitError("");
    setTempPassword("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    setIsEditing(true);
    setCurrentId(user._id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setDepartmentId(user.departmentId?._id || "");
    setSupervisorId(user.supervisorId?._id || "");
    setSubmitError("");
    setTempPassword("");
    setIsModalOpen(true);
  };

  // ── Form submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setTempPassword("");

    try {
      const payload = {
        name,
        email,
        role,
        departmentId: departmentId || null,
        supervisorId: supervisorId || null,
      };

      if (isEditing) {
        await api.put(`/users/${currentId}`, payload);
        setIsModalOpen(false);
        fetchData();
      } else {
        const res = await api.post("/users", payload);
        setTempPassword(res.data.temporaryPassword);
        fetchData();
        // Keep modal open so admin can see and copy the temp password
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Failed to save user");
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case "super_admin":  return "bg-purple-100 text-purple-700 border-purple-200";
      case "admin":        return "bg-blue-100 text-blue-700 border-blue-200";
      case "supervisor":   return "bg-orange-100 text-orange-700 border-orange-200";
      default:             return "bg-green-100 text-green-700 border-green-200";
    }
  };

  // Roles the current actor is allowed to assign
  const allowedRoles =
    isSuperAdmin
      ? ["admin", "supervisor", "employee"]
      : isAdmin
      ? ["supervisor", "employee"]
      : [];

  // Show supervisor field only when creating/editing an employee
  const showSupervisorField = role === "employee";

  // Admins are locked to their own department
  const isDeptLocked = isAdmin;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.departmentId?.name.toLowerCase() || "").includes(term)
    );
  });

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading users…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            User Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {isAdmin ? "Manage users in your department" : "Manage all company users"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 text-sm w-64 transition-all focus:w-72"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 shrink-0"
            style={{ background: "var(--primary)" }}
          >
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* ── Users table ─────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border)",
                background: "color-mix(in srgb, var(--primary) 5%, transparent)",
              }}
            >
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Name</th>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Role</th>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Department</th>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Supervisor</th>
              <th className="p-4 text-sm font-semibold text-right" style={{ color: "var(--text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  {searchQuery ? "No users match your search." : "No users found."}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr
                  key={u._id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "var(--foreground)" }}>{u.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getRoleBadgeColor(u.role)}`}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.departmentId ? (
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <Building2 size={13} />
                        {u.departmentId.name}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {u.supervisorId ? (
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <UserCheck size={13} />
                        {u.supervisorId.name}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      title="Edit user"
                    >
                      <Edit2 size={16} />
                    </button>
                    {u._id !== authUser?._id && (
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-red-500 hover:text-red-600"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
              {isEditing ? "Edit User" : "Add New User"}
            </h2>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                {submitError}
              </div>
            )}

            {/* ── Temp password success state ── */}
            {tempPassword ? (
              <div className="mb-6 p-4 rounded-xl border bg-green-50/50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-2">
                  <KeyRound size={18} /> User Created Successfully
                </div>
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                  Share this temporary password securely with the user. They will be required to change it on first login.
                </p>
                <div className="bg-white dark:bg-black/40 p-3 rounded-lg border border-green-200 dark:border-green-700 font-mono text-center text-lg tracking-wider select-all">
                  {tempPassword}
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-4 w-full px-4 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity bg-green-600"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name + Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                    />
                  </div>
                </div>

                {/* Role + Department */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        // Clear supervisor if switching away from employee
                        if (e.target.value !== "employee") setSupervisorId("");
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                    >
                      {allowedRoles.map((r) => (
                        <option key={r} value={r} className="text-black">
                          {r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Department {!isDeptLocked && <span className="text-red-400">*</span>}
                    </label>
                    <select
                      required
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      disabled={isDeptLocked}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                    >
                      <option value="" className="text-black">— Select Department —</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id} className="text-black">{d.name}</option>
                      ))}
                    </select>
                    {isDeptLocked && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        Locked to your department
                      </p>
                    )}
                  </div>
                </div>

                {/* Supervisor — only for employees, scoped to chosen dept */}
                {showSupervisorField && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Supervisor
                      {!departmentId && (
                        <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                          (select a department first)
                        </span>
                      )}
                    </label>
                    <select
                      value={supervisorId}
                      onChange={(e) => setSupervisorId(e.target.value)}
                      disabled={!departmentId}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                    >
                      <option value="" className="text-black">— No Supervisor —</option>
                      {supervisors.map((s) => (
                        <option key={s._id} value={s._id} className="text-black">
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {departmentId && supervisors.length === 0 && (
                      <p className="text-xs mt-1 text-amber-500">
                        No supervisors found in this department. Create a supervisor first.
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ background: "var(--primary)" }}
                  >
                    {isEditing ? "Save Changes" : "Create User"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { api, useAuth } from "../../hooks/useAuth";
import { Users, Plus, Edit2, Trash2, KeyRound } from "lucide-react";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  departmentId: { _id: string; name: string } | null;
  managerId: { _id: string; name: string } | null;
}

interface Department {
  _id: string;
  name: string;
}

export default function UserManagement() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");
  
  const [submitError, setSubmitError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get("/users"),
        api.get("/departments")
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setName("");
    setEmail("");
    setRole("employee");
    // Pre-select department if admin
    setDepartmentId(authUser?.role === "admin" && authUser.departmentId ? authUser.departmentId : "");
    setManagerId("");
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
    setManagerId(user.managerId?._id || "");
    setSubmitError("");
    setTempPassword("");
    setIsModalOpen(true);
  };

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
        managerId: managerId || null
      };

      if (isEditing) {
        await api.put(`/users/${currentId}`, payload);
        setIsModalOpen(false);
        fetchData();
      } else {
        const res = await api.post("/users", payload);
        setTempPassword(res.data.temporaryPassword);
        fetchData();
        // Do not close modal yet so they can see the temp password
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Failed to save user");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case "super_admin": return "bg-purple-100 text-purple-700 border-purple-200";
      case "admin": return "bg-blue-100 text-blue-700 border-blue-200";
      case "supervisor": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-green-100 text-green-700 border-green-200";
    }
  };

  if (loading) return <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>User Management</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {authUser?.role === "admin" ? "Manage users in your department" : "Manage all company users"}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Name</th>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Role</th>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Department</th>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Manager</th>
              <th className="p-4 text-sm font-semibold text-right" style={{ color: "var(--text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
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
                <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{u.departmentId?.name || "-"}</td>
                <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{u.managerId?.name || "-"}</td>
                <td className="p-4 text-right">
                  <button onClick={() => openEditModal(u)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: "var(--text-secondary)" }}>
                    <Edit2 size={16} />
                  </button>
                  {u._id !== authUser?._id && (
                    <button onClick={() => handleDelete(u._id, u.name)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-red-500 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
              {isEditing ? "Edit User" : "Add New User"}
            </h2>
            
            {submitError && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">{submitError}</div>}
            
            {tempPassword ? (
              <div className="mb-6 p-4 rounded-xl border bg-green-50/50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-2">
                  <KeyRound size={18} /> User Created Successfully
                </div>
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                  Please securely share this temporary password with the user. They will be forced to change it on their first login.
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Full Name</label>
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
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address</label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                    >
                      {authUser?.role === "super_admin" && <option value="admin" className="text-black">Admin</option>}
                      <option value="supervisor" className="text-black">Supervisor</option>
                      <option value="employee" className="text-black">Employee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Department</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                      disabled={authUser?.role === "admin"} // Admins can't change department
                    >
                      <option value="" className="text-black">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id} className="text-black">{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Manager / Supervisor (Optional)</label>
                    <select
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                    >
                      <option value="" className="text-black">-- No Manager --</option>
                      {users
                        .filter(u => u.role === "supervisor" || u.role === "admin" || u.role === "super_admin")
                        .map((m) => (
                          <option key={m._id} value={m._id} className="text-black">
                            {m.name} ({m.role.replace("_", " ")})
                          </option>
                      ))}
                    </select>
                  </div>
                </div>
                
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

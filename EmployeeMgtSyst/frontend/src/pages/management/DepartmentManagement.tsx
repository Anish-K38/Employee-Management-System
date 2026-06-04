import { useState, useEffect } from "react";
import { api } from "../../hooks/useAuth";
import { Building2, Plus, Edit2, Trash2 } from "lucide-react";

interface Department {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState("");

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get("/departments");
      setDepartments(data);
    } catch (err: any) {
      setError("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setName("");
    setDescription("");
    setSubmitError("");
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setIsEditing(true);
    setCurrentId(dept._id);
    setName(dept.name);
    setDescription(dept.description);
    setSubmitError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    try {
      if (isEditing) {
        await api.put(`/departments/${currentId}`, { name, description });
      } else {
        await api.post("/departments", { name, description });
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Failed to save department");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${name} department?`)) return;

    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete department");
    }
  };

  if (loading) return <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading departments...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Department Management</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage company departments and teams</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} /> Create Department
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Name</th>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Description</th>
              <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Created At</th>
              <th className="p-4 text-sm font-semibold text-right" style={{ color: "var(--text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No departments found</td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept._id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                        <Building2 size={16} />
                      </div>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{dept.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{dept.description || "-"}</td>
                  <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{new Date(dept.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEditModal(dept)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: "var(--text-secondary)" }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(dept._id, dept.name)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-red-500 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
              {isEditing ? "Edit Department" : "Create Department"}
            </h2>
            {submitError && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">{submitError}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2 min-h-[100px]"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)", outlineColor: "var(--primary)" }}
                  placeholder="Optional description"
                />
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
                  {isEditing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { api, useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { differenceInBusinessDays } from "date-fns";
import { CheckCircle2, XCircle, Clock, Check, X } from "lucide-react";

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  supervisorApproval: string;
  adminApproval: string;
  superAdminApproval: string;
  createdAt: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    role?: string;
    departmentId?: string;
  };
}

export default function LeaveApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Needs Action");
  
  // For modal
  const [actionLeave, setActionLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(null);
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/leaves");
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionLeave || !actionType) return;
    setSubmitting(true);

    try {
      let endpoint = "";
      if (user?.role === "super_admin") endpoint = "superadmin-action";
      else if (user?.role === "admin") endpoint = "admin-action";
      else endpoint = "supervisor-action";

      await api.patch(`/leaves/${actionLeave._id}/${endpoint}`, {
        action: actionType,
        remark: remark || undefined,
      });
      fetchRequests();
      closeModal();
      toast(`Leave request ${actionType} successfully`, "success");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to process leave action", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setActionLeave(null);
    setActionType(null);
    setRemark("");
  };

  const openAction = (leave: LeaveRequest, type: "approved" | "rejected") => {
    setActionLeave(leave);
    setActionType(type);
    setRemark("");
  };

  // Determine if the current user needs to act on this leave
  const needsMyAction = (req: LeaveRequest) => {
    // Prevent seeing own leave in needs action
    if (req.employeeId._id === user?._id) return false;

    if (user?.role === "supervisor" && req.supervisorApproval === "pending" && req.status !== "cancelled") {
      return true;
    }
    if (user?.role === "admin" && req.supervisorApproval !== "pending" && req.supervisorApproval !== "rejected" && req.adminApproval === "pending" && req.status !== "cancelled") {
      return true;
    }
    if (user?.role === "super_admin" && req.adminApproval !== "pending" && req.adminApproval !== "rejected" && req.superAdminApproval === "pending" && req.status !== "cancelled") {
      return true;
    }
    return false;
  };

  const filteredRequests = filter === "Needs Action" 
    ? requests.filter(needsMyAction)
    : requests;

  const getStatusBadge = (status: string, stage: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-green-900/50 text-green-500 bg-green-500/10">
            <CheckCircle2 size={14} /> {stage === "overall" ? "Approved" : "Approved"}
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-red-900/50 text-red-500 bg-red-500/10">
            <XCircle size={14} /> {stage === "overall" ? "Rejected" : "Rejected"}
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-orange-900/50 text-orange-500 bg-orange-500/10">
            <Clock size={14} /> Pending
          </div>
        );
      case "cancelled":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-gray-500/50 text-gray-400 bg-gray-500/10">
            <XCircle size={14} /> Cancelled
          </div>
        );
      case "not_required":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-gray-500/50 text-gray-400 bg-gray-500/10">
            <Check size={14} /> Not Req.
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Leave Approvals</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage leave requests for your team
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 p-1 rounded-full border glass-card" style={{ borderColor: "var(--border)" }}>
          {["Needs Action", "All History"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                filter === f 
                  ? "bg-[var(--primary)] text-white shadow-sm" 
                  : "text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Employee</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Leave Type</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dates & Days</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Overall Status</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Supervisor</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Admin</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Super Admin</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: "var(--text-muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  {filter === "Needs Action" ? "You're all caught up! No leaves require your action." : "No leave requests found."}
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const isActionable = needsMyAction(req);
                const sDate = new Date(req.startDate);
                const eDate = new Date(req.endDate);
                const days = differenceInBusinessDays(eDate, sDate) + 1;

                return (
                  <tr key={req._id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-medium" style={{ color: "var(--foreground)" }}>{req.employeeId?.name || "Unknown"}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{req.employeeId?.email}</div>
                    </td>
                    <td className="p-4 font-medium capitalize" style={{ color: "var(--foreground)" }}>
                      {req.leaveType.replace("_", " ")}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                        {sDate.toLocaleDateString()} &rarr; {eDate.toLocaleDateString()}
                      </div>
                      <div className="text-xs mt-0.5 font-medium" style={{ color: "var(--primary)" }}>{days} working day{days !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(req.status, "overall")}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(req.supervisorApproval, "stage")}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(req.adminApproval, "stage")}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(req.superAdminApproval, "stage")}
                    </td>
                    <td className="p-4 text-right">
                      {isActionable ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openAction(req, "approved")}
                            className="p-1.5 rounded-lg border border-transparent hover:border-green-500/30 hover:bg-green-500/10 text-green-500 transition-all"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => openAction(req, "rejected")}
                            className="p-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-red-500 transition-all"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>No action</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {actionLeave && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2 capitalize" style={{ color: "var(--foreground)" }}>
              {actionType.slice(0, -1)} Leave Request
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Are you sure you want to {actionType.slice(0, -1).toLowerCase()} {actionLeave.employeeId?.name}'s leave request?
            </p>

            <form onSubmit={handleAction}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Remarks (Optional)</label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={`Leave a note about why it's being ${actionType}...`}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    borderColor: "var(--border)", 
                    color: "var(--foreground)", 
                    backgroundColor: "color-mix(in srgb, var(--primary) 2%, transparent)",
                    outlineColor: "var(--primary)" 
                  }}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ 
                    backgroundColor: actionType === "approved" ? "var(--primary)" : "var(--destructive)" 
                  }}
                >
                  {submitting ? "Processing..." : actionType === "approved" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

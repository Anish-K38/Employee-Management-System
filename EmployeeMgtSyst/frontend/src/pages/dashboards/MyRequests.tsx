import { useState, useEffect } from "react";
import { api } from "../../hooks/useAuth";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { CheckCircle2, XCircle, Clock, Ban } from "lucide-react";

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function MyRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/leaves/my");
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

  const handleCancel = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?")) return;
    try {
      await api.patch(`/leaves/${id}/cancel`);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel request");
    }
  };

  const filteredRequests = filter === "All" 
    ? requests 
    : requests.filter(r => r.status.toLowerCase() === filter.toLowerCase());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-green-900/50 text-green-500 bg-green-500/10">
            <CheckCircle2 size={14} /> Approved
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-red-900/50 text-red-500 bg-red-500/10">
            <XCircle size={14} /> Rejected
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
            <Ban size={14} /> Cancelled
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
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>My Requests</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {requests.length} total requests
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 p-1 rounded-full border glass-card" style={{ borderColor: "var(--border)" }}>
          {["All", "Pending", "Approved", "Rejected", "Cancelled"].map(f => (
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
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>ID</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Leave Type</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Duration</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Days</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Reason</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Applied</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</th>
              <th className="p-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: "var(--text-muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No requests found</td>
              </tr>
            ) : (
              filteredRequests.map((req, i) => {
                const days = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;
                return (
                  <tr key={req._id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-sm font-mono" style={{ color: "var(--text-muted)" }}>
                      LR-{(requests.length - i).toString().padStart(3, '0')}
                    </td>
                    <td className="p-4 font-medium capitalize" style={{ color: "var(--foreground)" }}>
                      {req.leaveType.replace("_", " ")} Leave
                    </td>
                    <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {new Date(req.startDate).toISOString().split('T')[0]} &rarr; {new Date(req.endDate).toISOString().split('T')[0]}
                    </td>
                    <td className="p-4 font-medium" style={{ color: "var(--foreground)" }}>
                      {days}d
                    </td>
                    <td className="p-4 text-sm truncate max-w-[150px]" style={{ color: "var(--text-secondary)" }} title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {new Date(req.createdAt).toISOString().split('T')[0]}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="p-4 text-right">
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleCancel(req._id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useDashboardData } from "../../hooks/useDashboardData";
import { api } from "../../hooks/useAuth";
import { CalendarDays, Plus, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { differenceInBusinessDays } from "date-fns";

export default function ApplyLeave() {
  const { data, loading } = useDashboardData(); // Reusing the KPI fetch for balances
  const navigate = useNavigate();

  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    try {
      await api.post("/leaves", {
        leaveType,
        startDate,
        endDate,
        reason,
      });
      navigate("/employee/requests"); // Redirect to requests upon success
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClear = () => {
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setError("");
  };

  // Calculate working days requested
  let workingDays = 0;
  if (startDate && endDate) {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    if (eDate >= sDate) {
      // differenceInBusinessDays returns 0 for same day, so we add 1 if both are weekdays
      workingDays = differenceInBusinessDays(eDate, sDate) + 1;
      // Note: If start date is weekend and end date is weekend, this might need more robust logic,
      // but this works for general cases.
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Apply for Leave</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Submit a new leave request for manager review
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Form Container */}
      <div className="glass-card rounded-2xl p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Leave Type</label>
            <select
              required
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border appearance-none focus:outline-none focus:ring-2"
              style={{ 
                borderColor: "var(--border)", 
                color: leaveType ? "var(--foreground)" : "var(--text-muted)", 
                backgroundColor: "color-mix(in srgb, var(--primary) 2%, transparent)",
                outlineColor: "var(--primary)" 
              }}
            >
              <option value="" disabled className="text-black">Select leave type...</option>
              <option value="annual" className="text-black">Annual Leave</option>
              <option value="sick" className="text-black">Sick Leave</option>
              <option value="casual" className="text-black">Casual Leave</option>
              <option value="maternity" className="text-black">Maternity Leave</option>
              <option value="paternity" className="text-black">Paternity Leave</option>
              <option value="unpaid" className="text-black">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: "var(--border)", 
                    color: startDate ? "var(--foreground)" : "var(--text-muted)", 
                    backgroundColor: "color-mix(in srgb, var(--primary) 2%, transparent)",
                    outlineColor: "var(--primary)" 
                  }}
                />
                <CalendarDays size={18} className="absolute right-4 top-3.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>End Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: "var(--border)", 
                    color: endDate ? "var(--foreground)" : "var(--text-muted)", 
                    backgroundColor: "color-mix(in srgb, var(--primary) 2%, transparent)",
                    outlineColor: "var(--primary)" 
                  }}
                />
                <CalendarDays size={18} className="absolute right-4 top-3.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
          </div>

          {startDate && endDate && workingDays > 0 && (
            <div className="flex items-center gap-2 p-4 rounded-xl border" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)", borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)", color: "var(--primary)" }}>
              <Info size={18} />
              <span className="text-sm font-medium">
                {workingDays} working day{workingDays !== 1 ? 's' : ''} <span className="font-normal opacity-80">of leave requested</span>
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Reason</label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe the reason for your leave..."
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 resize-none"
              style={{ 
                borderColor: "var(--border)", 
                color: "var(--foreground)", 
                backgroundColor: "color-mix(in srgb, var(--primary) 2%, transparent)",
                outlineColor: "var(--primary)" 
              }}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              <Plus size={18} /> {submitLoading ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 rounded-xl font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 border"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Balances Widget */}
      <div className="glass-card rounded-2xl p-6 mt-8">
        <h2 className="text-base font-semibold mb-6" style={{ color: "var(--foreground)" }}>Your Available Balances</h2>
        
        {loading ? (
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading balances...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Annual Leave</span>
              </div>
              <span className="font-semibold" style={{ color: "var(--primary)" }}>{data?.kpis?.annualBalance || 0}d</span>
            </div>
            
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#00cc00" }} />
                <span style={{ color: "var(--text-secondary)" }}>Sick Leave</span>
              </div>
              <span className="font-semibold text-green-500">{data?.kpis?.sickBalance || 0}d</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--orange)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Casual Leave</span>
              </div>
              <span className="font-semibold" style={{ color: "var(--orange)" }}>{data?.kpis?.casualBalance || 0}d</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#8884d8" }} />
                <span style={{ color: "var(--text-secondary)" }}>Unpaid Leave</span>
              </div>
              <span className="font-semibold" style={{ color: "#8884d8" }}>30d</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

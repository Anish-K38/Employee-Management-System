import { useDashboardData } from "../../hooks/useDashboardData";
import { KPICard } from "../../components/dashboard/KPICard";
import LeaveBalancesWidget from "../../components/dashboard/LeaveBalancesWidget";
import { Umbrella, HeartPulse, Clock, FileText } from "lucide-react";

export default function EmployeeDashboard() {
  const { data, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-[var(--primary)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>My Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Your personal leave summary
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Annual Leave Balance"
          value={data.kpis.annualBalance}
          subtitle="Days remaining"
          icon={<Umbrella size={20} />}
          colorTheme="primary"
        />
        <KPICard
          title="Sick Leave Balance"
          value={data.kpis.sickBalance}
          subtitle="Days remaining"
          icon={<HeartPulse size={20} />}
          colorTheme="accent"
        />
        <KPICard
          title="Pending Requests"
          value={data.kpis.pendingRequests}
          subtitle="Awaiting approval"
          icon={<Clock size={20} />}
          colorTheme={data.kpis.pendingRequests > 0 ? "orange" : "primary"}
        />
        <KPICard
          title="Total Taken"
          value={data.kpis.totalTaken}
          subtitle="This year"
          icon={<FileText size={20} />}
          colorTheme="primary"
        />
      </div>

      {/* Leave Balances Widget */}
      <LeaveBalancesWidget leaveBalances={data.kpis.leaveBalances} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>My Leave Usage</h2>
          {(!data.kpis.recentLeaves || data.kpis.recentLeaves.length === 0) ? (
             <div className="h-64 w-full flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>No leaves taken yet</div>
          ) : (
            <div className="h-64 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {data.kpis.recentLeaves.map((leave: any) => (
                <div key={leave._id} className="p-3 rounded-xl border flex flex-col" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--primary) 2%, transparent)" }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold capitalize" style={{ color: "var(--foreground)" }}>{leave.leaveType} Leave</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>Recent Notifications</h2>
          {data.activity.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>No recent notifications</div>
          ) : (
            <div className="space-y-4">
              {data.activity.map((item) => (
                <div key={item._id} className="p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.message}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

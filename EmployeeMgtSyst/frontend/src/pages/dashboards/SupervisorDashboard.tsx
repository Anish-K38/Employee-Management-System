import { useState } from "react";
import { useDashboardData } from "../../hooks/useDashboardData";
import { KPICard } from "../../components/dashboard/KPICard";
import LeaveBalancesWidget from "../../components/dashboard/LeaveBalancesWidget";
import { OnLeaveModal } from "../../components/dashboard/OnLeaveModal";
import { Users, CalendarClock, CalendarDays, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function SupervisorDashboard() {
  const { data, loading, error } = useDashboardData();
  const [isOnLeaveModalOpen, setIsOnLeaveModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-[var(--primary)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-sm" style={{ color: "var(--text-muted)" }}>
        Error loading dashboard: {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Supervisor Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Team availability and approvals — {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Team Members"
          value={data.kpis.teamMembers}
          subtitle="Direct reports"
          icon={<Users size={20} />}
          colorTheme="primary"
        />
        <KPICard
          title="On Leave Today"
          value={data.kpis.onLeaveToday}
          subtitle="Unavailable"
          icon={<CalendarDays size={20} />}
          colorTheme={data.kpis.onLeaveToday > 0 ? "orange" : "accent"}
          onClick={() => setIsOnLeaveModalOpen(true)}
        />
        <KPICard
          title="Pending Review"
          value={data.kpis.pendingReview}
          subtitle="Requires your action"
          icon={<CalendarClock size={20} />}
          colorTheme={data.kpis.pendingReview > 0 ? "destructive" : "primary"}
        />
        <KPICard
          title="Upcoming Leaves"
          value={data.kpis.upcomingLeaves}
          subtitle="Next 7 days"
          icon={<ArrowRight size={20} />}
          colorTheme="primary"
        />
      </div>

      {/* Leave Balances Widget */}
      <LeaveBalancesWidget leaveBalances={data.kpis.leaveBalances} />

      {/* Notifications/Activity could go here. For supervisor, calendar view of upcoming leaves is requested in spec, but for MVP we will just show activity feed */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--foreground)" }}>Team Activity & Notifications</h2>
        {data.activity.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>No recent activity</div>
        ) : (
          <div className="space-y-4">
            {data.activity.map((item) => (
              <div key={item._id} className="flex gap-4 border-b pb-4 last:border-0" style={{ borderColor: "var(--border)" }}>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.message}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OnLeaveModal 
        isOpen={isOnLeaveModalOpen} 
        onClose={() => setIsOnLeaveModalOpen(false)} 
        employees={data.kpis.onLeaveEmployees || []} 
      />
    </div>
  );
}

import { useDashboardData } from "../../hooks/useDashboardData";
import { KPICard } from "../../components/dashboard/KPICard";
import { Users, CalendarClock, UserCheck, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#0088cc", "#00cc00", "#ff9900", "#ff4444", "#0006bc", "#8884d8"];

export default function AdminDashboard() {
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

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Admin Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Department leave management summary — {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Employees"
          value={data.kpis.departmentSize}
          subtitle="In your department"
          icon={<Users size={20} />}
          colorTheme="primary"
        />
        <KPICard
          title="On Leave Today"
          value={data.kpis.onLeaveToday}
          subtitle="Currently out"
          icon={<UserCheck size={20} />}
          colorTheme="accent"
        />
        <KPICard
          title="Pending Approvals"
          value={data.kpis.pendingApprovals}
          subtitle="Awaiting admin action"
          icon={<CalendarClock size={20} />}
          colorTheme={data.kpis.pendingApprovals > 0 ? "orange" : "primary"}
        />
        <KPICard
          title="Rejected"
          value={data.kpis.rejectedThisMonth}
          subtitle="This month"
          icon={<XCircle size={20} />}
          colorTheme="destructive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--foreground)" }}>Monthly Leave Trends</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--border)', opacity: 0.2 }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} 
                />
                <Bar dataKey="count" fill="var(--orange)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>By Leave Type</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={data.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="label"
                >
                  {data.distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center">
            {data.distribution.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs font-medium capitalize" style={{ color: "var(--text-secondary)" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                {entry.label} <span style={{ color: "var(--foreground)" }}>{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

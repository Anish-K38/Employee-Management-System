import { useDashboardData } from "../../hooks/useDashboardData";
import { KPICard } from "../../components/dashboard/KPICard";
import { Users, Building, Activity, CalendarClock } from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";

const PIE_COLORS = ["#0088cc", "#00cc00", "#ff9900", "#ff4444", "#0006bc", "#8884d8"];

export default function SuperAdminDashboard() {
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
      <div className="p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Super Admin Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Global metrics and system health — {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Workforce"
          value={data.kpis.totalWorkforce}
          subtitle="Active employee accounts"
          icon={<Users size={20} />}
          colorTheme="primary"
        />
        <KPICard
          title="Global Leave Rate"
          value={`${data.kpis.globalLeaveRate}%`}
          subtitle="Employees off today"
          icon={<Activity size={20} />}
          colorTheme="accent"
        />
        <KPICard
          title="Pending Actions"
          value={data.kpis.pendingActions}
          subtitle="Stuck > 3 days"
          icon={<CalendarClock size={20} />}
          colorTheme={data.kpis.pendingActions > 5 ? "destructive" : "orange"}
        />
        <KPICard
          title="Departments"
          value={data.kpis.departmentsConfigured}
          subtitle="Active in system"
          icon={<Building size={20} />}
          colorTheme="primary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--foreground)" }}>Global Monthly Trends</h2>
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

        {/* Pie Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>Leave By Department</h2>
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
              <div key={index} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                {entry.label} <span style={{ color: "var(--foreground)" }}>{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>System Activity</h2>
        </div>
        
        {data.activity.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {data.activity.map((item) => (
              <div key={item._id} className="flex gap-4">
                <div className="mt-1 relative">
                  <div className="absolute top-8 bottom-[-16px] left-1/2 -translate-x-1/2 w-px" style={{ background: "var(--border)" }} />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center z-10 relative" style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
                    <Activity size={14} />
                  </div>
                </div>
                <div className="flex-1 pb-4">
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
    </div>
  );
}

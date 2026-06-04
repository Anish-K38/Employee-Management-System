import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  FileText,
  User as UserIcon,
} from "lucide-react";

interface SidebarItem {
  name: string;
  path: string;
  icon: ReactNode;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Define navigation based on role
  let navigation: SidebarItem[] = [];

  if (user.role === "super_admin") {
    navigation = [
      { name: "Dashboard", path: "/super-admin/dashboard", icon: <LayoutDashboard size={20} /> },
      { name: "Departments", path: "/super-admin/departments", icon: <Settings size={20} /> },
      { name: "User Management", path: "/super-admin/users", icon: <Users size={20} /> },
      { name: "All Employees", path: "/super-admin/employees", icon: <Users size={20} /> },
      { name: "Leave Requests", path: "/super-admin/leaves", icon: <CalendarDays size={20} /> },
    ];
  } else if (user.role === "admin") {
    navigation = [
      { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
      { name: "User Management", path: "/admin/users", icon: <Users size={20} /> },
      { name: "Pending Approvals", path: "/admin/approvals", icon: <CalendarDays size={20} /> },
    ];
  } else if (user.role === "supervisor") {
    navigation = [
      { name: "Dashboard", path: "/supervisor/dashboard", icon: <LayoutDashboard size={20} /> },
      { name: "My Team", path: "/supervisor/team", icon: <Users size={20} /> },
      { name: "Team Leave Requests", path: "/supervisor/leaves", icon: <CalendarDays size={20} /> },
    ];
  } else {
    navigation = [
      { name: "Dashboard", path: "/employee/dashboard", icon: <LayoutDashboard size={20} /> },
      { name: "Apply for Leave", path: "/employee/apply", icon: <FileText size={20} /> },
      { name: "My Requests", path: "/employee/requests", icon: <CalendarDays size={20} /> },
    ];
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <div
        className="w-64 flex flex-col justify-between border-r backdrop-blur-xl"
        style={{
          background: "var(--sidebar)",
          borderColor: "var(--border)",
        }}
      >
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--primary)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight" style={{ color: "var(--foreground)" }}>
                LeaveFlow
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div className="p-4 space-y-1">
            <p className="text-xs font-semibold px-4 py-2 uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              {user.role.replace("_", " ")}
            </p>
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "shadow-sm" : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  style={{
                    background: isActive ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
                    color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  }}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl" style={{ background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--deepblue)] flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "var(--destructive)" }}
          >
            <LogOut size={20} />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-8 z-0 relative">
          {/* Subtle background gradients for visual flair */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "var(--primary)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: "var(--accent)" }} />
          
          <div className="max-w-6xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

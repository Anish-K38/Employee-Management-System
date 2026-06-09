import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import { getStoredToken, getStoredUser } from "./hooks/useAuth";

import { DashboardLayout } from "./layouts/DashboardLayout";
import SuperAdminDashboard from "./pages/dashboards/SuperAdminDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import SupervisorDashboard from "./pages/dashboards/SupervisorDashboard";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import ApplyLeave from "./pages/dashboards/ApplyLeave";
import MyRequests from "./pages/dashboards/MyRequests";
import SupervisorTeam from "./pages/dashboards/SupervisorTeam";
import LeaveApprovals from "./pages/dashboards/LeaveApprovals";
import UserManagement from "./pages/management/UserManagement";
import DepartmentManagement from "./pages/management/DepartmentManagement";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = getStoredToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = getStoredToken();
  const user = getStoredUser();
  if (token && user) {
    const roleMap: Record<string, string> = {
      employee: "/employee/dashboard",
      supervisor: "/supervisor/dashboard",
      admin: "/admin/dashboard",
      super_admin: "/super-admin/dashboard",
    };
    return <Navigate to={roleMap[user.role] ?? "/employee/dashboard"} replace />;
  }
  return <>{children}</>;
}



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root — redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public auth routes */}
        <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />

        {/* First-login password change (protected) */}
        <Route path="/change-password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />

        {/* Role-specific dashboards (protected) */}
        <Route path="/employee/dashboard" element={<PrivateRoute><DashboardLayout><EmployeeDashboard /></DashboardLayout></PrivateRoute>} />
        <Route path="/employee/apply" element={<PrivateRoute><DashboardLayout><ApplyLeave /></DashboardLayout></PrivateRoute>} />
        <Route path="/employee/requests" element={<PrivateRoute><DashboardLayout><MyRequests /></DashboardLayout></PrivateRoute>} />
        
        <Route path="/supervisor/dashboard" element={<PrivateRoute><DashboardLayout><SupervisorDashboard /></DashboardLayout></PrivateRoute>} />
        <Route path="/supervisor/team" element={<PrivateRoute><DashboardLayout><SupervisorTeam /></DashboardLayout></PrivateRoute>} />
        <Route path="/supervisor/leaves" element={<PrivateRoute><DashboardLayout><LeaveApprovals /></DashboardLayout></PrivateRoute>} />
        <Route path="/supervisor/apply" element={<PrivateRoute><DashboardLayout><ApplyLeave /></DashboardLayout></PrivateRoute>} />
        <Route path="/supervisor/requests" element={<PrivateRoute><DashboardLayout><MyRequests /></DashboardLayout></PrivateRoute>} />
        
        <Route path="/admin/dashboard" element={<PrivateRoute><DashboardLayout><AdminDashboard /></DashboardLayout></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute><DashboardLayout><UserManagement /></DashboardLayout></PrivateRoute>} />
        <Route path="/admin/approvals" element={<PrivateRoute><DashboardLayout><LeaveApprovals /></DashboardLayout></PrivateRoute>} />
        <Route path="/admin/apply" element={<PrivateRoute><DashboardLayout><ApplyLeave /></DashboardLayout></PrivateRoute>} />
        <Route path="/admin/requests" element={<PrivateRoute><DashboardLayout><MyRequests /></DashboardLayout></PrivateRoute>} />
        
        <Route path="/super-admin/dashboard" element={<PrivateRoute><DashboardLayout><SuperAdminDashboard /></DashboardLayout></PrivateRoute>} />
        <Route path="/super-admin/users" element={<PrivateRoute><DashboardLayout><UserManagement /></DashboardLayout></PrivateRoute>} />
        <Route path="/super-admin/employees" element={<PrivateRoute><DashboardLayout><UserManagement /></DashboardLayout></PrivateRoute>} />
        <Route path="/super-admin/departments" element={<PrivateRoute><DashboardLayout><DepartmentManagement /></DashboardLayout></PrivateRoute>} />
        <Route path="/super-admin/leaves" element={<PrivateRoute><DashboardLayout><LeaveApprovals /></DashboardLayout></PrivateRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

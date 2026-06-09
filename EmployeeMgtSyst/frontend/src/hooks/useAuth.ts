import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "./useToast";

// ─────────────────────────────────────────────────────────────
// Role → dashboard route mapping
// ─────────────────────────────────────────────────────────────
const ROLE_DASHBOARD: Record<string, string> = {
  employee: "/employee/dashboard",
  supervisor: "/supervisor/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/super-admin/dashboard",
};

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  departmentId?: string;
}

const STORAGE_KEY = "lf_token";
const USER_KEY = "lf_user";

// ─────────────────────────────────────────────────────────────
// Persist helpers (localStorage vs sessionStorage based on remember me)
// ─────────────────────────────────────────────────────────────
const getStore = (rememberMe: boolean) =>
  rememberMe ? localStorage : sessionStorage;

export const getStoredToken = (): string | null =>
  localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);

export const getStoredUser = (): AuthUser | null => {
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(STORAGE_KEY);
    s.removeItem(USER_KEY);
  });
};

// ─────────────────────────────────────────────────────────────
// Axios instance — automatically attaches Bearer token
// ─────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─────────────────────────────────────────────────────────────
// useAuth hook
// ─────────────────────────────────────────────────────────────
export function useAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post("/auth/login", {
          email,
          password,
          rememberMe,
        });

        const store = getStore(rememberMe);
        store.setItem(STORAGE_KEY, data.token);
        store.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);

        // Force password change before dashboard access
        if (data.user.mustChangePassword) {
          navigate("/change-password");
          return;
        }

        // Redirect to role-specific dashboard
        const route = ROLE_DASHBOARD[data.user.role] ?? "/employee/dashboard";
        navigate(route);
      } catch (err: any) {
        const errMsg = err.response?.data?.message || "Login failed. Please try again.";
        setError(errMsg);
        toast(errMsg, "error");
      } finally {
        setLoading(false);
      }
    },
    [navigate, toast]
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  return { user, loading, error, setError, login, logout };
}

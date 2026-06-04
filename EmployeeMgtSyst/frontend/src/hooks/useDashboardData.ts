import { useState, useEffect } from "react";
import { api, getStoredUser } from "./useAuth";

export interface DashboardData {
  kpis: any;
  trends: any[];
  distribution: any[];
  activity: any[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const [kpisRes, trendsRes, distRes, activityRes] = await Promise.all([
          api.get("/dashboard/kpis"),
          api.get("/dashboard/trends"),
          api.get("/dashboard/distribution"),
          api.get("/dashboard/activity"),
        ]);

        setData({
          kpis: kpisRes.data,
          trends: trendsRes.data,
          distribution: distRes.data,
          activity: activityRes.data,
        });
      } catch (err: any) {
        console.error("Failed to fetch dashboard data", err);
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?._id]);

  return { data, loading, error };
}

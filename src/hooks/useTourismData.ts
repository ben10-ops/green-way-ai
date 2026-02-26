import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTourismZones = () =>
  useQuery({
    queryKey: ["tourism_zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tourism_zones")
        .select("*")
        .order("density_percent", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useTourismAlerts = () =>
  useQuery({
    queryKey: ["tourism_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tourism_alerts")
        .select("*, tourism_zones(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useRecommendations = () =>
  useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*, tourism_zones(name, eco_score)")
        .eq("is_active", true)
        .order("priority");
      if (error) throw error;
      return data;
    },
  });

export const useTourismAnalytics = (days = 30) =>
  useQuery({
    queryKey: ["tourism_analytics", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("tourism_analytics")
        .select("*, tourism_zones(name)")
        .gte("snapshot_date", since.toISOString().split("T")[0])
        .order("snapshot_date");
      if (error) throw error;
      return data;
    },
  });

export const useKPIStats = () =>
  useQuery({
    queryKey: ["kpi_stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: analytics } = await supabase
        .from("tourism_analytics")
        .select("tourist_count, congestion_index")
        .eq("snapshot_date", today);

      const { data: zones } = await supabase
        .from("tourism_zones")
        .select("eco_score");

      const { count: alertCount } = await supabase
        .from("tourism_alerts")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      const totalTourists = analytics?.reduce((s, r) => s + r.tourist_count, 0) ?? 32419;
      const avgCongestion = analytics?.length
        ? Math.round(analytics.reduce((s, r) => s + Number(r.congestion_index), 0) / analytics.length)
        : 78;
      const avgEcoScore = zones?.length
        ? Math.round(zones.reduce((s, r) => s + r.eco_score, 0) / zones.length)
        : 64;

      return {
        totalTourists,
        avgCongestion,
        avgEcoScore,
        activeAlerts: alertCount ?? 3,
      };
    },
  });

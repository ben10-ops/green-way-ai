import { Users, TrendingUp, Leaf, AlertTriangle } from "lucide-react";
import KPICard from "@/components/KPICard";
import { CongestionChart, SeasonalChart } from "@/components/Charts";
import HeatmapPanel from "@/components/HeatmapPanel";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import ESIGauge from "@/components/ESIGauge";
import TouristClustering from "@/components/TouristClustering";
import AlertsPanel from "@/components/AlertsPanel";
import Navbar from "@/components/Navbar";
import TourismMap from "@/components/TourismMap";
import { useKPIStats } from "@/hooks/useTourismData";

const Dashboard = () => {
  const { data: kpi } = useKPIStats();

  const kpis = [
    {
      title: "Total Tourists Today",
      value: kpi ? kpi.totalTourists.toLocaleString() : "—",
      change: 12,
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Congestion Index",
      value: kpi ? `${kpi.avgCongestion}%` : "—",
      change: 8,
      icon: TrendingUp,
      color: "warning" as const,
    },
    {
      title: "Avg Eco Score",
      value: kpi ? String(kpi.avgEcoScore) : "—",
      change: 5,
      icon: Leaf,
      color: "success" as const,
    },
    {
      title: "Active Alerts",
      value: kpi ? String(kpi.activeAlerts) : "—",
      change: -2,
      icon: AlertTriangle,
      color: "destructive" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Policy Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered insights for sustainable tourism planning</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((k) => (
            <KPICard key={k.title} {...k} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <CongestionChart />
          <SeasonalChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <ESIGauge />
          <TouristClustering />
          <AlertsPanel />
        </div>

        <div className="grid grid-cols-1 gap-5 mb-5">
          <TourismMap />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <HeatmapPanel />
          <RecommendationsPanel />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

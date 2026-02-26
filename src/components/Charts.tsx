import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { useTourismAnalytics } from "@/hooks/useTourismData";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const customTooltipStyle = {
  backgroundColor: "hsl(220 18% 10%)",
  border: "1px solid hsl(220 15% 20%)",
  borderRadius: "8px",
  color: "hsl(210 20% 92%)",
  fontSize: "12px",
  fontFamily: "JetBrains Mono",
};

export const CongestionChart = () => {
  const { data: analytics, isLoading } = useTourismAnalytics(7);

  const chartData = (analytics ?? []).reduce<Record<string, { day: string; actual: number; predicted: number }>>((acc, row) => {
    const day = format(new Date(row.snapshot_date), "EEE");
    if (!acc[row.snapshot_date]) {
      acc[row.snapshot_date] = { day, actual: 0, predicted: 0 };
    }
    acc[row.snapshot_date].actual += row.tourist_count;
    acc[row.snapshot_date].predicted += row.predicted_count;
    return acc;
  }, {});

  const data = Object.values(chartData);

  if (isLoading) return <div className="glass-card rounded-xl p-6"><Skeleton className="h-[280px]" /></div>;

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-foreground font-semibold text-lg mb-1">Congestion Prediction</h3>
      <p className="text-muted-foreground text-sm mb-6">Actual vs predicted tourist volume (last 7 days)</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(175 80% 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(175 80% 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(30 95% 55%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(30 95% 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
          <XAxis dataKey="day" stroke="hsl(215 15% 55%)" fontSize={12} fontFamily="JetBrains Mono" />
          <YAxis stroke="hsl(215 15% 55%)" fontSize={12} fontFamily="JetBrains Mono" />
          <Tooltip contentStyle={customTooltipStyle} />
          <Area type="monotone" dataKey="actual" stroke="hsl(175 80% 50%)" fill="url(#actualGrad)" strokeWidth={2} name="Actual" />
          <Area type="monotone" dataKey="predicted" stroke="hsl(30 95% 55%)" fill="url(#predictedGrad)" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
          <Legend iconType="line" wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SeasonalChart = () => {
  const { data: analytics, isLoading } = useTourismAnalytics(30);

  const monthMap = (analytics ?? []).reduce<Record<string, { month: string; tourists: number; stress: number; count: number }>>(
    (acc, row) => {
      const month = format(new Date(row.snapshot_date), "MMM");
      if (!acc[month]) acc[month] = { month, tourists: 0, stress: 0, count: 0 };
      acc[month].tourists += row.tourist_count;
      acc[month].stress += Number(row.environmental_stress);
      acc[month].count += 1;
      return acc;
    },
    {}
  );

  const data = Object.values(monthMap).map((m) => ({
    month: m.month,
    tourists: m.tourists,
    stress: Math.round(m.stress / m.count),
  }));

  if (isLoading) return <div className="glass-card rounded-xl p-6"><Skeleton className="h-[280px]" /></div>;

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-foreground font-semibold text-lg mb-1">Seasonal Analysis</h3>
      <p className="text-muted-foreground text-sm mb-6">Monthly tourist volume & environmental stress</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
          <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={11} fontFamily="JetBrains Mono" />
          <YAxis yAxisId="left" stroke="hsl(215 15% 55%)" fontSize={11} fontFamily="JetBrains Mono" />
          <YAxis yAxisId="right" orientation="right" stroke="hsl(215 15% 55%)" fontSize={11} fontFamily="JetBrains Mono" />
          <Tooltip contentStyle={customTooltipStyle} />
          <Bar yAxisId="left" dataKey="tourists" fill="hsl(175 80% 50%)" radius={[4, 4, 0, 0]} opacity={0.8} name="Tourists" />
          <Bar yAxisId="right" dataKey="stress" fill="hsl(30 95% 55%)" radius={[4, 4, 0, 0]} opacity={0.7} name="Stress %" />
          <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

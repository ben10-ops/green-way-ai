import { useTourismZones } from "@/hooks/useTourismData";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  moderate: "bg-primary/20 text-primary border-primary/30",
  low: "bg-success/20 text-success border-success/30",
};

const statusDots = {
  critical: "bg-destructive animate-pulse",
  high: "bg-warning animate-pulse-slow",
  moderate: "bg-primary",
  low: "bg-success",
};

const blobColors = {
  critical: "hsl(0 75% 55%)",
  high: "hsl(30 95% 55%)",
  moderate: "hsl(175 80% 50%)",
  low: "hsl(145 65% 45%)",
};

const HeatmapPanel = () => {
  const { data: zones, isLoading } = useTourismZones();

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-foreground font-semibold text-lg mb-1">GIS Density Heatmap</h3>
      <p className="text-muted-foreground text-sm mb-5">Real-time tourist density by zone</p>

      {/* Simulated map */}
      <div className="relative bg-muted/30 rounded-lg border border-border/50 p-4 mb-5 h-48 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        {(zones ?? []).map((z, i) => {
          const x = 10 + (i % 4) * 23;
          const y = 15 + Math.floor(i / 4) * 50;
          const size = 8 + (z.density_percent / 100) * 24;
          return (
            <div
              key={z.id}
              className="absolute rounded-full opacity-60 blur-sm"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: blobColors[z.status as keyof typeof blobColors] ?? blobColors.low,
              }}
            />
          );
        })}
        <span className="absolute bottom-2 right-3 text-muted-foreground/50 text-xs font-mono">Simulated GIS View</span>
      </div>

      <div className="space-y-2.5 max-h-64 overflow-y-auto">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
          : (zones ?? []).map((z) => {
              const s = z.status as keyof typeof statusColors;
              return (
                <div key={z.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusDots[s]}`} />
                    <div>
                      <span className="text-foreground text-sm font-medium">{z.name}</span>
                      <span className="text-muted-foreground text-xs block font-mono">
                        {z.latitude}°N, {z.longitude}°E
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${z.density_percent}%`, backgroundColor: blobColors[s] }}
                      />
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusColors[s]}`}>
                      {z.density_percent}%
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default HeatmapPanel;

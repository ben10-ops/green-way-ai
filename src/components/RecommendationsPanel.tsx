import { Leaf } from "lucide-react";
import { useRecommendations } from "@/hooks/useTourismData";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons: Record<string, string> = {
  economic: "💰",
  regulatory: "📋",
  marketing: "📣",
  infrastructure: "🏗️",
  technology: "🤖",
  general: "🌿",
};

const RecommendationsPanel = () => {
  const { data: recs, isLoading } = useRecommendations();

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-foreground font-semibold text-lg mb-1">Sustainable Recommendations</h3>
      <p className="text-muted-foreground text-sm mb-5">AI-powered eco-friendly policy actions</p>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
          : (recs ?? []).map((r) => {
              const ecoScore = r.tourism_zones?.eco_score ?? 85;
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-lg bg-muted/20 border border-border/30 hover:border-success/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center text-base">
                        {categoryIcons[r.category] ?? "🌿"}
                      </div>
                      <div>
                        <span className="text-foreground font-medium text-sm">{r.title}</span>
                        <span className="text-muted-foreground text-xs block">
                          {r.tourism_zones?.name ?? "All Zones"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-success/10 border border-success/20">
                      <Leaf className="w-3 h-3 text-success" />
                      <span className="text-success text-xs font-mono font-semibold">{ecoScore}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs pl-12">{r.description}</p>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default RecommendationsPanel;

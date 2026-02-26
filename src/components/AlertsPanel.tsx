import { AlertTriangle, Bell, Info } from "lucide-react";
import { useTourismAlerts } from "@/hooks/useTourismData";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const severityStyles = {
  critical: "border-destructive/30 bg-destructive/5",
  warning: "border-warning/30 bg-warning/5",
  info: "border-primary/20 bg-primary/5",
};

const iconStyles = {
  critical: "text-destructive",
  warning: "text-warning",
  info: "text-primary",
};

const SeverityIcon = ({ severity }: { severity: string }) => {
  if (severity === "critical") return <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${iconStyles.critical}`} />;
  if (severity === "warning") return <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${iconStyles.warning}`} />;
  return <Info className={`w-4 h-4 mt-0.5 shrink-0 ${iconStyles.info}`} />;
};

const AlertsPanel = () => {
  const { data: alerts, isLoading } = useTourismAlerts();

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-foreground font-semibold text-lg mb-1">Smart Alerts</h3>
      <p className="text-muted-foreground text-sm mb-5">Live tourism pressure signals</p>
      <div className="space-y-2.5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
          : (alerts ?? []).map((a) => {
              const sev = a.severity as "critical" | "warning" | "info";
              return (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${severityStyles[sev]}`}>
                  <SeverityIcon severity={sev} />
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground text-sm font-medium block">{a.title}</span>
                    <span className="text-muted-foreground text-xs">{a.message}</span>
                  </div>
                  <span className="text-muted-foreground text-xs font-mono whitespace-nowrap">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default AlertsPanel;

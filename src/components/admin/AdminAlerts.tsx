import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";

type Alert = {
  id: string;
  title: string;
  message: string;
  severity: string;
  is_active: boolean;
  zone_id: string | null;
  tourism_zones?: { name: string } | null;
};

const severityColor: Record<string, string> = {
  info: "bg-primary/10 text-primary border-primary/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function AdminAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["tourism_alerts_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tourism_alerts")
        .select("*, tourism_zones(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Alert[];
    },
  });

  const { data: zones } = useQuery({
    queryKey: ["tourism_zones_simple"],
    queryFn: async () => {
      const { data } = await supabase.from("tourism_zones").select("id, name").order("name");
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; message: string; severity: string; zone_id: string | null }) => {
      const { error } = await supabase.from("tourism_alerts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tourism_alerts_all"] });
      queryClient.invalidateQueries({ queryKey: ["tourism_alerts"] });
      queryClient.invalidateQueries({ queryKey: ["kpi_stats"] });
      toast({ title: "Alert created" });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("tourism_alerts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tourism_alerts_all"] });
      queryClient.invalidateQueries({ queryKey: ["tourism_alerts"] });
      queryClient.invalidateQueries({ queryKey: ["kpi_stats"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tourism_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tourism_alerts_all"] });
      queryClient.invalidateQueries({ queryKey: ["tourism_alerts"] });
      queryClient.invalidateQueries({ queryKey: ["kpi_stats"] });
      toast({ title: "Alert deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const zone_id = fd.get("zone_id") as string;
    createMutation.mutate({
      title: fd.get("title") as string,
      message: fd.get("message") as string,
      severity: fd.get("severity") as string,
      zone_id: zone_id === "none" ? null : zone_id,
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Alert</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Alert</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Alert title" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" placeholder="Describe the alert..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Severity</Label>
                  <Select name="severity" defaultValue="info">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Zone (optional)</Label>
                  <Select name="zone_id" defaultValue="none">
                    <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No zone</SelectItem>
                      {zones?.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Alert
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {alerts?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No alerts yet.</div>
        )}
        {alerts?.map((alert) => (
          <Card key={alert.id} className={`border-border/50 ${!alert.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground text-sm">{alert.title}</span>
                  <Badge variant="outline" className={`text-xs ${severityColor[alert.severity] || ""}`}>{alert.severity}</Badge>
                  {!alert.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                {alert.tourism_zones && <span className="text-xs text-muted-foreground">Zone: {alert.tourism_zones.name}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: alert.id, is_active: !alert.is_active })}
                  disabled={toggleMutation.isPending}
                >
                  {alert.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate(alert.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Loader2 } from "lucide-react";

type Zone = {
  id: string;
  name: string;
  density_percent: number;
  eco_score: number;
  status: string;
  infrastructure_capacity: number;
  latitude: number;
  longitude: number;
};

const statusColor: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
  critical: "bg-destructive/20 text-destructive border-destructive/50",
};

export default function AdminZones() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Zone | null>(null);
  const [open, setOpen] = useState(false);

  const { data: zones, isLoading } = useQuery({
    queryKey: ["tourism_zones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tourism_zones").select("*").order("name");
      if (error) throw error;
      return data as Zone[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (zone: Partial<Zone> & { id: string }) => {
      const { error } = await supabase.from("tourism_zones").update(zone).eq("id", zone.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tourism_zones"] });
      queryClient.invalidateQueries({ queryKey: ["kpi_stats"] });
      toast({ title: "Zone updated successfully" });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editing.id,
      density_percent: Number(fd.get("density_percent")),
      eco_score: Number(fd.get("eco_score")),
      infrastructure_capacity: Number(fd.get("infrastructure_capacity")),
      status: fd.get("status") as string,
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      {zones?.map((zone) => (
        <Card key={zone.id} className="border-border/50">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground text-sm">{zone.name}</span>
                <Badge variant="outline" className={`text-xs ${statusColor[zone.status] || ""}`}>{zone.status}</Badge>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>Density: <span className="text-foreground font-medium">{zone.density_percent}%</span></span>
                <span>Eco Score: <span className="text-foreground font-medium">{zone.eco_score}</span></span>
                <span>Capacity: <span className="text-foreground font-medium">{zone.infrastructure_capacity}</span></span>
              </div>
            </div>
            <Dialog open={open && editing?.id === zone.id} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => { setEditing(zone); setOpen(true); }}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Zone: {zone.name}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="density_percent">Density %</Label>
                      <Input id="density_percent" name="density_percent" type="number" min={0} max={100} defaultValue={zone.density_percent} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="eco_score">Eco Score</Label>
                      <Input id="eco_score" name="eco_score" type="number" min={0} max={100} defaultValue={zone.eco_score} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="infrastructure_capacity">Capacity</Label>
                      <Input id="infrastructure_capacity" name="infrastructure_capacity" type="number" min={0} defaultValue={zone.infrastructure_capacity} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={zone.status}>
                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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
import { Plus, Trash2, Loader2, Lightbulb } from "lucide-react";

type Rec = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  is_active: boolean;
  zone_id: string | null;
  tourism_zones?: { name: string } | null;
};

const categoryColor: Record<string, string> = {
  general: "bg-muted/50 text-muted-foreground",
  transport: "bg-primary/10 text-primary",
  capacity: "bg-warning/10 text-warning",
  environment: "bg-success/10 text-success",
  safety: "bg-destructive/10 text-destructive",
};

export default function AdminRecommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: recs, isLoading } = useQuery({
    queryKey: ["recommendations_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*, tourism_zones(name)")
        .order("priority");
      if (error) throw error;
      return data as Rec[];
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
    mutationFn: async (payload: { title: string; description: string; category: string; priority: number; zone_id: string | null }) => {
      const { error } = await supabase.from("recommendations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations_all"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast({ title: "Recommendation created" });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("recommendations").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations_all"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recommendations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations_all"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast({ title: "Recommendation deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const zone_id = fd.get("zone_id") as string;
    createMutation.mutate({
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      category: fd.get("category") as string,
      priority: Number(fd.get("priority")),
      zone_id: zone_id === "none" ? null : zone_id,
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Recommendation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Recommendation</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Recommendation title" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Describe the recommendation..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select name="category" defaultValue="general">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="capacity">Capacity</SelectItem>
                      <SelectItem value="environment">Environment</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority (1=highest)</Label>
                  <Input id="priority" name="priority" type="number" min={1} max={100} defaultValue={5} required />
                </div>
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
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Recommendation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {recs?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No recommendations yet.</div>
        )}
        {recs?.map((rec) => (
          <Card key={rec.id} className={`border-border/50 ${!rec.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Lightbulb className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground text-sm">{rec.title}</span>
                  <Badge variant="outline" className={`text-xs ${categoryColor[rec.category] || ""}`}>{rec.category}</Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">P{rec.priority}</Badge>
                  {!rec.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.description}</p>
                {rec.tourism_zones && <span className="text-xs text-muted-foreground">Zone: {rec.tourism_zones.name}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: rec.id, is_active: !rec.is_active })}
                  disabled={toggleMutation.isPending}
                >
                  {rec.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate(rec.id)}
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

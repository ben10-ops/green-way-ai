import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminZones from "@/components/admin/AdminZones";
import AdminAlerts from "@/components/admin/AdminAlerts";
import AdminRecommendations from "@/components/admin/AdminRecommendations";
import { Shield } from "lucide-react";

const Admin = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (userRole !== "admin" && userRole !== "policymaker") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground text-sm">You don't have permission to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage tourism zones, alerts, and recommendations</p>
        </div>

        <Tabs defaultValue="zones">
          <TabsList className="mb-6">
            <TabsTrigger value="zones">Tourism Zones</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          <TabsContent value="zones"><AdminZones /></TabsContent>
          <TabsContent value="alerts"><AdminAlerts /></TabsContent>
          <TabsContent value="recommendations"><AdminRecommendations /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

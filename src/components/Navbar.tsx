import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Home, Leaf, LogIn, LogOut, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    ...(userRole === "admin" || userRole === "policymaker"
      ? [{ to: "/admin", label: "Admin", icon: Shield }]
      : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-foreground text-sm tracking-tight">
            SmartTourism<span className="text-primary">.AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            );
          })}

          {user ? (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/20">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground font-medium max-w-[100px] truncate">
                  {profile?.display_name || user.email?.split("@")[0]}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

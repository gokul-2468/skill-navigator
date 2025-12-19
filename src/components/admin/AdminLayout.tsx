import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: FileQuestion, label: "Questions", path: "/admin/questions" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/");
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: typeof LayoutDashboard; label: string; path: string }) => {
    const isActive = location.pathname === path;
    
    return (
      <button
        onClick={() => {
          navigate(path);
          setMobileMenuOpen(false);
        }}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent group",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
        )}
      >
        <Icon className={cn("w-5 h-5", isActive && "animate-scale-in")} />
        {(sidebarOpen || mobileMenuOpen) && (
          <span className="font-medium animate-fade-in">{label}</span>
        )}
        {isActive && (sidebarOpen || mobileMenuOpen) && (
          <ChevronRight className="w-4 h-4 ml-auto animate-slide-in-right" />
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300",
          "bg-sidebar border-r border-sidebar-border",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="font-display font-bold text-sidebar-foreground">EduAdmin</h1>
              <p className="text-xs text-sidebar-foreground/60">Management Portal</p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-medium hover:scale-110 transition-transform"
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold">EduAdmin</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-card border-b border-border p-4 space-y-2 animate-fade-in">
            {navItems.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          "lg:ml-64",
          !sidebarOpen && "lg:ml-20",
          "pt-20 lg:pt-0"
        )}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
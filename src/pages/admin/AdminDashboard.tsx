import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileQuestion, ClipboardCheck, TrendingUp, Activity, Clock } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUsers: number;
  totalQuestions: number;
  totalTests: number;
  avgAccuracy: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalQuestions: 0,
    totalTests: 0,
    avgAccuracy: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);

      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch questions count
      const { count: questionsCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });

      // Fetch test results
      const { data: testResults, count: testsCount } = await supabase
        .from("test_results")
        .select("*", { count: "exact" });

      // Calculate average accuracy
      const avgAccuracy = testResults?.length
        ? testResults.reduce((acc, t) => acc + Number(t.accuracy), 0) / testResults.length
        : 0;

      setStats({
        totalUsers: usersCount || 0,
        totalQuestions: questionsCount || 0,
        totalTests: testsCount || 0,
        avgAccuracy: Math.round(avgAccuracy),
      });

      // Fetch recent activity
      const { data: recentTests } = await supabase
        .from("test_results")
        .select("*, profiles!inner(name, email)")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity(recentTests || []);
      setIsLoading(false);
    };

    if (isAdmin) {
      fetchStats();

      // Subscribe to realtime updates
      const channel = supabase
        .channel("admin-stats")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchStats)
        .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, fetchStats)
        .on("postgres_changes", { event: "*", schema: "public", table: "test_results" }, fetchStats)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin panel. Here's an overview of your platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            trend={{ value: 12, isPositive: true }}
            color="primary"
          />
          <StatsCard
            title="Questions"
            value={stats.totalQuestions}
            icon={<FileQuestion className="w-6 h-6" />}
            trend={{ value: 8, isPositive: true }}
            color="success"
          />
          <StatsCard
            title="Tests Taken"
            value={stats.totalTests}
            icon={<ClipboardCheck className="w-6 h-6" />}
            trend={{ value: 15, isPositive: true }}
            color="warning"
          />
          <StatsCard
            title="Avg Accuracy"
            value={`${stats.avgAccuracy}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            trend={{ value: 3, isPositive: true }}
            color="info"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live updates
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {activity.profiles?.name || activity.profiles?.email || "User"} completed a test
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.category} • Score: {activity.score}/{activity.total_questions} ({activity.accuracy}%)
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate("/admin/questions")}
            className="group p-6 rounded-xl border bg-card hover:shadow-medium transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileQuestion className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold mb-2">Manage Questions</h3>
            <p className="text-sm text-muted-foreground">Add, edit, or remove questions from the question bank</p>
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="group p-6 rounded-xl border bg-card hover:shadow-medium transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-display font-semibold mb-2">User Management</h3>
            <p className="text-sm text-muted-foreground">View users, manage roles, and access permissions</p>
          </button>

          <button
            onClick={() => navigate("/admin/analytics")}
            className="group p-6 rounded-xl border bg-card hover:shadow-medium transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <h3 className="font-display font-semibold mb-2">View Analytics</h3>
            <p className="text-sm text-muted-foreground">Explore detailed analytics and performance metrics</p>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
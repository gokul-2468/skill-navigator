import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award, 
  LogOut, 
  PlayCircle,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { getLatestTestResult } from "@/lib/testResults";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResults, setHasResults] = useState(false);
  const [testCount, setTestCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUser(session.user);

      // Check for test results in database
      try {
        const result = await getLatestTestResult(session.user.id);
        setHasResults(!!result);
        
        // Count total tests
        const { count } = await supabase
          .from("test_results")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("category", "Overall");
        setTestCount(count || 0);
      } catch (error) {
        console.error("Error fetching results:", error);
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card shadow-soft border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">Skill Gap Analyzer</span>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {userName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to assess your skills and identify areas for improvement?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Start Test Card */}
          <Card className="shadow-soft border-0 hover:shadow-glow transition-shadow duration-300 cursor-pointer group"
                onClick={() => navigate("/test")}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">Start Diagnostic Test</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Take a comprehensive assessment to identify your skill gaps
                  </p>
                  <Button className="mt-4" size="sm">
                    Begin Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Results Card */}
          <Card className={`shadow-soft border-0 transition-shadow duration-300 ${hasResults ? 'hover:shadow-glow cursor-pointer' : 'opacity-60'}`}
                onClick={() => hasResults && navigate("/results")}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">View Results</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {hasResults 
                      ? "Review your assessment results and recommendations"
                      : "Complete a test first to see your results"
                    }
                  </p>
                  <Button variant="outline" className="mt-4" size="sm" disabled={!hasResults}>
                    View Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <h2 className="text-xl font-semibold text-foreground mb-4">Your Progress</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{testCount}</p>
                  <p className="text-sm text-muted-foreground">Tests Taken</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">~10</p>
                  <p className="text-sm text-muted-foreground">Min per Test</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">15</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-sm text-muted-foreground">Skill Areas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8 shadow-soft border-0 bg-accent/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-2">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. Take the diagnostic test with multiple choice questions</li>
              <li>2. Get instant results showing your strong and weak areas</li>
              <li>3. Receive personalized recommendations for improvement</li>
              <li>4. Track your progress over time with retakes</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;

// Results Page - src/pages/Results.tsx
// Shows test results with strong/weak areas visualization

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from "lucide-react";

// Type for category results
interface CategoryResult {
  correct: number;
  total: number;
}

// Type for all results
interface TestResults {
  totalScore: number;
  totalCorrect: number;
  totalQuestions: number;
  categoryResults: Record<string, CategoryResult>;
  date: string;
}

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResults | null>(null);

  // Load results when page loads
  useEffect(() => {
    const savedResults = localStorage.getItem("testResults");
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    } else {
      // No results found, redirect to dashboard
      navigate("/dashboard");
    }
  }, [navigate]);

  // Show loading while data loads
  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  // Calculate which areas are strong and weak
  const categoryData = Object.entries(results.categoryResults).map(([name, data]) => {
    const percentage = Math.round((data.correct / data.total) * 100);
    return {
      name,
      correct: data.correct,
      total: data.total,
      percentage,
      isStrong: percentage >= 70,
      isWeak: percentage < 50
    };
  });

  // Sort by percentage (weak areas first)
  const sortedCategories = [...categoryData].sort((a, b) => a.percentage - b.percentage);
  const strongAreas = categoryData.filter(c => c.isStrong);
  const weakAreas = categoryData.filter(c => c.isWeak);
  const averageAreas = categoryData.filter(c => !c.isStrong && !c.isWeak);

  // Get score color based on performance
  const getScoreColor = () => {
    if (results.totalScore >= 70) return "text-success";
    if (results.totalScore >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">Your Results</h1>
                <p className="text-sm text-muted-foreground">
                  {new Date(results.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Score Card */}
        <Card className="shadow-soft border-0 mb-8 animate-fade-in">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-4">
              <Trophy className={`w-10 h-10 ${getScoreColor()}`} />
            </div>
            <h2 className="text-4xl font-bold mb-2">
              <span className={getScoreColor()}>{results.totalScore}%</span>
            </h2>
            <p className="text-muted-foreground">
              You answered {results.totalCorrect} out of {results.totalQuestions} questions correctly
            </p>
            
            {/* Performance Message */}
            <div className={`mt-4 p-4 rounded-xl ${
              results.totalScore >= 70 
                ? "bg-success/10 text-success" 
                : results.totalScore >= 50 
                ? "bg-warning/10 text-warning"
                : "bg-destructive/10 text-destructive"
            }`}>
              {results.totalScore >= 70 && "Great job! You have a solid foundation."}
              {results.totalScore >= 50 && results.totalScore < 70 && "Good effort! There's room for improvement."}
              {results.totalScore < 50 && "Keep practicing! Focus on the weak areas below."}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Weak Areas */}
          <Card className="shadow-soft border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weakAreas.length > 0 ? (
                <div className="space-y-4">
                  {weakAreas.map((area) => (
                    <div key={area.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{area.name}</span>
                        <span className="text-sm text-destructive font-medium">{area.percentage}%</span>
                      </div>
                      <Progress value={area.percentage} className="h-2 bg-destructive/20" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {area.correct}/{area.total} correct
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No weak areas identified. Great work!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Strong Areas */}
          <Card className="shadow-soft border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-success" />
                Strong Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strongAreas.length > 0 ? (
                <div className="space-y-4">
                  {strongAreas.map((area) => (
                    <div key={area.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{area.name}</span>
                        <span className="text-sm text-success font-medium">{area.percentage}%</span>
                      </div>
                      <Progress value={area.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {area.correct}/{area.total} correct
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Keep practicing to build strong areas!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Categories Overview */}
        <Card className="shadow-soft border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Detailed Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedCategories.map((area) => (
                <div key={area.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-foreground">{area.name}</span>
                      <span className={`font-medium ${
                        area.isStrong ? "text-success" : area.isWeak ? "text-destructive" : "text-warning"
                      }`}>
                        {area.percentage}%
                      </span>
                    </div>
                    <Progress 
                      value={area.percentage} 
                      className={`h-3 ${
                        area.isStrong ? "bg-success/20" : area.isWeak ? "bg-destructive/20" : "bg-warning/20"
                      }`} 
                    />
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    area.isStrong 
                      ? "bg-success/10 text-success" 
                      : area.isWeak 
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  }`}>
                    {area.correct}/{area.total}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="shadow-soft border-0 bg-accent/30">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {weakAreas.map((area) => (
                <li key={area.name} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning mt-2" />
                  <span className="text-foreground">
                    Focus on <strong>{area.name}</strong> - Review fundamental concepts and practice more exercises in this area.
                  </span>
                </li>
              ))}
              {averageAreas.map((area) => (
                <li key={area.name} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <span className="text-foreground">
                    Good progress in <strong>{area.name}</strong> - A bit more practice will help solidify your understanding.
                  </span>
                </li>
              ))}
              {strongAreas.length > 0 && (
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-success mt-2" />
                  <span className="text-foreground">
                    Keep up the great work in your strong areas and consider helping others learn these topics!
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button onClick={() => navigate("/test")} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Test
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Results;

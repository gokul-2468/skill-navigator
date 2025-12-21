import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TestResultWithUser {
  id: string;
  user_id: string;
  category: string;
  score: number;
  total_questions: number;
  accuracy: number;
  weak_topics: string[] | null;
  strong_topics: string[] | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export const useTestResults = () => {
  const [testResults, setTestResults] = useState<TestResultWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTestResults = async () => {
    setIsLoading(true);

    // Fetch test results with user profiles
    const { data: results, error } = await supabase
      .from("test_results")
      .select(`
        *,
        profiles!inner(name, email)
      `)
      .eq("category", "Overall")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching test results:", error);
      setIsLoading(false);
      return;
    }

    const formattedResults: TestResultWithUser[] = (results || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      category: r.category,
      score: r.score,
      total_questions: r.total_questions,
      accuracy: r.accuracy,
      weak_topics: r.weak_topics,
      strong_topics: r.strong_topics,
      created_at: r.created_at,
      user_name: r.profiles?.name,
      user_email: r.profiles?.email,
    }));

    setTestResults(formattedResults);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTestResults();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("test-results-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_results" },
        () => {
          console.log("Test results updated");
          fetchTestResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get unique users who have taken tests
  const usersWithTests = Array.from(
    new Map(testResults.map((r) => [r.user_id, r])).values()
  );

  // Get stats
  const totalTests = testResults.length;
  const uniqueTestTakers = usersWithTests.length;
  const avgAccuracy = testResults.length
    ? Math.round(testResults.reduce((acc, t) => acc + t.accuracy, 0) / testResults.length)
    : 0;

  return {
    testResults,
    usersWithTests,
    totalTests,
    uniqueTestTakers,
    avgAccuracy,
    isLoading,
    refetch: fetchTestResults,
  };
};

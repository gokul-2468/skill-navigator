import { supabase } from "@/integrations/supabase/client";

interface CategoryResult {
  correct: number;
  total: number;
}

interface TestResults {
  totalScore: number;
  totalCorrect: number;
  totalQuestions: number;
  categoryResults: Record<string, CategoryResult>;
  date: string;
}

export const saveTestResults = async (results: TestResults, userId: string) => {
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

  const weakTopics = categoryData.filter(c => c.isWeak).map(c => c.name);
  const strongTopics = categoryData.filter(c => c.isStrong).map(c => c.name);

  // Save overall results
  const { data, error } = await supabase.from("test_results").insert({
    user_id: userId,
    category: "Overall",
    score: results.totalCorrect,
    total_questions: results.totalQuestions,
    accuracy: results.totalScore,
    weak_topics: weakTopics,
    strong_topics: strongTopics,
  }).select().single();

  if (error) {
    console.error("Error saving test results:", error);
    throw error;
  }

  // Save individual category results
  for (const category of categoryData) {
    await supabase.from("test_results").insert({
      user_id: userId,
      category: category.name,
      score: category.correct,
      total_questions: category.total,
      accuracy: category.percentage,
      weak_topics: category.isWeak ? [category.name] : [],
      strong_topics: category.isStrong ? [category.name] : [],
    });
  }

  return data;
};

export const getUserTestResults = async (userId: string) => {
  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching test results:", error);
    throw error;
  }

  return data;
};

export const getLatestTestResult = async (userId: string) => {
  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("user_id", userId)
    .eq("category", "Overall")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching latest test result:", error);
    throw error;
  }

  return data;
};

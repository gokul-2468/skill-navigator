import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAnsweredQuestions = (userId: string | null) => {
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnsweredQuestions = async () => {
      if (!userId) {
        setAnsweredQuestionIds([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data, error } = await supabase
        .from("user_answers")
        .select("question_id")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching answered questions:", error);
        setAnsweredQuestionIds([]);
      } else {
        const ids = (data || []).map((a) => a.question_id);
        setAnsweredQuestionIds(ids);
      }

      setIsLoading(false);
    };

    fetchAnsweredQuestions();
  }, [userId]);

  return { answeredQuestionIds, isLoading };
};

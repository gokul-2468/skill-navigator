import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface Question {
  id: string;
  category: string;
  topic: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string | null;
  created_at: string;
}

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const parseOptions = (options: Json): string[] => {
    if (Array.isArray(options)) {
      return options.map(opt => String(opt));
    }
    return [];
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching questions:", error);
    } else {
      const parsedQuestions: Question[] = (data || []).map(q => ({
        ...q,
        options: parseOptions(q.options),
      }));
      setQuestions(parsedQuestions);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuestions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("questions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        (payload) => {
          console.log("Realtime update:", payload);
          if (payload.eventType === "INSERT") {
            const newQuestion = {
              ...payload.new,
              options: parseOptions(payload.new.options as Json),
            } as Question;
            setQuestions((prev) => [newQuestion, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === payload.new.id
                  ? { ...payload.new, options: parseOptions(payload.new.options as Json) } as Question
                  : q
              )
            );
          } else if (payload.eventType === "DELETE") {
            setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addQuestion = async (question: Omit<Question, "id" | "created_at">) => {
    const { error } = await supabase.from("questions").insert({
      category: question.category,
      topic: question.topic,
      question: question.question,
      options: question.options as unknown as Json,
      correct_answer: question.correct_answer,
      difficulty: question.difficulty,
    });

    if (error) {
      console.error("Error adding question:", error);
      throw error;
    }
  };

  const updateQuestion = async (id: string, question: Partial<Question>) => {
    const updateData: Record<string, unknown> = { ...question };
    if (question.options) {
      updateData.options = question.options as unknown as Json;
    }
    delete updateData.id;
    delete updateData.created_at;

    const { error } = await supabase
      .from("questions")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating question:", error);
      throw error;
    }
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id);

    if (error) {
      console.error("Error deleting question:", error);
      throw error;
    }
  };

  return {
    questions,
    isLoading,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    refetch: fetchQuestions,
  };
};
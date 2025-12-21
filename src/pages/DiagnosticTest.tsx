import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveTestResults } from "@/lib/testResults";

interface Question {
  id: string;
  category: string;
  topic: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string | null;
}

const QUESTIONS_PER_TEST = 50;

const DiagnosticTest = () => {
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth and fetch questions on mount
  useEffect(() => {
    const initTest = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUserId(session.user.id);

      // Fetch already answered question IDs for this user
      const { data: answeredData } = await supabase
        .from("user_answers")
        .select("question_id")
        .eq("user_id", session.user.id);

      const answeredIds = (answeredData || []).map(a => a.question_id);

      // Fetch all questions from database
      const { data: allQuestions, error } = await supabase
        .from("questions")
        .select("*");

      if (error) {
        console.error("Error fetching questions:", error);
        toast({
          title: "Error loading questions",
          description: "Please try again later.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      if (!allQuestions || allQuestions.length === 0) {
        toast({
          title: "No questions available",
          description: "Please contact your administrator.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Filter out already answered questions
      let availableQuestions = allQuestions.filter(q => !answeredIds.includes(q.id));

      // If not enough unanswered questions, use all questions (reset)
      if (availableQuestions.length < QUESTIONS_PER_TEST) {
        toast({
          title: "New question set",
          description: "You've answered all questions. Starting fresh with the full question bank!",
        });
        availableQuestions = allQuestions;
      }

      // Shuffle and pick 50 (or available count)
      const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, Math.min(QUESTIONS_PER_TEST, shuffled.length));

      // Parse options
      const parsedQuestions: Question[] = selectedQuestions.map(q => ({
        id: q.id,
        category: q.category,
        topic: q.topic,
        question: q.question,
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correct_answer: q.correct_answer,
        difficulty: q.difficulty,
      }));

      setQuestions(parsedQuestions);
      setAnswers(Array(parsedQuestions.length).fill(null));
      setIsLoadingQuestions(false);
    };

    initTest();
  }, [navigate]);

  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your personalized test...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No questions available.</p>
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  const handleSelectOption = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(answers[currentQuestion + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(answers[currentQuestion - 1]);
    }
  };

  const handleSubmit = async () => {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      toast({
        title: "Incomplete Test",
        description: `Please answer all questions. ${unanswered} remaining.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Calculate results by category
    const categoryResults: Record<string, { correct: number; total: number }> = {};
    
    questions.forEach((q, index) => {
      if (!categoryResults[q.category]) {
        categoryResults[q.category] = { correct: 0, total: 0 };
      }
      categoryResults[q.category].total++;
      
      const selectedOptionText = q.options[answers[index] as number];
      if (selectedOptionText === q.correct_answer) {
        categoryResults[q.category].correct++;
      }
    });

    const totalCorrect = questions.filter((q, index) => {
      const selectedOptionText = q.options[answers[index] as number];
      return selectedOptionText === q.correct_answer;
    }).length;

    const results = {
      totalScore: Math.round((totalCorrect / questions.length) * 100),
      totalCorrect,
      totalQuestions: questions.length,
      categoryResults,
      date: new Date().toISOString()
    };

    // Save to localStorage for Results page
    localStorage.setItem("testResults", JSON.stringify(results));

    // Save individual answers to database
    if (userId) {
      try {
        // Save each answer
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const selectedOptionText = q.options[answers[i] as number];
          const isCorrect = selectedOptionText === q.correct_answer;
          
          await supabase.from("user_answers").insert({
            user_id: userId,
            question_id: q.id,
            selected_option: selectedOptionText,
            is_correct: isCorrect,
          });
        }

        await saveTestResults(results, userId);
        toast({
          title: "Test Completed!",
          description: "Your results have been saved.",
        });
      } catch (error) {
        console.error("Error saving results:", error);
        toast({
          title: "Test Completed!",
          description: "Calculating your results...",
        });
      }
    } else {
      toast({
        title: "Test Completed!",
        description: "Calculating your results...",
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/results");
    }, 1000);
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
                <h1 className="font-bold text-foreground">Diagnostic Test</h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Exit
            </Button>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Question Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-soft border-0 animate-fade-in">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                {question.category}
              </span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {question.topic}
              </span>
              {question.difficulty && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  question.difficulty === 'easy' ? 'bg-success/20 text-success' :
                  question.difficulty === 'hard' ? 'bg-destructive/20 text-destructive' :
                  'bg-warning/20 text-warning'
                }`}>
                  {question.difficulty}
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6">
              {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectOption(index)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedOption === index
                      ? "border-primary bg-accent shadow-soft"
                      : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === index
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}>
                      {selectedOption === index && (
                        <CheckCircle className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <span className={`font-medium ${
                      selectedOption === index ? "text-foreground" : "text-foreground/80"
                    }`}>
                      {option}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              {currentQuestion === questions.length - 1 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Test"}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentQuestion(index);
                setSelectedOption(answers[index]);
              }}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                index === currentQuestion
                  ? "gradient-primary text-primary-foreground"
                  : answers[index] !== null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DiagnosticTest;

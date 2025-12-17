import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveTestResults } from "@/lib/testResults";

// Sample questions data - in real app, fetch from backend
const questions = [
  {
    id: 1,
    category: "Programming Basics",
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language"
    ],
    correctAnswer: 0
  },
  {
    id: 2,
    category: "Programming Basics",
    question: "Which symbol is used for comments in JavaScript?",
    options: ["#", "//", "/* */", "Both // and /* */"],
    correctAnswer: 3
  },
  {
    id: 3,
    category: "Programming Basics",
    question: "What is a variable?",
    options: [
      "A fixed value that never changes",
      "A container to store data values",
      "A type of function",
      "A programming language"
    ],
    correctAnswer: 1
  },
  {
    id: 4,
    category: "Web Development",
    question: "CSS stands for?",
    options: [
      "Creative Style Sheets",
      "Computer Style Sheets",
      "Cascading Style Sheets",
      "Colorful Style Sheets"
    ],
    correctAnswer: 2
  },
  {
    id: 5,
    category: "Web Development",
    question: "Which HTML tag is used to create a hyperlink?",
    options: ["<link>", "<a>", "<href>", "<url>"],
    correctAnswer: 1
  },
  {
    id: 6,
    category: "Web Development",
    question: "What property is used to change text color in CSS?",
    options: ["text-color", "font-color", "color", "text-style"],
    correctAnswer: 2
  },
  {
    id: 7,
    category: "JavaScript",
    question: "How do you declare a JavaScript variable?",
    options: ["variable x;", "var x;", "v x;", "declare x;"],
    correctAnswer: 1
  },
  {
    id: 8,
    category: "JavaScript",
    question: "What is the output of: console.log(typeof [])?",
    options: ["array", "object", "undefined", "list"],
    correctAnswer: 1
  },
  {
    id: 9,
    category: "JavaScript",
    question: "Which method adds an element to the end of an array?",
    options: ["add()", "push()", "append()", "insert()"],
    correctAnswer: 1
  },
  {
    id: 10,
    category: "Database",
    question: "SQL stands for?",
    options: [
      "Structured Query Language",
      "Simple Query Language",
      "Standard Query Language",
      "Sequential Query Language"
    ],
    correctAnswer: 0
  },
  {
    id: 11,
    category: "Database",
    question: "Which SQL command is used to retrieve data?",
    options: ["GET", "RETRIEVE", "SELECT", "FETCH"],
    correctAnswer: 2
  },
  {
    id: 12,
    category: "Database",
    question: "What is a primary key?",
    options: [
      "The first column in a table",
      "A unique identifier for each record",
      "The most important data in a table",
      "A password for the database"
    ],
    correctAnswer: 1
  },
  {
    id: 13,
    category: "Problem Solving",
    question: "What is an algorithm?",
    options: [
      "A programming language",
      "A step-by-step procedure to solve a problem",
      "A type of computer",
      "A debugging tool"
    ],
    correctAnswer: 1
  },
  {
    id: 14,
    category: "Problem Solving",
    question: "What does 'debugging' mean?",
    options: [
      "Writing new code",
      "Finding and fixing errors in code",
      "Deleting code",
      "Running code faster"
    ],
    correctAnswer: 1
  },
  {
    id: 15,
    category: "Problem Solving",
    question: "What is a loop used for in programming?",
    options: [
      "To make the code look better",
      "To repeat a block of code multiple times",
      "To stop the program",
      "To connect to the internet"
    ],
    correctAnswer: 1
  }
];

const DiagnosticTest = () => {
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

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
      if (answers[index] === q.correctAnswer) {
        categoryResults[q.category].correct++;
      }
    });

    const totalCorrect = answers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;

    const results = {
      totalScore: Math.round((totalCorrect / questions.length) * 100),
      totalCorrect,
      totalQuestions: questions.length,
      categoryResults,
      date: new Date().toISOString()
    };

    // Save to localStorage for Results page
    localStorage.setItem("testResults", JSON.stringify(results));

    // Save to database if user is logged in
    if (userId) {
      try {
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
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground mb-4">
              {question.category}
            </span>

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

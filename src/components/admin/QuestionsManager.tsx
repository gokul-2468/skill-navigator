import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const categories = ["Quantitative", "Logical", "Verbal", "Technical"];
const difficulties = ["easy", "medium", "hard"];

export const QuestionsManager = () => {
  const { questions, isLoading, addQuestion, updateQuestion, deleteQuestion } = useQuestions();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    category: "",
    topic: "",
    question: "",
    options: ["", "", "", ""],
    correct_answer: "",
    difficulty: "medium",
  });

  const resetForm = () => {
    setFormData({
      category: "",
      topic: "",
      question: "",
      options: ["", "", "", ""],
      correct_answer: "",
      difficulty: "medium",
    });
    setEditingQuestion(null);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      category: question.category,
      topic: question.topic,
      question: question.question,
      options: [...question.options],
      correct_answer: question.correct_answer,
      difficulty: question.difficulty || "medium",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.topic || !formData.question || !formData.correct_answer) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, formData);
        toast({ title: "Question updated successfully" });
      } else {
        await addQuestion(formData);
        toast({ title: "Question added successfully" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error saving question", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await deleteQuestion(id);
      toast({ title: "Question deleted successfully" });
    } catch (error) {
      toast({ title: "Error deleting question", variant: "destructive" });
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const difficultyColors = {
    easy: "bg-success/10 text-success border-success/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    hard: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Questions Bank</h1>
          <p className="text-muted-foreground">Manage your diagnostic test questions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((diff) => (
                        <SelectItem key={diff} value={diff} className="capitalize">{diff}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Topic *</Label>
                <Input
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Percentages, Arrays, Grammar"
                />
              </div>

              <div className="space-y-2">
                <Label>Question *</Label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter your question"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Options *</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                <Select
                  value={formData.correct_answer}
                  onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct option" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.options.map((option, index) => (
                      option && (
                        <SelectItem key={index} value={option}>
                          {String.fromCharCode(65 + index)}: {option}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-primary">
                  {editingQuestion ? "Update Question" : "Add Question"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredQuestions.length} questions</span>
        {categoryFilter !== "all" && (
          <Badge variant="secondary" className="gap-1">
            {categoryFilter}
            <X className="w-3 h-3 cursor-pointer" onClick={() => setCategoryFilter("all")} />
          </Badge>
        )}
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              className="bg-card rounded-xl border p-6 hover:shadow-medium transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{question.category}</Badge>
                    <Badge variant="secondary">{question.topic}</Badge>
                    <Badge
                      variant="outline"
                      className={cn("capitalize", difficultyColors[question.difficulty as keyof typeof difficultyColors])}
                    >
                      {question.difficulty}
                    </Badge>
                  </div>
                  <p className="font-medium">{question.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {question.options.map((option, i) => (
                      <div
                        key={i}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm border",
                          option === question.correct_answer
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-muted/50"
                        )}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(question)}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(question.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No questions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
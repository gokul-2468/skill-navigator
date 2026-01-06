import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CSVQuestion {
  category: string;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
}

interface ParsedQuestion {
  category: string;
  topic: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  isValid: boolean;
  errors: string[];
}

interface CSVUploaderProps {
  onUpload: (questions: Omit<ParsedQuestion, 'isValid' | 'errors'>[]) => Promise<void>;
}

const CSV_TEMPLATE = `category,topic,question,option_a,option_b,option_c,option_d,correct_answer,difficulty
Quantitative,Arithmetic,What is 15 + 27?,32,42,52,62,42,easy
Logical,Reasoning,If all cats are animals and all animals are living beings then all cats are?,Living beings,Plants,Non-living,None of these,Living beings,medium
Technical,Java Basics,Which keyword is used to define a class in Java?,class,Class,define,struct,class,easy
Verbal,Vocabulary,What is the synonym of 'Eloquent'?,Articulate,Silent,Confused,Angry,Articulate,medium`;

const VALID_CATEGORIES = ["Quantitative", "Logical", "Verbal", "Technical"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

export const CSVUploader = ({ onUpload }: CSVUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'preview' | 'uploading' | 'success' | 'error'>('idle');

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Template downloaded successfully!" });
  };

  const parseCSV = (content: string): ParsedQuestion[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['category', 'topic', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'difficulty'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        continue; // Skip malformed rows
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      const errors: string[] = [];

      // Validate category
      if (!VALID_CATEGORIES.includes(row.category)) {
        errors.push(`Invalid category: "${row.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
      }

      // Validate difficulty
      if (!VALID_DIFFICULTIES.includes(row.difficulty?.toLowerCase())) {
        errors.push(`Invalid difficulty: "${row.difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
      }

      // Validate required fields
      if (!row.topic) errors.push('Topic is required');
      if (!row.question) errors.push('Question is required');
      if (!row.option_a) errors.push('Option A is required');
      if (!row.option_b) errors.push('Option B is required');
      if (!row.option_c) errors.push('Option C is required');
      if (!row.option_d) errors.push('Option D is required');

      const options = [row.option_a, row.option_b, row.option_c, row.option_d];
      
      // Validate correct answer
      if (!options.includes(row.correct_answer)) {
        errors.push(`Correct answer "${row.correct_answer}" must match one of the options`);
      }

      questions.push({
        category: row.category,
        topic: row.topic,
        question: row.question,
        options,
        correct_answer: row.correct_answer,
        difficulty: row.difficulty?.toLowerCase() || 'medium',
        isValid: errors.length === 0,
        errors,
      });
    }

    return questions;
  };

  // Handle CSV values with commas inside quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({ title: "Please upload a CSV file", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const questions = parseCSV(content);
        
        if (questions.length === 0) {
          toast({ title: "No questions found in CSV", variant: "destructive" });
          return;
        }

        setParsedQuestions(questions);
        setUploadStatus('preview');
      } catch (error) {
        toast({ 
          title: "Error parsing CSV", 
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    const validQuestions = parsedQuestions.filter(q => q.isValid);
    
    if (validQuestions.length === 0) {
      toast({ title: "No valid questions to upload", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      await onUpload(validQuestions.map(({ isValid, errors, ...q }) => q));
      setUploadStatus('success');
      toast({ 
        title: "Questions uploaded successfully!", 
        description: `${validQuestions.length} questions added to the database.`
      });
      
      setTimeout(() => {
        setIsDialogOpen(false);
        resetState();
      }, 1500);
    } catch (error) {
      setUploadStatus('error');
      toast({ 
        title: "Error uploading questions", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setParsedQuestions([]);
    setUploadStatus('idle');
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedQuestions.filter(q => q.isValid).length;
  const invalidCount = parsedQuestions.filter(q => !q.isValid).length;

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Bulk Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk Upload Questions
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          {/* Template Download Section */}
          <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">CSV Template</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Download the template to see the required format
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={downloadTemplate} className="gap-2">
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </div>
          </div>

          {/* CSV Format Info */}
          <div className="text-xs text-muted-foreground bg-card rounded-lg p-3 border">
            <p className="font-medium mb-2">CSV Format Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>category:</strong> Quantitative, Logical, Verbal, or Technical</li>
              <li><strong>topic:</strong> The topic name (e.g., Arithmetic, Java Basics)</li>
              <li><strong>question:</strong> The question text</li>
              <li><strong>option_a, option_b, option_c, option_d:</strong> Four answer options</li>
              <li><strong>correct_answer:</strong> Must match exactly one of the options</li>
              <li><strong>difficulty:</strong> easy, medium, or hard</li>
            </ul>
          </div>

          {uploadStatus === 'idle' && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Drag & drop your CSV file here</p>
              <p className="text-sm text-muted-foreground mt-1">or</p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          )}

          {uploadStatus === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-success font-medium">{validCount} valid</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-destructive font-medium">{invalidCount} invalid</span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Topic</th>
                      <th className="px-3 py-2 text-left">Question</th>
                      <th className="px-3 py-2 text-left">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedQuestions.map((q, index) => (
                      <tr 
                        key={index} 
                        className={cn(
                          "border-t",
                          !q.isValid && "bg-destructive/5"
                        )}
                      >
                        <td className="px-3 py-2">
                          {q.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <div className="group relative">
                              <AlertCircle className="w-4 h-4 text-destructive" />
                              <div className="absolute left-0 top-6 z-10 hidden group-hover:block bg-popover border rounded-lg p-2 shadow-lg w-64">
                                <ul className="text-xs text-destructive space-y-1">
                                  {q.errors.map((err, i) => (
                                    <li key={i}>• {err}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">{q.category}</td>
                        <td className="px-3 py-2">{q.topic}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate">{q.question}</td>
                        <td className="px-3 py-2 capitalize">{q.difficulty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {uploadStatus === 'uploading' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-3" />
              <p className="font-medium">Uploading questions...</p>
              <p className="text-sm text-muted-foreground mt-1">Please wait</p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-3" />
              <p className="font-medium text-success">Upload Complete!</p>
              <p className="text-sm text-muted-foreground mt-1">{validCount} questions added</p>
            </div>
          )}
        </div>

        {uploadStatus === 'preview' && (
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={resetState}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={validCount === 0 || isUploading}
              className="gradient-primary"
            >
              Upload {validCount} Questions
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

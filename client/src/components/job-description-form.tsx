import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  title: z.string().min(5, "Job title must be at least 5 characters"),
  company: z.string().optional(),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  numQuestions: z.string().default("5"),
});

type FormData = z.infer<typeof formSchema>;

export default function JobDescriptionForm() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      company: "",
      jobDescription: "",
      numQuestions: "5",
    },
  });
  
  const createInterviewMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/interviews", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      toast({
        title: "Interview created",
        description: "Your interview simulation has been set up.",
      });
      navigate(`/interview/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create interview",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormData) => {
    if (!user) return;
    
    createInterviewMutation.mutate(data);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      setFileName(file.name);
      
      // Update the form field value
      form.setValue("jobDescription", content);
    };
    
    if (file.type === "application/pdf") {
      toast({
        title: "PDF Processing",
        description: "PDF text extraction may be limited. Please verify the extracted content.",
        variant: "default",
      });
    }
    
    reader.readAsText(file);
  };
  
  const handleClearFile = () => {
    setFileContent(null);
    setFileName(null);
    form.setValue("jobDescription", "");
  };
  
  const handleClearForm = () => {
    form.reset();
    setFileContent(null);
    setFileName(null);
  };
  
  return (
    <Card id="job-description-form" className="mb-8 shadow">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
        <CardTitle className="text-lg font-medium text-neutral-900">Start a New Interview</CardTitle>
        <CardDescription className="text-neutral-500">
          Upload a job description or paste it below to begin an AI-powered interview simulation.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 py-5 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Tech Solutions Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste the full job description here..." 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-neutral-500 mt-2">
                    The AI will analyze this to generate relevant interview questions.
                  </p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="numQuestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Questions</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Questions</SelectItem>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="8">8 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="15">15 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-neutral-500 mt-2">
                    Powered by Llama AI from Meta via OpenRouter API.
                  </p>
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Upload Job Description (Optional)</FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-neutral-400" />
                  <div className="flex flex-col items-center text-sm text-neutral-600">
                    {fileName ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-primary-600">{fileName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={handleClearFile}
                        >
                          <Trash2 className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">PDF, DOCX, or TXT up to 10MB</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Button
                type="submit"
                className="inline-flex items-center"
                disabled={createInterviewMutation.isPending}
              >
                {createInterviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>Start Interview</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClearForm}
                disabled={createInterviewMutation.isPending}
              >
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Interview } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Helmet } from "react-helmet";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, Plus, ArrowUp, ArrowDown, ChevronRight, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Form schema for job description
const jobFormSchema = z.object({
  title: z.string().min(3, {
    message: "Job title must be at least 3 characters long",
  }),
  company: z.string().optional(),
  jobDescription: z.string().min(30, {
    message: "Job description must be at least 30 characters long",
  }),
  numQuestions: z.string().default("5"),
  difficulty: z.string().default("medium"),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("prepare");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get interviews data
  const { data: interviews = [], isLoading } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
  });
  
  // Calculate stats
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(i => i.status === "completed").length;
  const averageScore = interviews.length > 0
    ? Math.round(
        interviews
          .filter(i => i.score !== null)
          .reduce((sum, i) => sum + (i.score || 0), 0) / 
        (interviews.filter(i => i.score !== null).length || 1)
      )
    : 0;
  
  // Form setup
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      company: "",
      jobDescription: "",
      numQuestions: "5",
      difficulty: "medium",
    },
  });
  
  // Interview creation mutation
  const createInterviewMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      const res = await apiRequest("POST", "/api/interviews", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      toast({
        title: "Interview created",
        description: "Your interview has been set up.",
      });
      navigate(`/interview/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: JobFormValues) => {
    createInterviewMutation.mutate(data);
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get score status icon
  const getScoreIcon = (score: number | null) => {
    if (score === null) return <Clock className="h-4 w-4 text-gray-400" />;
    if (score >= 70) return <ArrowUp className="h-4 w-4 text-green-500" />;
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <>
      <Helmet>
        <title>InterviewAI - Dashboard</title>
        <meta
          name="description"
          content="Practice job interviews with AI-powered interview simulator"
        />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.fullName.split(' ')[0]}</h1>
            <p className="mt-2 text-lg text-gray-600">
              Practice your interview skills with our AI-powered interview simulator
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalInterviews}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedInterviews}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{averageScore > 0 ? `${averageScore}%` : 'N/A'}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="prepare" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="prepare">Prepare Interview</TabsTrigger>
                  <TabsTrigger value="history">Interview History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="prepare" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Start New Interview</CardTitle>
                      <CardDescription>
                        Enter a job description to start practicing for your next interview
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Software Engineer" {...field} />
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
                                  <Input placeholder="e.g. Acme Inc." {...field} />
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
                                    placeholder="Paste the job description here..." 
                                    className="h-32" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="numQuestions"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Questions</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="3">3 Questions</SelectItem>
                                      <SelectItem value="5">5 Questions</SelectItem>
                                      <SelectItem value="8">8 Questions</SelectItem>
                                      <SelectItem value="10">10 Questions</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="difficulty"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Difficulty Level</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="easy">Easy</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => form.reset()}>
                        Clear
                      </Button>
                      <Button 
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={createInterviewMutation.isPending}
                      >
                        {createInterviewMutation.isPending ? 'Setting up...' : 'Start Interview'}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history">
                  {isLoading ? (
                    <div className="text-center p-8">Loading interviews...</div>
                  ) : interviews.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>No Interviews Yet</CardTitle>
                        <CardDescription>
                          You haven't completed any interviews yet. Start a new interview to practice.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center p-8">
                        <Button onClick={() => setActiveTab("prepare")}>
                          <Plus className="mr-2 h-4 w-4" />
                          Start Your First Interview
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Interviews</CardTitle>
                        <CardDescription>
                          Your interview history and results
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Mobile view */}
                        <div className="block md:hidden space-y-4">
                          {interviews.map((interview) => (
                            <div 
                              key={interview.id} 
                              className="border rounded-lg p-4"
                            >
                              <div className="flex justify-between mb-2">
                                <div className="font-medium">{interview.title}</div>
                                {getStatusBadge(interview.status)}
                              </div>
                              <div className="text-sm text-gray-500 mb-2">
                                {interview.company && `${interview.company} • `}
                                {formatDate(interview.date)}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium">
                                    {interview.score !== null ? `${interview.score}%` : 'No score'}
                                  </span>
                                  <span className="ml-1">{getScoreIcon(interview.score)}</span>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(
                                    interview.status === "completed" 
                                      ? `/feedback/${interview.id}` 
                                      : `/interview/${interview.id}`
                                  )}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  {interview.status === "completed" ? "View Report" : "Continue"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Desktop view */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Job Title</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {interviews.map((interview) => (
                                <TableRow key={interview.id}>
                                  <TableCell className="font-medium">
                                    {interview.title}
                                    {interview.company && (
                                      <div className="text-sm text-gray-500">{interview.company}</div>
                                    )}
                                  </TableCell>
                                  <TableCell>{formatDate(interview.date)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      {interview.score !== null 
                                        ? `${interview.score}%` 
                                        : 'Pending'}
                                      <span className="ml-1">{getScoreIcon(interview.score)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(interview.status)}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(
                                        interview.status === "completed" 
                                          ? `/feedback/${interview.id}` 
                                          : `/interview/${interview.id}`
                                      )}
                                    >
                                      {interview.status === "completed" ? (
                                        <>
                                          <Eye className="h-3 w-3 mr-1" />
                                          View Report
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3 mr-1" />
                                          Continue
                                        </>
                                      )}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Sidebar */}
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                  <CardDescription>
                    How to ace your next interview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      Speak clearly and take your time to articulate your thoughts
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      Use concrete examples from your experience
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      Follow the STAR method: Situation, Task, Action, Result
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      Review your performance and focus on areas for improvement
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Practice Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    For best results, practice in a quiet environment and speak clearly. 
                    Review your feedback to improve with each interview.
                  </p>
                  
                  <a 
                    href="https://www.indeed.com/career-advice/interviewing/common-interview-questions-and-answers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="outline" className="w-full">
                      Interview Resources
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
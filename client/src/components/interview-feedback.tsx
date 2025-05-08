import { useState } from "react";
import { Interview, Question } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Home, Play } from "lucide-react";
import { useLocation } from "wouter";

interface InterviewFeedbackProps {
  interview: Interview;
  questions: Question[];
  date: string;
  duration: string;
  onStartNewInterview: () => void;
}

export default function InterviewFeedback({
  interview,
  questions,
  date,
  duration,
  onStartNewInterview
}: InterviewFeedbackProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Make sure interview feedback exists and is properly parsed
  let feedback: any;
  try {
    // Check if feedback exists 
    if (!interview.feedback) {
      throw new Error("No feedback data");
    }

    // Handle case where feedback might be a string (JSON stringified)
    if (typeof interview.feedback === 'string') {
      feedback = JSON.parse(interview.feedback);
    } else {
      feedback = interview.feedback;
    }

    // Verify that feedback contains required fields
    if (!feedback.overallScore) {
      throw new Error("Invalid feedback format - missing score data");
    }
    
    // Add a summary if it's missing
    if (!feedback.summary) {
      feedback.summary = "Thank you for completing your practice interview. We've analyzed your responses and provided feedback to help you improve.";
    }
    
    // Ensure all required arrays exist with defaults if missing
    if (!Array.isArray(feedback.strengths)) {
      feedback.strengths = ["No specific strengths identified"];
    }
    
    if (!Array.isArray(feedback.weaknesses)) {
      feedback.weaknesses = ["No specific weaknesses identified"];
    }
    
    // Handle different data formats - sometimes the API returns 'weaknesses' but UI uses 'improvements'
    if (!Array.isArray(feedback.improvements)) {
      // If we have weaknesses but no improvements, use weaknesses as improvements
      if (Array.isArray(feedback.weaknesses)) {
        feedback.improvements = feedback.weaknesses;
      } else {
        feedback.improvements = ["No specific improvements identified"];
      }
    }
    
    if (!Array.isArray(feedback.recommendations)) {
      feedback.recommendations = ["Practice more interview questions in this field"];
    }
    
    // Normalize overall score to percentage 
    if (typeof feedback.overallScore === 'number') {
      // If score is between 1-10, multiply by 10 (scale of 10)
      if (feedback.overallScore <= 10) {
        feedback.overallScore = Math.round(feedback.overallScore * 10);
      }
      
      // Ensure the score is between 0-100
      feedback.overallScore = Math.max(0, Math.min(100, feedback.overallScore));
    } else if (typeof feedback.overallScore === 'string') {
      // Try to parse string scores like "7/10" or "70%"
      if (feedback.overallScore.includes('/')) {
        const [num, denom] = feedback.overallScore.split('/').map(s => parseFloat(s.trim()));
        if (!isNaN(num) && !isNaN(denom) && denom > 0) {
          feedback.overallScore = Math.round((num / denom) * 100);
        }
      } else if (feedback.overallScore.includes('%')) {
        const score = parseFloat(feedback.overallScore);
        if (!isNaN(score)) {
          feedback.overallScore = Math.round(score);
        }
      } else {
        const score = parseFloat(feedback.overallScore);
        if (!isNaN(score)) {
          feedback.overallScore = score <= 10 ? Math.round(score * 10) : Math.round(score);
        }
      }
      
      // Default to 70 if parsing failed
      if (isNaN(feedback.overallScore)) {
        feedback.overallScore = 70;
      }
    }
    
    // Add default scores for detailed metrics if missing
    feedback.technicalScore = feedback.technicalScore || Math.round(feedback.overallScore * 0.9);
    feedback.communicationScore = feedback.communicationScore || Math.round(feedback.overallScore * 1.1);
    feedback.problemSolvingScore = feedback.problemSolvingScore || Math.round(feedback.overallScore * 0.95);
    
    // Ensure these scores are capped at 100%
    feedback.technicalScore = Math.min(100, feedback.technicalScore);
    feedback.communicationScore = Math.min(100, feedback.communicationScore);
    feedback.problemSolvingScore = Math.min(100, feedback.problemSolvingScore);
    
    // Add question analysis if missing
    if (!feedback.questionAnalysis) {
      feedback.questionAnalysis = questions.map((q, i) => ({
        question: q.question,
        score: q.score || Math.round(feedback.overallScore / 10),
        feedback: q.feedback || "No specific feedback available for this question"
      }));
    }
  } catch (error) {
    console.error("Error parsing feedback:", error, interview.feedback);
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Feedback Not Available</h1>
            <p className="mt-4 text-neutral-600">
              Unable to load feedback for this interview. Details: {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Button className="mt-6" onClick={onStartNewInterview}>
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const generatePdfReport = () => {
    // In a real implementation, this would generate a PDF or call a server endpoint
    alert("PDF report generation would be implemented here");
  };
  
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        {/* Step Indicators */}
        <div className="py-4 border-b border-neutral-200 mb-6">
          <div className="max-w-3xl mx-auto">
            <nav className="flex justify-between">
              <div className="step-item flex items-center completed">
                <div className="step-number flex items-center justify-center h-8 w-8 rounded-full bg-green-500 font-medium text-white">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-neutral-900">Setup</span>
              </div>
              <div className="hidden sm:block w-full border-t border-neutral-300 my-auto mx-4"></div>
              <div className="step-item flex items-center completed">
                <div className="step-number flex items-center justify-center h-8 w-8 rounded-full bg-green-500 font-medium text-white">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-neutral-900">Interview</span>
              </div>
              <div className="hidden sm:block w-full border-t border-neutral-300 my-auto mx-4"></div>
              <div className="step-item flex items-center active">
                <div className="step-number flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 font-medium text-white">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-neutral-900">Feedback</span>
              </div>
            </nav>
          </div>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Interview Performance Report</h1>
          <p className="text-neutral-600 mt-1">
            {interview.title} {interview.company ? `at ${interview.company}` : ''}
          </p>
        </div>
        
        {/* Overall Score Card */}
        <Card className="mb-6 shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h2 className="text-lg font-semibold text-neutral-900">Overall Performance</h2>
                <p className="text-neutral-500 text-sm">{date} • {duration}</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">{feedback.overallScore}%</div>
                  <div className="text-neutral-500 text-sm">Overall Score</div>
                </div>
                <div className="h-12 w-0.5 bg-neutral-200 hidden md:block"></div>
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-24 text-sm text-neutral-600">Technical</div>
                    <div className="w-48 h-2 bg-neutral-200 rounded-full overflow-hidden mr-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${feedback.technicalScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-neutral-600">{feedback.technicalScore}%</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="w-24 text-sm text-neutral-600">Communication</div>
                    <div className="w-48 h-2 bg-neutral-200 rounded-full overflow-hidden mr-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${feedback.communicationScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-neutral-600">{feedback.communicationScore}%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-sm text-neutral-600">Problem Solving</div>
                    <div className="w-48 h-2 bg-neutral-200 rounded-full overflow-hidden mr-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${feedback.problemSolvingScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-neutral-600">{feedback.problemSolvingScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs 
          defaultValue="overview" 
          className="mb-6"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Question Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {/* Summary Card */}
            <Card className="shadow mb-6">
              <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                <CardTitle className="text-lg font-medium text-neutral-900">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-neutral-700 whitespace-pre-line">
                  {(() => {
                    // Handle different formats of summary data
                    if (typeof feedback.summary === 'string') {
                      return feedback.summary;
                    } else if (typeof feedback.summary === 'object' && feedback.summary !== null) {
                      // Sometimes the summary might be an object with nested information
                      try {
                        // Try to stringify it if it's a complex object
                        const summaryText = JSON.stringify(feedback.summary, null, 2);
                        return summaryText.replace(/[{}"]/g, '').replace(/,/g, '\n');
                      } catch (e) {
                        return "Your interview performance has been analyzed. Review your strengths and areas for improvement below.";
                      }
                    } else {
                      return "Your interview performance has been analyzed. Review your strengths and areas for improvement in the sections below.";
                    }
                  })()}
                </p>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="shadow">
                <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                  <CardTitle className="text-lg font-medium text-neutral-900">Strengths</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {feedback.strengths.map((strength: string, index: number) => (
                      <li className="flex items-start" key={index}>
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-neutral-700">{strength}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Areas for Improvement */}
              <Card className="shadow">
                <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                  <CardTitle className="text-lg font-medium text-neutral-900">Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {feedback.improvements.map((improvement: string, index: number) => (
                      <li className="flex items-start" key={index}>
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-7a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm0-7a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-neutral-700">{improvement}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="questions">
            <Card className="shadow">
              <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between items-center">
                <CardTitle className="text-lg font-medium text-neutral-900">Question-by-Question Analysis</CardTitle>
                <span className="text-sm text-neutral-500">{questions.length} questions total</span>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {feedback.questionAnalysis.map((analysis: any, index: number) => (
                  <div key={index} className={index > 0 ? "border-t border-neutral-200 pt-6" : ""}>
                    <div className="mb-2 flex justify-between items-center">
                      <h4 className="text-base font-medium text-neutral-800">{analysis.question}</h4>
                      <ScoreTag score={analysis.score} />
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-4 mb-3">
                      <p className="text-sm text-neutral-700">
                        {questions[index]?.answer || "No answer provided"}
                      </p>
                    </div>
                    <div className="ml-4 text-sm text-neutral-600">
                      <p><span className="font-medium text-neutral-700">Feedback:</span> {analysis.feedback}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations">
            <Card className="shadow">
              <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                <CardTitle className="text-lg font-medium text-neutral-900">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4">
                  {feedback.recommendations.map((recommendation: string, index: number) => (
                    <li className="flex items-start" key={index}>
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-neutral-700">{recommendation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end mb-12">
          <Button onClick={generatePdfReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Save Report
          </Button>
          <Button variant="secondary" onClick={onStartNewInterview}>
            <Play className="mr-2 h-4 w-4" />
            Practice Again
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScoreTag({ score }: { score: number }) {
  let color = "bg-yellow-100 text-yellow-800";
  let label = "Needs Improvement";
  
  if (score >= 80) {
    color = "bg-green-100 text-green-800";
    label = "Great Response";
  } else if (score >= 60) {
    color = "bg-blue-100 text-blue-800";
    label = "Good Response";
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

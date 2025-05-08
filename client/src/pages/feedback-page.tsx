import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Interview, Question } from "@shared/schema";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import InterviewFeedback from "@/components/interview-feedback";
import { Helmet } from "react-helmet";
import { queryClient } from "@/lib/queryClient";

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  
  // Check session storage for the completed interview flag once on component mount
  useEffect(() => {
    const completedInterview = sessionStorage.getItem('interview_completed');
    if (completedInterview === 'true') {
      console.log("Coming from completed interview, refreshing data immediately");
      sessionStorage.removeItem('interview_completed');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/interviews/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/interviews/${id}/questions`] });
    }
  }, [id]);
  
  // Fetch interview data
  const { 
    data: interview, 
    isLoading: isLoadingInterview,
    refetch: refetchInterview
  } = useQuery<Interview>({
    queryKey: [`/api/interviews/${id}`],
    onError: () => navigate("/"),
    refetchInterval: autoRefreshing ? 5000 : false,
  });
  
  // Fetch interview questions
  const { 
    data: questions = [], 
    isLoading: isLoadingQuestions,
    refetch: refetchQuestions
  } = useQuery<Question[]>({
    queryKey: [`/api/interviews/${id}/questions`],
    enabled: !!interview,
    refetchInterval: autoRefreshing ? 5000 : false,
  });
  
  // Set up auto-refresh if the interview is complete but feedback is not available
  useEffect(() => {
    if (interview?.status === "completed" && !interview?.feedback && !autoRefreshing) {
      console.log("Setting up auto-refresh for feedback page");
      setAutoRefreshing(true);
      
      // After 30 seconds of auto-refreshing, force a page reload if still no feedback
      const timer = setTimeout(() => {
        console.log("Auto-refresh timeout reached, forcing page reload");
        window.location.reload();
      }, 30000);
      
      return () => clearTimeout(timer);
    }
    
    // If we got the feedback, stop auto-refreshing
    if (interview?.feedback && autoRefreshing) {
      console.log("Feedback received, turning off auto-refresh");
      setAutoRefreshing(false);
    }
  }, [interview, autoRefreshing]);
  
  // Manually refresh the data
  const handleManualRefresh = () => {
    refetchInterview();
    refetchQuestions();
  };

  if (isLoadingInterview || isLoadingQuestions) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="mt-2 text-neutral-600">Loading interview feedback...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!interview) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-800">Interview not found</h2>
            <p className="mt-2 text-neutral-600">Unable to load the interview data.</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              onClick={() => navigate("/")}
            >
              Return to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (interview.status !== "completed" || !interview.feedback) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center p-4 bg-primary-50 rounded-full mb-4">
                <svg className="w-10 h-10 text-primary-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">Your Feedback is Being Prepared</h2>
              <p className="text-neutral-600 mb-6">
                {interview.status === "completed" 
                  ? "Your feedback is almost ready! The AI is still analyzing your responses."
                  : "Your interview is being processed. This usually takes 30-60 seconds to complete."}
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-neutral-100 rounded-full h-2.5 mb-6 overflow-hidden">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-pulse-width"></div>
              </div>
              
              <div className="text-sm text-neutral-500 italic mb-6">
                The AI is analyzing your responses and preparing detailed feedback on your interview performance.
                {autoRefreshing && (
                  <p className="mt-2 font-medium flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Auto-refreshing every 5 seconds...
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition duration-200"
                  onClick={handleManualRefresh}
                >
                  Refresh Now
                </button>
                
                <button 
                  className="px-6 py-3 bg-neutral-200 text-neutral-800 font-medium rounded-lg hover:bg-neutral-300 transition duration-200"
                  onClick={() => navigate("/")}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    return `${mins} mins`;
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };
  
  return (
    <>
      <Helmet>
        <title>Interview Feedback - InterviewAI</title>
        <meta name="description" content="Comprehensive feedback and performance analysis of your interview session. Review your strengths and areas for improvement." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <Header />
        <main className="flex-grow">
          <InterviewFeedback
            interview={interview}
            questions={questions}
            date={formatDate(interview.date)}
            duration={formatDuration(interview.duration)}
            onStartNewInterview={() => navigate("/")}
          />
        </main>
        <Footer />
      </div>
    </>
  );
}

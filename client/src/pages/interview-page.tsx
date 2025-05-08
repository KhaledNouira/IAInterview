import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Interview, Question } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSpeechRecognition } from "@/lib/use-web-speech-v2";
import { useTTS } from "@/hooks/use-tts-v2";
import { Loader2, Check, ArrowRight } from "lucide-react";
import Header from "@/components/header";
import InterviewSimulator from "@/components/interview-simulator";
import { Helmet } from "react-helmet";

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showProcessingFeedback, setShowProcessingFeedback] = useState(false);
  
  // Fetch interview data
  const { data: interview, isLoading: isLoadingInterview } = useQuery<Interview>({
    queryKey: [`/api/interviews/${id}`]
  });
  
  // Fetch interview questions
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: [`/api/interviews/${id}/questions`],
    enabled: !!interview,
  });
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Speech recognition with improved settings - define callback separately to prevent hook order issues
  const speechRecognitionCallback = useCallback((result: string) => {
    if (currentQuestion) {
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: result
      }));
    }
  }, [currentQuestion]);
  
  const { 
    transcript, 
    isListening, 
    start: startListening, 
    stop: stopListening,
    setTranscript
  } = useSpeechRecognition({
    onResult: speechRecognitionCallback,
    continuous: true,
    autoRestart: true,
    timeout: 30000, // 30 seconds timeout for silence
    language: 'en-US'
  });
  
  // Text-to-speech using Dia with better control
  const speechRef = useRef<{
    lastSpokenTime: number;
    questionId: number | null;
    repeatTimer: NodeJS.Timeout | null;
    autoSkipTimer: NodeJS.Timeout | null;
  }>({
    lastSpokenTime: 0,
    questionId: null,
    repeatTimer: null,
    autoSkipTimer: null
  });
  
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking 
  } = useTTS({
    voice: 'default',
    emotionLevel: 0.7,
    onError: (err) => console.error('TTS error:', err)
  });
  
  // Answer submission
  const answerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number, answer: string }) => {
      const res = await apiRequest("POST", `/api/questions/${questionId}/answer`, { answer });
      return res.json();
    }
  });
  
  // AI response for next question
  const nextQuestionMutation = useMutation({
    mutationFn: async ({ 
      interviewId, 
      currentQuestionId, 
      answer, 
      previousQuestions 
    }: { 
      interviewId: number, 
      currentQuestionId: number, 
      answer: string, 
      previousQuestions: string[] 
    }) => {
      const res = await apiRequest("POST", "/api/ai/next-question", {
        interviewId, 
        currentQuestionId, 
        answer, 
        previousQuestions
      });
      return res.json();
    }
  });
  
  // Complete interview
  const completeInterviewMutation = useMutation({
    mutationFn: async ({ interviewId, duration }: { interviewId: number, duration: number }) => {
      const res = await apiRequest("POST", "/api/ai/complete-interview", { interviewId, duration });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      // Add a small delay to ensure the server has time to process
      setTimeout(() => {
        // Set a flag in session storage to indicate we're coming from a completed interview
        sessionStorage.setItem('interview_completed', 'true');
        navigate(`/feedback/${id}`);
      }, 1000);
    },
    onError: (error) => {
      console.error("Error completing interview:", error);
      // Even if there's an error, still navigate to feedback page
      // The feedback page has better error handling now
      setTimeout(() => {
        navigate(`/feedback/${id}`);
      }, 1000);
    }
  });
  
  // Initialize interview time tracking
  useEffect(() => {
    if (interview && !interviewStartTime && interview.status === "pending") {
      setInterviewStartTime(new Date());
    }
  }, [interview, interviewStartTime]);
  
  // Timer for interview duration
  useEffect(() => {
    if (!interviewStartTime) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - interviewStartTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [interviewStartTime]);
  
  // Define functions in the correct order to avoid circular dependencies
  
  // Handle skip question - basic implementation without dependencies
  const handleSkipQuestionBase = (skipToNext: boolean) => {
    if (!currentQuestion || !interview) return;
    
    // Clear any active timers
    if (speechRef.current.repeatTimer) {
      clearTimeout(speechRef.current.repeatTimer);
      speechRef.current.repeatTimer = null;
    }
    
    if (speechRef.current.autoSkipTimer) {
      clearTimeout(speechRef.current.autoSkipTimer);
      speechRef.current.autoSkipTimer = null;
    }
    
    // Submit the current answer
    const answer = userAnswers[currentQuestion.id] || "";
    answerMutation.mutate({ questionId: currentQuestion.id, answer });
    
    // Stop activities
    stopSpeaking();
    stopListening();
    
    // Either move to the next question or complete the interview
    if (skipToNext && currentQuestionIndex < questions.length - 1) {
      setTranscript("");
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Show processing screen
      setShowProcessingFeedback(true);
      
      // Complete the interview
      completeInterviewMutation.mutate({ 
        interviewId: interview.id, 
        duration: elapsedTime 
      });
    }
  };
  
  // Complete the interview
  const handleCompleteInterview = useCallback(() => {
    if (!interview) return;
    
    // Clear any active timers
    if (speechRef.current.repeatTimer) {
      clearTimeout(speechRef.current.repeatTimer);
      speechRef.current.repeatTimer = null;
    }
    
    if (speechRef.current.autoSkipTimer) {
      clearTimeout(speechRef.current.autoSkipTimer);
      speechRef.current.autoSkipTimer = null;
    }
    
    // Submit the current answer if available
    if (currentQuestion) {
      const answer = userAnswers[currentQuestion.id] || transcript || "";
      answerMutation.mutate({ questionId: currentQuestion.id, answer });
    }
    
    // Stop activities
    stopSpeaking();
    stopListening();
    
    // Show the processing screen
    setShowProcessingFeedback(true);
    
    // Complete the interview
    completeInterviewMutation.mutate({ 
      interviewId: interview.id, 
      duration: elapsedTime 
    });
  }, [interview, currentQuestion, userAnswers, transcript, elapsedTime, answerMutation, completeInterviewMutation, stopSpeaking, stopListening]);
  
  // Skip to the next question
  const handleSkipQuestion = useCallback(() => {
    handleSkipQuestionBase(true);
  }, [handleSkipQuestionBase]);
  
  // Function to manually repeat the current question
  const handleRepeatQuestion = useCallback(() => {
    if (!currentQuestion || isSpeaking) return;
    
    // Speak the current question again
    console.log("Manually repeating question:", currentQuestion.id);
    speak(currentQuestion.question);
    speechRef.current.lastSpokenTime = Date.now();
  }, [currentQuestion, speak, isSpeaking]);
  
  // Function to set up auto-skip timer (2 minutes of no response)
  const setupAutoSkipTimer = useCallback((questionId: number) => {
    // Clear any existing auto-skip timer
    if (speechRef.current.autoSkipTimer) {
      clearTimeout(speechRef.current.autoSkipTimer);
    }
    
    // Set up a new auto-skip timer (2 minutes = 120,000 ms)
    speechRef.current.autoSkipTimer = setTimeout(() => {
      // Only auto-skip if we're still on the same question and there's no answer
      const hasAnswer = !!userAnswers[questionId];
      const isStillCurrentQuestion = speechRef.current.questionId === questionId;
      
      if (!hasAnswer && isStillCurrentQuestion) {
        console.log("No answer after 2 minutes, auto-skipping to next question");
        handleSkipQuestion();
      }
    }, 120000); // 2 minutes
  }, [userAnswers, handleSkipQuestion]);
  
  // Single function to speak question ONLY when question changes - no automatic repeats
  const speakQuestionOnce = useCallback((question: string, questionId: number) => {
    // Only speak if it's a different question
    const isDifferentQuestion = speechRef.current.questionId !== questionId;
    
    if (isDifferentQuestion) {
      // Remember we spoke this question
      speechRef.current.lastSpokenTime = Date.now();
      speechRef.current.questionId = questionId;
      
      // Stop any current speech and speak the new question
      stopSpeaking();
      speak(question);
      console.log("Speaking question ONLY on change:", questionId);
      
      // Set up auto-skip timer for 2 minutes of inactivity
      setupAutoSkipTimer(questionId);
    }
  }, [speak, stopSpeaking, setupAutoSkipTimer]);
  
  // Use a ref to track if we've spoken the current question
  // This ensures we speak exactly once per question ID regardless of component re-renders
  const hasSpokenRef = useRef<number | null>(null);
  
  // Speak question only when it changes to a new question ID
  useEffect(() => {
    if (!currentQuestion?.question || !currentQuestion?.id) {
      return; // Exit if no question data
    }
    
    // Check if this is a new question we haven't spoken yet
    if (hasSpokenRef.current !== currentQuestion.id) {
      console.log("New question detected, speaking once:", currentQuestion.id);
      
      // Mark this question as spoken
      hasSpokenRef.current = currentQuestion.id;
      
      // Speak the question once and only once
      speakQuestionOnce(currentQuestion.question, currentQuestion.id);
    }
    
    // Cleanup
    return () => {
      // Clear all timers when effect is cleaned up
      if (speechRef.current.repeatTimer) {
        clearTimeout(speechRef.current.repeatTimer);
        speechRef.current.repeatTimer = null;
      }
      if (speechRef.current.autoSkipTimer) {
        clearTimeout(speechRef.current.autoSkipTimer);
        speechRef.current.autoSkipTimer = null;
      }
    };
  }, [currentQuestion?.id, speakQuestionOnce]);
  
  // The handleSkipQuestion function is now defined above using useCallback
  
  // Handle next question
  const handleNextQuestion = async () => {
    if (!interview || !currentQuestion) return;
    
    // Clear any active repeat timer
    if (speechRef.current.repeatTimer) {
      clearTimeout(speechRef.current.repeatTimer);
      speechRef.current.repeatTimer = null;
    }
    
    const answer = userAnswers[currentQuestion.id] || "";
    
    // Submit the current answer
    await answerMutation.mutateAsync({ questionId: currentQuestion.id, answer });
    
    // If this is the last question, complete the interview and show processing screen
    if (currentQuestionIndex >= questions.length - 1) {
      setShowProcessingFeedback(true);
      handleCompleteInterview();
      return;
    }
    
    // Get previous questions
    const previousQuestions = questions
      .slice(0, currentQuestionIndex)
      .map(q => q.question);
    
    // Get AI feedback and next question
    await nextQuestionMutation.mutateAsync({
      interviewId: interview.id,
      currentQuestionId: currentQuestion.id,
      answer,
      previousQuestions
    });
    
    // Move to next question
    stopSpeaking();
    stopListening();
    setTranscript("");
    setCurrentQuestionIndex(prev => prev + 1);
  };
  
  // The handleCompleteInterview function is now defined above using useCallback
  
  if (isLoadingInterview || isLoadingQuestions) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="mt-2 text-neutral-600">Loading interview...</p>
          </div>
        </main>
      </div>
    );
  }
  
  if (!interview || !questions.length) {
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
      </div>
    );
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Show processing feedback when interview is complete and being analyzed
  if (showProcessingFeedback || completeInterviewMutation.isPending) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center p-4 bg-primary-50 rounded-full mb-4">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">Analyzing Your Interview</h2>
              <p className="text-neutral-600 mb-6">
                The AI is processing your answers and preparing detailed feedback.
                This usually takes about 30-60 seconds.
              </p>
              
              {/* Progress steps */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mr-3">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-neutral-800">Answers recorded</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mr-3">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-neutral-800">Questions analyzed</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 mr-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-neutral-800">Generating performance report</p>
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-neutral-100 rounded-full h-2.5 mb-6 overflow-hidden">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-pulse-width"></div>
              </div>
              
              <div className="text-sm text-neutral-500 italic mb-6">
                You'll be automatically redirected to the feedback page when it's ready.
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Interview Session - InterviewAI</title>
        <meta name="description" content="Active interview session with AI interviewer. Answer questions using your voice and get real-time feedback." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <Header />
        <main className="flex-grow">
          <InterviewSimulator
            interview={interview}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            userAnswer={userAnswers[currentQuestion?.id || 0] || ""}
            isRecording={isListening}
            isSpeaking={isSpeaking}
            elapsedTime={formatTime(elapsedTime)}
            onStartRecording={startListening}
            onStopRecording={stopListening}
            onSkipQuestion={handleSkipQuestion}
            onNextQuestion={handleNextQuestion}
            onEndInterview={handleCompleteInterview}
            onRepeatQuestion={handleRepeatQuestion}
            isProcessingNextQuestion={nextQuestionMutation.isPending}
            isProcessingCompletion={completeInterviewMutation.isPending}
          />
        </main>
      </div>
    </>
  );
}

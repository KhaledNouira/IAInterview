import { useState, useEffect } from "react";
import { Interview, Question } from "@shared/schema";
import { AlertCircle, Mic, MicOff, Volume2, VolumeX, SkipForward, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface InterviewSimulatorProps {
  interview: Interview;
  currentQuestion: Question;
  currentQuestionIndex: number;
  totalQuestions: number;
  userAnswer: string;
  isRecording: boolean;
  isSpeaking: boolean;
  elapsedTime: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSkipQuestion: () => void;
  onNextQuestion: () => void;
  onEndInterview: () => void;
  onRepeatQuestion: () => void;
  isProcessingNextQuestion: boolean;
  isProcessingCompletion: boolean;
}

export default function InterviewSimulator({
  interview,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  userAnswer,
  isRecording,
  isSpeaking,
  elapsedTime,
  onStartRecording,
  onStopRecording,
  onSkipQuestion,
  onNextQuestion,
  onEndInterview,
  onRepeatQuestion,
  isProcessingNextQuestion,
  isProcessingCompletion
}: InterviewSimulatorProps) {
  const [endInterviewDialog, setEndInterviewDialog] = useState(false);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  
  // Check for microphone permission
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setMicPermission(true))
      .catch(() => setMicPermission(false));
  }, []);
  
  const toggleRecording = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
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
              <div className="step-item flex items-center active">
                <div className="step-number flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 font-medium text-white">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-neutral-900">Interview</span>
              </div>
              <div className="hidden sm:block w-full border-t border-neutral-300 my-auto mx-4"></div>
              <div className="step-item flex items-center">
                <div className="step-number flex items-center justify-center h-8 w-8 rounded-full bg-neutral-200 font-medium text-neutral-700">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-neutral-500">Feedback</span>
              </div>
            </nav>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-neutral-50 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-neutral-900">
                    Interview for {interview.title}
                  </h2>
                  {interview.company && (
                    <p className="text-sm text-neutral-500">{interview.company}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    In Progress
                  </span>
                  <div className="text-sm text-neutral-500">
                    <span className="font-medium">{elapsedTime}</span> elapsed
                  </div>
                </div>
              </div>
            </div>
            
            {/* Video Chat Interface */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              {/* AI Interviewer Video Feed */}
              <div className="md:col-span-2">
                <div className="relative rounded-lg overflow-hidden bg-neutral-800 aspect-video shadow-lg">
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">AI Interviewer</p>
                          <p className="text-xs text-neutral-300">
                            {isSpeaking ? "Speaking..." : "Listening..."}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          type="button" 
                          className={`p-1 rounded-full ${isSpeaking ? "bg-primary-600 text-white" : "bg-neutral-700 text-neutral-300"} hover:text-white`}
                        >
                          {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* User Video Feed */}
              <div className="md:col-span-1">
                <div className="relative rounded-lg overflow-hidden bg-neutral-800 aspect-video shadow-lg">
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-neutral-600 flex items-center justify-center text-white">
                          <span className="text-xs font-medium">You</span>
                        </div>
                        <div className="ml-2">
                          <span className={`text-xs ${isRecording ? "text-green-400" : "text-red-400"}`}>
                            {isRecording ? "Mic Active" : "Mic Off"}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          type="button" 
                          className={`p-1 rounded-full ${isRecording ? "bg-red-600 text-white animate-pulse" : "bg-neutral-700 text-white"}`}
                          onClick={toggleRecording}
                          disabled={micPermission === false}
                          title={isRecording ? "Stop Recording" : "Start Recording"}
                        >
                          {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Interview Progress & Controls */}
            <div className="px-6 pb-6">
              <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                <h3 className="text-base font-medium text-neutral-800 mb-2">Current Question</h3>
                <p className="text-neutral-700">
                  {currentQuestion?.question || "Loading question..."}
                </p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {micPermission === false ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    {micPermission === false ? (
                      <>
                        <h3 className="text-sm font-medium text-red-800">Microphone Permission Required</h3>
                        <div className="mt-2 text-sm text-neutral-600">
                          <p>Please enable microphone access to use speech recognition for answering questions.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-medium text-neutral-800">
                          {isRecording ? 
                            <span className="flex items-center text-green-600">
                              <span className="inline-block h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                              Microphone Active - We're Listening
                            </span> 
                            : "Click the microphone button to speak"
                          }
                        </h3>
                        <div className="mt-2 text-sm text-neutral-600">
                          {isRecording ? (
                            <p>Speak clearly into your microphone. Your voice is being recorded and transcribed in real-time. The microphone will stay on until you click the button to turn it off.</p>
                          ) : (
                            <p>Press the microphone button in your video feed to start speaking. The button will pulse red when active.</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {isRecording && userAnswer && (
                  <div className="mt-4 p-3 bg-white rounded border border-neutral-200">
                    <p className="text-sm text-neutral-700">{userAnswer}</p>
                  </div>
                )}
              </div>
              
              {/* Interview Controls */}
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={onRepeatQuestion}
                    disabled={isSpeaking || isProcessingNextQuestion || isProcessingCompletion}
                  >
                    <Volume2 className="-ml-1 mr-2 h-5 w-5" />
                    Repeat Question
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={onSkipQuestion}
                    disabled={isProcessingNextQuestion || isProcessingCompletion}
                  >
                    <SkipForward className="-ml-1 mr-2 h-5 w-5" />
                    Skip Question
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setEndInterviewDialog(true)}
                    disabled={isProcessingCompletion}
                  >
                    <X className="-ml-1 mr-2 h-5 w-5" />
                    End Interview
                  </Button>
                  {userAnswer && (
                    <Button
                      onClick={onNextQuestion}
                      disabled={isProcessingNextQuestion || isProcessingCompletion}
                    >
                      {isProcessingNextQuestion ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {currentQuestionIndex === totalQuestions - 1 ? 'Complete Interview' : 'Next Question'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-neutral-500 mr-3">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <div className="w-48 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AlertDialog open={endInterviewDialog} onOpenChange={setEndInterviewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this interview? You will receive feedback based on the answers you've provided so far.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onEndInterview}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isProcessingCompletion}
            >
              {isProcessingCompletion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'End Interview'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

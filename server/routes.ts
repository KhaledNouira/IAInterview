import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";  // Import the auth setup
// Import both sets of functions for backward compatibility
import { generateInterviewQuestions as generateInterviewQuestionsLocal, 
         generateNextQuestion as generateNextQuestionLocal, 
         generatePerformanceReport as generatePerformanceReportLocal } from "./openai";
// Import OpenRouter functions
import { generateInterviewQuestions as generateInterviewQuestionsAI,
         analyzeAnswer as analyzeAnswerAI,
         generatePerformanceReport as generatePerformanceReportAI } from "./openrouter";
import { generateSpeech, fallbackGenerateSpeech } from "./dia";
import { insertInterviewSchema, updateInterviewSchema, insertQuestionSchema } from "@shared/schema";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  // Interview routes
  // Function to choose between local and AI question generation
  // This allows us to fallback to local generation if the API isn't available
  async function generateInterviewQuestions(jobTitle: string, jobDescription: string, numQuestions: number = 5): Promise<string[]> {
    try {
      // Try to use OpenRouter API first
      return await generateInterviewQuestionsAI(jobDescription, numQuestions);
    } catch (error) {
      console.error("Error using AI for question generation, falling back to local:", error);
      // Fallback to local rule-based generation
      return generateInterviewQuestionsLocal(jobTitle, jobDescription);
    }
  }
  
  app.post("/api/interviews", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const parsedData = insertInterviewSchema.parse({ ...req.body, userId });
      
      // Get number of questions from the request, or default to 5
      const numQuestions = req.body.numQuestions ? parseInt(req.body.numQuestions) : 5;
      
      // Generate questions based on job description using AI
      const questions = await generateInterviewQuestions(
        parsedData.title, 
        parsedData.jobDescription,
        numQuestions
      );
      
      const interview = await storage.createInterview(parsedData);
      
      // Store generated questions
      for (const question of questions) {
        await storage.createQuestion({
          interviewId: interview.id,
          question,
          answer: "",
          feedback: "",
          score: null,
        });
      }
      
      res.status(201).json(interview);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/interviews", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const interviews = await storage.getInterviewsByUserId(req.user!.id);
      res.json(interviews);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/interviews/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const interview = await storage.getInterview(parseInt(req.params.id));
      
      if (!interview || interview.userId !== req.user!.id) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      res.json(interview);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/interviews/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const interview = await storage.getInterview(id);
      
      if (!interview || interview.userId !== req.user!.id) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      const parsedData = updateInterviewSchema.parse(req.body);
      const updatedInterview = await storage.updateInterview(id, parsedData);
      
      res.json(updatedInterview);
    } catch (error) {
      next(error);
    }
  });

  // Questions routes
  app.get("/api/interviews/:id/questions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const interview = await storage.getInterview(parseInt(req.params.id));
      
      if (!interview || interview.userId !== req.user!.id) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      const questions = await storage.getQuestionsByInterviewId(interview.id);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/questions/:id/answer", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { answer } = req.body;
      const questionId = parseInt(req.params.id);
      
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const interview = await storage.getInterview(question.interviewId);
      if (!interview || interview.userId !== req.user!.id) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      // Update question with answer
      await storage.updateQuestion(questionId, { answer });
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // AI response routes
  app.post("/api/ai/next-question", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { interviewId, currentQuestionId, answer, previousQuestions } = req.body;
      
      const interview = await storage.getInterview(interviewId);
      if (!interview || interview.userId !== req.user!.id) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      const currentQuestion = await storage.getQuestion(currentQuestionId);
      if (!currentQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Update current question with answer
      await storage.updateQuestion(currentQuestionId, { answer });
      
      // Generate AI response
      let result;
      try {
        // Try to use AI analysis for the answer
        const analysis = await analyzeAnswerAI(
          currentQuestion.question,
          answer,
          interview.jobDescription
        );
        
        result = {
          feedback: analysis.feedback,
          score: analysis.score || 0
        };
      } catch (error) {
        console.error("Error using AI for answer analysis, falling back to local:", error);
        // Fallback to local rule-based analysis
        const localResult = await generateNextQuestionLocal(
          interview.jobDescription,
          currentQuestion.question,
          answer,
          previousQuestions || []
        );
        
        result = {
          feedback: localResult.feedback,
          score: 0 // Default score since local generation doesn't provide scores
        };
      }
      
      // Store feedback for current question
      await storage.updateQuestion(currentQuestionId, { 
        feedback: result.feedback,
        score: result.score || null
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Text-to-speech endpoint
  app.post("/api/tts/generate", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { text, voice, emotionLevel } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      try {
        // With our simplified approach, we just return the text as is
        // The client will handle TTS using browser's SpeechSynthesis API
        
        // Process the text through the TTS function
        // This is a simplified version that just returns the text
        const processedText = await generateSpeech(text, {
          voice: voice || 'default',
          emotionLevel: emotionLevel || 0.7
        });
        
        // Return the processed text for client-side TTS
        res.status(200).json({ text: processedText });
        
      } catch (error: any) {
        console.error('Error in TTS endpoint:', error);
        
        // Return error message
        res.status(500).json({ 
          message: "Failed to generate speech",
          error: error.message || 'Unknown error'
        });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/complete-interview", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { interviewId, duration } = req.body;
      
      const interview = await storage.getInterview(interviewId);
      if (!interview || interview.userId !== req.user!.id) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      const questions = await storage.getQuestionsByInterviewId(interviewId);
      
      // Format interview data for AI processing
      const interviewData = questions.map(q => ({
        question: q.question,
        answer: q.answer || "",
        feedback: q.feedback || ""
      }));
      
      // Prepare data for AI analysis
      const questionsArray = questions.map(q => q.question);
      const answersArray = questions.map(q => q.answer || "No answer provided");
      
      let report;
      try {
        // Try to use AI for the performance report
        report = await generatePerformanceReportAI(
          questionsArray,
          answersArray,
          interview.jobDescription
        );
      } catch (error) {
        console.error("Error using AI for performance report, falling back to local:", error);
        // Fallback to local rule-based report generation
        report = await generatePerformanceReportLocal(
          interview.title,
          interview.jobDescription,
          interviewData
        );
      }
      
      // Update interview with results
      await storage.updateInterview(interviewId, {
        status: "completed",
        score: report.overallScore,
        duration,
        feedback: report
      });
      
      // Update individual question scores based on the report type
      if ('questionAnalysis' in report) {
        // Handle local report format which has detailed question analysis
        const localReport = report as { 
          overallScore: number;
          questionAnalysis: Array<{ score: number; feedback: string }>; 
          // Plus other fields that vary between implementations
        };
        
        for (let i = 0; i < localReport.questionAnalysis.length && i < questions.length; i++) {
          await storage.updateQuestion(questions[i].id, {
            score: localReport.questionAnalysis[i].score,
            feedback: localReport.questionAnalysis[i].feedback
          });
        }
      } else {
        // Handle AI report format (which doesn't have question-level analysis)
        // Set scores based on strengths/weaknesses
        for (let i = 0; i < questions.length; i++) {
          // If we already have a score from the answer analysis, keep it
          if (!questions[i].score) {
            await storage.updateQuestion(questions[i].id, {
              score: report.overallScore // Use overall score as a default
            });
          }
        }
      }
      
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

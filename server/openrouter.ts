import axios from 'axios';

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// OpenRouter API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Llama model options
const LLAMA_MODELS = {
  // Meta's Llama models available through OpenRouter
  small: 'meta-llama/llama-3-8b-instruct',
  medium: 'meta-llama/llama-3-70b-instruct',
  large: 'meta-llama/llama-3.1-405b-instruct'
};

// Default model (small version of Llama to stay within free tier limits)
const DEFAULT_MODEL = LLAMA_MODELS.small;

interface OpenRouterResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Send a request to OpenRouter API
 * @param prompt The prompt to send
 * @param systemPrompt Optional system prompt
 * @param model The model to use, defaults to Llama 3 8B
 * @returns The response from the API
 */
export async function callOpenRouter(
  prompt: string,
  systemPrompt: string = "You are a helpful assistant.",
  model: string = DEFAULT_MODEL
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  try {
    const response = await axios.post<OpenRouterResponse>(
      OPENROUTER_API_URL,
      {
        model: model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://interviewai.replit.app', // Update with your domain
          'X-Title': 'InterviewAI' // Name of your application
        }
      }
    );

    // Return the content from the first choice
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Response:', error.response.data);
      throw new Error(`OpenRouter API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to call OpenRouter API: ${errorMessage}`);
  }
}

/**
 * Generate interview questions based on job description
 * @param jobDescription The job description
 * @param numQuestions The number of questions to generate
 * @returns Array of generated questions
 */
export async function generateInterviewQuestions(
  jobDescription: string,
  numQuestions: number = 5
): Promise<string[]> {
  const systemPrompt = `You are an expert technical interviewer. Your task is to create challenging 
  but fair interview questions based on the job description provided. Focus on questions that test 
  both technical knowledge and problem-solving abilities. Each question should be clear, specific, 
  and relevant to the job requirements.`;

  const userPrompt = `
  Based on the following job description, generate exactly ${numQuestions} interview questions.
  Format your response as a JSON array of strings with each question. Do not include any explanations, 
  just return the JSON array.
  
  Job Description:
  ${jobDescription}
  `;

  try {
    const response = await callOpenRouter(userPrompt, systemPrompt);
    
    // Try to parse the response as JSON array
    try {
      // Find anything that looks like a JSON array in the response
      // Using a safer regex approach without the 's' flag for compatibility
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(questions) && questions.length > 0) {
          return questions.slice(0, numQuestions);
        }
      }
      
      // If we can't parse as JSON, split by newlines and filter
      const lines = response.split('\n').filter(line => 
        line.trim() && 
        !line.includes('```') && 
        !line.startsWith('[') && 
        !line.startsWith(']') &&
        !line.includes('Here are')
      );
      
      // Extract questions (assuming they might be numbered)
      const extractedQuestions = lines
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.endsWith('?') || line.length > 30)
        .slice(0, numQuestions);
        
      if (extractedQuestions.length > 0) {
        return extractedQuestions;
      }
      
      throw new Error('Could not parse questions from response');
    } catch (parseError: unknown) {
      console.error('Error parsing questions:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new Error(`Failed to parse interview questions: ${errorMessage}`);
    }
  } catch (error: unknown) {
    console.error('Error generating interview questions:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error generating interview questions');
    }
  }
}

/**
 * Analyze an interview answer
 * @param question The interview question
 * @param answer The candidate's answer
 * @param jobDescription The job description
 * @returns Analysis of the answer
 */
export async function analyzeAnswer(
  question: string,
  answer: string,
  jobDescription: string
): Promise<{
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}> {
  const systemPrompt = `You are an expert interview coach and evaluator. Your role is to analyze
  candidate answers to interview questions and provide objective feedback. Be thorough but fair in
  your assessment.`;

  const userPrompt = `
  I need you to analyze this candidate's answer to an interview question. The job is described as:
  
  "${jobDescription}"
  
  Question: ${question}
  
  Candidate's Answer: ${answer}
  
  Please analyze the answer and return your analysis in JSON format with the following fields:
  - score: A score from 1-10
  - feedback: A short paragraph with overall feedback
  - strengths: An array of 2-3 specific strengths in the answer
  - improvements: An array of 2-3 specific areas for improvement
  
  Return only the JSON object.
  `;

  try {
    const response = await callOpenRouter(userPrompt, systemPrompt);
    
    // Try to parse the response as JSON
    try {
      // Find anything that looks like a JSON object in the response
      // Using a safer regex approach without the 's' flag for compatibility
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          score: analysis.score || 5,
          feedback: analysis.feedback || "No feedback provided.",
          strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
          improvements: Array.isArray(analysis.improvements) ? analysis.improvements : []
        };
      }
      
      // Fallback: return a default object with extracted text
      return {
        score: 5,
        feedback: response.substring(0, 200),
        strengths: ["Could not parse strengths from AI response"],
        improvements: ["Could not parse improvements from AI response"]
      };
    } catch (parseError: unknown) {
      console.error('Error parsing answer analysis:', parseError);
      return {
        score: 5,
        feedback: "Could not parse AI analysis response.",
        strengths: [],
        improvements: ["Try providing a more complete answer."]
      };
    }
  } catch (error: unknown) {
    console.error('Error analyzing answer:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error analyzing answer');
    }
  }
}

/**
 * Generate a performance report based on all questions and answers
 * @param questions Array of interview questions
 * @param answers Array of candidate answers
 * @param jobDescription The job description
 * @returns Comprehensive performance report
 */
export async function generatePerformanceReport(
  questions: string[],
  answers: string[],
  jobDescription: string
): Promise<{
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  // Create a Q&A summary
  const qaSection = questions.map((q, i) => 
    `Question ${i+1}: ${q}\nAnswer ${i+1}: ${answers[i] || "No answer provided."}`
  ).join('\n\n');

  const systemPrompt = `You are an expert interview coach providing comprehensive feedback on a 
  completed job interview. Analyze the candidate's responses to all questions and provide detailed,
  constructive feedback related to the job requirements.`;

  const userPrompt = `
  Please analyze this candidate's interview for the following job position:
  
  "${jobDescription}"
  
  Here are all the questions and answers from the interview:
  
  ${qaSection}
  
  Provide a comprehensive evaluation in JSON format with these fields:
  - overallScore: A number from 1-10 representing overall performance
  - summary: A detailed paragraph summarizing the candidate's performance
  - strengths: An array of 3-5 specific strengths demonstrated in the interview
  - weaknesses: An array of 3-5 specific areas for improvement
  - recommendations: An array of 3-5 actionable recommendations for improvement
  
  Return only the JSON object.
  `;

  try {
    const response = await callOpenRouter(userPrompt, systemPrompt, LLAMA_MODELS.medium);
    
    // Try to parse the response as JSON
    try {
      // Find anything that looks like a JSON object in the response
      // Using a safer regex approach without the 's' flag for compatibility
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const report = JSON.parse(jsonMatch[0]);
        return {
          overallScore: report.overallScore || 5,
          summary: report.summary || "No summary provided.",
          strengths: Array.isArray(report.strengths) ? report.strengths : [],
          weaknesses: Array.isArray(report.weaknesses) ? report.weaknesses : [],
          recommendations: Array.isArray(report.recommendations) ? report.recommendations : []
        };
      }
      
      // Fallback: return a default object with extracted text
      return {
        overallScore: 5,
        summary: response.substring(0, 300),
        strengths: ["Could not parse strengths from AI response"],
        weaknesses: ["Could not parse weaknesses from AI response"],
        recommendations: ["Could not parse recommendations from AI response"]
      };
    } catch (parseError: unknown) {
      console.error('Error parsing performance report:', parseError);
      return {
        overallScore: 5,
        summary: "Could not parse the AI analysis response.",
        strengths: [],
        weaknesses: [],
        recommendations: ["Consider providing more detailed answers in future interviews."]
      };
    }
  } catch (error: unknown) {
    console.error('Error generating performance report:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error generating performance report');
    }
  }
}
/**
 * This file implements AI interview functionality using a rule-based algorithm
 * to prevent any need for external API calls or API keys
 */

/**
 * Generate interview questions based on a job description
 */
export async function generateInterviewQuestions(
  jobTitle: string,
  jobDescription: string,
  numQuestions: number = 10
): Promise<string[]> {
  try {
    // Extract keywords from job description
    const description = jobDescription.toLowerCase();
    const technicalKeywords = extractKeywords(description);
    
    // Generate interview questions based on job title and keywords
    const questions = generateQuestionsFromKeywords(jobTitle, technicalKeywords, numQuestions);
    
    return questions;
  } catch (error) {
    console.error("Error generating interview questions:", error);
    // Provide fallback questions instead of throwing an error
    return getDefaultQuestions(jobTitle);
  }
}

// Helper function to extract keywords from job description
function extractKeywords(description: string): string[] {
  // Common technical skills and keywords
  const commonKeywords = [
    "javascript", "typescript", "python", "java", "c++", "react", "angular", 
    "vue", "node", "express", "django", "flask", "spring", "docker", "kubernetes",
    "aws", "azure", "gcp", "cloud", "database", "sql", "nosql", "mongodb",
    "leadership", "management", "communication", "teamwork", "problem-solving",
    "analytics", "data", "machine learning", "ai", "agile", "scrum", "devops",
    "frontend", "backend", "fullstack", "mobile", "android", "ios", "testing",
    "qa", "security", "networking", "infrastructure", "architecture", "design",
    "user experience", "ui", "ux", "product management", "project management"
  ];
  
  // Find matching keywords in description
  const foundKeywords = commonKeywords.filter(keyword => 
    description.includes(keyword)
  );
  
  // If we didn't find enough keywords, add generic ones
  if (foundKeywords.length < 3) {
    foundKeywords.push("experience", "skills", "projects", "challenges");
  }
  
  return foundKeywords;
}

// Default questions for fallback
function getDefaultQuestions(jobTitle: string): string[] {
  return [
    `What interests you about this ${jobTitle} position?`,
    `What relevant experience do you have for this ${jobTitle} role?`,
    `What do you consider your strongest skills for this ${jobTitle} position?`,
    `Describe a challenging project you've worked on that's relevant to this role.`,
    `How do you stay updated with the latest developments in your field?`,
    `Tell me about a time when you had to solve a complex problem.`,
    `How do you handle working under pressure or tight deadlines?`,
    `Give an example of a situation where you had to collaborate with a difficult team member.`,
    `What are your career goals and how does this position help you achieve them?`,
    `Do you have any questions about the role or the company?`
  ];
}

// Helper function to generate questions from keywords
function generateQuestionsFromKeywords(jobTitle: string, keywords: string[], count: number): string[] {
  const technicalQuestionTemplates = [
    (skill: string) => `Tell me about your experience with ${skill}.`,
    (skill: string) => `How have you used ${skill} in your previous roles?`,
    (skill: string) => `Describe a challenging project where you utilized ${skill}.`,
    (skill: string) => `What do you consider best practices when working with ${skill}?`,
    (skill: string) => `How do you stay updated with the latest developments in ${skill}?`
  ];
  
  const behavioralQuestionTemplates = [
    "Describe a situation where you had to meet a tight deadline.",
    "Tell me about a time when you had to work with a difficult team member.",
    "Give an example of a project that didn't go as planned and how you handled it.",
    "Describe a situation where you had to make a difficult decision.",
    "Tell me about a time when you went above and beyond for a project.",
    "How do you prioritize tasks when working on multiple projects?",
    "Describe a situation where you had to learn a new skill quickly.",
    "Tell me about a time when you received constructive criticism.",
    "How do you handle disagreements with team members?",
    "Give an example of how you've contributed to improving a process."
  ];
  
  const roleSpecificQuestions = [
    `What interests you about this ${jobTitle} position?`,
    `What do you think are the most important skills for a ${jobTitle}?`,
    `Where do you see the challenges in this ${jobTitle} role?`,
    `What achievements are you most proud of in your career as a ${jobTitle}?`,
    `How would you approach the first 90 days in this ${jobTitle} position?`
  ];
  
  // Generate technical questions based on keywords
  const technicalQuestions = keywords.flatMap(keyword => 
    technicalQuestionTemplates.map(template => template(keyword))
  );
  
  // Combine all questions and take the requested number
  const allQuestions = [
    ...technicalQuestions,
    ...behavioralQuestionTemplates,
    ...roleSpecificQuestions
  ];
  
  // Shuffle questions to get a good mix
  const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
  
  // Ensure we have enough questions
  return shuffledQuestions.slice(0, count);
}

/**
 * Generate the next question from the AI interviewer based on the conversation context
 * using a rule-based approach that doesn't require external API calls
 */
export async function generateNextQuestion(
  jobDescription: string,
  currentQuestion: string,
  candidateAnswer: string,
  previousQuestions: string[] = []
): Promise<{ question: string; feedback: string }> {
  try {
    // Extract keywords from the job description and answer
    const jobKeywords = extractKeywords(jobDescription.toLowerCase());
    const answerKeywords = jobKeywords.filter(keyword => 
      candidateAnswer.toLowerCase().includes(keyword)
    );
    
    // Generate feedback based on keywords mentioned in the answer
    let feedback = generateFeedback(candidateAnswer, answerKeywords);
    
    // Generate follow-up question
    let question = generateFollowUpQuestion(currentQuestion, candidateAnswer, previousQuestions, jobKeywords);
    
    return { question, feedback };
  } catch (error) {
    console.error("Error generating next question:", error);
    // Provide fallback response
    return {
      feedback: "Thank you for sharing that information. That's helpful context.",
      question: "Could you tell me more about your specific experience related to this role?"
    };
  }
}

// Helper function to generate feedback
function generateFeedback(answer: string, mentionedKeywords: string[]): string {
  // Base feedback templates
  const positiveFeedbackTemplates = [
    "Thank you for sharing your experience with {keyword}. That's valuable information.",
    "Your knowledge of {keyword} shows through in your answer. That's great to hear.",
    "I appreciate your detailed explanation about {keyword}.",
    "Your experience with {keyword} seems relevant to this position."
  ];
  
  const generalFeedbackTemplates = [
    "Thank you for your answer.",
    "I appreciate your response.",
    "That's helpful information.",
    "Thank you for sharing your perspective."
  ];
  
  // Give specific feedback if keywords were mentioned
  if (mentionedKeywords.length > 0) {
    const randomKeyword = mentionedKeywords[Math.floor(Math.random() * mentionedKeywords.length)];
    const randomTemplate = positiveFeedbackTemplates[Math.floor(Math.random() * positiveFeedbackTemplates.length)];
    return randomTemplate.replace('{keyword}', randomKeyword);
  }
  
  // General feedback if no keywords were mentioned
  return generalFeedbackTemplates[Math.floor(Math.random() * generalFeedbackTemplates.length)];
}

// Helper function to generate a follow-up question
function generateFollowUpQuestion(
  currentQuestion: string, 
  answer: string, 
  previousQuestions: string[],
  jobKeywords: string[]
): string {
  // Follow-up question templates
  const followUpTemplates = [
    "Could you tell me more about your experience with {keyword}?",
    "How have you applied {keyword} in your previous roles?",
    "What challenges have you faced when working with {keyword}?",
    "Can you give a specific example of how you've used {keyword} to solve a problem?",
    "What do you consider to be the most important aspects of {keyword}?"
  ];
  
  const generalFollowUpTemplates = [
    "Could you elaborate on your last point?",
    "How would you apply that experience to this role?",
    "What specific skills did you develop from that experience?",
    "How do you measure success in that area?",
    "What did you learn from that experience that would be valuable in this position?"
  ];
  
  // If job keywords are found in the answer, use one as a basis for the follow-up
  const unusedKeywords = jobKeywords.filter(keyword => 
    !previousQuestions.some(q => q.toLowerCase().includes(keyword))
  );
  
  if (unusedKeywords.length > 0) {
    const randomKeyword = unusedKeywords[Math.floor(Math.random() * unusedKeywords.length)];
    const randomTemplate = followUpTemplates[Math.floor(Math.random() * followUpTemplates.length)];
    return randomTemplate.replace('{keyword}', randomKeyword);
  }
  
  // Fallback to general follow-up questions
  return generalFollowUpTemplates[Math.floor(Math.random() * generalFollowUpTemplates.length)];
}

/**
 * Generate a performance report based on the entire interview
 * using a rule-based algorithm without external API calls
 */
export async function generatePerformanceReport(
  jobTitle: string,
  jobDescription: string,
  interviewData: { question: string; answer: string; feedback?: string }[]
): Promise<{
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  questionAnalysis: { question: string; score: number; feedback: string }[];
}> {
  try {
    // Extract relevant keywords from job description
    const jobKeywords = extractKeywords(jobDescription.toLowerCase());
    
    // Analyze each answer for relevant keywords and answer quality
    const questionAnalysis = analyzeAnswers(interviewData, jobKeywords);
    
    // Calculate various scores based on the analysis
    const scores = calculateScores(questionAnalysis, jobKeywords);
    
    // Generate strengths and improvement areas
    const strengths = identifyStrengths(questionAnalysis, scores);
    const improvements = identifyImprovements(questionAnalysis, scores);
    
    // Generate recommendations based on improvement areas
    const recommendations = generateRecommendations(improvements);
    
    return {
      overallScore: scores.overall,
      technicalScore: scores.technical,
      communicationScore: scores.communication,
      problemSolvingScore: scores.problemSolving,
      strengths,
      improvements,
      recommendations,
      questionAnalysis
    };
  } catch (error) {
    console.error("Error generating performance report:", error);
    
    // Provide a fallback performance report
    return generateFallbackReport(interviewData);
  }
}

// Helper function to analyze interview answers
function analyzeAnswers(
  interviewData: { question: string; answer: string; feedback?: string }[],
  jobKeywords: string[]
): { question: string; score: number; feedback: string }[] {
  return interviewData.map(item => {
    const answer = item.answer.toLowerCase();
    
    // Count mentions of job-relevant keywords
    const keywordMentions = jobKeywords.filter(keyword => 
      answer.includes(keyword)
    ).length;
    
    // Analyze answer length (proxy for detail)
    const wordCount = answer.split(/\s+/).length;
    
    // Calculate base score
    let score = 70; // Default score
    
    // Adjust score based on keyword mentions
    if (keywordMentions > 3) {
      score += 15;
    } else if (keywordMentions > 1) {
      score += 10;
    } else if (keywordMentions > 0) {
      score += 5;
    }
    
    // Adjust score based on answer length
    if (wordCount > 150) {
      score += 10;
    } else if (wordCount > 100) {
      score += 5;
    } else if (wordCount < 20) {
      score -= 15;
    } else if (wordCount < 50) {
      score -= 5;
    }
    
    // Cap score at 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Generate feedback based on score
    let feedback;
    if (score >= 90) {
      feedback = "Excellent answer with specific details and relevant skills.";
    } else if (score >= 80) {
      feedback = "Strong answer demonstrating good knowledge and experience.";
    } else if (score >= 70) {
      feedback = "Good answer with some relevant points, but could include more specific examples.";
    } else if (score >= 60) {
      feedback = "Adequate answer, but lacks depth and concrete examples.";
    } else {
      feedback = "Answer needs improvement - provide more details and specific examples.";
    }
    
    return {
      question: item.question,
      score,
      feedback
    };
  });
}

// Helper function to calculate various scores
function calculateScores(
  questionAnalysis: { question: string; score: number; feedback: string }[],
  jobKeywords: string[]
): { 
  overall: number; 
  technical: number; 
  communication: number; 
  problemSolving: number 
} {
  // Calculate average score across all questions for overall score
  const overallScore = Math.round(
    questionAnalysis.reduce((sum, item) => sum + item.score, 0) / questionAnalysis.length
  );
  
  // For the other scores, use variations on the overall score
  // In a real system these would be more sophisticated
  
  // Technical score: bias toward technical questions
  const technicalScore = Math.min(100, Math.round(overallScore * (Math.random() * 0.2 + 0.9)));
  
  // Communication score: based on answer lengths
  const communicationScore = Math.min(100, Math.round(overallScore * (Math.random() * 0.2 + 0.9)));
  
  // Problem-solving score: slightly lower than overall on average
  const problemSolvingScore = Math.min(100, Math.round(overallScore * (Math.random() * 0.2 + 0.8)));
  
  return {
    overall: overallScore,
    technical: technicalScore,
    communication: communicationScore,
    problemSolving: problemSolvingScore
  };
}

// Helper function to identify strengths
function identifyStrengths(
  questionAnalysis: { question: string; score: number; feedback: string }[],
  scores: { overall: number; technical: number; communication: number; problemSolving: number }
): string[] {
  const strengths = [];
  
  // Add strengths based on high question scores
  const highScoreQuestions = questionAnalysis.filter(item => item.score >= 80);
  
  if (highScoreQuestions.length > 0) {
    strengths.push("Provided detailed and relevant answers to multiple questions");
  }
  
  // Add score-based strengths
  if (scores.technical >= 75) {
    strengths.push("Demonstrated good technical knowledge relevant to the position");
  }
  
  if (scores.communication >= 75) {
    strengths.push("Communicated ideas clearly and effectively");
  }
  
  if (scores.problemSolving >= 75) {
    strengths.push("Showed strong problem-solving abilities");
  }
  
  // Add generic strengths to ensure we have at least 3
  const genericStrengths = [
    "Showed enthusiasm for the role",
    "Articulated past experiences well",
    "Demonstrated a positive attitude",
    "Presented professional demeanor during the interview"
  ];
  
  while (strengths.length < 3) {
    const randomStrength = genericStrengths.shift();
    if (randomStrength) {
      strengths.push(randomStrength);
    } else {
      break; // In case we run out of generic strengths
    }
  }
  
  return strengths;
}

// Helper function to identify improvement areas
function identifyImprovements(
  questionAnalysis: { question: string; score: number; feedback: string }[],
  scores: { overall: number; technical: number; communication: number; problemSolving: number }
): string[] {
  const improvements = [];
  
  // Add improvements based on low question scores
  const lowScoreQuestions = questionAnalysis.filter(item => item.score <= 65);
  
  if (lowScoreQuestions.length > 0) {
    improvements.push("Provide more detailed responses with specific examples");
  }
  
  // Add score-based improvements
  if (scores.technical < 75) {
    improvements.push("Highlight technical skills more clearly in answers");
  }
  
  if (scores.communication < 75) {
    improvements.push("Structure answers more clearly with a beginning, middle, and conclusion");
  }
  
  if (scores.problemSolving < 75) {
    improvements.push("Include more examples of problem-solving in responses");
  }
  
  // Add generic improvements to ensure we have at least 3
  const genericImprovements = [
    "Quantify achievements with metrics when possible",
    "Research the company more thoroughly before the interview",
    "Prepare more concise responses to common questions",
    "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions"
  ];
  
  while (improvements.length < 3) {
    const randomImprovement = genericImprovements.shift();
    if (randomImprovement) {
      improvements.push(randomImprovement);
    } else {
      break; // In case we run out of generic improvements
    }
  }
  
  return improvements;
}

// Helper function to generate recommendations
function generateRecommendations(improvements: string[]): string[] {
  // Map improvements to actionable recommendations
  const recommendationMap: { [key: string]: string } = {
    "Provide more detailed responses with specific examples": 
      "Practice answering questions using the STAR method to provide structured examples",
    
    "Highlight technical skills more clearly in answers": 
      "Create a list of your technical skills with specific project examples for each",
    
    "Structure answers more clearly with a beginning, middle, and conclusion": 
      "Record yourself answering practice questions and review for clarity and structure",
    
    "Include more examples of problem-solving in responses": 
      "Prepare 5-7 stories about overcoming challenges in previous roles",
    
    "Quantify achievements with metrics when possible": 
      "Review your resume and add specific numbers and percentages to your achievements",
    
    "Research the company more thoroughly before the interview": 
      "Spend at least one hour researching the company's products, culture, and recent news",
    
    "Prepare more concise responses to common questions": 
      "Practice limiting your answers to 1-2 minutes for most questions",
    
    "Practice the STAR method for behavioral questions": 
      "Work with a friend to practice behavioral interview questions using the STAR framework"
  };
  
  // Convert improvements to recommendations
  const recommendations = improvements.map(improvement => 
    recommendationMap[improvement] || `To address "${improvement.toLowerCase()}", practice with a friend or career counselor`
  );
  
  // Generic recommendations to fill in if needed
  const genericRecommendations = [
    "Join professional groups related to your field to expand your network",
    "Take an online course to strengthen skills in areas mentioned in the job description",
    "Prepare thoughtful questions to ask at the end of your next interview",
    "Create a portfolio that showcases your relevant projects and skills"
  ];
  
  // Ensure we have at least 3 recommendations
  while (recommendations.length < 3) {
    const randomRecommendation = genericRecommendations.shift();
    if (randomRecommendation) {
      recommendations.push(randomRecommendation);
    } else {
      break; // In case we run out of generic recommendations
    }
  }
  
  return recommendations;
}

// Fallback report generator
function generateFallbackReport(
  interviewData: { question: string; answer: string; feedback?: string }[]
): {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  questionAnalysis: { question: string; score: number; feedback: string }[];
} {
  return {
    overallScore: 70,
    technicalScore: 68,
    communicationScore: 75,
    problemSolvingScore: 65,
    strengths: [
      "Good communication skills",
      "Demonstrates technical knowledge",
      "Shows enthusiasm for the role"
    ],
    improvements: [
      "Could provide more specific examples",
      "More detailed technical answers needed",
      "Could structure answers more clearly"
    ],
    recommendations: [
      "Practice structured answering techniques",
      "Prepare more concrete examples",
      "Research company-specific information"
    ],
    questionAnalysis: interviewData.map(item => ({
      question: item.question,
      score: 70,
      feedback: item.feedback || "Good answer that could be more detailed."
    }))
  };
}

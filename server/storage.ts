import { 
  users, 
  type User, 
  type InsertUser,
  interviews, 
  type Interview,
  type InsertInterview,
  type UpdateInterview,
  questions,
  type Question,
  type InsertQuestion
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Interview methods
  createInterview(interview: InsertInterview): Promise<Interview>;
  getInterview(id: number): Promise<Interview | undefined>;
  getInterviewsByUserId(userId: number): Promise<Interview[]>;
  updateInterview(id: number, interview: Partial<UpdateInterview>): Promise<Interview>;
  
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByInterviewId(interviewId: number): Promise<Question[]>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question>;
  
  // Session store
  sessionStore: any; // Using any for session store to avoid type issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private interviews: Map<number, Interview>;
  private questions: Map<number, Question>;
  sessionStore: any; // Using any type for session store
  
  private userIdCounter: number;
  private interviewIdCounter: number;
  private questionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.interviews = new Map();
    this.questions = new Map();
    this.userIdCounter = 1;
    this.interviewIdCounter = 1;
    this.questionIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Interview methods
  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const id = this.interviewIdCounter++;
    const now = new Date();
    // Ensure company is null rather than undefined if not provided
    const company = insertInterview.company === undefined ? null : insertInterview.company;
    
    const interview: Interview = { 
      ...insertInterview,
      company, 
      id, 
      date: now, 
      status: "pending", 
      score: null, 
      duration: null, 
      difficulty: insertInterview.difficulty || "medium", 
      feedback: null 
    };
    this.interviews.set(id, interview);
    return interview;
  }
  
  async getInterview(id: number): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }
  
  async getInterviewsByUserId(userId: number): Promise<Interview[]> {
    return Array.from(this.interviews.values())
      .filter(interview => interview.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  }
  
  async updateInterview(id: number, updateData: Partial<UpdateInterview>): Promise<Interview> {
    const interview = this.interviews.get(id);
    if (!interview) {
      throw new Error(`Interview with id ${id} not found`);
    }
    
    const updatedInterview = { ...interview, ...updateData };
    this.interviews.set(id, updatedInterview);
    return updatedInterview;
  }
  
  // Question methods
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    // Ensure optional fields are null rather than undefined
    const score = insertQuestion.score === undefined ? null : insertQuestion.score;
    const feedback = insertQuestion.feedback === undefined ? null : insertQuestion.feedback;
    const answer = insertQuestion.answer === undefined ? null : insertQuestion.answer;
    
    const question: Question = { 
      ...insertQuestion, 
      id,
      score,
      feedback,
      answer
    };
    this.questions.set(id, question);
    return question;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async getQuestionsByInterviewId(interviewId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.interviewId === interviewId);
  }
  
  async updateQuestion(id: number, updateData: Partial<InsertQuestion>): Promise<Question> {
    const question = this.questions.get(id);
    if (!question) {
      throw new Error(`Question with id ${id} not found`);
    }
    
    const updatedQuestion = { ...question, ...updateData };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for session store

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Interview methods
  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    // Ensure company is null rather than undefined if not provided
    const company = insertInterview.company === undefined ? null : insertInterview.company;
    
    const interview = {
      ...insertInterview,
      company,
      date: new Date(),
      score: null,
      status: "pending",
      duration: null,
      difficulty: insertInterview.difficulty || "medium",
      feedback: null
    };
    const [createdInterview] = await db.insert(interviews).values(interview).returning();
    return createdInterview;
  }
  
  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }
  
  async getInterviewsByUserId(userId: number): Promise<Interview[]> {
    return await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.date));
  }
  
  async updateInterview(id: number, updateData: Partial<UpdateInterview>): Promise<Interview> {
    const [updatedInterview] = await db
      .update(interviews)
      .set(updateData)
      .where(eq(interviews.id, id))
      .returning();

    if (!updatedInterview) {
      throw new Error(`Interview with id ${id} not found`);
    }
    
    return updatedInterview;
  }
  
  // Question methods
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    // Ensure optional fields are null rather than undefined
    const score = insertQuestion.score === undefined ? null : insertQuestion.score;
    const feedback = insertQuestion.feedback === undefined ? null : insertQuestion.feedback;
    const answer = insertQuestion.answer === undefined ? null : insertQuestion.answer;
    
    const questionData = {
      ...insertQuestion,
      score,
      feedback,
      answer
    };
    
    const [question] = await db.insert(questions).values(questionData).returning();
    return question;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }
  
  async getQuestionsByInterviewId(interviewId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.interviewId, interviewId));
  }
  
  async updateQuestion(id: number, updateData: Partial<InsertQuestion>): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(updateData)
      .where(eq(questions.id, id))
      .returning();

    if (!updatedQuestion) {
      throw new Error(`Question with id ${id} not found`);
    }
    
    return updatedQuestion;
  }
}

// Use database storage
export const storage = new DatabaseStorage();

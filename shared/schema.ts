import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
});

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  company: text("company"),
  jobDescription: text("job_description").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  score: integer("score"),
  status: text("status").notNull().default("pending"),
  duration: integer("duration"), // in seconds
  difficulty: text("difficulty").notNull().default("medium"), // easy, medium, hard
  feedback: jsonb("feedback"),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => interviews.id),
  question: text("question").notNull(),
  answer: text("answer"),
  feedback: text("feedback"),
  score: integer("score"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).pick({
  title: true,
  company: true,
  jobDescription: true,
  userId: true,
  difficulty: true,
});

export const updateInterviewSchema = createInsertSchema(interviews).pick({
  status: true,
  score: true,
  duration: true,
  feedback: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  interviewId: true,
  question: true,
  answer: true,
  feedback: true,
  score: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type UpdateInterview = z.infer<typeof updateInterviewSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

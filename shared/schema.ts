import { z } from "zod";

// Shared validation schemas
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Core types used by server and client
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  password: z.string(), // hashed password in storage
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const transactionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  type: z.enum(["income", "expense"]),
  amount: z.number(),
  category: z.string(),
  description: z.string().optional().nullable(),
  created_at: z.string(),
});

export const transactionCreateSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional().nullable(),
  date: z.string().optional(),
});

export const transactionUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export const moneyFlowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  direction: z.enum(["pay", "receive"]),
  amount: z.number(),
  counterparty: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  created_at: z.string(),
});

export const moneyFlowCreateSchema = z.object({
  direction: z.enum(["pay", "receive"]),
  amount: z.number().positive(),
  counterparty: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const moneyFlowUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  counterparty: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const budgetSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  amount: z.number(),
  period: z.enum(["monthly", "yearly"]),
  category: z.string().optional().nullable(),
  created_at: z.string(),
});

export const budgetCreateSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  period: z.enum(["monthly", "yearly"]).default("monthly"),
  category: z.string().optional().nullable(),
});

export const budgetUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  period: z.enum(["monthly", "yearly"]).optional(),
  category: z.string().optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type MoneyFlow = z.infer<typeof moneyFlowSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;
export type MoneyFlowCreate = z.infer<typeof moneyFlowCreateSchema>;
export type MoneyFlowUpdate = z.infer<typeof moneyFlowUpdateSchema>;
export type BudgetCreate = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdate = z.infer<typeof budgetUpdateSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(200),
});

export const setPasswordSchema = z.object({
  token: z.string().min(1).max(200),
  password: z.string().min(8).max(200),
});

import { z } from "zod";

export const AddUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  sector: z.string().nullable().optional(),
  role: z.string().min(1, "Role is required"),
});

// 1. Validation schema
export const UpdateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required"),
  sector: z.string().nullable().optional(),
  role: z.string().min(1, "Role is required"),
});

export const ArchiveUserSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

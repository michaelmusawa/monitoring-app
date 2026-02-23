import z from "zod";

export type ProfileActionState = {
  errors?: {
    name?: string[];
    image?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  state_error?: string | null;
  message?: string | null;
};

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    image: z
      .any()
      .refine(
        (v) => v === undefined || v instanceof File,
        "Invalid file upload",
      )
      .optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.password) {
      if (!data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please confirm your new password",
          path: ["confirmPassword"],
        });
      } else if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }
  });

import { z } from "zod";

export const authEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(320);

export const authPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

export const authFullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(80, "Full name must be 80 characters or fewer.");

export const signInSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
});

export const signUpSchema = z
  .object({
    email: authEmailSchema,
    password: authPasswordSchema,
    fullName: authFullNameSchema,
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const signOutSchema = z.object({});

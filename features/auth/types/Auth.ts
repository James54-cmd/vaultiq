import type { z } from "zod";

import type { signInSchema, signUpSchema } from "@/features/auth/schemas/auth.schema";

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export type AuthSuccessResponse = {
  user: AuthUser | null;
  requiresEmailConfirmation: boolean;
  message: string;
};

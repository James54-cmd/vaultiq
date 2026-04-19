import type { z } from "zod";

import type {
  updateUserPreferencesSchema,
  userPreferencesSchema,
} from "@/features/preferences/schemas/user-preferences.schema";

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;

export type UserPreferencesRecord = {
  user_id: string;
  primary_currency_code: string;
  created_at: string;
  updated_at: string;
};

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { updateUserPreferencesSchema } from "@/features/preferences/schemas/user-preferences.schema";
import type {
  UpdateUserPreferencesInput,
  UserPreferences,
  UserPreferencesRecord,
} from "@/features/preferences/types/UserPreferences";
import { mapUserPreferencesRecord } from "@/features/preferences/utils/mapUserPreferencesRecord";

function createDefaultUserPreferences(userId: string): UserPreferences {
  const now = new Date().toISOString();

  return {
    userId,
    primaryCurrencyCode: "PHP",
    createdAt: now,
    updatedAt: now,
  };
}

export async function getUserPreferences(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return createDefaultUserPreferences(userId);
  }

  return mapUserPreferencesRecord(data as UserPreferencesRecord);
}

export async function updateUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateUserPreferencesInput
) {
  const parsedInput = updateUserPreferencesSchema.parse(input);

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        primary_currency_code: parsedInput.primaryCurrencyCode,
      },
      {
        onConflict: "user_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapUserPreferencesRecord(data as UserPreferencesRecord);
}

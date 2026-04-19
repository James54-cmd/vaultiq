import { userPreferencesSchema } from "@/features/preferences/schemas/user-preferences.schema";
import type { UserPreferencesRecord } from "@/features/preferences/types/UserPreferences";

export function mapUserPreferencesRecord(record: UserPreferencesRecord) {
  return userPreferencesSchema.parse({
    userId: record.user_id,
    primaryCurrencyCode: record.primary_currency_code,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}

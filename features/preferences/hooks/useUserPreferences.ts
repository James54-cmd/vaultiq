"use client";

import { useEffect, useState, useTransition } from "react";

import { fetchUserPreferences, updateUserPreferencesRequest } from "@/features/preferences/services/user-preferences-api.service";
import type { UpdateUserPreferencesInput, UserPreferences } from "@/features/preferences/types/UserPreferences";

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadPreferences = () => {
    startTransition(async () => {
      try {
        setError(null);
        const payload = await fetchUserPreferences();
        setPreferences(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load user preferences.");
      }
    });
  };

  useEffect(() => {
    reloadPreferences();
  }, []);

  const updatePreferences = async (input: UpdateUserPreferencesInput) => {
    const nextPreferences = await updateUserPreferencesRequest(input);
    setPreferences(nextPreferences);
    return nextPreferences;
  };

  return {
    preferences,
    error,
    isPending,
    reloadPreferences,
    updatePreferences,
  };
}

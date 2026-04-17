"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { signInSchema, signUpSchema } from "@/features/auth/schemas/auth.schema";
import {
  signInRequest,
  signInWithGoogleRequest,
  signUpRequest,
} from "@/features/auth/services/auth-api.service";
import type { SignInInput, SignUpInput } from "@/features/auth/types/Auth";
import { ApiValidationError } from "@/lib/api-errors";

type AuthMode = "sign-in" | "sign-up";

export function useAuthForm(mode: AuthMode) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const submit = async (values: SignInInput | SignUpInput) => {
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      if (mode === "sign-in") {
        const parsedValues = signInSchema.safeParse(values);
        if (!parsedValues.success) {
          const flattened = parsedValues.error.flatten();
          setFieldErrors(flattened.fieldErrors);
          setFormError(flattened.formErrors[0] ?? null);
          return;
        }

        await signInRequest(parsedValues.data);
        router.push(redirectTo);
        router.refresh();
        return;
      }

      const parsedValues = signUpSchema.safeParse(values);
      if (!parsedValues.success) {
        const flattened = parsedValues.error.flatten();
        setFieldErrors(flattened.fieldErrors);
        setFormError(flattened.formErrors[0] ?? null);
        return;
      }

      const result = await signUpRequest(parsedValues.data);

      if (result.requiresEmailConfirmation) {
        setSuccessMessage(result.message);
        router.push("/login?registered=1");
        router.refresh();
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiValidationError) {
        setFieldErrors(error.fieldErrors ?? {});
        setFormError(error.formErrors?.[0] ?? error.message);
        return;
      }

      setFormError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsPending(false);
    }
  };

  const signInWithGoogle = async () => {
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      await signInWithGoogleRequest(redirectTo);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Google sign-in failed.");
      setIsPending(false);
    }
  };

  return {
    submit,
    signInWithGoogle,
    isPending,
    fieldErrors,
    formError,
    successMessage,
  };
}

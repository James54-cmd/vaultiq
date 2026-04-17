import { appEnvSchema } from "@/schemas/app-env.schema";

export function getAppEnv() {
  return appEnvSchema.parse({
    NEXT_PUBLIC_ENABLE_GMAIL_SYNC: process.env.NEXT_PUBLIC_ENABLE_GMAIL_SYNC,
  });
}

export function isGmailSyncEnabled() {
  return getAppEnv().NEXT_PUBLIC_ENABLE_GMAIL_SYNC === "true";
}

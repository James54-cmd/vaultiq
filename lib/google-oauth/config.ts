import "server-only";

import { googleOauthEnvSchema } from "@/schemas/google-oauth-env.schema";

export function getGoogleOauthEnv() {
  return googleOauthEnvSchema.parse({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  });
}

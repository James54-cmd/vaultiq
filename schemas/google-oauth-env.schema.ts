import { z } from "zod";

export const googleOauthEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "Google client ID is required."),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google client secret is required."),
});

export type GoogleOauthEnv = z.infer<typeof googleOauthEnvSchema>;

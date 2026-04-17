import { z } from "zod";

export const appEnvSchema = z.object({
  NEXT_PUBLIC_ENABLE_GMAIL_SYNC: z.enum(["true", "false"]).optional().default("false"),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

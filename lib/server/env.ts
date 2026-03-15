import { z } from "zod";

const envSchema = z.object({
  PUBLIC_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_CLIENT_SECRET: z.string().min(1),
  DISCORD_BOT_TOKEN: z.string().min(1),
  STEAM_API_KEY: z.string().min(1),
  QLSTATS_API_URL: z.string().url().default("https://qlstats.net/api"),
  SESSION_SECRET: z.string().min(16),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
});

export type NotificationEnv = z.infer<typeof envSchema>;

let cachedEnv: NotificationEnv | null = null;

export function getNotificationEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

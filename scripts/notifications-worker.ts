import process from "node:process";
import { loadEnvConfig } from "@next/env";

import { destroyDiscordClient } from "../lib/server/discord";
import { getNotificationEnv } from "../lib/server/env";
import { getPrisma } from "../lib/server/prisma";
import { syncNotificationRules } from "../lib/server/service";

loadEnvConfig(process.cwd());

const prisma = getPrisma();
const env = getNotificationEnv();

let timer: NodeJS.Timeout | null = null;
let stopping = false;

async function runOnce() {
  const summary = await syncNotificationRules();
  console.log(
    `[notifications-worker] checked=${summary.checked} notified=${summary.notified} reset=${summary.reset} failed=${summary.failed}`,
  );
}

async function shutdown(signal: string) {
  if (stopping) {
    return;
  }

  stopping = true;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  console.log(`[notifications-worker] shutting down due to ${signal}`);
  await destroyDiscordClient();
  await prisma.$disconnect();
  process.exit(0);
}

async function start() {
  await runOnce();
  timer = setInterval(() => {
    void runOnce().catch((error) => {
      console.error("[notifications-worker] sync failed", error);
    });
  }, env.WORKER_POLL_INTERVAL_MS);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void start().catch(async (error) => {
  console.error("[notifications-worker] failed to start", error);
  await destroyDiscordClient();
  await prisma.$disconnect();
  process.exit(1);
});

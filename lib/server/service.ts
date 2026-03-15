import {
  DeliveryStatus,
  type NotificationRule,
  type User,
} from "@prisma/client";

import { sendServerNotification } from "@/lib/server/discord";
import { getNotificationEnv } from "@/lib/server/env";
import {
  evaluateRuleTransition,
  getThresholdLabel,
} from "@/lib/server/notifications";
import { getPrisma } from "@/lib/server/prisma";
import {
  fetchSteamSnapshots,
  getCachedSteamSnapshots,
  type SteamServerSnapshot,
} from "@/lib/server/steam";

type RuleWithUser = NotificationRule & {
  user: User;
};

export async function getServerSnapshot(serverAddr: string) {
  const env = getNotificationEnv();
  const snapshots = await getCachedSteamSnapshots(env.STEAM_API_KEY);

  return snapshots.get(serverAddr) ?? null;
}

export async function syncNotificationRules() {
  const prisma = getPrisma();
  const env = getNotificationEnv();
  const snapshots = await fetchSteamSnapshots(env.STEAM_API_KEY);
  const rules = await prisma.notificationRule.findMany({
    where: {
      enabled: true,
    },
    include: {
      user: true,
    },
  });

  const summary = {
    checked: rules.length,
    failed: 0,
    notified: 0,
    reset: 0,
  };

  for (const rule of rules) {
    const resolved = await processRule(rule, snapshots);

    if (resolved === "failed") {
      summary.failed += 1;
    } else if (resolved === "notified") {
      summary.notified += 1;
    } else if (resolved === "reset") {
      summary.reset += 1;
    }
  }

  return summary;
}

async function processRule(
  rule: RuleWithUser,
  snapshots: Map<string, SteamServerSnapshot>,
) {
  const prisma = getPrisma();
  const env = getNotificationEnv();
  const snapshot = snapshots.get(rule.serverAddr) ?? null;
  const { matched, shouldNotify } = evaluateRuleTransition(rule, snapshot);

  if (!matched) {
    if (rule.lastMatched) {
      await prisma.notificationRule.update({
        where: { id: rule.id },
        data: { lastMatched: false },
      });

      return "reset";
    }

    return "ignored";
  }

  if (!shouldNotify || !snapshot) {
    return "ignored";
  }

  const delivery = await prisma.notificationDelivery.create({
    data: {
      ruleId: rule.id,
      userId: rule.userId,
      serverAddr: snapshot.addr,
      serverNameSnapshot: snapshot.name,
      players: snapshot.players,
      maxPlayers: snapshot.maxPlayers,
      thresholdMode: rule.thresholdMode,
      thresholdValue: rule.thresholdValue,
      status: DeliveryStatus.success,
    },
  });

  let status: DeliveryStatus = DeliveryStatus.success;
  let discordMessageId: string | null = null;
  let errorMessage: string | null = null;

  try {
    if (!rule.user.dmAvailable) {
      throw new Error("Discord DM is not currently available for this account.");
    }

    discordMessageId = await sendServerNotification({
      userId: rule.user.discordUserId,
      serverName: snapshot.name,
      map: snapshot.map,
      serverAddress: snapshot.addr,
      players: snapshot.players,
      maxPlayers: snapshot.maxPlayers,
      thresholdLabel: getThresholdLabel(rule.thresholdMode, rule.thresholdValue),
      joinUrl: `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}/join/${delivery.id}`,
    });
  } catch (error) {
    status = DeliveryStatus.failed;
    errorMessage =
      error instanceof Error ? error.message : "Discord notification failed.";

    await prisma.user.update({
      where: { id: rule.userId },
      data: {
        dmAvailable: false,
        dmErrorMessage: errorMessage,
      },
    });
  }

  await prisma.notificationDelivery.update({
    where: { id: delivery.id },
    data: {
      discordMessageId,
      errorMessage,
      status,
    },
  });

  await prisma.notificationRule.update({
    where: { id: rule.id },
    data: {
      lastMatched: true,
      lastNotifiedAt: new Date(),
    },
  });

  return status === DeliveryStatus.success ? "notified" : "failed";
}

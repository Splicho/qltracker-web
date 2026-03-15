import { NextResponse } from "next/server";

import { requireAppSession } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/errors";
import { clampThresholdValue } from "@/lib/server/notifications";
import { getPrisma } from "@/lib/server/prisma";
import { createRuleSchema, toNotificationRule } from "@/lib/server/routes";
import { getServerSnapshot } from "@/lib/server/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await requireAppSession(request);
    const prisma = getPrisma();
    const rules = await prisma.notificationRule.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      rules: rules.map(toNotificationRule),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAppSession(request);
    const prisma = getPrisma();
    const body = createRuleSchema.parse(await request.json());
    const snapshot = await getServerSnapshot(body.serverAddr);
    const maxPlayers = snapshot?.maxPlayers ?? 64;
    const rule = await prisma.notificationRule.upsert({
      where: {
        userId_serverAddr: {
          serverAddr: body.serverAddr,
          userId: session.user.id,
        },
      },
      update: {
        enabled: body.enabled ?? true,
        serverNameSnapshot: body.serverNameSnapshot,
        thresholdMode: body.thresholdMode,
        thresholdValue: clampThresholdValue(
          body.thresholdMode,
          body.thresholdValue,
          maxPlayers,
        ),
      },
      create: {
        enabled: body.enabled ?? true,
        serverAddr: body.serverAddr,
        serverNameSnapshot: body.serverNameSnapshot,
        thresholdMode: body.thresholdMode,
        thresholdValue: clampThresholdValue(
          body.thresholdMode,
          body.thresholdValue,
          maxPlayers,
        ),
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { rule: toNotificationRule(rule) },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

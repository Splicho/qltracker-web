import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAppSession } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/errors";
import { clampThresholdValue } from "@/lib/server/notifications";
import { getPrisma } from "@/lib/server/prisma";
import { toNotificationRule, updateRuleSchema } from "@/lib/server/routes";
import { getServerSnapshot } from "@/lib/server/service";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession(request);
    const params = paramsSchema.parse(await context.params);
    const prisma = getPrisma();
    const body = updateRuleSchema.parse(await request.json());
    const existingRule = await prisma.notificationRule.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { message: "Notification rule not found." },
        { status: 404 },
      );
    }

    const thresholdMode = body.thresholdMode ?? existingRule.thresholdMode;
    const thresholdValue = body.thresholdValue ?? existingRule.thresholdValue;
    const snapshot = await getServerSnapshot(existingRule.serverAddr);
    const maxPlayers = snapshot?.maxPlayers ?? 64;
    const updatedRule = await prisma.notificationRule.update({
      where: { id: existingRule.id },
      data: {
        enabled: body.enabled ?? existingRule.enabled,
        serverNameSnapshot:
          body.serverNameSnapshot ?? existingRule.serverNameSnapshot,
        thresholdMode,
        thresholdValue: clampThresholdValue(
          thresholdMode,
          thresholdValue,
          maxPlayers,
        ),
      },
    });

    return NextResponse.json({
      rule: toNotificationRule(updatedRule),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession(request);
    const params = paramsSchema.parse(await context.params);
    const prisma = getPrisma();
    const deleted = await prisma.notificationRule.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { message: "Notification rule not found." },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}

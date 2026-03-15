import { LinkSessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError } from "@/lib/server/errors";
import { getPrisma } from "@/lib/server/prisma";
import { toNotificationUser } from "@/lib/server/routes";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = paramsSchema.parse(await context.params);
    const prisma = getPrisma();
    const linkSession = await prisma.linkSession.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!linkSession) {
      return NextResponse.json(
        { message: "Link session not found." },
        { status: 404 },
      );
    }

    if (
      linkSession.status === LinkSessionStatus.pending &&
      linkSession.expiresAt.getTime() <= Date.now()
    ) {
      const expired = await prisma.linkSession.update({
        where: { id: linkSession.id },
        data: { status: LinkSessionStatus.expired },
        include: { user: true },
      });

      return NextResponse.json({
        errorMessage: expired.errorMessage,
        expiresAt: expired.expiresAt.toISOString(),
        id: expired.id,
        status: expired.status,
      });
    }

    if (
      linkSession.status === LinkSessionStatus.complete &&
      linkSession.appSessionToken
    ) {
      const sessionToken = linkSession.appSessionToken;
      const consumed = await prisma.linkSession.update({
        where: { id: linkSession.id },
        data: {
          appSessionToken: null,
        },
        include: { user: true },
      });

      return NextResponse.json({
        errorMessage: consumed.errorMessage,
        expiresAt: consumed.expiresAt.toISOString(),
        id: consumed.id,
        sessionToken,
        status: consumed.status,
        user: consumed.user ? toNotificationUser(consumed.user) : null,
      });
    }

    return NextResponse.json({
      errorMessage: linkSession.errorMessage,
      expiresAt: linkSession.expiresAt.toISOString(),
      id: linkSession.id,
      status: linkSession.status,
      user: linkSession.user ? toNotificationUser(linkSession.user) : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

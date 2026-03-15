import { NextResponse } from "next/server";

import { createOauthState, getLinkSessionExpiry } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/errors";
import { getPrisma } from "@/lib/server/prisma";
import { buildDiscordAuthorizeUrl } from "@/lib/server/routes";

export const runtime = "nodejs";

export async function POST() {
  try {
    const prisma = getPrisma();
    const oauthState = createOauthState();
    const linkSession = await prisma.linkSession.create({
      data: {
        oauthState,
        expiresAt: getLinkSessionExpiry(),
      },
    });

    return NextResponse.json({
      authorizeUrl: buildDiscordAuthorizeUrl(oauthState),
      expiresAt: linkSession.expiresAt.toISOString(),
      id: linkSession.id,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

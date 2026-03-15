import { NextResponse } from "next/server";

import { requireAppSession } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/errors";
import { toNotificationUser } from "@/lib/server/routes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await requireAppSession(request);

    return NextResponse.json({
      user: toNotificationUser(session.user),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

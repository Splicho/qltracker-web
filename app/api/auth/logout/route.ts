import { NextResponse } from "next/server";

import { invalidateSession, requireAppSession } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireAppSession(request);
    await invalidateSession(session.token);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}

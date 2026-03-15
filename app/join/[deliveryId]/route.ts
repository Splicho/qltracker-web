import { z } from "zod";

import { getPrisma } from "@/lib/server/prisma";
import { buildJoinHtml, buildOauthResultHtml } from "@/lib/server/routes";

const paramsSchema = z.object({
  deliveryId: z.string().min(1),
});

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ deliveryId: string }> },
) {
  const params = paramsSchema.parse(await context.params);
  const prisma = getPrisma();
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: params.deliveryId },
  });

  if (!delivery) {
    return new Response(
      buildOauthResultHtml(false, "This QLTracker join link no longer exists."),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 404,
      },
    );
  }

  return new Response(
    buildJoinHtml(delivery.serverNameSnapshot, delivery.serverAddr),
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

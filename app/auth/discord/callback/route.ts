import { LinkSessionStatus } from "@prisma/client";

import { createAppSession } from "@/lib/server/auth";
import { sendLinkConfirmation } from "@/lib/server/discord";
import { getPrisma } from "@/lib/server/prisma";
import {
  buildOauthResultHtml,
  exchangeDiscordCode,
  fetchDiscordIdentity,
  upsertDiscordUser,
} from "@/lib/server/routes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  const prisma = getPrisma();

  if (!state) {
    return new Response(buildOauthResultHtml(false, "Missing Discord OAuth state."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  const linkSession = await prisma.linkSession.findUnique({
    where: { oauthState: state },
  });

  if (!linkSession) {
    return new Response(
      buildOauthResultHtml(false, "This QLTracker link session is no longer valid."),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 404,
      },
    );
  }

  if (linkSession.expiresAt.getTime() <= Date.now()) {
    await prisma.linkSession.update({
      where: { id: linkSession.id },
      data: {
        errorMessage: "The Discord link session expired before completion.",
        status: LinkSessionStatus.expired,
      },
    });

    return new Response(
      buildOauthResultHtml(
        false,
        "This QLTracker link session expired. Start it again from the app.",
      ),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 400,
      },
    );
  }

  if (error || !code) {
    await prisma.linkSession.update({
      where: { id: linkSession.id },
      data: {
        errorMessage: error ?? "Discord OAuth was cancelled.",
        status: LinkSessionStatus.error,
      },
    });

    return new Response(
      buildOauthResultHtml(false, "Discord authorization did not complete."),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 400,
      },
    );
  }

  try {
    const tokenResponse = await exchangeDiscordCode(code);
    const identity = await fetchDiscordIdentity(tokenResponse.access_token);
    const user = await upsertDiscordUser(identity);
    const sessionToken = await createAppSession(user.id);

    let dmAvailable = false;
    let dmErrorMessage: string | null = null;
    try {
      await sendLinkConfirmation({
        discordUserId: identity.id,
        username: identity.username,
      });
      dmAvailable = true;
    } catch (error) {
      dmAvailable = false;
      dmErrorMessage =
        error instanceof Error
          ? error.message
          : "QLTracker could not send a Discord DM to this account yet.";
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        dmAvailable,
        dmErrorMessage: dmAvailable ? null : dmErrorMessage,
      },
    });

    await prisma.linkSession.update({
      where: { id: linkSession.id },
      data: {
        appSessionToken: sessionToken,
        completedAt: new Date(),
        errorMessage: dmAvailable ? null : dmErrorMessage,
        status: LinkSessionStatus.complete,
        userId: user.id,
      },
    });

    return new Response(
      buildOauthResultHtml(
        true,
        dmAvailable
          ? "QLTracker is installed on Discord and linked to your account. You can return to the app now."
          : dmErrorMessage ??
              "QLTracker is installed and linked, but Discord still refused the DM check. Return to the app for guidance.",
      ),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Discord OAuth failed.";
    await prisma.linkSession.update({
      where: { id: linkSession.id },
      data: {
        errorMessage: message,
        status: LinkSessionStatus.error,
      },
    });

    return new Response(buildOauthResultHtml(false, message), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 500,
    });
  }
}

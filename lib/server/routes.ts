import type { NotificationRule, ThresholdMode, User } from "@prisma/client";
import { z } from "zod";

import { getNotificationEnv } from "@/lib/server/env";
import { getPrisma } from "@/lib/server/prisma";

export type NotificationUserDto = {
  avatarUrl: string | null;
  discordUserId: string;
  dmAvailable: boolean;
  dmErrorMessage: string | null;
  globalName: string | null;
  id: string;
  username: string;
};

export type NotificationRuleDto = {
  createdAt: string;
  enabled: boolean;
  id: string;
  lastMatched: boolean;
  lastNotifiedAt: string | null;
  serverAddr: string;
  serverNameSnapshot: string;
  thresholdMode: ThresholdMode;
  thresholdValue: number;
  updatedAt: string;
};

export const discordIdentitySchema = z.object({
  avatar: z.string().nullable().optional(),
  global_name: z.string().nullable().optional(),
  id: z.string(),
  username: z.string(),
});

export const createRuleSchema = z.object({
  enabled: z.boolean().optional(),
  serverAddr: z.string().min(3),
  serverNameSnapshot: z.string().min(1),
  thresholdMode: z.enum(["min_players", "free_slots"]),
  thresholdValue: z.number().int().min(0).max(64),
});

export const updateRuleSchema = z.object({
  enabled: z.boolean().optional(),
  serverNameSnapshot: z.string().min(1).optional(),
  thresholdMode: z.enum(["min_players", "free_slots"]).optional(),
  thresholdValue: z.number().int().min(0).max(64).optional(),
});

export function toNotificationUser(user: User): NotificationUserDto {
  return {
    avatarUrl: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.discordUserId}/${user.avatar}.png`
      : null,
    discordUserId: user.discordUserId,
    dmAvailable: user.dmAvailable,
    dmErrorMessage: user.dmErrorMessage,
    globalName: user.globalName,
    id: user.id,
    username: user.username,
  };
}

export function toNotificationRule(rule: NotificationRule): NotificationRuleDto {
  return {
    createdAt: rule.createdAt.toISOString(),
    enabled: rule.enabled,
    id: rule.id,
    lastMatched: rule.lastMatched,
    lastNotifiedAt: rule.lastNotifiedAt?.toISOString() ?? null,
    serverAddr: rule.serverAddr,
    serverNameSnapshot: rule.serverNameSnapshot,
    thresholdMode: rule.thresholdMode,
    thresholdValue: rule.thresholdValue,
    updatedAt: rule.updatedAt.toISOString(),
  };
}

export function buildDiscordAuthorizeUrl(oauthState: string) {
  const env = getNotificationEnv();
  const url = new URL("https://discord.com/oauth2/authorize");

  url.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
  url.searchParams.set("integration_type", "1");
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "redirect_uri",
    `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}/auth/discord/callback`,
  );
  url.searchParams.set("scope", "identify applications.commands");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", oauthState);

  return url.toString();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildJoinHtml(serverName: string, serverAddress: string) {
  const escapedName = escapeHtml(serverName);
  const steamUrl = `steam://connect/${serverAddress}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>QLTracker Join Redirect</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: linear-gradient(180deg, #050505 0%, #121212 100%);
        color: #fafafa;
        font-family: Geist, Inter, system-ui, sans-serif;
      }
      .panel {
        width: min(28rem, 100%);
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 1.5rem;
        background: rgba(255,255,255,.05);
        padding: 2rem;
        text-align: center;
      }
      .logo {
        display: block;
        height: 2.8rem;
        width: auto;
        margin: 0 auto 1rem;
      }
      .title {
        margin: 0 0 .55rem;
        font-size: 1.55rem;
        font-weight: 600;
        letter-spacing: -.02em;
      }
      .meta {
        margin: 0 0 1.2rem;
        color: rgba(250,250,250,.72);
        line-height: 1.6;
        font-size: .98rem;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 11.5rem;
        height: 3rem;
        border-radius: .9rem;
        background: #00a63e;
        color: white;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <main class="panel">
      <img class="logo" src="/images/logo.png" alt="QLTracker" />
      <h1 class="title">Launching ${escapedName}</h1>
      <p class="meta">If Steam does not open automatically, use the button below.</p>
      <a class="button" href="${steamUrl}">Open in Steam</a>
    </main>
    <script>
      window.location.href = "${steamUrl}";
    </script>
  </body>
</html>`;
}

export function buildOauthResultHtml(success: boolean, message: string) {
  const escapedMessage = escapeHtml(message);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>QLTracker Discord Link</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: linear-gradient(180deg, #050505 0%, #121212 100%);
        color: #fafafa;
        font-family: Geist, Inter, system-ui, sans-serif;
      }
      .panel {
        width: min(28rem, 100%);
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 1.5rem;
        background: rgba(255,255,255,.05);
        padding: 2rem;
        text-align: center;
      }
      .logo {
        display: block;
        height: 2.8rem;
        width: auto;
        margin: 0 auto 1rem;
      }
      .state {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 7.5rem;
        justify-content: center;
        border-radius: 999px;
        padding: .45rem .95rem;
        margin-bottom: 1rem;
        border: 1px solid ${success ? "rgba(0,166,62,.32)" : "rgba(239,68,68,.28)"};
        background: ${success ? "rgba(0,166,62,.14)" : "rgba(239,68,68,.12)"};
        color: ${success ? "#7af0b0" : "#f7b1b1"};
        font-size: .92rem;
        font-weight: 600;
      }
      h1 {
        margin: 0 0 .7rem;
        font-size: 1.55rem;
        font-weight: 600;
        letter-spacing: -.02em;
      }
      p {
        margin: 0;
        color: rgba(250,250,250,.72);
        line-height: 1.6;
        font-size: .98rem;
      }
      .hint {
        margin-top: 1rem;
        color: rgba(250,250,250,.48);
        font-size: .85rem;
      }
    </style>
  </head>
  <body>
    <main class="panel">
      <img class="logo" src="/images/logo.png" alt="QLTracker" />
      <div class="state">${success ? "Connected" : "Failed"}</div>
      <h1>Discord Notifications</h1>
      <p>${escapedMessage}</p>
      <p class="hint">You can close this page and return to the app.</p>
    </main>
  </body>
</html>`;
}

export async function exchangeDiscordCode(code: string) {
  const env = getNotificationEnv();
  const body = new URLSearchParams();

  body.set("client_id", env.DISCORD_CLIENT_ID);
  body.set("client_secret", env.DISCORD_CLIENT_SECRET);
  body.set("grant_type", "authorization_code");
  body.set(
    "redirect_uri",
    `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}/auth/discord/callback`,
  );
  body.set("code", code);

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as { access_token: string };
}

export async function fetchDiscordIdentity(accessToken: string) {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discord identity lookup failed with HTTP ${response.status}.`);
  }

  return discordIdentitySchema.parse(await response.json());
}

export async function upsertDiscordUser(
  identity: z.infer<typeof discordIdentitySchema>,
) {
  const prisma = getPrisma();

  return prisma.user.upsert({
    where: { discordUserId: identity.id },
    update: {
      avatar: identity.avatar ?? null,
      globalName: identity.global_name ?? null,
      username: identity.username,
    },
    create: {
      avatar: identity.avatar ?? null,
      discordUserId: identity.id,
      globalName: identity.global_name ?? null,
      username: identity.username,
    },
  });
}

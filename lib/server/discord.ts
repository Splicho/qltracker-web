import { getNotificationEnv } from "@/lib/server/env";

const DISCORD_API_BASE = "https://discord.com/api/v10";

type DiscordApiErrorPayload = {
  code?: number;
  message?: string;
};

type DiscordUserIdentity = {
  discordUserId: string;
  username: string;
};

type NotificationMessageInput = {
  userId: string;
  serverName: string;
  map: string;
  serverAddress: string;
  players: number;
  maxPlayers: number;
  thresholdLabel: string;
  joinUrl: string;
};

type DiscordChannelResponse = {
  id: string;
};

type DiscordMessageResponse = {
  id: string;
};

const DISCORD_EMBED_COLOR = 0x00a63e;

function getHeaders() {
  const env = getNotificationEnv();

  return {
    Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function buildDiscordApiError(prefix: string, response: Response) {
  let detail = `HTTP ${response.status}`;

  try {
    const payload = (await response.json()) as DiscordApiErrorPayload;
    if (payload.message) {
      detail = payload.message;
      if (payload.code != null) {
        detail += ` (code ${payload.code})`;
      }
    }
  } catch {
    // Ignore invalid error payloads.
  }

  return new Error(`${prefix}: ${detail}.`);
}

async function ensureDmChannel(userId: string) {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
    body: JSON.stringify({
      recipient_id: userId,
    }),
    headers: getHeaders(),
    method: "POST",
  });

  if (!response.ok) {
    throw await buildDiscordApiError("Discord DM channel lookup failed", response);
  }

  return ((await response.json()) as DiscordChannelResponse).id;
}

async function sendDiscordMessage(
  channelId: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    body: JSON.stringify(body),
    headers: getHeaders(),
    method: "POST",
  });

  if (!response.ok) {
    throw await buildDiscordApiError("Discord DM send failed", response);
  }

  return ((await response.json()) as DiscordMessageResponse).id;
}

export async function sendLinkConfirmation(identity: DiscordUserIdentity) {
  const channelId = await ensureDmChannel(identity.discordUserId);

  return sendDiscordMessage(channelId, {
    embeds: [
      {
        color: DISCORD_EMBED_COLOR,
        description: "If DMs stay enabled, match notifications will arrive here.",
        title: `QLTracker linked for ${identity.username}`,
      },
    ],
  });
}

export async function sendServerNotification(input: NotificationMessageInput) {
  const channelId = await ensureDmChannel(input.userId);

  return sendDiscordMessage(channelId, {
    embeds: [
      {
        color: DISCORD_EMBED_COLOR,
        fields: [
          {
            inline: true,
            name: "Map",
            value: input.map,
          },
          {
            inline: true,
            name: "Players",
            value: `${input.players}/${input.maxPlayers}`,
          },
          {
            inline: false,
            name: "Rule",
            value: input.thresholdLabel,
          },
        ],
        title: input.serverName,
      },
    ],
    components: [
      {
        components: [
          {
            label: "Join Server",
            style: 5,
            type: 2,
            url: input.joinUrl,
          },
        ],
        type: 1,
      },
    ],
  });
}

export async function destroyDiscordClient() {
  return Promise.resolve();
}

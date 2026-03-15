const STEAM_SERVER_LIST_URL =
  "https://api.steampowered.com/IGameServersService/GetServerList/v1/";
const QUAKE_LIVE_APP_ID = "282440";
const CACHE_TTL_MS = 60_000;
const DEFAULT_QLSTATS_API_URL = "https://qlstats.net/api";

type SteamServerRecord = {
  addr: string;
  map?: string | null;
  max_players?: number | null;
  name?: string | null;
  players?: number | null;
};

type SteamServersPayload = {
  response?: {
    servers?: SteamServerRecord[];
  };
};

export type SteamServerSnapshot = {
  addr: string;
  map: string;
  maxPlayers: number;
  name: string;
  players: number;
};

type QlStatsPlayerRecord = {
  team?: number | null;
};

type QlStatsServerPayload = {
  players?: QlStatsPlayerRecord[];
};

export type ActivePlayerSnapshot = {
  activePlayers: number;
  spectatorPlayers: number;
  totalPlayers: number;
};

let cachedSnapshots = new Map<string, SteamServerSnapshot>();
let cachedAt = 0;
let inFlight: Promise<Map<string, SteamServerSnapshot>> | null = null;

export async function fetchSteamSnapshots(apiKey: string) {
  const url = new URL(STEAM_SERVER_LIST_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("filter", `\\appid\\${QUAKE_LIVE_APP_ID}`);
  url.searchParams.set("limit", "500");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 0,
    },
  });

  if (!response.ok) {
    throw new Error(`Steam server list returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as SteamServersPayload;
  const records = payload.response?.servers ?? [];

  return new Map<string, SteamServerSnapshot>(
    records.map((record) => [
      record.addr,
      {
        addr: record.addr,
        map: record.map?.trim() || "unknown",
        maxPlayers: record.max_players ?? 0,
        name: record.name?.trim() || "Unknown server",
        players: record.players ?? 0,
      },
    ]),
  );
}

export async function getCachedSteamSnapshots(apiKey: string) {
  const now = Date.now();
  if (cachedAt > 0 && now - cachedAt < CACHE_TTL_MS) {
    return cachedSnapshots;
  }

  if (!inFlight) {
    inFlight = fetchSteamSnapshots(apiKey)
      .then((snapshots) => {
        cachedSnapshots = snapshots;
        cachedAt = Date.now();
        return snapshots;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

function normalizeQlstatsBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  return trimmed || DEFAULT_QLSTATS_API_URL;
}

export async function fetchActivePlayerSnapshot(
  baseUrl: string,
  serverAddr: string,
) {
  const normalizedBaseUrl = normalizeQlstatsBaseUrl(baseUrl);
  const response = await fetch(
    `${normalizedBaseUrl}/server/${encodeURIComponent(serverAddr)}/players`,
    {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 0,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `QLStats player list returned HTTP ${response.status} for ${serverAddr}.`,
    );
  }

  const payload = (await response.json()) as QlStatsServerPayload;
  const players = payload.players ?? [];
  let activePlayers = 0;
  let spectatorPlayers = 0;

  for (const player of players) {
    if (player.team === 3) {
      spectatorPlayers += 1;
    } else {
      activePlayers += 1;
    }
  }

  return {
    activePlayers,
    spectatorPlayers,
    totalPlayers: players.length,
  } satisfies ActivePlayerSnapshot;
}

export async function fetchActivePlayerSnapshots(
  baseUrl: string,
  addrs: string[],
) {
  const uniqueAddrs = Array.from(new Set(addrs));
  const snapshots = await Promise.all(
    uniqueAddrs.map(async (addr) => {
      try {
        const snapshot = await fetchActivePlayerSnapshot(baseUrl, addr);
        return [addr, snapshot] as const;
      } catch {
        return [addr, null] as const;
      }
    }),
  );

  return new Map(
    snapshots.filter(
      (
        entry,
      ): entry is readonly [string, ActivePlayerSnapshot] => entry[1] !== null,
    ),
  );
}

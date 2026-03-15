import type { NotificationRule, ThresholdMode } from "@prisma/client";

export type ServerSnapshot = {
  addr: string;
  activePlayers?: number | null;
  map: string;
  maxPlayers: number;
  name: string;
  players: number;
};

export function evaluateRuleMatch(
  rule: Pick<
    NotificationRule,
    "thresholdMode" | "thresholdValue" | "matchCapacity"
  >,
  snapshot: Pick<ServerSnapshot, "activePlayers" | "maxPlayers" | "players">,
) {
  if (rule.thresholdMode === "min_players") {
    return snapshot.players >= rule.thresholdValue;
  }

  if (rule.thresholdMode === "active_free_slots") {
    if (rule.matchCapacity == null || snapshot.activePlayers == null) {
      return false;
    }

    const freeActiveSlots = Math.max(
      rule.matchCapacity - snapshot.activePlayers,
      0,
    );
    return freeActiveSlots <= rule.thresholdValue;
  }

  const freeSlots = Math.max(snapshot.maxPlayers - snapshot.players, 0);
  return freeSlots <= rule.thresholdValue;
}

export function evaluateRuleTransition(
  rule: Pick<
    NotificationRule,
    "lastMatched" | "thresholdMode" | "thresholdValue" | "matchCapacity"
  >,
  snapshot: Pick<ServerSnapshot, "activePlayers" | "maxPlayers" | "players"> | null,
) {
  const matched = snapshot ? evaluateRuleMatch(rule, snapshot) : false;

  return {
    matched,
    shouldNotify: matched && !rule.lastMatched,
  };
}

export function getThresholdLabel(
  thresholdMode: ThresholdMode,
  thresholdValue: number,
  matchCapacity?: number | null,
) {
  if (thresholdMode === "min_players") {
    return `${thresholdValue}+ players`;
  }

  if (thresholdMode === "active_free_slots") {
    const matchLabel =
      matchCapacity != null ? ` with total match size ${matchCapacity}` : "";
    return `${thresholdValue} active slot${thresholdValue === 1 ? "" : "s"} left or fewer${matchLabel}`;
  }

  return `${thresholdValue} free slot${thresholdValue === 1 ? "" : "s"} or fewer`;
}

export function clampThresholdValue(
  thresholdMode: ThresholdMode,
  thresholdValue: number,
  maxPlayers: number,
  matchCapacity?: number | null,
) {
  const maxBound = Math.max(
    thresholdMode === "active_free_slots"
      ? (matchCapacity ?? maxPlayers)
      : maxPlayers,
    1,
  );

  if (thresholdMode === "min_players") {
    return Math.min(Math.max(thresholdValue, 1), maxBound);
  }

  return Math.min(Math.max(thresholdValue, 0), maxBound);
}

export function clampMatchCapacity(matchCapacity: number, maxPlayers: number) {
  return Math.min(Math.max(matchCapacity, 1), Math.max(maxPlayers, 1));
}

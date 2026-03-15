import type { NotificationRule, ThresholdMode } from "@prisma/client";

export type ServerSnapshot = {
  addr: string;
  map: string;
  maxPlayers: number;
  name: string;
  players: number;
};

export function evaluateRuleMatch(
  rule: Pick<NotificationRule, "thresholdMode" | "thresholdValue">,
  snapshot: Pick<ServerSnapshot, "maxPlayers" | "players">,
) {
  if (rule.thresholdMode === "min_players") {
    return snapshot.players >= rule.thresholdValue;
  }

  const freeSlots = Math.max(snapshot.maxPlayers - snapshot.players, 0);
  return freeSlots <= rule.thresholdValue;
}

export function evaluateRuleTransition(
  rule: Pick<
    NotificationRule,
    "lastMatched" | "thresholdMode" | "thresholdValue"
  >,
  snapshot: Pick<ServerSnapshot, "maxPlayers" | "players"> | null,
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
) {
  return thresholdMode === "min_players"
    ? `${thresholdValue}+ players`
    : `${thresholdValue} free slot${thresholdValue === 1 ? "" : "s"} or fewer`;
}

export function clampThresholdValue(
  thresholdMode: ThresholdMode,
  thresholdValue: number,
  maxPlayers: number,
) {
  const maxBound = Math.max(maxPlayers, 1);

  if (thresholdMode === "min_players") {
    return Math.min(Math.max(thresholdValue, 1), maxBound);
  }

  return Math.min(Math.max(thresholdValue, 0), maxBound);
}

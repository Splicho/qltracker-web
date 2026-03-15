import { describe, expect, it } from "vitest";

import {
  clampThresholdValue,
  evaluateRuleTransition,
  getThresholdLabel,
} from "../lib/server/notifications";

describe("notification rule evaluation", () => {
  it("matches a false-to-true min_players crossing once", () => {
    const next = evaluateRuleTransition(
      { lastMatched: false, thresholdMode: "min_players", thresholdValue: 7 },
      { maxPlayers: 8, players: 7 },
    );

    expect(next.matched).toBe(true);
    expect(next.shouldNotify).toBe(true);
  });

  it("does not notify again while the rule stays matched", () => {
    const next = evaluateRuleTransition(
      { lastMatched: true, thresholdMode: "min_players", thresholdValue: 7 },
      { maxPlayers: 8, players: 8 },
    );

    expect(next.matched).toBe(true);
    expect(next.shouldNotify).toBe(false);
  });

  it("resets once the server falls back below threshold", () => {
    const next = evaluateRuleTransition(
      { lastMatched: true, thresholdMode: "free_slots", thresholdValue: 1 },
      { maxPlayers: 8, players: 5 },
    );

    expect(next.matched).toBe(false);
    expect(next.shouldNotify).toBe(false);
  });

  it("treats a missing snapshot as unmatched", () => {
    const next = evaluateRuleTransition(
      { lastMatched: true, thresholdMode: "free_slots", thresholdValue: 1 },
      null,
    );

    expect(next.matched).toBe(false);
    expect(next.shouldNotify).toBe(false);
  });

  it("formats labels and clamps thresholds", () => {
    expect(getThresholdLabel("min_players", 7)).toBe("7+ players");
    expect(getThresholdLabel("free_slots", 1)).toBe("1 free slot or fewer");
    expect(clampThresholdValue("min_players", 99, 16)).toBe(16);
    expect(clampThresholdValue("free_slots", -10, 16)).toBe(0);
  });
});

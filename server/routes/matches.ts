import { Router } from "express";

import { fetchPlayerMatches } from "../lib/faceit.js";
import type { MatchesResponse } from "../types.js";

export const matchesRouter = Router();

matchesRouter.get("/api/player/:id/matches", async (req, res) => {
  const playerId = req.params.id;
  if (!playerId || playerId.trim().length === 0) {
    res.status(400).json({ error: "Player ID is required." });
    return;
  }

  const limitParam = req.query.limit;
  const limit =
    typeof limitParam === "string" ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100) : 20;

  const result = await fetchPlayerMatches(playerId, limit);

  const response: MatchesResponse = {
    player_id: playerId,
    matches: result.matches,
    warnings: result.warnings,
  };

  res.json(response);
});

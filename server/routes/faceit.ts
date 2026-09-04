import { Router } from "express";

import type {
  FaceitMatchHistory,
  FaceitPlayerStats,
  FaceitSegment,
} from "../faceit-client.js";
import {
  FaceitApiError,
  getPlayerHistory,
  getPlayerStats,
  lookupPlayerBySteamId,
} from "../faceit-client.js";

// ---------------------------------------------------------------------------
// Response shapes — derived from what the FACEIT API actually returns
// ---------------------------------------------------------------------------

interface MapStat {
  map: string;
  matches: string;
  wins: string;
  winRate: string;
  imgSmall: string;
  imgRegular: string;
}

interface RecentMatch {
  matchId: string;
  startedAt: number;
  finishedAt: number;
  map: string | null;
  score: Record<string, number>;
  result: string;
  competitionName: string;
  matchType: string;
  teamId: string | null;
}

interface FaceitProfileResponse {
  nickname: string;
  playerId: string;
  avatar: string;
  country: string;
  level: number;
  elo: number;
  faceitUrl: string;
  lifetime: Record<string, string>;
  mapPool: MapStat[];
  recentMatches: RecentMatch[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string | null {
  return process.env["FACEIT_API_KEY"]
    ?? process.env["FLASHPEEK_FACEIT_API_KEY"]
    ?? null;
}

const STEAM_ID_RE = /^7656119\d{10}$/;

function toMapStat(seg: FaceitSegment): MapStat {
  return {
    map: seg.label,
    matches: seg.stats["Matches"] ?? "0",
    wins: seg.stats["Wins"] ?? "0",
    winRate: seg.stats["Win Rate %"] ?? "0",
    imgSmall: seg.img_small,
    imgRegular: seg.img_regular,
  };
}

function summariseMatch(
  match: FaceitMatchHistory,
  faceitPlayerId: string,
): RecentMatch {
  let teamId: string | null = null;
  for (const [factionKey, team] of Object.entries(match.teams)) {
    if (team.players.some((p) => p.player_id === faceitPlayerId)) {
      teamId = factionKey;
      break;
    }
  }

  const winner = match.results?.winner ?? null;
  let result = "unknown";
  if (winner && teamId) {
    result = winner === teamId ? "win" : "loss";
  }

  return {
    matchId: match.match_id,
    startedAt: match.started_at,
    finishedAt: match.finished_at,
    map: match.competition_name ?? null,
    score: match.results?.score ?? {},
    result,
    competitionName: match.competition_name,
    matchType: match.match_type,
    teamId,
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const faceitRouter = Router();

faceitRouter.get("/:steamId", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(503).json({
      error: "FACEIT API key not configured. Set FACEIT_API_KEY or FLASHPEEK_FACEIT_API_KEY.",
    });
    return;
  }

  const { steamId } = req.params;
  if (!steamId || !STEAM_ID_RE.test(steamId)) {
    res.status(400).json({
      error: "Invalid Steam ID. Expected a SteamID64 (76561198…).",
    });
    return;
  }

  try {
    const player = await lookupPlayerBySteamId(steamId, apiKey);

    const cs2 = player.games["cs2"];
    if (!cs2) {
      res.status(404).json({ error: "Player has no CS2 profile on FACEIT." });
      return;
    }

    const [stats, history] = await Promise.all([
      getPlayerStats(player.player_id, apiKey).catch((): FaceitPlayerStats | null => null),
      getPlayerHistory(player.player_id, apiKey).catch(() => null),
    ]);

    const mapPool: MapStat[] = (stats?.segments ?? [])
      .filter((s: FaceitSegment) => s.type === "Map")
      .map(toMapStat);

    const recentMatches: RecentMatch[] = (history?.items ?? []).map((m) =>
      summariseMatch(m, player.player_id),
    );

    const body: FaceitProfileResponse = {
      nickname: player.nickname,
      playerId: player.player_id,
      avatar: player.avatar,
      country: player.country,
      level: cs2.skill_level,
      elo: cs2.faceit_elo,
      faceitUrl: player.faceit_url,
      lifetime: stats?.lifetime ?? {},
      mapPool,
      recentMatches,
    };

    res.json(body);
  } catch (err) {
    if (err instanceof FaceitApiError) {
      if (err.status === 404) {
        res.status(404).json({ error: "Player not found on FACEIT." });
        return;
      }
      res.status(err.status >= 500 ? 502 : err.status).json({
        error: `FACEIT API error: ${err.message}`,
      });
      return;
    }
    throw err;
  }
});

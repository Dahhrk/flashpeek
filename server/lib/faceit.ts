import type { ApiWarning, FaceitMatch, MatchResult } from "../types.js";

const FACEIT_API_BASE = "https://open.faceit.com/data/v4";

type FaceitPlayerStats = {
  teams: Array<{
    players: Array<{
      player_id: string;
      nickname: string;
      player_stats: Record<string, string>;
    }>;
  }>;
};

type FaceitMatchItem = {
  match_id: string;
  started_at: number;
  finished_at: number;
  playing_players: string[];
  results: { score: Record<string, number> };
  competition_name?: string;
  faceit_url?: string;
};

type FaceitMatchListResponse = {
  items: FaceitMatchItem[];
};

type FaceitMatchStatsResponse = FaceitPlayerStats & {
  rounds: Array<{
    round_stats: Record<string, string>;
    teams: Array<{
      team_stats: Record<string, string>;
      players: Array<{
        player_id: string;
        nickname: string;
        player_stats: Record<string, string>;
      }>;
    }>;
  }>;
};

function getApiKey(): string | null {
  return (
    process.env.FLASHPEEK_FACEIT_API_KEY ??
    process.env.FACEIT_API_KEY ??
    null
  );
}

async function faceitFetch<T>(path: string, apiKey: string): Promise<T> {
  const url = `${FACEIT_API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FACEIT API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

function parseResult(
  matchStats: FaceitMatchStatsResponse,
  playerId: string,
): { result: MatchResult; kills: number; deaths: number; kd_ratio: number; map: string; score: string } | null {
  const round = matchStats.rounds?.[0];
  if (!round) return null;

  const map = round.round_stats?.Map ?? "unknown";
  const score = round.round_stats?.Score ?? "0 / 0";

  for (const team of round.teams) {
    const player = team.players.find((p) => p.player_id === playerId);
    if (!player) continue;

    const kills = parseInt(player.player_stats?.Kills ?? "0", 10);
    const deaths = parseInt(player.player_stats?.Deaths ?? "0", 10);
    const kdRaw = parseFloat(player.player_stats?.["K/D Ratio"] ?? "0");
    const kd_ratio = isNaN(kdRaw) ? 0 : Math.round(kdRaw * 100) / 100;

    const teamScore = parseInt(
      team.team_stats?.["Final Score"] ?? team.team_stats?.["Team Win"] ?? "0",
      10,
    );
    const otherTeam = round.teams.find((t) => t !== team);
    const otherScore = otherTeam
      ? parseInt(
          otherTeam.team_stats?.["Final Score"] ??
            otherTeam.team_stats?.["Team Win"] ??
            "0",
          10,
        )
      : 0;
    const result: MatchResult = teamScore > otherScore ? "win" : "loss";

    return { result, kills, deaths, kd_ratio, map, score };
  }

  return null;
}

export type FaceitResult = {
  matches: FaceitMatch[];
  warnings: ApiWarning[];
};

export async function fetchPlayerMatches(
  playerId: string,
  limit = 20,
): Promise<FaceitResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      matches: [],
      warnings: [
        {
          source: "faceit",
          code: "NO_API_KEY",
          message:
            "BLOCKED: keys absent. Set FLASHPEEK_FACEIT_API_KEY or FACEIT_API_KEY.",
        },
      ],
    };
  }

  let matchList: FaceitMatchListResponse;
  try {
    matchList = await faceitFetch<FaceitMatchListResponse>(
      `/players/${playerId}/history?game=cs2&offset=0&limit=${limit}`,
      apiKey,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404")) {
      return {
        matches: [],
        warnings: [
          {
            source: "faceit",
            code: "PLAYER_NOT_FOUND",
            message: `Player ${playerId} not found on FACEIT.`,
          },
        ],
      };
    }
    return {
      matches: [],
      warnings: [
        {
          source: "faceit",
          code: "API_ERROR",
          message: `FACEIT API error: ${msg}`,
        },
      ],
    };
  }

  const items = matchList.items ?? [];
  if (items.length === 0) {
    return { matches: [], warnings: [] };
  }

  const matches: FaceitMatch[] = [];
  const warnings: ApiWarning[] = [];

  for (const item of items) {
    try {
      const stats = await faceitFetch<FaceitMatchStatsResponse>(
        `/matches/${item.match_id}/stats`,
        apiKey,
      );
      const parsed = parseResult(stats, playerId);
      if (parsed) {
        matches.push({
          match_id: item.match_id,
          started_at: new Date(item.started_at * 1000).toISOString(),
          map: parsed.map,
          result: parsed.result,
          score: parsed.score,
          kills: parsed.kills,
          deaths: parsed.deaths,
          kd_ratio: parsed.kd_ratio,
        });
      }
    } catch {
      warnings.push({
        source: "faceit",
        code: "API_ERROR",
        message: `Failed to fetch stats for match ${item.match_id}.`,
      });
    }
  }

  return { matches, warnings };
}

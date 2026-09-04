const BASE_URL = "https://open.faceit.com/data/v4";

// ---------------------------------------------------------------------------
// Raw FACEIT Data API v4 response types — only fields the API actually returns
// ---------------------------------------------------------------------------

export interface FaceitGameProfile {
  region: string;
  game_player_id: string;
  game_player_name: string;
  game_profile_id: string;
  skill_level: number;
  faceit_elo: number;
  skill_level_label: string;
}

export interface FaceitPlayer {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  games: Record<string, FaceitGameProfile>;
  faceit_url: string;
}

export interface FaceitLifetime {
  [key: string]: string;
}

export interface FaceitSegment {
  type: string;
  mode: string;
  label: string;
  img_small: string;
  img_regular: string;
  stats: Record<string, string>;
}

export interface FaceitPlayerStats {
  player_id: string;
  game_id: string;
  lifetime: FaceitLifetime;
  segments: FaceitSegment[];
}

export interface FaceitMatchResult {
  winner: string;
  score: Record<string, number>;
}

export interface FaceitHistoryPlayer {
  player_id: string;
  nickname: string;
  avatar: string;
  skill_level: number;
  game_player_id: string;
  game_player_name: string;
  faceit_url: string;
}

export interface FaceitHistoryTeam {
  team_id: string;
  nickname: string;
  avatar: string;
  type: string;
  players: FaceitHistoryPlayer[];
}

export interface FaceitMatchHistory {
  match_id: string;
  game_id: string;
  region: string;
  match_type: string;
  game_mode: string;
  max_players: number;
  teams_size: number;
  teams: Record<string, FaceitHistoryTeam>;
  playing_players: string[];
  competition_id: string;
  competition_name: string;
  competition_type: string;
  organizer_id: string;
  started_at: number;
  finished_at: number;
  status: string;
  results: FaceitMatchResult;
  faceit_url: string;
}

export interface FaceitMatchHistoryList {
  items: FaceitMatchHistory[];
  start: number;
  end: number;
  from: number;
  to: number;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class FaceitApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`FACEIT API ${status}: ${body}`);
    this.name = "FaceitApiError";
  }
}

async function faceitFetch<T>(
  path: string,
  apiKey: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new FaceitApiError(res.status, text);
  }

  return (await res.json()) as T;
}

/** Resolve a Steam ID to a FACEIT player profile (CS2). */
export function lookupPlayerBySteamId(
  steamId: string,
  apiKey: string,
): Promise<FaceitPlayer> {
  return faceitFetch<FaceitPlayer>("/players", apiKey, {
    game: "cs2",
    game_player_id: steamId,
  });
}

/** Lifetime / per-segment stats for a player in CS2. */
export function getPlayerStats(
  playerId: string,
  apiKey: string,
): Promise<FaceitPlayerStats> {
  return faceitFetch<FaceitPlayerStats>(`/players/${playerId}/stats/cs2`, apiKey);
}

/** Recent match history for a player in CS2 (last 20 by default). */
export function getPlayerHistory(
  playerId: string,
  apiKey: string,
  limit = 20,
): Promise<FaceitMatchHistoryList> {
  return faceitFetch<FaceitMatchHistoryList>(
    `/players/${playerId}/history`,
    apiKey,
    { game: "cs2", offset: "0", limit: String(limit) },
  );
}

export type MatchResult = "win" | "loss";

export type FaceitMatch = {
  match_id: string;
  started_at: string;
  map: string;
  result: MatchResult;
  score: string;
  kills: number;
  deaths: number;
  kd_ratio: number;
};

export type WarningCode = "NO_API_KEY" | "API_ERROR" | "PLAYER_NOT_FOUND";

export type ApiWarning = {
  source: "faceit";
  code: WarningCode;
  message: string;
};

export type MatchesResponse = {
  player_id: string;
  matches: FaceitMatch[];
  warnings: ApiWarning[];
};

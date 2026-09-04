export interface PlayerLinks {
  rip: string | null;
  csrep: string | null;
  leetify: string | null;
  csstats: string | null;
}

export interface PlayerIdentity {
  username: string;
  steamId: string | null;
  faceitId: string | null;
  avatar: string | null;
}

export interface FaceitSeasonData {
  elo: number | null;
  level: number | null;
}

export interface FaceitData {
  elo: number | null;
  level: number | null;
  previous: FaceitSeasonData | null;
}

export interface PremierSeasonData {
  rating: number | null;
}

export interface PremierData {
  rating: number | null;
  previous: PremierSeasonData | null;
}

export interface RecentMatch {
  map: string;
  score: string;
  result: "W" | "L";
  date: string;
  matchId: string;
}

export interface PlayerData {
  username: string;
  identity: PlayerIdentity;
  faceit: FaceitData | null;
  premier: PremierData | null;
  recent: RecentMatch[] | null;
  form: Array<"W" | "L"> | null;
  links: PlayerLinks;
}

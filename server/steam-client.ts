const STEAM_API_BASE = "https://api.steampowered.com";
const CS2_APP_ID = 730;
const STEAM64_RE = /^7656119\d{10}$/;

function getApiKey(): string {
  const key =
    process.env["FLASHPEEK_STEAM_API_KEY"] ??
    process.env["STEAM_WEB_API_KEY"];
  if (!key) {
    throw new SteamApiError(
      "FLASHPEEK_STEAM_API_KEY or STEAM_WEB_API_KEY must be set",
      "NO_API_KEY",
    );
  }
  return key;
}

export class SteamApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NO_API_KEY"
      | "VANITY_NOT_FOUND"
      | "PROFILE_NOT_FOUND"
      | "UPSTREAM_ERROR",
  ) {
    super(message);
    this.name = "SteamApiError";
  }
}

export function isSteam64(input: string): boolean {
  return STEAM64_RE.test(input);
}

async function steamGet(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(path, STEAM_API_BASE);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new SteamApiError(
      `Steam API returned ${String(res.status)}`,
      "UPSTREAM_ERROR",
    );
  }
  return res.json() as Promise<unknown>;
}

export async function resolveVanityUrl(vanity: string): Promise<string> {
  const key = getApiKey();
  const data = (await steamGet("/ISteamUser/ResolveVanityURL/v0001/", {
    key,
    vanityurl: vanity,
  })) as { response: { success: number; steamid?: string } };

  if (data.response.success !== 1 || !data.response.steamid) {
    throw new SteamApiError(
      `Vanity URL "${vanity}" not found`,
      "VANITY_NOT_FOUND",
    );
  }
  return data.response.steamid;
}

interface RawPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  timecreated?: number;
  communityvisibilitystate?: number;
}

async function getPlayerSummary(
  steamId: string,
  key: string,
): Promise<RawPlayerSummary> {
  const data = (await steamGet("/ISteamUser/GetPlayerSummaries/v0002/", {
    key,
    steamids: steamId,
  })) as { response: { players: RawPlayerSummary[] } };

  const player = data.response.players[0];
  if (!player) {
    throw new SteamApiError(
      `No profile found for Steam64 ${steamId}`,
      "PROFILE_NOT_FOUND",
    );
  }
  return player;
}

interface RawPlayerBans {
  SteamId: string;
  CommunityBanned: boolean;
  VACBanned: boolean;
  NumberOfVACBans: number;
  DaysSinceLastBan: number;
  NumberOfGameBans: number;
  EconomyBan: string;
}

async function getPlayerBans(
  steamId: string,
  key: string,
): Promise<RawPlayerBans | null> {
  try {
    const data = (await steamGet("/ISteamUser/GetPlayerBans/v1/", {
      key,
      steamids: steamId,
    })) as { players: RawPlayerBans[] };
    return data.players[0] ?? null;
  } catch {
    return null;
  }
}

interface RawOwnedGames {
  game_count?: number;
  games?: Array<{ appid: number; playtime_forever: number }>;
}

async function getOwnedGames(
  steamId: string,
  key: string,
): Promise<RawOwnedGames | null> {
  try {
    const data = (await steamGet("/IPlayerService/GetOwnedGames/v0001/", {
      key,
      steamid: steamId,
      include_played_free_games: "1",
      format: "json",
    })) as { response: RawOwnedGames };
    return data.response;
  } catch {
    return null;
  }
}

export interface SteamProfile {
  steamId: string;
  personaName: string;
  profileUrl: string;
  avatarUrl: string;
  accountCreatedUnix: number | null;
  accountAgeYears: number | null;
  vacBanned: boolean;
  numberOfVacBans: number;
  daysSinceLastBan: number | null;
  gameBans: number;
  communityBanned: boolean;
  economyBan: string;
  cs2HoursPlayed: number | null;
}

function yearsSince(unixTimestamp: number): number {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - unixTimestamp * 1000) / msPerYear);
}

export async function fetchSteamProfile(idOrVanity: string): Promise<SteamProfile> {
  const key = getApiKey();

  const steamId = isSteam64(idOrVanity)
    ? idOrVanity
    : await resolveVanityUrl(idOrVanity);

  const [summary, bans, games] = await Promise.all([
    getPlayerSummary(steamId, key),
    getPlayerBans(steamId, key),
    getOwnedGames(steamId, key),
  ]);

  const cs2 = games?.games?.find((g) => g.appid === CS2_APP_ID);
  const cs2Hours = cs2 ? Math.round((cs2.playtime_forever / 60) * 10) / 10 : null;

  return {
    steamId: summary.steamid,
    personaName: summary.personaname,
    profileUrl: summary.profileurl,
    avatarUrl: summary.avatarfull,
    accountCreatedUnix: summary.timecreated ?? null,
    accountAgeYears: summary.timecreated ? yearsSince(summary.timecreated) : null,
    vacBanned: bans?.VACBanned ?? false,
    numberOfVacBans: bans?.NumberOfVACBans ?? 0,
    daysSinceLastBan: bans ? (bans.DaysSinceLastBan > 0 ? bans.DaysSinceLastBan : null) : null,
    gameBans: bans?.NumberOfGameBans ?? 0,
    communityBanned: bans?.CommunityBanned ?? false,
    economyBan: bans?.EconomyBan ?? "none",
    cs2HoursPlayed: cs2Hours,
  };
}

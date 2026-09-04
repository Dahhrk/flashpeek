import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

async function lookupPlayer(username: string) {
  const faceitKey = process.env["FLASHPEEK_FACEIT_KEY"] ?? "";
  const steamKey = process.env["FLASHPEEK_STEAM_KEY"] ?? "";

  const result = {
    username,
    identity: {
      username,
      steamId: null as string | null,
      faceitId: null as string | null,
      avatar: null as string | null,
    },
    faceit: null as { elo: number | null; level: number | null } | null,
    premier: null as { rating: number | null } | null,
    recent: null as
      | Array<{
          map: string;
          score: string;
          result: "W" | "L";
          date: string;
          matchId: string;
        }>
      | null,
    form: null as Array<"W" | "L"> | null,
    links: {
      rip: null as string | null,
      csrep: null as string | null,
      leetify: null as string | null,
      csstats: null as string | null,
    },
  };

  if (faceitKey) {
    try {
      const playerResp = await fetch(
        `https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(username)}&game=cs2`,
        { headers: { Authorization: `Bearer ${faceitKey}` } },
      );
      if (playerResp.ok) {
        const player = (await playerResp.json()) as Record<string, unknown>;
        result.identity.faceitId = (player["player_id"] as string) ?? null;
        result.identity.avatar = (player["avatar"] as string) ?? null;
        const steamId64 = player["steam_id_64"] as string | undefined;
        if (steamId64) result.identity.steamId = steamId64;

        const games = player["games"] as
          | Record<string, Record<string, unknown>>
          | undefined;
        const cs2 = games?.["cs2"];
        result.faceit = {
          elo: (cs2?.["faceit_elo"] as number) ?? null,
          level: (cs2?.["skill_level"] as number) ?? null,
        };

        const playerId = result.identity.faceitId;
        if (playerId) {
          const histResp = await fetch(
            `https://open.faceit.com/data/v4/players/${playerId}/history?game=cs2&offset=0&limit=20`,
            { headers: { Authorization: `Bearer ${faceitKey}` } },
          );
          if (histResp.ok) {
            const hist = (await histResp.json()) as {
              items?: Array<Record<string, unknown>>;
            };
            const matches: typeof result.recent = [];
            const formMarks: Array<"W" | "L"> = [];

            for (const match of hist.items ?? []) {
              const teams = match["teams"] as
                | Record<string, { players?: Array<{ player_id: string }> }>
                | undefined;
              const results = match["results"] as
                | Record<string, unknown>
                | undefined;
              const matchId = (match["match_id"] as string) ?? "";

              let playerTeam: string | null = null;
              if (teams) {
                for (const [faction, team] of Object.entries(teams)) {
                  if (team.players?.some((p) => p.player_id === playerId)) {
                    playerTeam = faction;
                    break;
                  }
                }
              }

              const winner = results?.["winner"] as string | undefined;
              const matchResult: "W" | "L" =
                playerTeam && winner === playerTeam ? "W" : "L";

              const score = results?.["score"] as
                | Record<string, number>
                | undefined;
              const scoreStr = score
                ? `${String(score["faction1"] ?? "?")}–${String(score["faction2"] ?? "?")}`
                : "–";

              const voting = match["voting"] as
                | { map?: { pick?: string[] } }
                | undefined;
              const mapName = voting?.map?.pick?.[0] ?? "Unknown";

              const startedAt = match["started_at"] as number | undefined;
              const dateStr = startedAt
                ? new Date(startedAt * 1000).toISOString().slice(0, 10)
                : "";

              matches.push({
                map: mapName,
                score: scoreStr,
                result: matchResult,
                date: dateStr,
                matchId,
              });
              formMarks.push(matchResult);
            }

            result.recent = matches;
            result.form = formMarks.slice(0, 10);
          } else {
            result.recent = [];
            result.form = [];
          }
        }
      }
    } catch {
      // FACEIT API unavailable — leave as null
    }
  }

  if (steamKey && !result.identity.steamId) {
    try {
      const vanityResp = await fetch(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steamKey}&vanityurl=${encodeURIComponent(username)}`,
      );
      if (vanityResp.ok) {
        const data = (await vanityResp.json()) as {
          response?: { success?: number; steamid?: string };
        };
        if (data.response?.success === 1 && data.response.steamid) {
          result.identity.steamId = data.response.steamid;
        }
      }
    } catch {
      // Steam API unavailable
    }
  }

  if (result.identity.steamId) {
    const sid = result.identity.steamId;
    result.links = {
      rip: `https://cs2.rip/player/${sid}`,
      csrep: `https://csrep.io/player/${sid}`,
      leetify: `https://leetify.com/app/profile/${sid}`,
      csstats: `https://csstats.gg/player/${sid}`,
    };
  }

  return result;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "flashpeek-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const match = req.url?.match(/^\/api\/player\/([^/?]+)/);
          if (!match?.[1]) {
            next();
            return;
          }

          const username = decodeURIComponent(match[1]);
          try {
            const data = await lookupPlayer(username);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        });
      },
    },
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 5174,
  },
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";

import express from "express";

import { matchesRouter } from "../routes/matches.js";
import type { MatchesResponse } from "../types.js";

let server: Server;
let baseUrl: string;

function startServer(): Promise<void> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());
    app.use(matchesRouter);
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}

beforeAll(async () => {
  delete process.env.FLASHPEEK_FACEIT_API_KEY;
  delete process.env.FACEIT_API_KEY;
  await startServer();
});

afterAll(() => {
  server?.close();
});

describe("GET /api/player/:id/matches", () => {
  it("returns NO_API_KEY warning when no key is set", async () => {
    const res = await fetch(`${baseUrl}/api/player/test-player-id/matches`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as MatchesResponse;
    expect(body.player_id).toBe("test-player-id");
    expect(body.matches).toEqual([]);
    expect(body.warnings).toHaveLength(1);
    expect(body.warnings[0]!.code).toBe("NO_API_KEY");
    expect(body.warnings[0]!.source).toBe("faceit");
    expect(body.warnings[0]!.message).toContain("BLOCKED");
  });

  it("returns correct shape with player_id, matches, and warnings", async () => {
    const res = await fetch(`${baseUrl}/api/player/some-id/matches`);
    const body = (await res.json()) as MatchesResponse;

    expect(body).toHaveProperty("player_id");
    expect(body).toHaveProperty("matches");
    expect(body).toHaveProperty("warnings");
    expect(Array.isArray(body.matches)).toBe(true);
    expect(Array.isArray(body.warnings)).toBe(true);
  });

  it("respects limit query parameter bounds", async () => {
    const res = await fetch(`${baseUrl}/api/player/some-id/matches?limit=5`);
    const body = (await res.json()) as MatchesResponse;
    expect(body.player_id).toBe("some-id");
    expect(body.warnings[0]!.code).toBe("NO_API_KEY");
  });

  it("returns 400 for missing player id with empty param", async () => {
    const res = await fetch(`${baseUrl}/api/player/%20/matches`);
    expect(res.status).toBe(400);
  });
});

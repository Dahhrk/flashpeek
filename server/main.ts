import express from "express";

import { fetchSteamProfile, SteamApiError } from "./steam-client.js";

const PORT = Number(process.env["FLASHPEEK_API_PORT"] ?? 3100);
const app = express();

app.get("/api/steam/:id", async (req, res) => {
  const id = req.params["id"];
  if (!id || id.trim().length === 0) {
    res.status(400).json({ error: "Missing Steam ID or vanity URL" });
    return;
  }

  try {
    const profile = await fetchSteamProfile(id.trim());
    res.json(profile);
  } catch (err: unknown) {
    if (err instanceof SteamApiError) {
      const status: Record<SteamApiError["code"], number> = {
        NO_API_KEY: 500,
        VANITY_NOT_FOUND: 404,
        PROFILE_NOT_FOUND: 404,
        UPSTREAM_ERROR: 502,
      };
      res.status(status[err.code]).json({ error: err.message, code: err.code });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Flashpeek API listening on http://localhost:${PORT}`);
});

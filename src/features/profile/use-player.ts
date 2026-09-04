import { useEffect, useState } from "react";

import type { PlayerData } from "./types";

interface PlayerState {
  status: "loading" | "loaded" | "error";
  data: PlayerData | null;
}

export function usePlayer(username: string): PlayerState {
  const [state, setState] = useState<PlayerState>({
    status: "loading",
    data: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", data: null });

    fetch(`/api/player/${encodeURIComponent(username)}`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${String(r.status)}`);
        return r.json() as Promise<PlayerData>;
      })
      .then((data) => {
        setState({ status: "loaded", data });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({ status: "error", data: null });
      });

    return () => controller.abort();
  }, [username]);

  return state;
}

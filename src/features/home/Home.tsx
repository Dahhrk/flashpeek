import type { FormEvent } from "react";
import { useCallback, useState } from "react";

import "./Home.css";

export function Home() {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        // Profile lookup will be wired in a future iteration.
      }
    },
    [query],
  );

  return (
    <main data-testid="home-root" className="home">
      <h1 data-testid="home-brand" className="home__brand">
        Flashpeek
      </h1>

      <form className="home__form" onSubmit={handleSubmit}>
        <input
          data-testid="home-search"
          className="home__search"
          type="text"
          placeholder="Search player…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search player by username"
        />
      </form>
    </main>
  );
}

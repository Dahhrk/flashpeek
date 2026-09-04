import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Home.css";

export function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        navigate(`/player/${encodeURIComponent(trimmed)}`);
      }
    },
    [query, navigate],
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
          placeholder="FACEIT or Steam username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="FACEIT or Steam username"
        />
        <button type="submit" className="home__submit">
          Peek
        </button>
      </form>
    </main>
  );
}

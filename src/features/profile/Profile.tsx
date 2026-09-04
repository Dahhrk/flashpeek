import { useParams } from "react-router-dom";

import type { PlayerData, RecentMatch } from "./types";
import { usePlayer } from "./use-player";

import "./Profile.css";

function IdentityPlate({ data }: { data: PlayerData }) {
  const hasLinks =
    data.links.leetify ??
    data.links.csstats ??
    data.links.rip ??
    data.links.csrep;

  return (
    <section data-testid="profile-identity" className="profile__plate profile__identity">
      <div className="profile__identity-row">
        <h1 className="profile__username">{data.identity.username}</h1>
        {data.identity.steamId && (
          <span className="profile__steam-id">{data.identity.steamId}</span>
        )}
      </div>
      {hasLinks && (
        <nav className="profile__links" aria-label="External profiles">
          {data.links.leetify && (
            <a href={data.links.leetify} target="_blank" rel="noopener noreferrer" className="profile__link">Leetify</a>
          )}
          {data.links.csstats && (
            <a href={data.links.csstats} target="_blank" rel="noopener noreferrer" className="profile__link">csstats</a>
          )}
          {data.links.rip && (
            <a href={data.links.rip} target="_blank" rel="noopener noreferrer" className="profile__link">.rip</a>
          )}
          {data.links.csrep && (
            <a href={data.links.csrep} target="_blank" rel="noopener noreferrer" className="profile__link">csrep</a>
          )}
        </nav>
      )}
    </section>
  );
}

function FaceitPlate({ data }: { data: PlayerData }) {
  return (
    <section data-testid="profile-faceit" className="profile__plate">
      <h2 className="profile__section-label">FACEIT</h2>
      {data.faceit ? (
        <>
          <div className="profile__stats-row">
            {data.faceit.elo != null && (
              <div className="profile__stat">
                <span className="profile__stat-label">Elo</span>
                <span className="profile__stat-value">{data.faceit.elo}</span>
              </div>
            )}
            {data.faceit.level != null && (
              <div className="profile__stat">
                <span className="profile__stat-label">Level</span>
                <span className="profile__stat-value">{data.faceit.level}</span>
              </div>
            )}
          </div>
          <div className="profile__season-block">
            <span className="profile__season-label">Previous season</span>
            {data.faceit.previous ? (
              <div className="profile__stats-row">
                {data.faceit.previous.elo != null && (
                  <div className="profile__stat">
                    <span className="profile__stat-label">Elo</span>
                    <span className="profile__stat-value">{data.faceit.previous.elo}</span>
                  </div>
                )}
                {data.faceit.previous.level != null && (
                  <div className="profile__stat">
                    <span className="profile__stat-label">Level</span>
                    <span className="profile__stat-value">{data.faceit.previous.level}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="profile__unavailable">Unavailable</p>
            )}
          </div>
        </>
      ) : (
        <p className="profile__unavailable">Unavailable</p>
      )}
    </section>
  );
}

function PremierPlate({ data }: { data: PlayerData }) {
  return (
    <section data-testid="profile-premier" className="profile__plate">
      <h2 className="profile__section-label">Premier</h2>
      {data.premier ? (
        <>
          <div className="profile__stats-row">
            {data.premier.rating != null && (
              <div className="profile__stat">
                <span className="profile__stat-label">Rating</span>
                <span className="profile__stat-value">{data.premier.rating}</span>
              </div>
            )}
          </div>
          <div className="profile__season-block">
            <span className="profile__season-label">Previous season</span>
            {data.premier.previous ? (
              <div className="profile__stats-row">
                {data.premier.previous.rating != null && (
                  <div className="profile__stat">
                    <span className="profile__stat-label">Rating</span>
                    <span className="profile__stat-value">{data.premier.previous.rating}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="profile__unavailable">Unavailable</p>
            )}
          </div>
        </>
      ) : (
        <p className="profile__unavailable">Unavailable</p>
      )}
    </section>
  );
}

function MatchRow({ match }: { match: RecentMatch }) {
  const resultClass =
    match.result === "W"
      ? "profile__match-result--win"
      : "profile__match-result--loss";

  return (
    <div className="profile__match-row" role="row">
      <span className={`profile__match-result ${resultClass}`} role="cell">
        {match.result}
      </span>
      <span className="profile__match-map" role="cell">{match.map}</span>
      <span className="profile__match-score" role="cell">{match.score}</span>
      <time className="profile__match-date" role="cell">{match.date}</time>
    </div>
  );
}

function RecentPlate({ data }: { data: PlayerData }) {
  return (
    <section data-testid="profile-recent" className="profile__plate">
      <h2 className="profile__section-label">Recent games</h2>
      {data.recent === null ? (
        <p className="profile__unavailable">Unavailable</p>
      ) : data.recent.length === 0 ? (
        <p className="profile__empty">No recent games</p>
      ) : (
        <div className="profile__match-table" role="table" aria-label="Recent games">
          {data.recent.map((m) => (
            <MatchRow key={m.matchId} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}

function FormStrip({ data }: { data: PlayerData }) {
  return (
    <section data-testid="profile-form" className="profile__plate profile__form-plate">
      <h2 className="profile__section-label">Form</h2>
      {data.form === null ? (
        <p className="profile__unavailable">Unavailable</p>
      ) : data.form.length === 0 ? (
        <p className="profile__unavailable">Unavailable</p>
      ) : (
        <div className="profile__form-marks" aria-label="Recent form">
          {data.form.map((mark, i) => (
            <span
              key={`${String(i)}-${mark}`}
              className={
                mark === "W"
                  ? "profile__form-mark profile__form-mark--win"
                  : "profile__form-mark profile__form-mark--loss"
              }
            >
              {mark}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const username = id ?? "";
  const { status, data } = usePlayer(username);

  if (status === "loading") {
    return (
      <div data-testid="profile-root" className="profile">
        <p className="profile__loading">Loading…</p>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div data-testid="profile-root" className="profile">
        <p className="profile__error">Failed to load profile for {username}</p>
      </div>
    );
  }

  return (
    <div data-testid="profile-root" className="profile">
      <IdentityPlate data={data} />
      <FaceitPlate data={data} />
      <PremierPlate data={data} />
      <RecentPlate data={data} />
      <FormStrip data={data} />
    </div>
  );
}

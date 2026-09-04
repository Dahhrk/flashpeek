# Matches Route — Curl Proof Transcript

Generated: 2026-09-04T05:37:54Z
Server: http://localhost:3100

## Environment

```
FLASHPEEK_FACEIT_API_KEY: (not set)
FACEIT_API_KEY: (not set)
```

## 1. Health check

```bash
$ curl -s http://localhost:3100/health
```

```json
{
    "ok": true
}
```

## 2. GET /api/player/:id/matches (no API key)

```bash
$ curl -s http://localhost:3100/api/player/test-player-123/matches
```

```json
{
    "player_id": "test-player-123",
    "matches": [],
    "warnings": [
        {
            "source": "faceit",
            "code": "NO_API_KEY",
            "message": "BLOCKED: keys absent. Set FLASHPEEK_FACEIT_API_KEY or FACEIT_API_KEY."
        }
    ]
}
```

## 3. GET /api/player/:id/matches with limit param (no API key)

```bash
$ curl -s "http://localhost:3100/api/player/test-player-123/matches?limit=5"
```

```json
{
    "player_id": "test-player-123",
    "matches": [],
    "warnings": [
        {
            "source": "faceit",
            "code": "NO_API_KEY",
            "message": "BLOCKED: keys absent. Set FLASHPEEK_FACEIT_API_KEY or FACEIT_API_KEY."
        }
    ]
}
```

## 4. GET /api/player/:id/matches with empty player id

```bash
$ curl -s -w "\nHTTP %{http_code}" http://localhost:3100/api/player/%20/matches
```

```
{"error":"Player ID is required."}
HTTP 400```

## Status

BLOCKED: API keys absent. Matches array is honestly empty.
No data was invented. Warnings clearly report `NO_API_KEY` with `BLOCKED: keys absent`.

### Required secrets

Set one of these environment variables to enable live FACEIT data:

- `FLASHPEEK_FACEIT_API_KEY` (preferred)
- `FACEIT_API_KEY` (fallback)

# Phase 2 — Premier Live Game Companion

The Premier Live Game companion is out of scope for the MVP.

## What it is

A desktop companion that detects the current Premier match and displays every player's stats in an overlay or side panel — similar to the FACEIT Live Game feature but for Valve's Premier mode.

## Why Phase 2

- Requires a desktop agent or companion app (not web-only).
- May involve reading game state (GSI or similar) which needs careful VAC-safety review.
- MVP ships website-first with FACEIT Live Game as the initial live feature.

## Do not build

- No desktop agent, overlay, or Electron shell.
- No game-state integration or process interaction.
- No Premier match detection logic.

These will be scoped and designed when Phase 2 begins.

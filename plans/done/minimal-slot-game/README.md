# Minimal Slot Game

## Goal

Build the smallest playable 3x3 slot game prototype for this Cocos Creator project with a separate Go backend.

The frontend should use built-in/simple Cocos assets only and support:

- Credit in
- Credit out
- Spin
- Auto spin
- Displaying a 3x3 board returned by the backend

The backend should support the matching game functions, SQLite persistence, and configurable board/reel settings.

## Current Status

Planning ready. Decisions are confirmed by the `/qdd-plan` request and phase files are available.

## How To Continue

1. Review every file under `plans/minimal-slot-game/phases/`.
2. Run `/qdd-phase {N}` for one phase or `/qdd-phase all` for the full MVP.

Implementation, tests, and smoke steps happen only through phase execution.

## Known Constraints And Assumptions

- Cocos Creator 3.8.x project conventions apply.
- Frontend and backend remain separated.
- WebSocket is the transport; game logic must stay outside transport code.
- Go backend owns authoritative balance, spin results, persistence, and validation.
- SQLite stores wallet/session and game configuration data.
- MVP should be intentionally small and playable before adding polish.

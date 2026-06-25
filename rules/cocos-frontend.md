# Cocos Frontend

## Defaults

- Use TypeScript and Cocos Creator 3.8.x APIs.
- Keep scene scripts thin. Move protocol and game-client behavior out of visual components.
- Preserve `.meta` files and UUID stability.
- Prefer explicit component references over runtime scene-wide searches when wiring stable UI.

## Slot MVP

- Start with one scene, a visible reel grid, spin button, balance/win text, and connection status.
- Render deterministic backend results; do not let client-side animation choose outcomes.
- Use generated or simple local assets only when they are enough for the first playable loop.

## Automation Hooks

- Add stable node names or component hooks for tests when needed.
- Avoid test-only visual text unless it is part of the real UI.


# E2E and Automation Testing

## Direction

Explore Cocos `automation-framework` / automation testing from `cocos/cocos-test-projects` as the starting reference.

Reference repo:

- `https://github.com/cocos/cocos-test-projects`
- The `v3.8.7` package.json references `automation-framework` `0.4.6`.

## Strategy

- Keep domain tests in Go for payout correctness.
- Use Cocos automation for engine/editor/player-facing behavior when possible.
- Use Playwright MCP for browser preview smoke tests, screenshots, and UI regression checks.
- Prefer deterministic backend fixtures for E2E spin results.

## First E2E Target

1. Launch backend with deterministic spin result.
2. Launch Cocos web preview/build.
3. Connect frontend to backend.
4. Click spin.
5. Assert displayed symbols, win, and balance.


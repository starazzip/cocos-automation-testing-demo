# E2E and Automation Testing

## Direction

Explore Cocos `automation-framework` / automation testing from `cocos/cocos-test-projects` as the starting reference.

Reference repo:

- `https://github.com/cocos/cocos-test-projects`
- Look for the older publicly available `automation-framework` `1.0.0` release and the matching `cocos-test-projects` source/commit.
- Do not use the `0.4.6` package reference as the main path; it was not publicly available when last checked.

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

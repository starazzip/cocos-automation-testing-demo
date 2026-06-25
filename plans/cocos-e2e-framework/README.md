# Cocos E2E Framework

## Goal

Build a reusable E2E testing framework for Cocos Creator games.

The sample Cocos slot game and Go backend are development fixtures only. They exist to simulate a real client/server game environment so the framework can prove that it is easy to adopt, easy to write test cases for, and reliable enough for day-to-day game development.

## Current Status

Alignment in progress.

## How To Continue

1. Fill `plans/cocos-e2e-framework/questionnaire.md`.
2. Run `/qdd-align`.
3. Review the generated `decisions.md`.
4. After decisions are confirmed, run `/qdd-plan`.

Do not create implementation phases, README usage docs, or code changes until decisions are confirmed.

## Known Constraints And Assumptions

- Cocos Creator 3.8.x project conventions apply.
- The framework should be reusable beyond this slot prototype.
- The Cocos frontend and Go backend are sample fixtures, not the product goal.
- Cocos automation should remain the primary place for game-facing assertions when practical.
- Playwright may orchestrate preview startup, browser control, screenshots, and VS Code Test Explorer integration.
- Backend fixtures should support deterministic test scenarios.
- Transport setup should stay separate from game and test-case logic.
- Final delivery should include README documentation and a step-by-step usage tutorial with a simple example.

# Project Agent Guide

This project is a Cocos Creator slot game prototype with a separate Go game backend.

## Read First

- Keep this file small. Put detailed or situational rules in `rules/`.
- Use Cocos Creator 3.8.x project conventions and avoid unrelated asset/meta churn.
- Target architecture: Cocos frontend, Go backend, WebSocket transport.
- Keep transport concerns separated from game/business logic through an adapter or service layer.
- Prefer end-to-end validation with Cocos automation testing plus Playwright MCP when UI behavior matters.

## Detail Index

- Product and architecture: `rules/architecture.md`
- Cocos frontend rules: `rules/cocos-frontend.md`
- Go backend rules: `rules/go-backend.md`
- WebSocket protocol rules: `rules/websocket-protocol.md`
- E2E and automation testing: `rules/e2e-testing.md`
- MCP workflow: `rules/mcp-workflow.md`


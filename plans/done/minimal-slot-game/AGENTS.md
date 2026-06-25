# Plan Agent Guide

## Objective

Create a minimal full-stack 3x3 slot game prototype with a Cocos Creator frontend and Go backend.

## Current Progress

Planning ready. Decisions are confirmed and phase files exist.

## Restrictions

- Do not implement code during `/qdd-plan`; this step creates phase artifacts only.
- Keep changes scoped to the slot MVP.
- Preserve Cocos asset `.meta` stability and avoid unrelated asset churn.
- Keep transport logic separated from game/business logic.
- Prefer standard Go library where reasonable; add dependencies only when they clearly improve the WebSocket or SQLite story.

## Phase Rule

Phases are created. Execute implementation only with `/qdd-phase {N}` or `/qdd-phase all`.

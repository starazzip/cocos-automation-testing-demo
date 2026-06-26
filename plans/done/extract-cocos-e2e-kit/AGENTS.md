# Extract Cocos E2E Kit Plan Guide

## Plan Objective

Split reusable Cocos E2E framework code into `starazzip/cocos-e2e-kit`, then reshape this repo into a clean frontend/backend demo project with two useful remote states:

- a playable branch before E2E framework adoption;
- `main` as the final state after following the kit README and adding E2E tests.

## Current Progress

Alignment in progress.

## Plan-Specific Restrictions

- Do not move code, rewrite Git history, create branches, push, or touch the external repo before decisions are confirmed.
- Keep framework code and demo app code clearly separated.
- Do not make Cocos asset or `.meta` churn unless required by the frontend folder move.
- Treat branch and remote operations as high-risk; verify the current branch, remotes, and working tree before each operation.
- Preserve a working playable state before E2E adoption.
- Keep user-facing plan and smoke-test content in Traditional Chinese unless explicitly requested otherwise.

## Phase Rule

Phases cannot be created before `decisions.md` is generated and confirmed by the user.

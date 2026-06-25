# Cocos E2E Framework Plan Guide

## Plan Objective

Create a practical E2E framework for Cocos Creator games that is easy to introduce into a project and easy for developers to extend with new test cases.

The included slot game frontend and Go backend are only fixtures for validating the framework in a realistic client/server setup.

## Current Progress

- Stage: alignment.
- Questionnaire is ready for user answers.
- Decisions and implementation phases have not been created.

## Plan-Specific Restrictions

- Do not treat slot gameplay polish as the main product.
- Keep reusable framework code, sample game code, backend fixtures, and documentation clearly separated.
- Prefer project-local patterns already present in `tests/e2e/`, `tools/`, and `rules/e2e-testing.md`.
- Avoid unrelated Cocos asset or `.meta` churn.
- Keep user-facing plan and smoke-test content in Traditional Chinese unless explicitly requested otherwise.
- README and tutorial work should happen after the framework behavior is defined and verified.

## Phase Rule

Phases cannot be created before `decisions.md` is generated and confirmed by the user.

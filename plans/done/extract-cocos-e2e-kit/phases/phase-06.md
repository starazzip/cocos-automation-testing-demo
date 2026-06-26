# Phase 06 - Final Smoke, Push, And Archive

## Status

Completed.

## Objective

對 kit repo 與 demo repo 做最後 smoke，確認兩個遠端分支都已正確 push，然後整理 QDD plan 狀態。

## Inputs

- Phase 02 kit repo commit
- Phase 03 `demo-without-e2e`
- Phase 04 `main`
- Phase 05 README 與 smoke steps

## Scope

- 驗證 kit repo 工作樹乾淨並已 push。
- 驗證 demo repo `demo-without-e2e` 已 push。
- 驗證 demo repo `main` 已 push。
- 跑最終 smoke。
- 更新 `smoke.md`。
- 如全部完成，將 plan 移到 `plans/done/`。

## Out Of Scope

- 不做新功能。
- 不做 force push。
- 不重寫已推送歷史。

## Plan

1. 讀取 Phase 02-05 結果。
2. 建立或更新 `smoke.md`。
3. 執行 kit repo final checks。
4. 執行 demo repo branch checks。
5. 執行 demo repo E2E checks。
6. 檢查遠端 branch 狀態。
7. Commit/push 最終文件與 plan 狀態。
8. 將 plan 移到 `plans/done/`。

## BDD

- Given 使用者 clone kit repo  
  When 閱讀 README  
  Then 能知道如何導入 framework。

- Given 使用者 checkout demo repo `demo-without-e2e`  
  When 啟動前後端  
  Then 能玩 demo，且尚未有 E2E framework。

- Given 使用者 checkout demo repo `main`  
  When 執行 README 的 E2E 指令  
  Then 三條 demo E2E 可列出並通過。

## TDD

- 跑 kit repo unit tests。
- 跑 demo repo E2E unit tests。
- 若 branch checkout 會改變 working tree，先確認乾淨再切換。

## Implement

- 更新 `smoke.md`。
- 更新 status。
- 必要時做最後小修。
- Commit/push。
- 歸檔 plan。

## E2E

- `npx playwright test --list`
- `npm run test:e2e`
- visual mode 指令只需文件驗證；除非使用者要求，不在 final smoke 強制 headed run。

## Review

- 確認 final branch 狀態與 README 描述一致。
- 確認沒有 untracked framework artifact。
- 確認遠端分支存在。

## Fix

- 如果 smoke 失敗，只修 smoke 或已知缺陷。
- 如果 branch 狀態錯誤，停止並回報，不 force push。

## Wrap Up

- 記錄：
  - kit repo commit hash
  - demo repo `demo-without-e2e` commit hash
  - demo repo `main` commit hash
  - final verification commands
  - push results

## Results

### Commits And Branches

- Kit repo `main`: `2f54565 Initial Cocos E2E kit`
- Demo repo `demo-without-e2e`: `4cc2aec Create playable demo branch without E2E`
- Demo repo `main`: pending final commit/push after plan archive.

### Final Verification

- Kit repo `npm test`: passed, 33 tests.
- Kit repo `git status -sb`: clean on `main`.
- Demo repo `server` `go test ./...`: passed.
- Demo repo `frontend` `npm run test:e2e:unit`: passed, 37 tests.
- Demo repo `frontend` `npx playwright test --list`: listed 3 tests.
- Demo repo `frontend` `npm run cocos:wait-preview`: passed.
- Demo repo `frontend` `npx playwright test -g "frontend-only deterministic spin"`: passed.
- Demo repo `frontend` `npm run test:e2e`: passed, 3 tests.
- `git ls-remote --heads origin demo-without-e2e main`: both branches exist.
- `git diff --check`: passed.

### Review

- Findings found and fixed:
  - Parallel final smoke of `npm run test:e2e:unit`, `npx playwright test --list`, and `npm run test:e2e` caused the full E2E command to time out because E2E helper ports/processes overlapped. The final full E2E was rerun alone and passed.
- Final findings: None.

## Verification

- kit repo `git status -sb`
- demo repo `git status -sb`
- `git ls-remote --heads origin demo-without-e2e main`
- kit repo tests
- demo repo tests
- `git diff --check`

## Done Criteria

- `starazzip/cocos-e2e-kit` 已 push framework。
- demo repo `demo-without-e2e` 已 push 且可遊玩。
- demo repo `main` 已 push 且 E2E 通過。
- `smoke.md` 完成。
- plan 已移到 `plans/done/extract-cocos-e2e-kit`。

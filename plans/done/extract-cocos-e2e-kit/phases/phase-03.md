# Phase 03 - Build Playable Demo Branch Without E2E

## Status

Completed.

## Objective

將本 repo 整理成「尚未導入 E2E framework 但可正常遊玩」的 demo 狀態，並推送遠端分支 `demo-without-e2e`。

## Inputs

- Phase 01 搬移清單
- Phase 02 kit repo 結果
- 本 repo Cocos frontend
- 本 repo `server/`
- 決策：前端放 `frontend/`，後端保留 `server/`

## Scope

- 建立或切換到 `demo-without-e2e` 分支。
- 將 Cocos 前端整理到 `frontend/`。
- 保留 `server/` 作為後端。
- 移除本 branch 中的 E2E framework scaffold 與 E2E 測項。
- 更新本 branch README，說明這是導入前狀態。
- 驗證前後端可用。
- 正常 commit 並 push `demo-without-e2e`。

## Out Of Scope

- 不在此分支導入 kit。
- 不保留 E2E tests。
- 不 force push。
- 不重寫遊戲玩法或後端產品邏輯。

## Plan

1. 確認工作樹乾淨與目前分支。
2. 從合適基準建立 `demo-without-e2e`。
3. 移動 Cocos frontend 到 `frontend/`。
4. 調整必要的 package/script/path。
5. 保留 `server/`，更新啟動指令。
6. 移除 E2E framework 與測試 scaffold：
   - `extensions/cocos-e2e-framework/`
   - `extensions/automation-framework/`
   - reusable E2E `tools/`
   - `tests/e2e/`
   - `assets/e2e/`
   - Playwright config/scripts
7. 更新 README。
8. 驗證可遊玩。
9. Commit 並 push `demo-without-e2e`。

## BDD

- Given 使用者 checkout `demo-without-e2e`  
  When 依 README 啟動 server 與 Cocos Preview  
  Then slot demo 應可正常遊玩。

- Given 使用者查看 repo 結構  
  When 尋找前後端  
  Then Cocos frontend 應在 `frontend/`，後端應在 `server/`。

## TDD

- 若 server 有 Go tests，執行相關 tests。
- 若 frontend 移動導致工具 scripts 需要改寫，對 scripts 做最小 command validation。

## Implement

- 移動前端檔案。
- 清除 E2E framework artifact。
- 更新 README 與 package scripts。
- Commit branch。

## E2E

- 不跑 E2E framework 測試，因為此分支是導入前狀態。
- 可用手動 smoke 或現有非 E2E 驗證確認遊戲能開。

## Review

- 檢查此分支沒有 framework scaffold。
- 檢查 README 沒把 E2E 當作已導入。
- 檢查前端移動沒有破壞 Cocos 專案必要檔案。

## Fix

- 若遊戲無法啟動，修正 frontend path 或 server 連線設定。
- 若 framework artifact 殘留，移除或轉成導入教學文字。

## Wrap Up

- 記錄 `demo-without-e2e` commit hash。
- 記錄 branch push 結果。
- 記錄可遊玩驗證方式與結果。

## Results

### Branch

- Branch: `demo-without-e2e`
- Commit: `4cc2aec Create playable demo branch without E2E`
- Push: `git push origin demo-without-e2e` passed.

### Changes

- Moved Cocos frontend into `frontend/`:
  - `frontend/assets/`
  - `frontend/settings/`
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/tsconfig.json`
- Kept Go backend in `server/`.
- Removed E2E framework scaffold from the branch:
  - root `tools/`
  - root `tests/e2e/`
  - root `playwright.config.mjs`
  - `extensions/cocos-e2e-framework/`
  - `extensions/automation-framework/`
  - `frontend/assets/e2e/`
- Removed personal Cocos MCP extension/settings from this demo branch:
  - `extensions/cocos-mcp-server/`
  - `frontend/settings/tool-manager.json`
  - `frontend/settings/mcp-server.json`
- Root README now describes this branch as the playable pre-E2E demo.

### Review

- Findings found and fixed:
  - `frontend/assets/e2e/` initially remained after moving `assets/`; it was removed.
  - Personal MCP settings initially appeared under `frontend/settings/`; they were removed.
- Final findings: None.

### Verification

- `go test ./...` in `server/`: passed.
- `rg` for E2E scaffold and MCP terms in `README.md frontend server`: only README branch-purpose references remain.
- `Test-Path extensions/tools/tests/playwright.config.mjs`: all false.
- `git diff --check`: passed.
- Branch push: passed.

## Verification

- `git status --short`
- `git branch --show-current`
- server build/test 或啟動驗證
- Cocos Preview 手動/工具化 smoke
- grep 確認無 E2E scaffold 主要路徑殘留
- `git push origin demo-without-e2e`

## Done Criteria

- `demo-without-e2e` 已 push。
- 分支可正常遊玩。
- 分支尚未導入 E2E framework。
- README 說明使用者可以從此分支開始導入。

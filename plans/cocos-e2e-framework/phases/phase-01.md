# Phase 01 - Runner Core And Framework Boundary

## Status

Completed on 2026-06-25.

## Objective

把目前 slot 專用的 Playwright orchestration 抽成可重用的 E2E runner core，明確切開框架、範例遊戲、後端 fixture 與 Cocos automation assertion 的責任。

## Inputs

- `plans/cocos-e2e-framework/decisions.md`
- `tests/e2e/cocos-slot.spec.mjs`
- `tools/automation-server.mjs`
- `tools/cocos-preview-proxy.mjs`
- `tools/cocos-rebuild-preview.mjs`
- `tools/wait-cocos-preview-bundle.mjs`
- `tools/e2e-cases.json`
- `rules/e2e-testing.md`

## Scope

- 建立 reusable runner core 與最小 config contract。
- 把 process 啟動、Cocos preview proxy、automation summary polling、testConfig 產生、log 路徑管理抽出 slot-specific spec。
- 讓現有 slot E2E 先成為 runner 的 sample consumer。
- 保留 Cocos automation 作為遊戲內 assertion 的主要執行點。
- 保持現有 `npm run test:e2e` 與 VS Code Test Explorer 可列出測項。

## Out Of Scope

- Cocos Creator extension UI 或安裝流程。
- 分檔測項 discovery/generator。
- 前端-only mock transport。
- README 最終教學。
- slot 遊戲玩法調整。

## Plan

1. 盤點 `tests/e2e/cocos-slot.spec.mjs` 中哪些邏輯是框架共用、哪些是 slot sample 專用。
2. 設計最小 runner API，例如讀取 case、建立 automation testConfig、啟動服務、開 preview、收 automation summary。
3. 將共用流程移到 framework-oriented module，讓 Playwright spec 只負責註冊 Playwright tests。
4. 將 slot 的 backend 啟動、database path、case metadata 留在 sample 層。
5. 確認 CLI 與 Test Explorer 的測試名稱維持穩定。

## BDD

- Given 一份 E2E case 設定，When 開發者執行 `npm run test:e2e -- --list`，Then Playwright 能列出每個 Cocos E2E case。
- Given 一個現有 slot case，When runner 執行該 case，Then runner 會產生對應 Cocos automation `testConfig.json` 並收集 automation summary。
- Given automation 回傳 failed，When runner 收到 summary，Then Playwright 測試失敗並附上可讀 log。

## TDD

- 為純函式加 focused tests，例如 testConfig 產生、case validation、log path 計算。
- 若 repo 尚無 Node unit test script，可在此 phase 加最小可執行驗證命令，避免只靠完整 E2E 發現錯誤。

### Result

- 新增 `tools/e2e/runner-core.test.mjs`。
- 新增 `npm run test:e2e:unit`。
- 覆蓋 testConfig 產生、case validation、run path、preview URL 與 automation failure log formatting。

## Implement

- 新增或整理 runner core 檔案，優先放在 `tools/` 下清楚命名的框架目錄。
- 保留現有 tools 的 public behavior；必要時以 wrapper 維持相容。
- 改寫 `tests/e2e/cocos-slot.spec.mjs` 讓它使用 runner core。
- 用 config 或 adapter 參數隔離 slot sample 的 Go backend 細節。

### Result

- 新增 `tools/e2e/runner-core.mjs`，包含 reusable runner core、process lifecycle、HTTP wait helpers、automation testConfig 產生、preview URL、summary polling 與 failure formatting。
- `tests/e2e/cocos-slot.spec.mjs` 改為只註冊 Playwright cases，並透過 `slotBackendEnvironment` 提供 demo Go backend setup。
- Slot backend 的 `server/` path、`SLOT_*` env、`slot.db` 只留在 sample spec，不在 runner core 內。
- Runner context 提供 `startManagedProcess`，adapter setup 失敗時也會納入 cleanup。

## E2E

- 執行 `npm run test:e2e -- --list`，確認 Test Explorer 可識別測項。
- 在 Cocos Preview 與必要服務可用時，執行現有 slot E2E。

### Result

- `npx playwright test --list` 列出 2 條 Cocos E2E。
- `npm run test:e2e` 通過 2 條現有 slot E2E。

## Review

- 檢查 runner core 是否仍直接寫死 slot class name、Go backend path、fixed port 或 WebSocket protocol。
- 檢查錯誤訊息是否能指出 log 路徑與 automation summary。
- 檢查是否產生不必要 Cocos asset 或 `.meta` churn。

### Result

- 自檢：runner core 沒有 slot class name、Go backend path 或 slot WebSocket protocol。
- 自檢：固定 automation/proxy port 已保留為 runner defaults，後續 adapter/config phase 可繼續擴展。
- 自檢：沒有 Cocos asset 或 `.meta` churn。
- `/qdd-review 1` completed on 2026-06-25：未發現需要修正的 correctness regression。
- 殘留風險：固定 automation/proxy default ports 仍存在，但已集中在 runner settings，後續 Phase 03 adapter/config 可繼續擴展。

## Fix

- 修正 review 或驗證發現的 runner coupling、錯誤處理、路徑計算與測試名稱問題。
- 若完整 E2E 因外部 Cocos Preview 狀態失敗，記錄失敗條件與可重跑命令。

## Wrap Up

- 在本 phase 檔記錄實際變更檔案與驗證結果。
- 若手動 smoke 步驟改變，更新 plan 的 `smoke.md`。

### Changed Files

- `package.json`
- `tests/e2e/cocos-slot.spec.mjs`
- `tools/e2e/runner-core.mjs`
- `tools/e2e/runner-core.test.mjs`
- `plans/cocos-e2e-framework/phases/phase-01.md`
- `plans/cocos-e2e-framework/status.md`

### Smoke

- 未新增手動 smoke 步驟；Phase 01 主要是 runner internals refactor，使用 automated verification 覆蓋。

## Verification

- `npm run test:e2e -- --list`
- `npm run test:e2e`
- 針對新增 runner pure logic 的 focused verification command。

### Result

- `npm run test:e2e:unit` passed：5 tests passed。
- `npx playwright test --list` passed：列出 2 tests。
- `npm run test:e2e` passed：2 tests passed。

## Done Criteria

- Playwright orchestration 的共用部分已成為 runner core。
- slot sample 不再是 runner core 的核心假設。
- 現有 E2E case 仍可列出並執行。
- framework、sample、backend fixture 邊界可從檔案結構與 config 看出來。

### Result

- Done.

## Review Findings

- None.

## Review Verification

- `npm run test:e2e:unit` passed：5 tests passed。
- `npx playwright test --list` passed：列出 2 tests。
- `npm run test:e2e` passed：2 tests passed。

# Phase 02 - Distributed Test Case Management

## Status

Not started.

## Objective

建立好的測項管理方式，避免所有測項集中在同一個檔案，讓開發者可以用簡單範本新增、搜尋、審查與執行單條 E2E。

## Inputs

- `plans/cocos-e2e-framework/decisions.md`
- Phase 01 runner core
- `tools/e2e-cases.json`
- `assets/slot-e2e.test.ts`
- `tests/e2e/cocos-slot.spec.mjs`

## Scope

- 設計測項 metadata 格式與 discovery/generation 流程。
- 支援每個測項或測項群組分檔管理。
- 讓 runner 取得單條測項的 `id`、`title`、Cocos script name、automation class name 與 optional tags/config。
- 提供新增測項的範本，讓開發者不用理解複雜 registry 實作。
- 保留 Test Explorer 單條測試列出與執行能力。

## Out Of Scope

- Extension UI 產生測項。
- 完整報表系統。
- 多遊戲/多裝置矩陣。
- Playwright 取代 Cocos automation assertion。

## Plan

1. 選定分檔測項結構，例如 `tests/e2e/cases/` 放 metadata，`assets/e2e/` 放 Cocos automation test class。
2. 定義簡單 metadata 欄位，讓一個測項檔能描述 Playwright 顯示名稱與 Cocos automation class。
3. 建立 manifest 產生或 discovery script，取代手動維護單一大型 `e2e-cases.json`。
4. 將現有 slot 測項拆成分檔或至少遷移到新結構的 sample layout。
5. 更新 runner 讀取新 manifest/discovery 結果。

## BDD

- Given 新增一個測項 metadata 檔，When 執行測項 discovery，Then 該測項出現在 runner case list。
- Given 多個測項分散在不同檔案，When 執行 `npm run test:e2e -- --list`，Then Test Explorer 仍列出每個單條測試。
- Given metadata 缺少必要欄位，When discovery 執行，Then 產生清楚錯誤並指出檔案。

## TDD

- 為 metadata validation、case discovery、manifest sorting 加 focused tests。
- 測試 duplicate `id`、missing `className`、missing script file 的失敗情境。

## Implement

- 新增 case discovery/manifest module。
- 更新 Playwright spec 或 runner 以 discovery 結果建立 tests。
- 新增測項範本檔與至少一個 slot sample case。
- 移除 `tools/e2e-cases.json` 的手動維護角色

## E2E

- 執行 `npm run test:e2e -- --list` 驗證每個分檔測項都被列出。
- 執行至少一條已遷移測項，確認 Cocos automation class 正確被載入。

## Review

- 檢查新增測項需要修改的檔案數是否足夠少。
- 檢查測項檔名、id、title、className 的命名規則是否一致。
- 檢查 discovery 是否 deterministic，避免 Test Explorer 清單順序飄移。

## Fix

- 修正 discovery 漏列、重複 id、錯誤訊息不清楚或排序不穩定問題。
- 修正範本讓第一次使用者能照著新增測項。

## Wrap Up

- 在本 phase 檔記錄新測項結構與驗證結果。
- 若新增測項流程需要人工檢查，更新 `smoke.md`。

## Verification

- Focused discovery/validation tests。
- `npm run test:e2e -- --list`
- 至少一條分檔測項的 E2E 執行。

## Done Criteria

- 測項不需要集中寫在單一大型檔案。
- 新增測項有清楚範本與少量 metadata。
- Runner 與 Test Explorer 能從新管理方式列出單條測試。
- 測項 discovery 對錯誤 metadata 有明確訊息。

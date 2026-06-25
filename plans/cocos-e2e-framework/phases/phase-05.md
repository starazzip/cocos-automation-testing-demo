# Phase 05 - Demo Migration And Full Validation

## Status

Not started.

## Objective

將現有 slot demo 遷移到新的 framework、測項管理、adapter 與 extension 產物上，證明框架可在真實 Cocos preview 流程中使用。

## Inputs

- Phase 01 runner core
- Phase 02 distributed case management
- Phase 03 adapters
- Phase 04 extension MVP
- `assets/slot-e2e.test.ts` 或新測項結構
- `server/`
- `tests/e2e/`
- `tools/`

## Scope

- 讓 slot demo 成為清楚的 sample project，不是框架核心。
- 驗證 backend-backed 與 frontend-only 測項都能在 demo 中執行。
- 驗證 CLI 與 VS Code Test Explorer 單條測試列出與執行。
- 改善測試 log、artifact、失敗訊息與 cleanup。
- 補齊 smoke steps。

## Out Of Scope

- slot 遊戲玩法擴充。
- 產品級後端品質。
- 視覺回歸平台。
- 多瀏覽器/多裝置矩陣。

## Plan

1. 用 extension 或 framework scaffold 產物整理 slot demo 的 E2E layout。
2. 遷移現有 `credit-in-out` 與 `forced-spin` case 到新測項管理方式。
3. 新增或調整一條 frontend-only sample case。
4. 確認 runner cleanup 不留下 Go backend、automation server 或 proxy process。
5. 整理 test artifacts，讓失敗時能快速定位 automation summary 與 logs。

## BDD

- Given demo slot project，When 執行所有 E2E，Then backend-backed 與 frontend-only cases 都能完成。
- Given 開發者在 VS Code Test Explorer 查看測試，When extension/scaffold 已初始化，Then 每條 Cocos E2E case 都能單獨顯示。
- Given 測試失敗，When 開發者查看 test results，Then 可看到 automation summary 與相關 process logs。

## TDD

- 若 Phase 01-04 已涵蓋 pure logic tests，本 phase 主要做 integration verification。
- 對 artifact path、case filtering、cleanup helper 可加 focused tests。

## Implement

- 遷移 slot case 檔案與 metadata。
- 更新 Playwright spec、runner config 或 sample config。
- 更新 demo adapter config 與 frontend-only fixture config。
- 改善失敗附檔與 cleanup 行為。

## E2E

- 執行 `npm run test:e2e -- --list`。
- 執行所有 demo E2E。
- 執行單條 backend-backed case。
- 執行單條 frontend-only case。

## Review

- 檢查 sample 是否仍有 slot-specific code 滲入 framework core。
- 檢查 Test Explorer 名稱是否清楚且穩定。
- 檢查 cleanup 是否處理成功與失敗兩種路徑。

## Fix

- 修正 demo 遷移、artifact、cleanup、case filtering、adapter selection 的問題。
- 若 Cocos Preview 狀態造成不穩定，記錄前置條件並調整等待或錯誤訊息。

## Wrap Up

- 在本 phase 檔記錄實際驗證指令與結果。
- 更新 `smoke.md`，包含 CLI、Test Explorer、backend-backed、frontend-only 驗證步驟。

## Verification

- `npm run test:e2e -- --list`
- `npm run test:e2e`
- 單條 backend-backed case。
- 單條 frontend-only case。

## Done Criteria

- Slot demo 已使用新的框架結構。
- CLI 與 VS Code Test Explorer 都可使用。
- backend-backed 與 frontend-only E2E 都被驗證。
- 失敗時有足夠 logs 與 summary 可診斷。

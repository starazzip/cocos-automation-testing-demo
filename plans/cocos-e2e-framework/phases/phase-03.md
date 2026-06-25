# Phase 03 - Pluggable Adapters And Frontend-Only E2E

## Status

Not started.

## Objective

讓框架支援可替換的環境/fixture adapter，包含 demo Go backend adapter 與完全無後端程式碼存取時的前端-only E2E 路徑。

## Inputs

- `plans/cocos-e2e-framework/decisions.md`
- Phase 01 runner core
- Phase 02 case management
- `server/`
- `assets/scripts/SlotGameService.ts`
- `assets/scripts/SlotWebSocketAdapter.ts`
- `assets/slot-e2e.test.ts` 或 Phase 02 後的新測項檔

## Scope

- 定義 adapter / fixture contract，例如 setup、teardown、runtime config、deterministic fixture 設定與清理。
- 將現有 Go backend 啟動流程包成 demo adapter。
- 設計並實作前端-only E2E 路徑，支援 mock transport、frontend test hook 或 client adapter。
- 保持 transport concerns 與遊戲邏輯分離。
- 讓測項能選擇使用 demo backend 或 frontend-only fixture。

## Out Of Scope

- 真實產品後端整合。
- 對未知專案後端架構做硬編碼假設。
- 完整 mock server 平台。
- 雲端測試服務。

## Plan

1. 定義 runner 可接受的 environment adapter contract。
2. 將現有 Go backend process、health check、db path 與 forced response 設定移入 demo adapter。
3. 定義 frontend-only fixture 注入方式，優先用可替換 client adapter 或明確 test hook，避免污染一般遊戲流程。
4. 新增一條前端-only sample case，證明無後端程式碼存取時仍能做 deterministic E2E。
5. 確認 demo backend 與 frontend-only 兩種路徑可並存。

## BDD

- Given 測項選擇 demo backend adapter，When runner 執行測試，Then Go demo backend 被啟動並在 teardown 後關閉。
- Given 測項選擇 frontend-only adapter，When runner 執行測試，Then 不需要啟動 Go backend 也能取得 deterministic game response。
- Given adapter setup 失敗，When runner 報錯，Then 錯誤訊息指出 adapter 名稱與 log path。

## TDD

- 為 adapter contract validation、setup/teardown ordering、runtime config merge 加 focused tests。
- 測試 adapter failure path，避免 process 或 port 留在背景。

## Implement

- 新增 adapter contract 與 demo Go backend adapter。
- 新增 frontend-only adapter 或 mock transport hook。
- 更新 runner config 讓測項可指定 adapter。
- 更新 sample 測項，至少保留一條 backend-backed case 與一條 frontend-only case。

## E2E

- 執行 backend-backed slot case。
- 執行 frontend-only slot case，確認不需要啟動 Go backend。
- 執行 `npm run test:e2e -- --list`，確認不同 adapter 的測項仍可列出。

## Review

- 檢查 adapter contract 是否足夠小且不綁死 Go/WebSocket。
- 檢查 frontend-only hook 是否只在 automation/test mode 生效。
- 檢查 teardown 是否可靠，避免背景 process 殘留。

## Fix

- 修正 adapter coupling、test hook 洩漏、teardown 不完整或錯誤訊息不清楚問題。
- 若前端-only 路徑需要改遊戲 transport 層，保持改動在 adapter/service layer。

## Wrap Up

- 在本 phase 檔記錄 adapter contract、sample adapter 與驗證結果。
- 補充 smoke steps，讓人工可確認 frontend-only case 不依賴後端。

## Verification

- Focused adapter tests。
- `npm run test:e2e -- --list`
- backend-backed E2E case。
- frontend-only E2E case。

## Done Criteria

- 框架核心不綁死 Go backend 或特定 WebSocket protocol。
- demo backend adapter 可用。
- 前端-only E2E 可用。
- 測項可用簡單設定選擇 adapter。

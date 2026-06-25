# Phase 05 - 整合、Smoke 與文件

## 狀態

已規劃。

## 目標

整合 MVP，讓 local startup 可重複執行，並產出給人操作的完整 slot loop smoke steps。

## 輸入

- 已完成的 phases 01-04
- 所有 plan decisions
- 目前 project rules

## 範圍

- 確認 backend 與 frontend commands 已記錄。
- 確認 SQLite default path 與 reset behavior 清楚。
- 確認 smoke steps 涵蓋 credit-in、bet selection、spin、auto spin、credit-out 與 restart 後 persistence。
- 新增或更新 `plans/minimal-slot-game/smoke.md`。
- 執行相關 final verification。

## 不在範圍

- New game features。
- 除明顯 layout broken fixes 之外的 visual polish。
- CI/CD packaging。

## 計畫

1. 重新執行 backend tests。
2. 重新執行本機可用的 Cocos compile/build 或 preview check。
3. 重新執行 automation-testing E2E 或 documented fallback。
4. 使用繁體中文撰寫 smoke steps。
5. 更新 phase notes，記錄 final commands 與 residual risks。

## BDD

- 給定 fresh checkout 與 documented commands，當 backend 與 frontend 啟動時，MVP 應可遊玩。
- 給定玩家 credit-in 並 restart backend，當再次載入 balance 時，persisted balance 應保留。
- 給定使用 credit-out，當查詢 balance 時，balance 應為 zero 並顯示 paid-out amount。

## TDD

使用早期 phases 已有的 Go tests。只新增 integration 過程發現缺漏的 regression tests。

## 實作

- 只做小型 integration fixes。
- 新增 smoke documentation。
- 避免 broad refactors。

## E2E

執行 phase 04 automation path 或 fallback，並記錄結果。

## 審查

檢查 docs 中 commands 是否正確，並確認 MVP scope 符合 decisions。

## 修正

只修正此階段發現的 integration 或 verification failures。

## 收尾

準備 final summary，並進入 review/smoke workflow。

## 驗證

- 在 `server/` 執行 `go test ./...`
- Cocos compile/build 或 preview check
- Automation-testing E2E 或 documented fallback
- `smoke.md` 中的 manual smoke steps

## 完成標準

- Full MVP 有可重複 startup 與 verification notes。
- Smoke file 已存在。
- Remaining risks 已記錄。

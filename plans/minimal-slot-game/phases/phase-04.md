# Phase 04 - Automation Testing E2E

## 狀態

已規劃。

## 目標

加入 Cocos automation-testing coverage，執行 credit-in 與 spin，並驗證 balance 與 3x3 board output。

## 輸入

- 已完成的 phase 03 frontend
- 已完成的 phase 02 backend
- `rules/e2e-testing.md`
- `plans/minimal-slot-game/decisions.md`

## 範圍

- 調查此專案可用的 Cocos automation-testing package/framework。
- 若尚未提供，加入 deterministic backend fixture support。
- E2E 必須使用強制盤面功能設定下一次 spin 結果，而不是依賴隨機結果。
- 新增 E2E test flow：
  - 以 deterministic config 啟動 backend，
  - 設定下一次 spin 的固定 3x3 盤面，
  - 啟動 Cocos test target，
  - credit-in，
  - spin，
  - assert balance，
  - assert board symbols。
- 記錄任何 Cocos automation limitations。

## 不在範圍

- Full browser visual regression。
- Exhaustive payout tests；這些屬於 Go unit tests。
- CI setup，除非非常簡單。

## 計畫

1. 驗證此 local project 中 Cocos Creator 3.8.x 的 automation-testing 可用性。
2. 加入 automation 需要的 test hooks 或 adapters，但不加入只為測試存在的可見文字。
3. 建立 deterministic spin fixture path。
4. 在 E2E 前置步驟呼叫 test mode force-board 介面，指定可預期的中獎或不中獎盤面。
5. 撰寫 E2E test 與 commands。
6. 若 automation-testing 被阻塞，停止 phase，記錄 blocker，等待問題排除；不提供 Playwright/manual fallback。

## BDD

- 給定 backend deterministic mode 回傳已知 board，當 automation credit-in 並 spin 時，UI 應顯示該 board。
- 給定已知 board 有已知 payout，當 spin 完成時，win 與 balance 應符合 expected values。
- 給定 test mode 強制盤面被設定為三條橫線之一中獎，當 automation spin 完成時，UI 顯示盤面與後端計算的 win/balance 必須一致。

## TDD

此階段本身就是 E2E verification，不另作單獨 unit-test layer。

## 實作

- 新增最小 automation test files 與 scripts。
- 只有在 repeatable E2E 需要時，加入 deterministic backend config/flag。
- 保持 test harness 與 production game logic 分離。
- E2E setup 應明確啟動 test mode，並在測試結束後不污染一般 SQLite/production run。

## E2E

端到端執行新的 automation test。

## 審查

檢查 E2E 是否真的 assert backend-driven symbols 與 balance，而不只是點擊 buttons。
確認測試有先設定強制盤面，且 assertion 同時涵蓋盤面文字、win、balance。

## 修正

修正 automation flakiness、missing hooks、launch order 或 deterministic fixture mismatches。
若 force-board 介面與 automation 啟動順序有 race condition，應優先修正。

## 收尾

記錄精確 E2E command 與 known limitations。

## 驗證

- Cocos automation-testing E2E command
- 在 `server/` 執行 `go test ./...`
- Test mode force-board E2E command 或前置 script

## 完成標準

- Automated E2E 能透過強制盤面驗證 credit-in 與 spin amount/board correctness。若 automation-testing 被阻塞，phase 必須停在 documented blocker，不以 fallback 視為完成。

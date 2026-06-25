# Phase 05 - 整合、Smoke 與文件

## 狀態

已完成：本機啟動流程、DB reset/persistence 說明、manual smoke steps 與 final verification 已記錄。

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

執行紀錄：

- 新增 `plans/minimal-slot-game/smoke.md`，以繁體中文記錄本機啟動、DB reset behavior、manual smoke steps、automation E2E 指令、expected results、failure signals 與 checklist。
- 確認後端預設 DB path 為 `server/slot.db`；可用 `SLOT_DB_PATH` 指定，刪除 DB 或更換 path 可 reset local state。
- 確認 documented startup 使用：
  - backend：`cd server; $env:SLOT_ADDR='127.0.0.1:8080'; $env:SLOT_DB_PATH='slot.db'; go run ./cmd/server`
  - Cocos Preview：Creator 開啟 `assets/main.scene` 後啟動 Preview。
  - automation E2E：`npm run test:e2e`。
- 未做 gameplay code 變更；此 phase 僅新增 smoke 文件並執行 final verification。

## E2E

執行 phase 04 automation path 或 fallback，並記錄結果。

結果：通過。`npm run test:e2e` 執行兩條 Cocos automation E2E：

- `Cocos E2E: credit-in and credit-out`
- `Cocos E2E: forced board spin payout`

## 審查

檢查 docs 中 commands 是否正確，並確認 MVP scope 符合 decisions。

檢查結果：commands 已覆蓋 backend startup、DB reset/persistence、manual smoke 與 automation E2E。MVP scope 仍符合 decisions：不新增美術、音效、正式後台、登入、多玩家或真金流。

Review 5 結果：

- 通過，未發現新的 Phase 5 finding。
- `smoke.md` 已涵蓋 credit-in、bet selection、spin、auto spin、credit-out、restart 後 persistence、DB reset 與 automation E2E。
- 驗證結果：`go test ./server/...` 通過；focused Cocos TypeScript check 通過；Node script syntax check 通過；`npx playwright test --list` 可列出兩條 Cocos E2E；`npm run test:e2e` 通過，2 tests passed。

Smoke follow-up 修正：

- 使用者在 manual Cocos Preview 看到 `testConfig.json` parse error；原因是 automation runtime 在一般 `7456` Preview 也會啟動並讀取 `testConfig.json`，但該檔只由 `7457` proxy 提供。
- 已調整 automation runtime：只有 URL query 帶 `automation=1` 時才執行 `Runner.run()`；一般 manual Preview 不再讀取 `testConfig.json`。
- 已調整 Playwright wrapper：E2E 開啟 `http://127.0.0.1:7457?automation=1`，可視化模式加上 `visual=1`。
- 已修正 E2E wrapper shutdown：等待 Windows `taskkill` 完成，並在每條 case 啟動前確認 `8080`、`8000`、`7457` 未被前一條 case 占用，避免連到錯誤 backend/test mode。
- Follow-up 驗證：`node --check tests/e2e/cocos-slot.spec.mjs` 通過；focused Cocos TypeScript check 通過；`go test ./server/...` 通過；`npm run cocos:rebuild-preview` 通過；`npm run test:e2e` 通過，2 tests passed。

Manual smoke 結果：

- 使用者於 `2026-06-25T15:03:09+08:00` 確認 `plans/minimal-slot-game/smoke.md` checklist 全部完成。

## 修正

只修正此階段發現的 integration 或 verification failures。

未發現需要 code fix 的 integration failure。

## 收尾

準備 final summary，並進入 review/smoke workflow。

剩餘風險：

- Manual smoke 仍依賴使用者本機 Cocos Creator Preview 狀態；若 Preview 未啟動，automation proxy 無法載入 `7456`。
- Persistence manual check 需使用同一個 `SLOT_DB_PATH` 才能驗證保留 balance。
- UI 為 MVP built-in controls，未涵蓋正式視覺 polish。

## 驗證

- 在 `server/` 執行 `go test ./...`
- Cocos compile/build 或 preview check
- Automation-testing E2E 或 documented fallback
- `smoke.md` 中的 manual smoke steps

已執行：

- `go test ./server/...`，通過。
- Focused Cocos TypeScript check，通過：
  `tsc --noEmit --skipLibCheck --target ES2020 --module ESNext --moduleResolution Node --experimentalDecorators --types C:\ProgramData\cocos\editors\Creator\3.8.8\resources\resources\3d\engine\bin\.declarations\cc assets\main.ts assets\slot-e2e.test.ts assets\scripts\protocol.ts assets\scripts\SlotWebSocketAdapter.ts assets\scripts\SlotGameService.ts`
- Node script syntax check，通過：
  `node --check tests\e2e\cocos-slot.spec.mjs; node --check tools\automation-server.mjs; node --check tools\cocos-preview-proxy.mjs; node --check tools\cocos-rebuild-preview.mjs; node --check tools\wait-cocos-preview-bundle.mjs`
- `npx playwright test --list`，通過並列出兩條 Cocos E2E。
- `npm run test:e2e`，通過，2 tests passed。
- `plans/minimal-slot-game/smoke.md` 已建立。

## 完成標準

- Full MVP 有可重複 startup 與 verification notes。
- Smoke file 已存在。
- Remaining risks 已記錄。

結果：完成。

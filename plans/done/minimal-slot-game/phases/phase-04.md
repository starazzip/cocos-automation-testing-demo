# Phase 04 - Automation Testing E2E

## 狀態

已完成：Cocos `automation-framework` E2E 已能執行開分、強制盤面 Spin，並驗證金額與 3x3 盤面。

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

執行紀錄：

- 已調查 `cocos/cocos-test-projects` 遠端分支與 tag。
- `auto-test` 分支與 `v1.0.0` tag 未包含 automation package dependency。
- `develop`、`v3.7`、`v3.8` 到 `v3.8.8` 等歷史分支的 `package.json` 使用 `creator.dependencies.automation-framework = 0.4.6`。
- npm registry 的 `automation-framework@1.0.0` / `1.0.2` 是非 Cocos 的 deprecated package，description 為 `Seller Apps Automation Framework`，不適合安裝到本專案。
- 已在專案層 `package.json` 加入 Cocos 官方測試專案同款 `creator.dependencies.automation-framework = 0.4.6` 與 `creator.registry.remote = {}`，作為最小接入嘗試。
- 已透過 Cocos MCP 執行 `project_refresh_assets`，但目前專案 `extensions/`、`profiles/`、`settings/`、`temp/`、`library/` 內沒有產生或載入 `automation-framework`。
- 已查詢 Cocos MCP project/server/debug 狀態，沒有 automation package 載入紀錄或 console error。
- 使用者指出 `automation-framework` 應在 `cocos-test-projects` 歷史分支中；已追蹤 PR #713 後的歷史。
- PR #713 merge commit `9ce34017` 首次加入 `extensions/automation-framework`。
- 最後仍保留本地 extension 的可用 commit 為 `2e42d11a073ffc32bd711379d92a84bd395d28f4`；下一個相關 commit `06e3e273` 已刪除本地 extension 並改走 package dependency。
- 已從 `2e42d11a` 複製 `extensions/automation-framework` 到本專案。
- 已移除本專案 `package.json` 中先前嘗試的 `creator.dependencies.automation-framework = 0.4.6`，避免本地 extension 與遠端 package dependency 撞名。
- 已確認 `extensions/automation-framework/node_modules` 不進版控；extension 本體、`dist/`、`package.json` 與 `package-lock.json` 進版控，依賴可用 `npm install` 還原。
- Cocos Creator 重啟後，本地掃描確認 `library/.automation-framework`、`library/.automation-framework-data.json`、`temp/asset-db/automation-framework` 已存在。
- `temp/programming/packer-driver/targets/preview/import-map.json` 已包含 `extensions/automation-framework/assets/runtime/main.ts` 與 `test-framework.mjs`，表示 automation runtime 已進 preview bundle。
- 新增 `assets/slot-e2e.test.ts`：
  - 以 `@runScene('main')` 註冊 Cocos automation tests。
  - 拆成 `slot_credit_in_out_e2e` 與 `slot_forced_spin_e2e`，讓 VS Code Test Explorer 可選擇單條 E2E 執行。
  - 透過穩定節點名稱點擊 `CreditOutButton`、`CreditInButton`、`SpinButton`。
  - 直接呼叫後端 `test.force_board.request` 設定下一次 spin 盤面。
  - 驗證 `BalanceLabel = BALANCE 129`、`WinLabel = WIN 30` 與 3x3 cell 文字。
- 新增 `tools/e2e-cases.json`，作為 VS Code Test Explorer wrapper 的 E2E case manifest。
- 新增 `tests/e2e/cocos-slot.spec.mjs` 與 `playwright.config.mjs`，讓 Playwright VS Code extension 能 discover Cocos E2E 並單條執行。
- 新增 `tools/e2e-test-explorer.md`，記錄 VS Code Test Explorer 使用方式與新增 E2E 流程。
- 新增 `tools/automation-server.mjs`，提供 automation-framework 需要的 `/ws/caster`、`/runtime/log`、`/runtime/nowScript`、`/runtime/scriptRunError`。
- 新增 `tools/testConfig.slot-e2e.json`，指定 `slot-e2e.test.ts` 的兩條 E2E class。
- 新增 `tools/cocos-preview-proxy.mjs`，在 `http://127.0.0.1:7457/testConfig.json` 提供測試設定，其餘請求代理到 Cocos Preview `7456`。
- 使用者開啟 Cocos MCP 後，已透過 `npm run cocos:rebuild-preview` 呼叫 `project_refresh_assets`，並確認 preview bundle 已包含 `slot-e2e.test.ts` 與 E2E class。
- automation runtime 載入的場景仍是臨時空場景，因此 E2E 在 automation 場景內掛載正式 `assets/main.ts` 的 `main` component 作為測試 fixture；這仍使用 Cocos `automation-framework`，不使用 Playwright/manual fallback。
- E2E 已實際完成：`ended: true`、`failed: false`。

## E2E

端到端執行新的 automation test。

結果：通過。automation 測試以固定盤面 `A A A / K Q K / 7 7 7` 執行 credit-in 與 spin，驗證 `BALANCE 129`、`WIN 30` 與 3x3 cell 文字。

## 審查

檢查 E2E 是否真的 assert backend-driven symbols 與 balance，而不只是點擊 buttons。
確認測試有先設定強制盤面，且 assertion 同時涵蓋盤面文字、win、balance。

## 修正

修正 automation flakiness、missing hooks、launch order 或 deterministic fixture mismatches。
若 force-board 介面與 automation 啟動順序有 race condition，應優先修正。

Review fix 紀錄：

- 已加強 `assets/slot-e2e.test.ts` 的 `backendRequest`：強制比對 response `id`、預期 response `type`，並驗證 payload 結構，避免只要收到任意非 error response 就通過。
- 已修正本文件對 `extensions/automation-framework/node_modules` 的說明：`node_modules` 不進版控；extension 依賴以 `cd extensions/automation-framework; npm install` 還原。

Review 4 結果：

- Low：Playwright 產生的 `test-results/` 目前未在 `.gitignore` 忽略，且工作區已有 `test-results/.last-run.json`。這容易讓 trace、error context 等本機測試產物被誤提交。建議 `/qdd-phase-fix 4` 加入 `test-results/` 與必要的 Playwright report/output ignore 規則，並清理目前未追蹤產物。
- 其餘 Phase 4 scope 未發現阻塞問題：E2E 仍由 Cocos `automation-framework` 執行節點操作與 assertion；Playwright 只負責啟動環境、開 preview、等待 automation summary。
- 驗證結果：`npx playwright test --list` 可列出兩條 Cocos E2E；focused TypeScript check 通過；Node script syntax check 通過；`go test ./server/...` 通過；`E2E_VISUAL=1 npx playwright test tests/e2e/cocos-slot.spec.mjs -g "forced board spin payout"` 通過。

Review 4 fix 紀錄：

- 已在 `.gitignore` 加入 Playwright 本機產物：`test-results/`、`playwright-report/`、`blob-report/`。
- 未刪除現有 `test-results/` 檔案；因 ignore 規則已生效，這些本機除錯產物不再出現在 `git status`。
- Fix 後驗證：`git check-ignore -v test-results/.last-run.json playwright-report/index.html blob-report/report.zip` 命中對應 ignore 規則；`npx playwright test --list` 可列出兩條 Cocos E2E；Node script syntax check 通過；`go test ./server/...` 通過。

Review 4 final 結果：

- 通過，未發現新的 Phase 4 finding。
- 已確認 `.gitignore` 命中 `test-results/`、`playwright-report/`、`blob-report/`，Playwright 本機產物不再出現在 `git status`。
- 驗證結果：`npx playwright test --list` 可列出兩條 Cocos E2E；Node script syntax check 通過；`go test ./server/...` 通過。

## 收尾

記錄精確 E2E command 與 known limitations。

已驗證可用的執行順序：

1. 啟動測試模式後端：
   `cd server; $env:SLOT_TEST_MODE='1'; $env:SLOT_DB_PATH='slot-e2e.db'; go run ./cmd/server`
2. 啟動 automation server：
   `node tools/automation-server.mjs`
3. 啟動 Cocos Preview proxy：
   `node tools/cocos-preview-proxy.mjs`
4. 執行 Cocos MCP refresh / preview bundle 等待：
   `npm run cocos:rebuild-preview`
5. 在瀏覽器或 headless Edge 開啟 `http://127.0.0.1:7457`，由 Cocos automation-framework 讀取 `testConfig.json` 並執行 E2E class。
6. 查詢結果：
   `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/summary`

VS Code Test Explorer 執行方式：

1. 安裝 VS Code `Playwright Test for VSCode` extension。
2. 確認 Cocos Creator、Cocos Preview 與 Cocos MCP server 已啟動。
3. 在 Test Explorer 選擇單條 `Cocos E2E: ...` 測試執行。
4. Wrapper 會啟動 backend、automation server、preview proxy，產生單條 E2E 的 `testConfig.json`，並由 Cocos `automation-framework` 執行真正 assertion。

本次 headless Edge 觸發指令：

```powershell
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$profile = Join-Path (Get-Location) 'temp\phase04\edge-profile'
New-Item -ItemType Directory -Force -Path $profile | Out-Null
Start-Process -FilePath $edge -ArgumentList @('--headless=new','--disable-gpu','--no-first-run',"--user-data-dir=$profile",'http://127.0.0.1:7457') -WindowStyle Hidden
```

Known limitation：

- Cocos MCP 的 `scene_open_scene` 對 `db://assets/main.scene` 回傳 `Scene not found`，但 `scene_get_scene_list` 與 asset list 可查到該 scene。phase 04 不依賴此工具完成。
- automation preview runtime 目前會先進入臨時空場景；E2E 測試會在 automation 場景中掛載正式 `main` component，驗證前端 component 與後端 WebSocket 行為。

## 驗證

- Cocos automation-testing E2E command
- 在 `server/` 執行 `go test ./...`
- Test mode force-board E2E command 或前置 script

已執行：

- 查詢 `cocos/cocos-test-projects` 遠端分支：找到 `auto-test`、`v3.8.8` 等分支。
- 檢查 `auto-test` 與 `v1.0.0`：未找到 automation dependency。
- 掃描遠端分支 `package.json`：Cocos 測試專案使用 `automation-framework: 0.4.6`。
- 查詢 npm `automation-framework`：1.x 套件不是 Cocos automation package，未安裝。
- 透過 Cocos MCP 執行 `project_refresh_assets`，成功，但未載入 automation package。
- 追蹤 PR #713 後歷史，確認本地 extension 最後可用 commit 為 `2e42d11a`。
- 已複製 `2e42d11a` 的 `extensions/automation-framework` 到本專案。
- 執行 `cd server && go test ./...`，通過。
- 執行 Phase 03 focused TypeScript check，通過。
- 執行包含 `assets/slot-e2e.test.ts` 的 focused TypeScript check，通過。
- 執行 `node --check tools/automation-server.mjs`，通過。
- 執行 `node --check tools/cocos-preview-proxy.mjs`，通過。
- 啟動 `tools/automation-server.mjs` 後請求 `http://127.0.0.1:8000/summary`，回傳 `200`。
- 啟動 `tools/cocos-preview-proxy.mjs` 後請求 `http://127.0.0.1:7457/testConfig.json`，成功回傳 `tools/testConfig.slot-e2e.json` 內容。
- 執行 `npm run cocos:rebuild-preview`，通過，preview bundle 已包含 `slot-e2e.test.ts` 與 `slot_e2e`。
- 透過 WebSocket 手動驗證 `test.force_board.request`，回傳 `{"ok":true}`。
- 重啟 `tools/automation-server.mjs`，用 headless Edge 開啟 `http://127.0.0.1:7457` 觸發 Cocos automation E2E，`/summary` 回傳 `ended: true`、`failed: false`。
- 執行 `cd server && go test ./...`，通過。
- Review fix 後執行 focused TypeScript check，通過。
- Review fix 後執行 `node --check tools/automation-server.mjs`、`node --check tools/cocos-preview-proxy.mjs`、`node --check tools/cocos-rebuild-preview.mjs`、`node --check tools/wait-cocos-preview-bundle.mjs`，通過。
- Review fix 後執行 `cd server && go test ./...`，通過。
- Test Explorer wrapper 新增後執行 `npx playwright test --list`，列出 `Cocos E2E: credit-in and credit-out` 與 `Cocos E2E: forced board spin payout`。
- Test Explorer wrapper 新增後執行 `node --check tests/e2e/cocos-slot.spec.mjs` 與工具 scripts syntax check，通過。
- Test Explorer wrapper 新增後執行包含 `assets/slot-e2e.test.ts` 的 focused TypeScript check，通過。
- Test Explorer wrapper 新增後執行 `cd server && go test ./...`，通過。

## 完成標準

- Automated E2E 能透過強制盤面驗證 credit-in 與 spin amount/board correctness。若 automation-testing 被阻塞，phase 必須停在 documented blocker，不以 fallback 視為完成。

結果：完成。

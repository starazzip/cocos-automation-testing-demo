# Phase 06 - README, Tutorial, And Example

## Status

Completed on 2026-06-26.

## Objective

產出最終 README、一步一步使用教學與簡單範例，讓第一次接觸此框架的 Cocos 開發者能導入 extension、建立測項並執行 E2E。

## Inputs

- `plans/cocos-e2e-framework/decisions.md`
- Phase 01-05 實作結果
- `tools/e2e-test-explorer.md`
- Extension README 或 root README
- `smoke.md`

## Scope

- 更新 README 說明框架定位、架構、限制與快速開始。
- 撰寫一步一步教學：安裝/啟用 extension、初始化框架、新增測項、選擇 adapter、執行 CLI、使用 VS Code Test Explorer。
- 提供簡單範例，包含一個前端-only 測項與一個 demo backend-backed 測項的最小寫法。
- 說明測項分檔管理方式與命名規則。
- 說明後端 adapter contract 與無後端程式碼存取時的做法。

## Out Of Scope

- 完整產品手冊。
- API reference 產生器。
- Marketplace 發布文件。
- CI/CD 平台教學。

## Plan

1. 整理實作後的框架目錄與使用者入口。
2. 更新 README，先講如何使用，再講架構細節。
3. 撰寫逐步教學，確保每一步都有可執行指令或可確認結果。
4. 補上簡單測項範例，避免讀者只看到 slot 專用內容。
5. 更新 `smoke.md`，讓人工能照文件驗證導入流程。

## BDD

- Given 第一次接觸框架的 Cocos 開發者，When 依 README 快速開始操作，Then 能初始化框架並列出 E2E 測項。
- Given 開發者想新增測項，When 依教學建立範例測項，Then Test Explorer 可看到該測項。
- Given 開發者無法碰後端程式碼，When 依前端-only 教學操作，Then 能完成 deterministic E2E。

## TDD

- 文件本身不需要單元測試。
- 需用指令驗證 README 中的命令、檔案路徑與範例名稱都存在且可執行。

## Implement

- 新增 root `README.md`，作為框架導入入口，涵蓋定位、快速開始、frontend-only 範例、backend adapter contract、VS Code Test Explorer、demo 驗證與限制。
- 新增 `extensions/cocos-e2e-framework/README.md`，說明 extension menu、generated project files、CLI methods 與 adapter 邊界。
- 更新 `tools/e2e-test-explorer.md`，把 Test Explorer 說明改成通用 `Cocos E2E: <case title>`，並保留本 repo demo case 對照。
- 撰寫 simple frontend-only example，使用 `createCase({ id:'scene-loads', adapter:'frontend-only' })` 產生 `tests/e2e/cases/scene-loads.case.json` 與 `assets/e2e/scene-loads.test.ts`。
- 補充 backend adapter example，說明真實專案應在 `tools/e2e/project-environment-adapters.mjs` 註冊自己的 adapter，而不是依賴本 repo 的 Go demo backend。
- 更新 `plans/cocos-e2e-framework/smoke.md`，改為 Phase 06 文件與導入流程 smoke。

## E2E

- 已用臨時專案驗證 README simple example：`initializeFramework()` + `createCase(scene-loads)` + `discoverE2ECases()` 可讀到 `scene-loads:frontend-only`。
- 已執行 `npx playwright test --list`，確認 demo 測項只由 `tests/e2e/cocos-e2e.spec.mjs` 列出。
- 已執行 `npx playwright test -g "frontend-only deterministic spin"`，確認 README 的 frontend-only 路徑仍可跑。

## Review

- 檢查文件是否把 slot demo 誤寫成框架必要條件。
- 檢查 extension、runner、case、adapter 名詞是否一致。
- 檢查步驟是否能由第一次使用者照做。

Review notes:

- README 明確標示 slot 遊戲與 Go backend 只是 demo fixture。
- extension menu 名稱與 `extensions/cocos-e2e-framework/package.json` 的 contributions 保持一致。
- 文件中的 case metadata 欄位與 `tools/e2e/case-discovery.mjs` 驗證欄位一致。

## Fix

- 已把文件中的 list 指令統一改為 `npx playwright test --list`；驗證時發現 `npm run test:e2e -- --list` 在目前 PowerShell/npm 組合下會實際跑完整 E2E，容易誤導使用者。
- 已修正 `smoke.md` 的臨時專案 example command，避免 PowerShell 展開 JavaScript template literal，並改用 `pathToFileURL()` 載入臨時專案中的 ESM discovery module。
- 已明確標示 Cocos Creator、Preview bundle 與測試 port 前置條件。

## Wrap Up

- 已在本 phase 檔記錄文件更新與驗證結果。
- 已確認 `smoke.md` 是 Phase 06 最終人工驗證入口。

## Verification

- `node -e "...checkSetup..."`：通過，`checkSetup: ok=true errors=0 warnings=0`。
- README simple example temp-project command：通過，輸出 `scene-loads:frontend-only`。
- `npm run test:e2e:unit`：通過，33 tests passed。
- `npx playwright test --list`：通過，列出 3 tests in 1 file，且只來自 `cocos-e2e.spec.mjs`。
- `npx playwright test -g "frontend-only deterministic spin"`：通過，1 passed。
- `npm run test:e2e`：通過，3 passed。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`。
- `git diff --check`：通過。

## Done Criteria

- README 清楚描述框架目的與導入方式。
- 有一步一步教學。
- 有簡單範例。
- 文件涵蓋 extension、分檔測項、adapter、frontend-only E2E、CLI 與 Test Explorer。
- 文件步驟已被驗證或清楚標記前置條件。

- Done.

### Independent Review - 2026-06-26

Findings:

1. `README.md` 的 simple example 目前只示範 `director.getScene()`，沒有示範 Cocos E2E 最常見的互動型 assertion：按下按鈕後檢查畫面元素文字。這不符合 phase 6 目標「讓第一次接觸此框架的 Cocos 開發者能建立測項」，因為讀者仍不知道在 Cocos automation class 中如何取得節點、觸發 UI、讀 Label 文字並 assertion。
2. README / extension README 的 `createCase({ projectRoot: process.cwd(), id:'scene-loads' ... })` 範例容易讓使用者直接在本 repo root 執行，現在工作區已產生未追蹤的 `assets/e2e/` 與 `tests/e2e/cases/scene-loads.case.json`，且 `npx playwright test --list` 從 3 tests 變成 4 tests。這會污染 demo 驗證基準，也與 smoke 期望「只列出 3 條 demo case」衝突。

Review verification:

- `rg -n "sceneLoads|director|getScene|Button|button|Label|text|click" README.md extensions/cocos-e2e-framework/README.md tools/e2e-test-explorer.md plans/cocos-e2e-framework/smoke.md`：確認 README 範例只有 scene load assertion，沒有 button click / Label text 範例。
- `npx playwright test --list`：列出 4 tests in 1 file，多出 `Cocos E2E: scene loads`。
- `git ls-files --others --exclude-standard`：確認多出 `assets/e2e.meta`、`assets/e2e/scene-loads.test.*`、`tests/e2e/cases/scene-loads.case.json`。

Next action: `/qdd-phase-fix 6`。

### Phase Fix - Adapter Boundary Review - 2026-06-26

Fixes:

- 更新 `README.md`，將一般導入者的本地執行流程改成 `目標專案本地執行 E2E`，使用 generic `<case title>`，不再混入本 repo demo 專用 `demo:backend` 與 `forced board spin payout`。
- 將本 repo demo 專用後端啟動、`demo-backend` 說明與 forced-board 驗證集中到 `本 Repo Demo 驗證`。
- 更新 `plans/cocos-e2e-framework/smoke.md`，讓 README simple example 檢查指向實際 `持續擴充測項` 區塊，並改為 `CreditInButton` / `BalanceLabel`。
- 更新 `extensions/cocos-e2e-framework/dist/scaffold.js`，`checkSetup()` 只接受標準 `tests/e2e/cocos-e2e.spec.mjs`。
- 新增 unit test，確認只有 legacy `tests/e2e/cocos-slot.spec.mjs` 時 `checkSetup()` 會失敗。
- 刪除 root `tools/cocos-rebuild-preview.mjs`，避免 framework surface 殘留 Cocos MCP 工具。

Verification:

- `node --check extensions/cocos-e2e-framework/dist/scaffold.js`：通過。
- `npm run test:e2e:unit`：通過，37 tests passed。
- `node --test extensions/cocos-e2e-framework/templates/project/tools/e2e/*.test.mjs`：通過，24 tests passed。
- `npx playwright test --list`：通過，3 tests in 1 file。
- `npm run test:e2e`：通過，3 passed。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`。
- `rg -n "Cocos MCP|COCOS_MCP|cocos-rebuild-preview" README.md extensions/cocos-e2e-framework tools package.json tests/e2e tools/e2e -S`：no matches。
- `git diff --check`：通過。

Next action: `/qdd-review 6`。

### Phase Fix After Review - 2026-06-26

Fixes:

- 更新 `README.md`，將導入教學中的初始化、檢查設定、建立測項、重新整理測項索引都改成 Cocos Creator menu 操作，不再把 `node -e` 當成一般使用者教學。
- 更新 `README.md` 的 frontend-only simple example，改成按下 `StartButton` 後檢查 `StatusLabel.string` 的互動型範例，示範 `Button.EventType.CLICK`、`Label.string` 與 scene node 查找 helper。
- 更新 `extensions/cocos-e2e-framework/README.md`，把使用者導入流程改成 Cocos UI workflow，移除 end-user `node -e` 操作。
- 更新 `tools/e2e-test-explorer.md`，新增測項流程改成 `Extension > Cocos E2E Framework > 建立 E2E 測項` 與 `重新整理測項索引`。
- 更新 `plans/cocos-e2e-framework/smoke.md`，把 smoke 的導入檢查改成 Cocos UI 驗證，並新增 Button click / Label text assertion 的失敗訊號。
- 刪除教學誤產生於 repo root 的未追蹤 scaffold artifacts：
  - `assets/e2e.meta`
  - `assets/e2e/`
  - `tests/e2e/cases/scene-loads.case.json`

Fix verification:

- `rg -n "node -e|CLI Verification|scene-loads|scene loads" README.md extensions/cocos-e2e-framework/README.md tools/e2e-test-explorer.md`：no matches。
- `rg -n "StartButton|StatusLabel|Button.EventType.CLICK|Label.string" README.md plans/cocos-e2e-framework/smoke.md`：確認 README 與 smoke 已涵蓋按鈕點擊與文字 assertion。
- `git ls-files --others --exclude-standard`：只剩 phase 6 新增文件 `README.md` 與 `extensions/cocos-e2e-framework/README.md`。
- `npx playwright test --list`：回到 3 tests in 1 file。
- `npm run test:e2e:unit`：33 tests passed。
- `npm run test:e2e`：3 passed。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`。
- `git diff --check`：通過。

Next action: `/qdd-review 6`。

### Independent Review - Adapter Boundary Cleanup - 2026-06-26

Findings:

1. `README.md` 的 `本地執行 E2E` 區塊接在「如何使用這個 E2E Framework」之後，但內容混入本 repo demo 專用步驟：`npm run demo:backend`、`demo-backend`、`forced board spin payout`。第一次導入到目標專案的使用者可能會照做不存在的 `demo:backend` script，或誤以為 demo backend 是一般導入流程的一部分。建議把此段改名為「本 Repo Demo 本地執行 E2E」，或拆出一段真正的目標專案本地執行流程。
2. `plans/cocos-e2e-framework/smoke.md` 與目前 `README.md` 已 drift：smoke 第 4 步仍指向 `README.md > 新增一個 Frontend-Only 測項`，並期待 `StartButton` / `StatusLabel`；目前 README 對應區塊是 `持續擴充測項`，範例節點是 `CreditInButton` / `BalanceLabel`。人工 smoke 會照到不存在的標題與不一致的範例。
3. `extensions/cocos-e2e-framework/dist/scaffold.js` 的 `checkSetup()` 仍接受 `tests/e2e/cocos-slot.spec.mjs` 作為有效 Playwright spec，但 phase 6 與 smoke 已把 `cocos-e2e.spec.mjs` 視為唯一標準入口，且 smoke 將 `cocos-slot.spec.mjs` 出現在 test list 視為 failure signal。這會讓舊 wrapper 殘留時 setup check 過度寬鬆。
4. `tools/cocos-rebuild-preview.mjs` 仍保留 Cocos MCP 專用實作與錯誤訊息。它目前不在 package scripts，也不會由 extension template 複製，但仍在 root `tools/` 下，容易讓後續維護者誤認為 E2E framework 仍有 MCP 工具面。若它只是個人輔助工具，建議移出 framework repo surface 或改到明確的 private/dev-only 位置。

Review verification:

- `npm run test:e2e:unit`：通過，36 tests passed。
- `npx playwright test --list`：通過，3 tests in 1 file。
- `rg -n "demo-backend|createDemoBackendAdapter|createSlotEnvironmentAdapters|cmd/server|SLOT_|slotFixture|slot-e2e|forced-spin|credit-in-out|slot_" extensions/cocos-e2e-framework/templates/project extensions/cocos-e2e-framework/dist/scaffold.js -S`：no matches。
- `git diff --check`：通過。

Next action: `/qdd-phase-fix 6`。

### Independent Review After Fix - 2026-06-26

Findings:

- None.

Review verification:

- `rg -n "node -e|CLI Verification|scene-loads|scene loads" README.md extensions/cocos-e2e-framework/README.md tools/e2e-test-explorer.md`：no matches，確認一般教學主線不再使用 `node -e` 或 `scene-loads`。
- `rg -n "StartButton|StatusLabel|Button.EventType.CLICK|Label.string|建立 E2E 測項|重新整理測項索引|檢查設定" README.md extensions/cocos-e2e-framework/README.md tools/e2e-test-explorer.md plans/cocos-e2e-framework/smoke.md`：確認 Cocos UI workflow 與 Button/Label assertion 範例存在。
- `git ls-files --others --exclude-standard`：只剩 phase 6 新增文件 `README.md` 與 `extensions/cocos-e2e-framework/README.md`。
- `npx playwright test --list`：3 tests in 1 file。
- `git diff --check`：通過。

Next action: `/qdd-smoke`。

### Smoke Failure Fix - 2026-06-26

Issue:

- Smoke 執行時在 repo root 透過 extension 建立了教學 scaffold，產生 `assets/e2e/`、`tests/e2e/cases/new-e2e-case.case.json`、`tests/e2e/cocos-e2e.spec.mjs` 與 `tools/e2e/project-environment-adapters.mjs` 等未追蹤檔案。
- 這些檔案污染 demo baseline，使 Playwright test discovery 出現重複 spec / 額外 case，且 Cocos Preview bundle 匯入不屬於 demo 的 `assets/e2e/*.ts`。

Fix:

- 刪除 repo root 中誤產生的未追蹤 scaffold artifacts。
- 更新 root README 與 extension README，明確區分「目標專案導入」與「本 repo demo 驗證」，並提醒不要在本 repo root 建立教學測項。
- 更新 `smoke.md`，把失敗時的 test list 記錄改為清理後的通過結果。

Verification:

- `npm run cocos:rebuild-preview`：通過，preview bundle only includes slot demo E2E classes。
- `npx playwright test --list`：通過，3 tests in 1 file。
- `npx playwright test -g "frontend-only deterministic spin"`：通過，1 passed。
- `npm run test:e2e`：通過，3 passed。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`。

### Demo Case Layout Cleanup - 2026-06-26

Issue:

- 本 repo 的 demo automation class 仍集中在 `assets/slot-e2e.test.ts`，不符合 Phase 02 後建立的分檔 case 管理規範，也和 README 中 `assets/e2e/<case-id>.test.ts` 的使用方式不一致。
- `tests/e2e/cocos-slot.spec.mjs` 是舊 demo 專用 Playwright wrapper 名稱；整理後應改用標準 `tests/e2e/cocos-e2e.spec.mjs`，並保留 demo adapter registry。

Fix:

- 刪除舊的 `assets/slot-e2e.test.ts` 與 `.meta`。
- 新增 `assets/e2e/` 與三個 demo automation class：
  - `assets/e2e/credit-in-out.test.ts`
  - `assets/e2e/forced-spin.test.ts`
  - `assets/e2e/frontend-only-spin.test.ts`
- 抽出共用操作到 `assets/e2e/slot-test-helpers.ts`。
- 更新 `tests/e2e/cases/*.case.json`，讓每個 case 的 `automation.scriptName` 指向自己的分檔 automation class。
- 更新 legacy `tools/testConfig.slot-e2e.json`、preview bundle fallback、Test Explorer 說明與 automation-framework README，避免再指向舊路徑。

Verification:

- `npx playwright test --list`：通過，3 tests in 1 file。
- `npm run test:e2e:unit`：通過，33 tests passed。
- `npm run cocos:rebuild-preview`：通過，preview bundle 包含三個 `assets/e2e/*.test.ts` 與三個 demo class name。
- `npm run test:e2e`：通過，3 passed。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`。

### Playwright Spec Name Cleanup - 2026-06-26

Fix:

- 將 `tests/e2e/cocos-slot.spec.mjs` 改名為標準入口 `tests/e2e/cocos-e2e.spec.mjs`。
- 保留 spec 內的 slot demo adapter registry，讓本 repo demo 仍可執行 `demo-backend` 與 `frontend-only` case。
- 更新 README、Test Explorer 說明、smoke 與狀態檔，將 `cocos-e2e.spec.mjs` 視為唯一預期 spec。

### Remove Cocos MCP Dependency - 2026-06-26

Decision:

- Cocos MCP 是個人開發前端時的輔助工具，不是此 E2E framework 的交付需求或執行依賴。
- Framework 導入與 E2E runner 預設流程不可要求目標專案安裝或啟動 Cocos MCP。

Fix:

- `tools/e2e/runner-core.mjs` 預設不再執行 `npm run cocos:rebuild-preview`，也不再呼叫任何 Cocos Editor / MCP API。
- Runner 改成 optional preview prepare hook：只有 spec 或 adapter 明確傳入 `options.preview.prepareCommand` 時才會在開啟 Preview URL 前執行命令。
- Extension scaffold 不再複製 `tools/cocos-rebuild-preview.mjs`，也不再加入 `cocos:rebuild-preview` npm script。
- README、extension README、Test Explorer 文件與 smoke 前置條件都改為要求使用者在 Cocos Creator 內手動 refresh assets 並確認 Preview bundle 已更新。
- `package.json` 移除公開 `cocos:rebuild-preview` script，避免被誤認為 framework 流程。

Verification:

- `npm run test:e2e:unit`：通過，33 tests passed。
- `npx playwright test --list`：通過，3 tests in 1 file。
- `npm run test:e2e`：通過，3 passed，且 runner 未產生新的 preview rebuild log。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`。
- `git diff --check`：通過。

### Adapter Boundary Cleanup - 2026-06-26

Issue:

- Framework/template 層仍有本 repo demo 專用假設，例如 `demo-backend`、Go backend 啟動邏輯、`SLOT_*` 環境變數、slot case fallback pattern 與 `slotFixture`。
- `frontend-only` 應是預設 adapter，但不應綁定 slot demo query param。
- 開發者需要能在 `tools/e2e/project-environment-adapters.mjs` 簡單擴充自己的 fixture adapter。

Fix:

- `tools/e2e/environment-adapters.mjs` 改成 framework contract/helper，只保留 `frontend-only`、adapter normalize/resolve/setup/teardown。
- 新增 `tools/e2e/project-environment-adapters.mjs`，把本 repo 的 `demo-backend` 與 demo `slotFixture` 放到專案層 registry。
- `tests/e2e/cocos-e2e.spec.mjs` 改為載入 project adapter registry。
- extension template 的 `environment-adapters.mjs` 與測試移除 `demo-backend`、Go backend 與 `SLOT_*`。
- template preview helper 改用 generic fallback：`e2e/_template-e2e.test.ts`、`my_e2e_case`。
- preview proxy 預設 config 名稱改成 `tools/testConfig.cocos-e2e.json`。
- root/template runner 與 discovery unit test 的 sample data 改成 generic `sample-case` / `sample-e2e`。
- root `_template.case.json` 預設 adapter 改成 `frontend-only`。
- README 補上 `frontend-only` 預設 registry、`previewUrlParams`、external backend、runner-managed backend 與本 repo `demo-backend` 擴充範例。

Verification:

- `node --check tools/e2e/environment-adapters.mjs; node --check tools/e2e/project-environment-adapters.mjs; node --check extensions/cocos-e2e-framework/templates/project/tools/e2e/environment-adapters.mjs; node --check tools/wait-cocos-preview-bundle.mjs; node --check tools/cocos-preview-proxy.mjs`：通過。
- `npm run test:e2e:unit`：通過，36 tests passed。
- `node --test extensions/cocos-e2e-framework/templates/project/tools/e2e/*.test.mjs`：通過，24 tests passed。
- `npx playwright test --list`：通過，3 tests in 1 file。
- `npm run test:e2e`：通過，3 passed。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`。
- `rg -n "demo-backend|createDemoBackendAdapter|createSlotEnvironmentAdapters|cmd/server|SLOT_|slotFixture|slot-e2e|forced-spin|credit-in-out|slot_" extensions/cocos-e2e-framework/templates/project extensions/cocos-e2e-framework/dist/scaffold.js -S`：no matches。
- `git diff --check`：通過。

Next action: `/qdd-review 6`。

### Independent Review - Visual Mode Docs - 2026-06-26

Findings:

1. `README.md` 的 visual mode 指令使用 `E2E_VISUAL_HOLD_MS`，但 root/template runner 實際讀取的是 `E2E_HOLD_MS`。因此使用者照 README 執行時，視窗保留時間不會套用 `3000ms`，而會回到 runner 預設值。需將 README 的三處 `E2E_VISUAL_HOLD_MS` 改成 `E2E_HOLD_MS`，或調整 runner 支援 README 中的變數名稱。

Review verification:

- `rg -n "E2E_VISUAL_HOLD_MS|E2E_HOLD_MS|holdEnv|E2E_VISUAL" README.md extensions/cocos-e2e-framework/README.md tools/e2e/runner-core.mjs extensions/cocos-e2e-framework/templates/project/tools/e2e/runner-core.mjs plans/cocos-e2e-framework/smoke.md -S`：確認 README 使用 `E2E_VISUAL_HOLD_MS`，runner 使用 `E2E_HOLD_MS`。
- `npm run test:e2e:unit`：通過，37 tests passed。
- `npx playwright test --list`：通過，3 tests in 1 file。
- `git diff --check`：通過。

Next action: `/qdd-phase-fix 6`。

### Phase Fix - Visual Mode Docs - 2026-06-26

Fix:

- 更新 `README.md` visual mode 指令，將 `E2E_VISUAL_HOLD_MS` 改成 runner 實際讀取的 `E2E_HOLD_MS`。

Verification:

- `rg -n "E2E_VISUAL_HOLD_MS|E2E_HOLD_MS|E2E_VISUAL" README.md tools/e2e/runner-core.mjs extensions/cocos-e2e-framework/templates/project/tools/e2e/runner-core.mjs plans/cocos-e2e-framework/smoke.md -S`：README 已不再出現 `E2E_VISUAL_HOLD_MS`，README 與 root/template runner 都使用 `E2E_HOLD_MS`。
- `npx playwright test --list`：通過，3 tests in 1 file。
- `git diff --check`：通過。

Next action: `/qdd-review 6`。

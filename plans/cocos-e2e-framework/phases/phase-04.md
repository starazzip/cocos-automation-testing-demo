# Phase 04 - Cocos Creator Extension MVP

## Status

Completed on 2026-06-25.

## Objective

建立 Cocos Creator extension 作為 MVP 交付形式，讓使用者能透過 extension 導入框架、產生範本、管理測項與檢查基本設定。

## Inputs

- `plans/cocos-e2e-framework/decisions.md`
- Phase 01 runner core
- Phase 02 case management
- Phase 03 adapter contract
- `extensions/automation-framework/`
- `extensions/cocos-mcp-server/`
- Cocos Creator 3.8.x extension conventions

## Scope

- 建立或整理 `extensions/cocos-e2e-framework/` extension。
- 提供最小 command/method：初始化 E2E framework、產生新測項、重新整理 manifest、檢查設定。
- 將可重用範本放在 extension 可管理的位置。
- 讓 extension 不依賴 slot sample，也不修改無關 assets。
- 保留命令列流程，extension 是導入與管理入口，不取代 runner core。

## Out Of Scope

- 上架 Marketplace。
- npm package 化。
- 複雜圖形化管理後台。
- 雲端測試平台。
- 完整 CI 管理 UI。

## Plan

1. 選擇 extension package 結構，避免覆蓋 Cocos 官方 automation framework。
2. 建立 extension manifest、main entry、必要 method 與範本資源。
3. 實作初始化流程，產生或檢查 Playwright config、runner config、case 目錄、Cocos automation template。
4. 實作新增測項流程，產生分檔 metadata 與 Cocos automation class 範本。
5. 實作設定檢查，指出缺少 dependency、config 或 Cocos automation framework 的狀態。

## BDD

- Given 使用者在 Cocos Creator 專案啟用 extension，When 執行初始化命令，Then 專案獲得可執行的 E2E framework scaffold。
- Given 使用者執行新增測項命令，When 輸入測項 id/title，Then extension 產生分檔測項範本。
- Given 專案缺少必要設定，When 執行檢查命令，Then extension 回報可操作的修正訊息。

## TDD

- 將 file generation 與 config validation 做成可測的純函式。
- 為 scaffold 產生、overwrite policy、路徑安全檢查與 missing dependency 診斷加 focused tests。

### Result

- 新增 `tools/e2e/extension-scaffold.test.mjs`。
- 覆蓋 extension scaffold 初始化、package script/devDependency merge、既有檔案不覆蓋、新測項 metadata 與 Cocos automation class 產生、unsafe path/id 拒絕、case index refresh、setup check、package metadata message/method mapping。

## Implement

- 新增 extension 檔案與 package metadata。
- 新增 scaffold/template generation 模組。
- 新增命令或 method 給 Cocos Creator 呼叫。
- 確保 extension 產生的檔案符合 Phase 01-03 的 runner/case/adapter contract。

### Result

- 新增 `extensions/cocos-e2e-framework/package.json`，使用 Cocos Creator extension `package_version: 2`、`main: ./dist/main.js` 與 menu/messages contributions。
- 新增 extension methods：
  - `initFramework`：產生/補齊 Playwright config、npm scripts、case template、automation test class template 與 project adapter template。
  - `createCase`：產生分檔 `tests/e2e/cases/<id>.case.json` 與 `assets/e2e/<id>.test.ts`。
  - `refreshCaseIndex`：讀取分檔 case metadata，維持 Phase 02 不手動維護集中 registry 的方向。
  - `checkSetup`：檢查 Phase 01-03 runner/core files、Playwright dependency、npm scripts 與 automation-framework extension。
- 新增 `extensions/cocos-e2e-framework/i18n/en.js` 與 `zh.js`。
- Scaffold 邏輯集中於 `extensions/cocos-e2e-framework/dist/scaffold.js`，可由 Node tests 直接驗證。
- Extension 不覆蓋 `extensions/automation-framework/` 或 `extensions/cocos-mcp-server/`。

## E2E

- 在本 repo 以 extension 產生或驗證 framework scaffold。
- 執行 `npm run test:e2e -- --list` 確認 extension 產物可被 runner 使用。
- 如 Cocos Creator extension 自動化不可行，保留明確手動驗證步驟並記錄限制。

### Result

- `node -e "...checkSetup...refreshCaseIndex..."` passed：extension method 可在本 repo 驗證 setup，並讀到 3 條 case。
- `npx playwright test --list` passed：列出 3 條 Cocos E2E。
- `node --input-type=module -e "...runCocosE2ECase(frontend-only-spin, alternate ports)..."` passed：frontend-only case 可在非預設 automation/proxy port 執行。
- `npm run test:e2e` 在本次驗證失敗：外部 `python.exe`/`uvicorn` process 佔用 `127.0.0.1:8000`，automation server 無法 bind；非本 phase code regression。

## Review

- 檢查 extension 是否與 sample game 解耦。
- 檢查 extension 是否會覆蓋使用者既有檔案；需要 overwrite policy 或明確提示。
- 檢查路徑處理是否限制在專案目錄內。

### Result

- 自檢：extension 產物在 `extensions/cocos-e2e-framework/`，沒有改 slot sample game、scene 或 `.meta`。
- 自檢：`initFramework` 對既有檔案預設 skip，`createCase` 對既有檔案預設拒絕覆蓋。
- 自檢：所有寫入路徑都經過 project-root containment check。
- `/qdd-review 4` completed on 2026-06-25：發現 initialization scaffold gap，下一步使用 `/qdd-phase-fix 4`。

### Independent Review - 2026-06-25

Findings:

1. `extensions/cocos-e2e-framework/dist/scaffold.js` 的 `initializeFramework()` 只寫入 `initialTemplates()` 中的 Playwright config、spec、case template、project adapter template 與 automation class template，沒有導入 `checkSetup()` 要求的 runner core/tools，例如 `tools/automation-server.mjs`、`tools/e2e/case-discovery.mjs`、`tools/e2e/environment-adapters.mjs`、`tools/e2e/runner-core.mjs` 與 `extensions/automation-framework/package.json`。在臨時空專案執行 `initializeFramework()` 後再跑 `checkSetup()` 仍會失敗，與本 phase BDD「初始化後取得可執行 E2E framework scaffold」以及 done criteria「Extension 可初始化框架」不一致。

Review verification:

- `npm run test:e2e:unit` passed：26 tests passed。
- `node -e "...checkSetup...refreshCaseIndex..."` passed：setup ok，cases=3。
- `npx playwright test --list` passed：列出 3 tests。
- `npm run test:e2e` passed：3 tests passed。
- `git diff --check` passed。
- `node -e "...initializeFramework(temp)...checkSetup(temp)..."` reproduced finding：初始化後仍缺少 core runner/tools。

Next action: `/qdd-phase-fix 4`。

## Fix

- 修正 extension scaffold 不完整、路徑不安全、覆蓋策略不清楚、錯誤訊息不可操作等問題。
- 修正 extension 產物與 runner contract 不一致問題。

### Result

- `initializeFramework()` 現在會從 `extensions/cocos-e2e-framework/templates/project/` 導入 Phase 01-03 的 reusable runner tools、runner unit tests 與 automation-framework extension 最小檔案。
- Extension template 不包含 slot sample case、slot game code 或 `extensions/automation-framework/node_modules`。
- 新增 `resolveFrameworkSourceRoot()` 與 `FRAMEWORK_FILES`，支援預設 extension-managed template，也可用 `frameworkSourceRoot` 或 `COCOS_E2E_FRAMEWORK_SOURCE` 覆蓋來源。
- 更新 `tools/e2e/extension-scaffold.test.mjs`，驗證 `initializeFramework(temp)` 後 `checkSetup(temp)` 通過。

### Fix Verification - 2026-06-25

- `npm run test:e2e:unit` passed：26 tests passed。
- `node -e "...initializeFramework(temp)...checkSetup(temp)..."` passed。
- `node -e "...checkSetup...refreshCaseIndex..."` passed：setup ok，cases=3。
- `npx playwright test --list` passed：列出 3 tests。
- `npm run test:e2e` passed：3 tests passed。
- `git diff --check` passed。

### Independent Review After Fix - 2026-06-25

Findings:

1. `initializeFramework()` 會將 `extensions/automation-framework/package.json` 與 `dist/*.js` 複製到目標專案，但沒有安裝或攜帶 automation-framework runtime dependency。被複製的 `extensions/automation-framework/dist/removeTestScripts.js` 會 `require("fs-extra")`，而 `FRAMEWORK_FILES` 不包含 `extensions/automation-framework/node_modules`，`checkSetup()` 也只檢查 `extensions/automation-framework/package.json` 是否存在。結果是 `initializeFramework(temp)` 後 `checkSetup(temp)` 會通過，但在臨時專案載入 `extensions/automation-framework/dist/main.js` 會失敗：`Cannot find module 'fs-extra'`。這會讓目標專案看似 setup 成功，實際在 Cocos Creator 載入 automation-framework extension 時失敗。

Review verification:

- `npm run test:e2e:unit` passed：26 tests passed。
- `node -e "...initializeFramework(temp)...checkSetup(temp)..."` passed。
- `node -e "...checkSetup...refreshCaseIndex..."` passed：setup ok，cases=3。
- `npx playwright test --list` passed：列出 3 tests。
- `npm run test:e2e` passed：3 tests passed。
- `git diff --check` passed。
- `node -e "...initializeFramework(temp); require(temp/extensions/automation-framework/dist/main.js)..."` reproduced finding：`Cannot find module 'fs-extra'`。

Next action: `/qdd-phase-fix 4`。

### Phase Fix After Review - 2026-06-26

Fixes:

- `extensions/cocos-e2e-framework/templates/project/extensions/automation-framework/dist/main.js` 不再直接 `require("fs-extra")`。
- `extensions/cocos-e2e-framework/templates/project/extensions/automation-framework/dist/removeTestScripts.js` 改用 Node.js 內建 `fs` 讀寫 JSON，保留 `getArgv`、`processJudge`、`startTest` 與 `updataJsonObject` export。
- `extensions/cocos-e2e-framework/templates/project/extensions/automation-framework/package.json` 與 `package-lock.json` 移除 stale `fs-extra` dependency metadata。
- `checkSetup()` 現在會把 `extensions/automation-framework/dist/main.js` 視為必要檔案，並以 CommonJS require 驗證 automation-framework extension entry 可載入。
- `tools/e2e/extension-scaffold.test.mjs` 新增初始化後 runtime load 測試，以及 runtime dependency 缺失時 `checkSetup()` 會失敗的測試。
- `plans/cocos-e2e-framework/smoke.md` 的臨時專案 smoke 升級為 `init + checkSetup + automation-framework load`。

Fix verification:

- `npm run test:e2e:unit` passed：28 tests passed。
- `node -e "...require('./extensions/cocos-e2e-framework/templates/project/extensions/automation-framework/dist/main.js')..."` passed：automation-framework template load ok。
- `node -e "...initializeFramework(temp); checkSetup(temp); require(temp/extensions/automation-framework/dist/main.js)..."` passed：init + checkSetup + automation-framework load ok。
- `node -e "...checkSetup...refreshCaseIndex..."` passed：setup ok，cases=3。
- `npx playwright test --list` passed：列出 3 tests。
- `npm run test:e2e` passed：3 tests passed。
- `git diff --check` passed。

Next action: `/qdd-review 4`。

### Independent Review After Phase Fix - 2026-06-26

Findings:

- None.

Review verification:

- `npm run test:e2e:unit` passed：28 tests passed。
- `node -e "...require('./extensions/cocos-e2e-framework/templates/project/extensions/automation-framework/dist/main.js')..."` passed：automation-framework template load ok。
- `node -e "...initializeFramework(temp); assert no fs-extra dependency; checkSetup(temp); require(temp/extensions/automation-framework/dist/main.js)..."` passed：scaffold package/runtime ok。
- `node -e "...checkSetup...refreshCaseIndex..."` passed：setup ok，cases=3。
- `npx playwright test --list` passed：列出 3 tests。
- `npm run test:e2e` passed：3 tests passed。
- `git diff --check` passed。

Next action: `/qdd-phase 5`。

## Wrap Up

- 在本 phase 檔記錄 extension command、產物路徑與驗證結果。
- 若使用者需要手動驗證 extension，更新 `smoke.md`。

### Changed Files

- `extensions/cocos-e2e-framework/package.json`
- `extensions/cocos-e2e-framework/i18n/en.js`
- `extensions/cocos-e2e-framework/i18n/zh.js`
- `extensions/cocos-e2e-framework/dist/main.js`
- `extensions/cocos-e2e-framework/dist/scaffold.js`
- `extensions/cocos-e2e-framework/templates/project/`
- `tools/e2e/extension-scaffold.test.mjs`
- `plans/cocos-e2e-framework/phases/phase-04.md`
- `plans/cocos-e2e-framework/smoke.md`
- `plans/cocos-e2e-framework/status.md`

### Smoke

- 更新 `plans/cocos-e2e-framework/smoke.md`，加入 extension menu/method、setup check、case index 與 Test Explorer 驗證步驟。

## Verification

- Extension scaffold/generator focused tests。
- Extension package metadata sanity check。
- `npm run test:e2e -- --list`
- 至少一條 extension 產生或管理的測項可執行。

### Result

- `npm run test:e2e:unit` passed：26 tests passed。
- `node -e "...checkSetup...refreshCaseIndex..."` passed：setup ok，cases=3。
- `npx playwright test --list` passed：列出 3 tests。
- `node --input-type=module -e "...frontend-only alt-port E2E..."` passed。
- `git diff --check` passed。
- `npm run test:e2e` initially failed：`127.0.0.1:8000` 被外部 `python.exe`/`uvicorn` 佔用，automation server log 顯示 `EADDRINUSE`。
- `/qdd-review 4` 期間重跑 `npm run test:e2e` passed：3 tests passed。
- `/qdd-phase-fix 4` 期間重跑 `npm run test:e2e:unit` passed：28 tests passed。
- `/qdd-phase-fix 4` 期間重跑臨時專案 scaffold runtime load passed：`init + checkSetup + automation-framework load ok`。
- `/qdd-phase-fix 4` 期間重跑 `npm run test:e2e` passed：3 tests passed。
- `/qdd-review 4` 期間重跑 `npm run test:e2e:unit` passed：28 tests passed。
- `/qdd-review 4` 期間重跑臨時專案 scaffold package/runtime check passed。
- `/qdd-review 4` 期間重跑 `npm run test:e2e` passed：3 tests passed。

## Done Criteria

- 有 Cocos Creator extension 作為 MVP 交付入口。
- Extension 可初始化框架。
- Extension 可產生新測項範本。
- Extension 與範例遊戲解耦，且不需要開發者手動維護複雜 registry。

### Result

- Done.

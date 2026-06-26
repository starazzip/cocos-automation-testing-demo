# Phase 02 - Distributed Test Case Management

## Status

Completed on 2026-06-25.

## Objective

建立好的測項管理方式，避免所有測項集中在同一個檔案，讓開發者可以用簡單範本新增、搜尋、審查與執行單條 E2E。

## Inputs

- `plans/cocos-e2e-framework/decisions.md`
- Phase 01 runner core
- Legacy `tools/e2e-cases.json`（本 phase 已移除）
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
3. 建立 discovery script，取代並移除手動維護的單一大型 `e2e-cases.json`。
4. 將現有 slot 測項拆成分檔或至少遷移到新結構的 sample layout。
5. 更新 runner 讀取新 discovery 結果。

## BDD

- Given 新增一個測項 metadata 檔，When 執行測項 discovery，Then 該測項出現在 runner case list。
- Given 多個測項分散在不同檔案，When 執行 `npm run test:e2e -- --list`，Then Test Explorer 仍列出每個單條測試。
- Given metadata 缺少必要欄位，When discovery 執行，Then 產生清楚錯誤並指出檔案。

## TDD

- 為 metadata validation、case discovery、manifest sorting 加 focused tests。
- 測試 duplicate `id`、missing `className`、missing script file 的失敗情境。

### Result

- 新增 `tools/e2e/case-discovery.test.mjs`。
- 覆蓋分檔 discovery、deterministic id sort、忽略 `_template.case.json`、duplicate id、missing `automation.className`、missing script file、non-object metadata、preview bundle patterns。

## Implement

- 新增 case discovery module。
- 更新 Playwright spec 或 runner 以 discovery 結果建立 tests。
- 新增測項範本檔與至少一個 slot sample case。
- 移除 `tools/e2e-cases.json`

### Result

- 新增 `tests/e2e/cases/*.case.json` 分檔 metadata：
  - `credit-in-out.case.json`
  - `forced-spin.case.json`
- 新增 `tests/e2e/cases/_template.case.json` 作為新增測項範本，discovery 會忽略 `_` 開頭檔案。
- 新增 `tools/e2e/case-discovery.mjs`，負責讀取、驗證、排序、script existence check、preview bundle pattern 產生。
- 移除 `tools/e2e-cases.json` 與相容 manifest 產生流程，讓 `tests/e2e/cases/*.case.json` 成為唯一測項來源。
- 更新 `tests/e2e/cocos-slot.spec.mjs`，改用 `discoverE2ECases(repoRoot)`，不再讀取集中 JSON。
- 更新 `tools/cocos-rebuild-preview.mjs` 與 `tools/wait-cocos-preview-bundle.mjs`，preview bundle wait patterns 改由 discovered cases 產生。
- 更新 `tools/e2e-test-explorer.md`，新增測項流程改為複製分檔 metadata 範本。
- 未拆分 `assets/slot-e2e.test.ts`，避免 Phase 02 產生不必要 Cocos asset 或 `.meta` churn；Cocos automation class 分檔可在後續 extension/template phase 處理。

## E2E

- 執行 `npm run test:e2e -- --list` 驗證每個分檔測項都被列出。
- 執行至少一條已遷移測項，確認 Cocos automation class 正確被載入。

### Result

- `npx playwright test --list` 列出 2 條 Cocos E2E，來源為分檔 metadata discovery。
- `npm run test:e2e` 通過 2 條現有 slot E2E。

## Review

- 檢查新增測項需要修改的檔案數是否足夠少。
- 檢查測項檔名、id、title、className 的命名規則是否一致。
- 檢查 discovery 是否 deterministic，避免 Test Explorer 清單順序飄移。

### Result

- 自檢：新增測項主要新增一個 `tests/e2e/cases/*.case.json`，並新增對應 Cocos automation class。
- 自檢：metadata 檔名、`id`、`automation.scriptName`、`automation.className` 已建立一致規則。
- 自檢：discovery 先讀檔名排序，再以 `id` 排序輸出，Test Explorer 清單 deterministic。

### Independent Review - 2026-06-25

Findings:

1. `tools/e2e/case-discovery.mjs` 在 JSON 有效但頂層不是 object（例如 `null` 或 string）時，會在讀取 `parsed.automation` 前就丟出一般 TypeError，錯誤訊息不會透過 `caseError()` 帶出 case 檔案與清楚欄位說明。這與本 phase 的「錯誤 metadata 有明確訊息」done criteria 不完全一致。
2. `plans/cocos-e2e-framework/README.md` 與 `plans/cocos-e2e-framework/AGENTS.md` 仍顯示 alignment 階段，和目前 Phase 2 review 狀態不一致，後續 agent 或使用者可能讀到過期流程指示。
3. 本檔 TDD result 仍寫到 `compat manifest output`，但實作已移除相容 manifest 產生流程；Changed Files 也列出目前未在 Phase 2 diff 中變更的 `package.json`。

Review verification:

- `npm run test:e2e:unit` passed：10 tests passed。
- `npx playwright test --list` passed：列出 2 tests。
- `npm run test:e2e` passed：2 tests passed。
- `git diff --check` passed。

Next action: `/qdd-phase-fix 2`。

## Fix

- 修正 discovery 漏列、重複 id、錯誤訊息不清楚或排序不穩定問題。
- 修正範本讓第一次使用者能照著新增測項。

### Result

- 補上 `case metadata must be a JSON object` validation，讓 `null`、array、string 這類非 object metadata 也會回報 case 檔案與清楚錯誤。
- 移除 `plans/cocos-e2e-framework/README.md` 與 `plans/cocos-e2e-framework/AGENTS.md` 中會過期的 current status/current progress 內容；目前進度改由 `status.md` 與 phase 檔紀錄。
- 修正本檔 TDD/Implement/Changed Files 的 manifest 與 `package.json` 記錄漂移。

### Fix Verification - 2026-06-25

- `npm run test:e2e:unit` passed：11 tests passed。
- `npx playwright test --list` passed：列出 2 tests。
- `npm run test:e2e` passed：2 tests passed。
- `git diff --check` passed。

### Post-Fix Independent Review - 2026-06-25

Findings:

- None.

Review verification:

- `npm run test:e2e:unit` passed：11 tests passed。
- `npx playwright test --list` passed：列出 2 tests。
- `npm run test:e2e` passed：2 tests passed。
- `git diff --check` passed。

Next action: `/qdd-phase 3`。

## Wrap Up

- 在本 phase 檔記錄新測項結構與驗證結果。
- 若新增測項流程需要人工檢查，更新 `smoke.md`。

### Changed Files

- `plans/cocos-e2e-framework/README.md`
- `plans/cocos-e2e-framework/AGENTS.md`
- `tests/e2e/cases/_template.case.json`
- `tests/e2e/cases/credit-in-out.case.json`
- `tests/e2e/cases/forced-spin.case.json`
- `tests/e2e/cocos-slot.spec.mjs`
- `tools/e2e-cases.json`（removed）
- `tools/e2e/case-discovery.mjs`
- `tools/e2e/case-discovery.test.mjs`
- `tools/e2e-test-explorer.md`
- `tools/cocos-rebuild-preview.mjs`
- `tools/wait-cocos-preview-bundle.mjs`
- `plans/cocos-e2e-framework/phases/phase-02.md`
- `plans/cocos-e2e-framework/status.md`

### Smoke

- 未新增獨立 `smoke.md`；Phase 02 以 automated verification 覆蓋現有測項 discovery 與執行流程。

## Verification

- Focused discovery/validation tests。
- `npm run test:e2e -- --list`
- 至少一條分檔測項的 E2E 執行。

### Result

- `npm run test:e2e:unit` passed：11 tests passed。
- `npx playwright test --list` passed：列出 2 tests。
- `npm run test:e2e` passed：2 tests passed。

## Done Criteria

- 測項不需要集中寫在單一大型檔案。
- 新增測項有清楚範本與少量 metadata。
- Runner 與 Test Explorer 能從新管理方式列出單條測試。
- 測項 discovery 對錯誤 metadata 有明確訊息。

### Result

- Done.

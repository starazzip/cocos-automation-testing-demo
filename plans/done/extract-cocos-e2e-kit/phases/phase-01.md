# Phase 01 - Inventory And Safety Baseline

## Status

Completed.

## Objective

盤點目前 repo 中 framework、demo frontend、server、E2E 測項與文件的邊界，確認 `starazzip/cocos-e2e-kit` 可存取，並建立後續分支與跨 repo 操作的安全基準。

## Inputs

- `plans/extract-cocos-e2e-kit/decisions.md`
- 目前 repo 的 `README.md`
- `extensions/`
- `tools/`
- `tests/e2e/`
- `assets/`
- `settings/`
- `server/`
- 目標 repo：`https://github.com/starazzip/cocos-e2e-kit`

## Scope

- 檢查目前工作樹、分支與 remotes。
- 盤點哪些檔案屬於 reusable framework，哪些屬於 demo app。
- 確認 kit repo clone/push 權限。
- 產出搬移清單與風險清單。
- 建立必要的安全檢查紀錄。

## Out Of Scope

- 不搬移檔案。
- 不建立分支。
- 不 push。
- 不修改外部 repo。

## Plan

1. 確認本 repo 工作樹狀態與目前分支。
2. 確認 `origin` 與 `starazzip/cocos-e2e-kit` 的遠端可用性。
3. 盤點 framework 檔案：
   - `extensions/cocos-e2e-framework/`
   - `extensions/automation-framework/`
   - reusable `tools/e2e/`
   - reusable runner/proxy/server helpers
   - Playwright config/template
4. 盤點 demo app 檔案：
   - Cocos frontend
   - `server/`
   - slot demo assets/scripts
   - demo-only E2E case/test files
5. 建立後續 phase 的檔案搬移對照表。

## BDD

- Given 目前 repo 包含 framework 與 demo app  
  When 完成盤點  
  Then 每個主要檔案群組都應被分類為 kit、demo baseline、demo final 或暫不處理。

## TDD

- 不新增自動測試；本 phase 是盤點與風險控制。
- 若建立搬移清單 helper script，需能 dry-run 並輸出 deterministic 清單。

## Implement

- 可新增或更新 phase 記錄與搬移清單文件。
- 不改動 runtime 程式碼。

## E2E

- Not applicable；尚未搬移或重構。

## Review

- 檢查分類是否把 demo-specific adapter、slot demo case 與 reusable framework 混在一起。
- 檢查是否有任何需要使用者確認的 repo 權限或分支風險。

## Fix

- 若分類不清楚，補充搬移清單與原因。
- 若 kit repo 無法存取，停止後續 phase 並回報 blocker。

## Wrap Up

- 在 phase 檔記錄：
  - kit repo 存取狀態
  - framework 搬移清單
  - demo baseline 保留清單
  - 後續高風險操作

## Results

### Repository Baseline

- Current branch: `main`
- Baseline commit: `44b5dc32247dccc630cc20982be75dcbf4b06dc4`
- Local untracked QDD files:
  - `plans/current.md`
  - `plans/extract-cocos-e2e-kit/`
- Demo repo remote:
  - `origin https://github.com/starazzip/cocos-automation-testing-demo.git`
- Kit repo remote:
  - `https://github.com/starazzip/cocos-e2e-kit.git`
  - `git ls-remote --heads` succeeded and returned no heads; treat as accessible empty/uninitialized repo for Phase 02.

### Reusable Framework Inventory

Move to `starazzip/cocos-e2e-kit`:

- `extensions/cocos-e2e-framework/`
- `extensions/automation-framework/`
- `tools/automation-server.mjs`
- `tools/cocos-preview-proxy.mjs`
- `tools/wait-cocos-preview-bundle.mjs`
- `tools/e2e/case-discovery.mjs`
- `tools/e2e/case-discovery.test.mjs`
- `tools/e2e/environment-adapters.mjs`
- `tools/e2e/environment-adapters.test.mjs`
- `tools/e2e/extension-scaffold.test.mjs`
- `tools/e2e/runner-core.mjs`
- `tools/e2e/runner-core.test.mjs`
- Generic Playwright scaffold from `tests/e2e/cocos-e2e.spec.mjs`
- Generic case/template scaffold from `tests/e2e/cases/_template.case.json`
- Generic Cocos automation template from `assets/e2e/_template-e2e.test.ts` if present in the extension template.
- Relevant framework README content from root `README.md`.

### Demo-Specific Inventory

Keep in this demo repo only:

- Slot frontend:
  - `assets/main.scene`
  - `assets/main.ts`
  - `assets/scripts/`
  - `settings/`
  - Cocos project files: `package.json`, `package-lock.json`, `tsconfig.json`
- Go backend:
  - `server/`
  - `go.work`
- Demo E2E cases for final `main` only:
  - `tests/e2e/cases/credit-in-out.case.json`
  - `tests/e2e/cases/forced-spin.case.json`
  - `tests/e2e/cases/frontend-only-spin.case.json`
  - `assets/e2e/credit-in-out.test.ts`
  - `assets/e2e/forced-spin.test.ts`
  - `assets/e2e/frontend-only-spin.test.ts`
  - `assets/e2e/slot-test-helpers.ts`
- Demo adapter:
  - `tools/e2e/project-environment-adapters.mjs`
  - `tools/e2e/project-environment-adapters.test.mjs`
  - `tools/demo-backend.mjs`
  - `tools/testConfig.slot-e2e.json`
- Personal/local tool not part of framework:
  - `extensions/cocos-mcp-server/`

### Branch Mapping

- `demo-without-e2e`:
  - Move Cocos frontend into `frontend/`.
  - Keep `server/`.
  - Remove framework scaffold, E2E tests, Playwright config/scripts, and demo E2E adapters.
  - Keep playable app behavior.
- `main`:
  - Keep the same `frontend/` and `server/` structure.
  - Re-adopt framework from kit.
  - Restore the three demo E2E cases and demo-specific adapter.

### High-Risk Operations

- Moving Cocos project files under `frontend/` may affect Cocos Creator project root assumptions.
- Branch switching after large path moves requires a clean working tree.
- Kit repo appears uninitialized; Phase 02 must create the initial branch without force push.
- `extensions/cocos-mcp-server/` is not part of the E2E kit and should not be copied.

### Phase 01 Review

- Findings: None.
- Verification passed:
  - `git status --short`
  - `git branch --show-current`
  - `git remote -v`
  - `git ls-remote --heads https://github.com/starazzip/cocos-e2e-kit.git`
- Required fixes: None.

## Verification

- `git status --short`
- `git branch --show-current`
- `git remote -v`
- kit repo clone 或 remote ls-remote 成功
- 搬移清單已寫入 phase 記錄

## Done Criteria

- 已確認 kit repo 可操作或明確標記 blocker。
- 已清楚分出 framework、frontend demo、server demo、E2E final demo。
- 後續 phase 可以依搬移清單執行。

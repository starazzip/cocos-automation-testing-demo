# Phase 02 - Extract Framework To Cocos E2E Kit

## Status

Completed.

## Objective

將 reusable Cocos E2E framework 搬到 `starazzip/cocos-e2e-kit`，整理 kit README 與最小驗證，讓 kit repo 可以作為獨立交付物。

## Inputs

- Phase 01 搬移清單
- `extensions/cocos-e2e-framework/`
- `extensions/automation-framework/`
- reusable `tools/e2e/`
- runner/proxy/wait helpers
- framework 相關 tests
- 目前 root README 的 framework 說明

## Scope

- 在 kit repo 建立 framework 檔案結構。
- 移入 Cocos Creator extension 與 automation-framework。
- 移入 reusable runner、case discovery、environment adapter、tests 與 templates。
- 撰寫 kit README。
- 保留最小 example/template，但不放完整 slot demo。
- 在 kit repo 建立乾淨 commit。

## Out Of Scope

- 不放完整 slot demo。
- 不做 npm package 化。
- 不做 git submodule。
- 不建立完整 CI/CD。
- 不修改本 repo 分支結構。

## Plan

1. Clone 或更新 `starazzip/cocos-e2e-kit` 到安全工作目錄。
2. 建立 kit repo 目錄結構。
3. 複製 reusable framework 檔案。
4. 移除 demo-specific 內容：
   - slot case
   - `demo-backend`
   - `slotFixture`
   - Go server 假設
5. 撰寫 kit README：
   - 安裝/導入方式
   - Cocos Creator extension menu
   - case metadata 與 automation class
   - frontend-only adapter
   - 自訂 backend adapter
   - Cocos 元件操作範例
   - 本地 E2E 執行與 visual mode
6. 跑 kit repo tests。
7. Commit 並 push kit repo。

## BDD

- Given 一個新的 Cocos Creator 專案  
  When 使用 kit README 透過 extension 初始化  
  Then 專案應獲得 E2E scaffold、case template、runner 與必要 scripts。

- Given 使用者需要自訂後端  
  When 閱讀 kit README adapter 範例  
  Then 可以知道如何新增 project adapter，而不需要修改 framework core。

## TDD

- 保留/移植 framework unit tests。
- 針對 scaffold、case discovery、environment adapter、runner core 執行 unit tests。
- 若搬移後 import path 改變，需要更新 tests。

## Implement

- 建立 kit repo 檔案。
- 調整路徑與 README。
- 確保 kit repo 沒有本 repo demo 專用依賴。

## E2E

- Kit repo 不放完整 demo；E2E 以 scaffold/listing 的可操作文件與 unit tests 為主。
- 完整 demo E2E 留到本 repo `main` phase 驗證。

## Review

- 檢查 kit repo 是否仍殘留 slot demo、Go backend 或本 repo 專用文字。
- 檢查 README 是否足以讓第一次使用者導入。
- 檢查 Cocos MCP 不被描述為必要條件。

## Fix

- 修正殘留 demo coupling。
- 修正 README 缺漏或不一致。
- 修正 unit tests 路徑與 import。

## Wrap Up

- 記錄 kit repo commit hash。
- 記錄 kit repo verification results。
- 記錄仍需 demo repo 驗證的項目。

## Results

### Kit Repo

- Path: `D:\Azzip\cocos\cocos-e2e-kit`
- Remote: `https://github.com/starazzip/cocos-e2e-kit.git`
- Branch: `main`
- Commit: `2f54565 Initial Cocos E2E kit`

### Extracted Content

- `extensions/cocos-e2e-framework/`
- `extensions/cocos-e2e-framework/templates/project/extensions/automation-framework/`
- Template runner files under `extensions/cocos-e2e-framework/templates/project/tools/`
- Template unit tests under `extensions/cocos-e2e-framework/templates/project/tools/e2e/*.test.mjs`
- Kit scaffold tests under `tests/extension-scaffold.test.mjs`
- Kit README, `.gitignore`, and root `package.json`

### Review

- Findings found and fixed:
  - `extensions/cocos-e2e-framework/README.md` still referenced the source repo's demo E2E verification. It now references kit-level `npm test`.
- Final findings: None.

### Verification

- `npm install`: passed.
- `npm test`: passed, 33 tests.
- `rg` for demo-only coupling (`slotFixture`, `demo-backend`, `SLOT_`, `credit-in`, `forced board`, `slot demo`, `Go backend`, `cocos-mcp`, `本 repo 的 demo`): no matches.
- `git diff --check`: passed.
- `git push origin main`: passed.

## Verification

- kit repo `git status --short`
- kit repo unit tests
- kit repo `git diff --check`
- README grep：無 demo-only coupling，例如 `slotFixture`、`demo-backend`、`SLOT_`，除非明確標為非 kit 內容
- push 到 `starazzip/cocos-e2e-kit`

## Done Criteria

- kit repo 已有可重用 framework 與 README。
- kit repo 已 push。
- kit repo 不包含完整 slot demo。
- kit repo 不要求 Cocos MCP。

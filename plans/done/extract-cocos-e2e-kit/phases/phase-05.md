# Phase 05 - Documentation And Tutorial

## Status

Completed.

## Objective

整理 `cocos-e2e-kit` 與本 repo 的 README，使兩個 repo 的用途、導入流程、分支操作與範例清楚分工。

## Inputs

- Kit repo 最終檔案
- 本 repo `demo-without-e2e`
- 本 repo `main`
- 決策中的 README 分工
- 驗證結果

## Scope

- kit README：
  - framework 目的
  - Cocos Creator extension 導入
  - 初始化、建立測項、刷新索引、檢查設定
  - case metadata
  - Cocos automation class
  - frontend-only
  - backend adapter
  - Cocos 元件操作表格與範例
  - visual mode
  - local/self-hosted runner 前置條件
- demo repo README：
  - repo 是 demo 專案
  - `frontend/` 與 `server/`
  - `demo-without-e2e` 與 `main` 分支用途
  - 如何從導入前分支照 kit README 導入
  - 如何驗證 main 最終狀態

## Out Of Scope

- 不寫 marketing landing page。
- 不建立完整 CI/CD。
- 不新增大型 API reference。

## Plan

1. 寫 kit README。
2. 寫 demo repo README。
3. 確認 README 指令與 package scripts 一致。
4. 確認 README 不提 Cocos MCP 為必要條件。
5. 加入 troubleshooting。
6. 加入一個最小範例：按 Button，檢查 Label 文字。
7. 更新 smoke steps。

## BDD

- Given 使用者第一次看到 kit repo  
  When 閱讀 README  
  Then 能知道如何導入 framework、建立測項、執行 E2E。

- Given 使用者第一次看到 demo repo  
  When 閱讀 README  
  Then 能知道哪個分支是導入前，哪個分支是導入後。

## TDD

- 文件不需要 unit tests。
- 使用 grep/checklist 驗證指令與關鍵路徑一致。

## Implement

- 更新 kit README。
- 更新 demo README。
- 更新 plan smoke。
- 若指令名稱調整，回補 scripts 或文件。

## E2E

- 文件 phase 不直接新增 E2E。
- 但 README 指令要以 Phase 04 的 E2E 驗證結果為準。

## Review

- 檢查 README 是否有自言自語或內部決策口吻。
- 檢查是否混淆 kit repo 與 demo repo。
- 檢查所有 Cocos 元件操作都有範例與輸出/結果描述。

## Fix

- 修正文案冗長、不專業或與程式不一致的地方。
- 修正錯誤指令與錯誤路徑。

## Wrap Up

- 記錄文件驗證結果。
- 記錄 README 的主要入口段落。

## Results

### Documentation Updated

- Kit README was created in `D:\Azzip\cocos\cocos-e2e-kit\README.md`.
- Demo repo README was rewritten at root `README.md`.

### Demo README Coverage

- Branch roles:
  - `demo-without-e2e`
  - `main`
- Project structure:
  - `frontend/`
  - `server/`
- Local demo startup.
- E2E execution from `frontend/`.
- Visual mode commands.
- Existing three demo E2E cases.
- How to add a new demo E2E case.
- How to start from `demo-without-e2e` and compare with `main`.
- Port table.
- Verification commands.
- Troubleshooting.

### Review

- Findings: None.
- README uses concise project-facing wording.
- README does not describe Cocos MCP as a requirement.
- README paths point to the new `frontend/` layout.

### Verification

- README grep for old root E2E paths: no invalid root-path instructions found.
- README referenced files exist.
- `npx playwright test --list` in `frontend/`: listed 3 tests.
- `git diff --check`: passed.

## Verification

- `rg` 檢查舊路徑、舊分支名、Cocos MCP 必要條件字樣。
- `npx playwright test --list` 指令與 README 一致。
- `git diff --check`

## Done Criteria

- kit README 可作為 framework 導入入口。
- demo README 可作為分支教學入口。
- 文件清楚、短、專業。
- README 與實際 repo 狀態一致。

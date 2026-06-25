# Phase 06 - README, Tutorial, And Example

## Status

Not started.

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

- 更新 root README 或新增框架 README。
- 更新 extension README 或補充 extension 使用章節。
- 更新 `tools/e2e-test-explorer.md` 或合併到主 README。
- 撰寫 simple example，確保與實作檔案一致。
- 更新 plan `smoke.md`。

## E2E

- 依 README 快速開始流程跑一次最小驗證。
- 執行 `npm run test:e2e -- --list`。
- 執行 README 中指定的 simple example case。

## Review

- 檢查文件是否把 slot demo 誤寫成框架必要條件。
- 檢查 extension、runner、case、adapter 名詞是否一致。
- 檢查步驟是否能由第一次使用者照做。

## Fix

- 修正文檔與實作不一致、命令錯誤、路徑錯誤或範例過度複雜問題。
- 若某些步驟需要 Cocos Creator 已開啟或 Preview 已啟動，明確寫在前置條件。

## Wrap Up

- 在本 phase 檔記錄文件更新與驗證結果。
- 確認 `smoke.md` 是最終人工驗證入口。

## Verification

- README quick start commands。
- `npm run test:e2e -- --list`
- README simple example case。
- 人工檢查 `smoke.md` 步驟完整性。

## Done Criteria

- README 清楚描述框架目的與導入方式。
- 有一步一步教學。
- 有簡單範例。
- 文件涵蓋 extension、分檔測項、adapter、frontend-only E2E、CLI 與 Test Explorer。
- 文件步驟已被驗證或清楚標記前置條件。

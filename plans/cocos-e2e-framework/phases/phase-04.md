# Phase 04 - Cocos Creator Extension MVP

## Status

Not started.

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

## Implement

- 新增 extension 檔案與 package metadata。
- 新增 scaffold/template generation 模組。
- 新增命令或 method 給 Cocos Creator 呼叫。
- 確保 extension 產生的檔案符合 Phase 01-03 的 runner/case/adapter contract。

## E2E

- 在本 repo 以 extension 產生或驗證 framework scaffold。
- 執行 `npm run test:e2e -- --list` 確認 extension 產物可被 runner 使用。
- 如 Cocos Creator extension 自動化不可行，保留明確手動驗證步驟並記錄限制。

## Review

- 檢查 extension 是否與 sample game 解耦。
- 檢查 extension 是否會覆蓋使用者既有檔案；需要 overwrite policy 或明確提示。
- 檢查路徑處理是否限制在專案目錄內。

## Fix

- 修正 extension scaffold 不完整、路徑不安全、覆蓋策略不清楚、錯誤訊息不可操作等問題。
- 修正 extension 產物與 runner contract 不一致問題。

## Wrap Up

- 在本 phase 檔記錄 extension command、產物路徑與驗證結果。
- 若使用者需要手動驗證 extension，更新 `smoke.md`。

## Verification

- Extension scaffold/generator focused tests。
- Extension package metadata sanity check。
- `npm run test:e2e -- --list`
- 至少一條 extension 產生或管理的測項可執行。

## Done Criteria

- 有 Cocos Creator extension 作為 MVP 交付入口。
- Extension 可初始化框架。
- Extension 可產生新測項範本。
- Extension 與範例遊戲解耦，且不需要開發者手動維護複雜 registry。

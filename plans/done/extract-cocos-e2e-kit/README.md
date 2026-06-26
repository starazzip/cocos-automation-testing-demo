# Extract Cocos E2E Kit

## Goal

將目前 repo 中可重用的 Cocos E2E framework 拆到 `starazzip/cocos-e2e-kit`，讓 framework 成為獨立可導入的工具。

本 repo 則整理回 demo 專案定位：

- 保留可正常遊玩的 Cocos 前端與後端。
- 將 Cocos 前端程式整理到 `frontend/`。
- 將後端程式整理到明確的後端資料夾。
- 建立一個尚未導入 E2E framework、但可正常遊玩的遠端分支，讓使用者能實際操作導入流程。
- `main` 保留為依 README 導入 framework 並完成 E2E 測項的最終結果。

## Current Status

Planning ready.

## How To Continue

1. 閱讀 `decisions.md` 與 `phases/`。
2. 若 phase 安排正確，執行 `/qdd-phase 1`。
3. 每個 phase 完成後執行 `/qdd-review <phase-number>`，必要時再執行 `/qdd-phase-fix <phase-number>`。

## Known Constraints And Assumptions

- 目前 repo 已完成一版 Cocos E2E framework demo。
- `starazzip/cocos-e2e-kit` 會成為 framework 交付 repo。
- 本 repo 會成為「前後端 demo 專案 + 導入前/導入後分支」。
- README 必須清楚分開 framework kit 說明與 demo repo 說明。
- 需要小心處理 Git 分支、遠端 push 與跨 repo 檔案移動，避免覆蓋未確認內容。
- 使用者可讀、需操作或需審查的文件預設使用繁體中文。

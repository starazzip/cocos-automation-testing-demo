# Extract Cocos E2E Kit Decisions

## Confirmed Decisions

1. Framework 會移到獨立 repo `starazzip/cocos-e2e-kit`。
   - kit repo 放 reusable framework。
   - 範圍包含 Cocos Creator extension、automation-framework、runner/tools、templates、README 與範例導入說明。
   - 不把完整 slot demo 放進 kit repo。

2. `cocos-e2e-kit` 只保留最小範例與文件。
   - 完整可執行 demo 留在本 repo。
   - kit repo 的 README 要能讓使用者把 framework 導入自己的 Cocos 專案。

3. 跨 repo 搬移不要求保留細部 Git 歷史。
   - 使用乾淨 commit 將 framework 內容搬到 `cocos-e2e-kit`。
   - 不使用 `git subtree split` 作為 MVP 必要條件。

4. 本 repo 的導入前可遊玩分支命名為 `demo-without-e2e`。
   - 該分支要保留可正常遊玩的前端與後端。
   - 該分支不得包含尚未導入前就已存在的 E2E framework scaffold。
   - 用途是讓使用者可以切到此分支，照 kit README 實際操作導入流程。

5. 本 repo 的 `main` 是導入後最終結果。
   - `main` 要完成前端/後端結構整理。
   - `main` 要依照 kit README 導入 framework。
   - `main` 要保留已完成的 E2E 測項。

6. Cocos 前端整理到 `frontend/`。
   - `frontend/` 應包含 Cocos Creator 專案需要的前端內容，例如 `assets/`、`settings/`、`extensions/`、Cocos 專案設定與前端 npm 設定。
   - 需要避免不必要的 Cocos asset 或 `.meta` churn。

7. 後端保留 `server/`。
   - 問卷選擇保留目前 `server/` 名稱。
   - README 要明確說明 `server/` 是後端資料夾。
   - 此決策取代原本「移到 backend/」的建議預設。

8. README 分工如下。
   - `cocos-e2e-kit` README：framework 導入方式、Cocos Creator extension、case 管理、adapter 擴充、Cocos 元件操作範例與 API。
   - 本 repo README：demo 專案架構、`frontend/` 與 `server/` 分工、分支用途、如何從 `demo-without-e2e` 操作到 `main` 的最終結果。

9. Demo repo 的最終 E2E 測項保留現有核心案例。
   - `credit-in and credit-out`
   - `forced board spin payout`
   - `frontend-only deterministic spin`

10. MVP 導入方式以 Cocos Creator extension 為主。
    - 不把 npm package、git submodule 或 Cocos Creator extension 之外的導入形式作為 MVP 必要項。

11. 分支與 push 策略採正常 commit 流程。
    - 先整理出 `demo-without-e2e` 並 push。
    - 再在 `main` 導入 kit 與 E2E，最後 push `main`。
    - 不允許 force push。

12. 驗證標準包含 kit repo 與 demo repo。
    - kit repo：scaffold/unit tests、README 導入說明可自洽。
    - 本 repo `demo-without-e2e`：可啟動前端與後端，且尚未導入 E2E framework。
    - 本 repo `main`：可列出 E2E，並可執行保留的 demo E2E。
    - 若 Cocos Preview 需要人工開啟，README 與 smoke steps 要明確標記。

13. CI/CD 不納入 MVP 實作。
    - README 可說明本地執行與 self-hosted Windows runner 的前置條件。
    - 本次不建立完整 GitHub Actions 矩陣。

14. 保留既有 QDD 歷史。
    - 已完成 plan 留在 `plans/done/`。
    - 本搬移工作使用新的 plan。
    - 不把舊 plan 搬到 kit repo。

## Defaults Used

以下題目使用問卷中的 Recommended 預設：

- 1：kit repo 放 reusable framework。
- 2：kit repo 不放完整 demo，只放最小範例與文件。
- 3：跨 repo 搬移不保留細部歷史，用乾淨 commit。
- 5：本 repo `main` 作為導入 framework 與 E2E 的最終結果。
- 6：Cocos 前端整理到 `frontend/`。
- 8：README 分工為 kit README 說明 framework，本 repo README 說明 demo 與分支。
- 9：保留現有三條核心 E2E。
- 10：MVP 導入方式使用 Cocos Creator extension。
- 11：先 push playable branch，再完成並 push main。
- 12：不允許 force push。
- 13：驗證包含 kit repo、本 repo playable branch、本 repo main。
- 14：不建立完整 CI/CD，只補文件說明。
- 15：保留已完成 QDD plan，不刪除歷史紀錄。

以下題目採用使用者非預設選擇：

- 4：導入前可遊玩分支使用 `demo-without-e2e`。
- 7：後端保留 `server/`，只在 README 明確標示為後端。

## Constraints

- 不得在決策確認前搬移程式碼、建立分支、push 或操作 `starazzip/cocos-e2e-kit`。
- 需要先確認 kit repo 可存取、可 clone、可 push。
- 不允許 force push。
- 需要保留一個真的可遊玩的導入前分支。
- `main` 必須能代表照 README 導入後的完成狀態。
- Framework code 與 demo app code 必須分離。
- Cocos MCP 不得成為 framework 或 demo 導入流程的必要條件。
- 避免不必要的 Cocos asset 與 `.meta` 異動。
- 文件、smoke steps 與需要使用者操作的內容使用繁體中文。

## Out Of Scope

- npm package 化。
- git submodule 導入。
- 建立完整 GitHub Actions 或多平台 CI/CD 矩陣。
- 在 `cocos-e2e-kit` 放完整 slot demo 專案。
- 保留 framework 搬移前的細部 Git 歷史。
- 重寫遊戲玩法或後端產品邏輯。

## Open Questions

- None.

## Confirmation

請檢查本檔內容。若決策正確，請在聊天中確認後執行 `/qdd-plan`。

# Questionnaire

請勾選或填寫每題答案。未回答的題目會採用標示為「Recommended」的預設答案。每題若選 `Other:`，請寫出具體內容。

## 1. Framework repo 要放哪些內容？

- [x] A. `cocos-e2e-kit` 放 reusable framework：Cocos Creator extension、automation-framework、runner/tools、templates、README 與範例導入說明。 (Recommended)
- [ ] B. 只放 Cocos Creator extension，其他工具留在 demo repo。
- [ ] C. 同時放 framework 與完整 slot demo。
- [ ] Other:

## 2. `cocos-e2e-kit` 是否要包含可執行 demo？

- [x] A. 不放完整 demo，只放最小範例檔與文件；完整 demo 留在本 repo。 (Recommended)
- [ ] B. 放一個完整 Cocos demo 專案，方便 kit repo 自我驗證。
- [ ] C. 只放文件與 scaffold，不放任何範例檔。
- [ ] Other:

## 3. 跨 repo 搬移要不要保留 framework 檔案歷史？

- [x] A. 不保留細部歷史，用乾淨 commit 搬移到 `cocos-e2e-kit`，降低操作風險。 (Recommended)
- [ ] B. 嘗試用 `git subtree split` 或類似方式保留部分歷史。
- [ ] C. 先不 push kit repo，只產出本地整理結果。
- [ ] Other:

## 4. 本 repo 的「導入前可遊玩分支」名稱？

- [] A. `playable-before-e2e`。 (Recommended)
- [ ] B. `before-e2e-framework`。
- [x] C. `demo-without-e2e`。
- [ ] Other:

## 5. 本 repo 的 `main` 最終狀態應該包含什麼？

- [x] A. 已整理 frontend/backend，並已照 kit README 導入 framework 與 E2E 測項。 (Recommended)
- [ ] B. 只保留整理後的 frontend/backend，不含 E2E framework。
- [ ] C. 保持目前狀態，只更新 README 指向 kit repo。
- [ ] Other:

## 6. Cocos 前端要如何整理到 `frontend/`？

- [x] A. 將 Cocos Creator 專案根目錄整理成 `frontend/`，包含 `assets/`、`settings/`、`extensions/`、Cocos 專案設定與前端 npm 設定。 (Recommended)
- [ ] B. 只把 `assets/` 移到 `frontend/assets/`，其他仍放 repo root。
- [ ] C. 暫不移動 Cocos 專案，只更新文件。
- [ ] Other:

## 7. 後端資料夾名稱？

- [] A. 使用 `backend/`，把目前 `server/` 內容移入。 (Recommended)
- [x ] B. 保留 `server/`，只在 README 說明它是後端。
- [ ] C. 使用 `go-backend/`。
- [ ] Other:

## 8. README 要如何分工？

- [x] A. `cocos-e2e-kit` README 說明 framework 導入與 API；本 repo README 說明 demo 架構、分支用途、如何從導入前分支操作到 main 結果。 (Recommended)
- [ ] B. 所有詳細教學都放 kit README，本 repo README 只放連結。
- [ ] C. 所有教學都放本 repo README，kit README 簡短說明。
- [ ] Other:

## 9. Demo repo 的最終 E2E 測項要保留哪些？

- [x] A. 保留現有 slot demo 的核心 E2E：credit in/out、forced spin、frontend-only spin。 (Recommended)
- [ ] B. 只保留一條最小 frontend-only 測項。
- [ ] C. 暫時不保留 E2E 測項，只示範導入 framework。
- [ ] Other:

## 10. `cocos-e2e-kit` 導入方式在 MVP 要支援哪一種？

- [x] A. 使用 Cocos Creator extension 複製/產生必要檔案；README 以此為主。 (Recommended)
- [ ] B. 使用 npm package 安裝。
- [ ] C. 使用 git submodule。
- [ ] Other:

## 11. 分支與 push 策略？

- [x] A. 先整理出 playable branch 並 push，再在 `main` 導入 kit 與 E2E，最後 push main。 (Recommended)
- [ ] B. 先完成 main，再從 main 回退建立 playable branch。
- [ ] C. 只建立本地分支，不 push，待人工確認後再推。
- [ ] Other:

## 12. 是否允許 force push？

- [x] A. 不允許 force push；所有遠端更新都用正常 commit。 (Recommended)
- [ ] B. 允許在明確確認後 force push 指定分支。
- [ ] C. 只允許 force-with-lease。
- [ ] Other:

## 13. 驗證標準？

- [x] A. 至少驗證 kit repo scaffold/unit tests、本 repo playable branch 可啟動前後端、main 可列出並執行 E2E；若 Cocos Preview 需人工開啟，文件要明確標記。 (Recommended)
- [ ] B. 只跑自動 unit tests 與 Playwright test list。
- [ ] C. 只做文件與檔案結構檢查。
- [ ] Other:

## 14. CI/CD 是否要納入這次範圍？

- [x] A. 暫不建立完整 CI/CD，只在 README 說明可用的本地與 self-hosted runner 前置條件。 (Recommended)
- [ ] B. 為 kit repo 與 demo repo 都建立 GitHub Actions。
- [ ] C. 只建立 demo repo CI。
- [ ] Other:

## 15. 需要保留哪些舊文件或 plan 紀錄？

- [x] A. 已完成的 QDD plan 留在 `plans/done/`；新搬移工作建立新 plan，不刪除歷史紀錄。 (Recommended)
- [ ] B. 清掉舊 plan，只保留最新文件。
- [ ] C. 將舊 plan 也搬到 kit repo。
- [ ] Other:

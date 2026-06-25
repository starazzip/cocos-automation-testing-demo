# Cocos E2E Framework Decisions

## Confirmed Decisions

1. 主要使用者是 Cocos 遊戲開發者與測試人員。
   - 目標是讓他們能快速新增、執行、維護 E2E 測項。

2. 最重要成果是一套可重用的測試框架。
   - 必須包含清楚 README。
   - 必須包含一步一步教學。
   - 必須包含簡單範例。
   - 範例遊戲與後端只用來驗證框架，不是主要產品。

3. MVP 能力包含完整測試流程骨架。
   - 啟動測試環境。
   - 宣告測項。
   - 控制 deterministic fixture。
   - 執行 Cocos automation。
   - 彙整測試結果。

4. 導入形式以 Cocos Creator extension 作為 MVP 交付形式。
   - 使用者應能透過 extension 導入或產生必要的 `tools/`、`tests/`、設定檔與 Cocos test class 範本。
   - extension 應降低手動複製檔案與設定的成本，讓框架更容易套用到其他 Cocos 專案。
   - npm package 化暫不作為 MVP 交付形式。

5. 測項管理方式要避免所有測項集中寫在同一個檔案。
   - 每個測項或測項群組應能獨立成檔或小模組，方便閱讀、維護與 code review。
   - 框架或 extension 應負責產生、發現或彙整測項索引，讓 Playwright / Test Explorer 仍能列出與執行單條測項。
   - 開發者撰寫新測項時應只需要使用簡單範本與少量 metadata，不需要理解複雜 registry 實作。
   - Cocos automation test class 仍用來承載遊戲內操作與 assertion，但管理方式必須支援分檔與擴展。

6. Cocos automation 與 Playwright 分工明確。
   - Cocos automation 負責遊戲內 assertion。
   - Playwright 負責 orchestration、browser preview、VS Code Test Explorer 整合與截圖輔助。
   - Playwright 不應取代主要遊戲內 assertion。

7. 後端 fixture 只作為 demo adapter，框架核心必須保留後端彈性。
   - 目前 Go 後端是為 demo 與驗證框架而寫，不代表真實專案的後端架構。
   - 框架不得綁死 Go backend、特定 WebSocket protocol 或特定 server 啟動方式。
   - 後端整合應透過可替換的 adapter / fixture contract 表達，例如啟動服務、提供連線資訊、設定 deterministic responses、清理測試狀態。
   - 框架必須支援完全無法接觸後端程式碼的情境，讓測試可只透過前端操作、前端測試控制點、mock transport 或可替換 client adapter 完成 E2E。
   - demo backend 可提供 deterministic server responses，但不能成為框架核心假設。
   - 後端 fixture 不應膨脹成完整產品級遊戲服務。

8. 完成標準包含功能、文件與架構品質。
   - 命令列 E2E 可執行。
   - VS Code Test Explorer 可列出單條測試。
   - README 教學可照步驟完成簡單範例。
   - 測試框架必須與範例遊戲解耦。
   - 架構必須簡單易懂。
   - 測試框架必須容易擴展。
   - 實作需符合編程最佳實踐。

9. README 與教學讀者是第一次接觸本框架的 Cocos 開發者。
   - 文件要讓讀者照步驟導入框架。
   - 文件要示範如何新增一個簡單測項。

10. 風險取捨是先做清楚、穩定、可教學的小框架。
    - package 化、多平台矩陣、完整報表系統與雲端測試平台可留到後續。

## Defaults Used

以下題目使用問卷中的建議預設或已勾選預設：

- 1：主要服務 Cocos 遊戲開發者與測試人員。
- 2：交付可重用框架、README、逐步教學與簡單範例。
- 3：MVP 包含環境啟動、測項宣告、deterministic fixture、Cocos automation 與結果彙整。
- 4：使用者改為要求以 Cocos Creator extension 作為 MVP 交付形式，取代原本建議預設的專案內 tools/tests 範本。
- 5：使用者要求好的測項管理方式，避免所有測項集中在同一檔；框架需支援分檔、索引/發現與簡單範本。
- 6：Cocos automation 做 assertion，Playwright 做 orchestration 與工具整合。
- 7：使用者要求保留後端彈性；demo Go backend 只作為 adapter 範例，框架不能綁死真實後端架構，並且要支援無後端程式碼存取時的前端-only E2E。
- 8：不做完整 slot 產品、不做雲端測試平台、不做大型報表系統。
- 9：不使用真實玩家資料；fixture 與範例資料保持本地、可重建、可提交審查。
- 11：README 與教學面向第一次接觸本框架的 Cocos 開發者。
- 12：先做小而穩定、可教學的框架。

第 10 題採用使用者填寫的 `Other`，並保留原本建議預設中的命令列、Test Explorer、README 教學驗證標準。

## Constraints

- Cocos Creator 3.8.x 專案慣例仍適用。
- MVP 交付形式是 Cocos Creator extension，extension 必須與範例遊戲解耦。
- 避免無關 Cocos asset 或 `.meta` 變更。
- 框架邏輯、範例遊戲、後端 fixture、文件要維持清楚邊界。
- 測項管理設計必須支援分檔、可搜尋、可審查、可擴展，且不能讓開發者手動維護複雜集中清單。
- 後端整合必須透過可替換 adapter / fixture contract，不能假設真實專案一定使用本 repo 的 Go backend 或 WebSocket protocol。
- 框架必須提供前端-only E2E 路徑，支援在無法修改或啟動真實後端時，透過 mock transport、frontend test hook 或 client adapter 達成 deterministic 測試。
- Transport / WebSocket orchestration 不應混入遊戲商業邏輯。
- 不使用真實玩家資料或外部私有服務。
- 測試資料與 fixture 應可重建、可提交審查。
- 使用者可讀、需確認或需操作的文件預設使用繁體中文。

## Out Of Scope

- 完整 slot 產品。
- 產品級 Go 遊戲後端。
- 雲端測試平台。
- 大型測試報表系統。
- npm package 化。
- 完整多遊戲、多瀏覽器、多裝置矩陣。
- Playwright 取代 Cocos automation 的主要遊戲內 assertion。

## Open Questions

- None.

## Confirmation

請檢查本檔內容。若決策正確，請在聊天中確認後執行 `/qdd-plan`。

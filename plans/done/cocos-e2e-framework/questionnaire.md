# Cocos E2E Framework Questionnaire

請勾選或保留每題的建議預設。未回答的題目會使用標示為「建議預設」的選項。每題只能選一個答案；若選 `Other:`，請在同一行寫清楚你的答案。

## Questions

1. 這套框架最主要要服務誰？
   - [x] Cocos 遊戲開發者與測試人員，需要快速新增 E2E 測項。（建議預設）
   - [ ] 只服務這個 slot prototype 的開發。
   - [ ] CI 維運人員，主要關注遠端 pipeline 穩定性。
   - [ ] Other:

2. 最重要的成果是什麼？
   - [x] 一套可重用的測試框架，加上清楚 README、逐步教學與簡單範例。（建議預設）
   - [ ] 先把目前 slot game 的 E2E 全部修到穩定即可。
   - [ ] 先做完整測試報表與視覺回歸。
   - [ ] Other:

3. MVP 應該包含哪些能力？
   - [x] 啟動測試環境、宣告測項、控制 deterministic fixture、執行 Cocos automation、彙整結果。（建議預設）
   - [ ] 只需要命令列能跑一條測試。
   - [ ] 需要完整支援多遊戲、多瀏覽器、多裝置矩陣。
   - [ ] Other:

4. 導入體驗應該偏向哪種形式？
   - [x] 專案內 tools/tests 範本，使用者複製少量檔案與設定即可導入。（建議預設）
   - [ ] 打包成 npm package。
   - [ ] 做成 Cocos Creator extension。
   - [ ] Other:

5. 撰寫測項時，開發者最應該面對哪個 API？
   - [x] 簡潔的 case registry 加 Cocos automation test class 範本。（建議預設）
   - [ ] 主要撰寫 Playwright test。
   - [ ] 主要撰寫後端 fixture JSON，不碰 Cocos test class。
   - [ ] Other:

6. Cocos automation 與 Playwright 的責任分工應該是？
   - [x] Cocos automation 做遊戲內 assertion；Playwright 負責 orchestration、browser preview、VS Code Test Explorer 與截圖輔助。（建議預設）
   - [ ] Playwright 取代大部分遊戲內 assertion。
   - [ ] 只使用 Cocos automation，不需要 Playwright。
   - [ ] Other:

7. 後端 fixture 的定位是？
   - [x] 提供 deterministic server responses，模擬真實 WebSocket 後端情境。（建議預設）
   - [ ] 不需要後端 fixture，全部 mock 在前端。
   - [ ] 後端也要成為完整產品級遊戲服務。
   - [ ] Other:

8. 哪些內容明確不在 MVP 範圍？
   - [x] 不做完整 slot 產品、不做雲端測試平台、不做大型報表系統。（建議預設）
   - [ ] 不排除任何項目，能做都做。
   - [ ] 只排除雲端測試平台。
   - [ ] Other:

9. 資料、隱私、權限限制要怎麼處理？
   - [x] 不使用真實玩家資料；fixture 與範例資料都保持本地、可重建、可提交審查。（建議預設）
   - [ ] 允許連線到外部測試服務。
   - [ ] 允許使用開發者本機私有設定，但不得提交。
   - [ ] Other:

10. 驗證完成的標準是什麼？
    - [] 命令列 E2E 可跑、VS Code Test Explorer 可列出單條測試、README 教學可照步驟完成範例。（建議預設）
    - [ ] 只要命令列 E2E 可跑。
    - [ ] 必須有 CI workflow 並通過。
    - [X] Other: 除第一外，要可以將測試框架與遊戲解耦合，並且架構簡單易懂，測試框架也可以容易擴展，使測試框架符合編程最佳實踐

11. README 與教學要偏向哪種讀者？
    - [x] 第一次接觸本框架的 Cocos 開發者，照步驟可導入並新增範例測項。（建議預設）
    - [ ] 熟悉此 repo 的內部開發者。
    - [ ] 測試工程師，需要完整設計背景。
    - [ ] Other:

12. 目前最可接受的風險取捨是什麼？
    - [x] 先做清楚、穩定、可教學的小框架，再考慮 package 化與更多平台。（建議預設）
    - [ ] 先追求 package 化，即使短期教學較複雜。
    - [ ] 先追求完整平台能力，即使 MVP 變大。
    - [ ] Other:

# Minimal Slot Game Decisions

## 確認決策

1. MVP 對象是內部團隊展示，不只是開發者自測。
2. 最重要成果是可從 Cocos 前端操作開分、洗分、Spin、Auto Spin，並由 Go 後端回傳盤面、輸贏與餘額。
3. E2E 驗證是核心需求：automation-testing 需要能執行開分、Spin，並驗證金額與盤面正確。
4. 前端使用 Cocos 內建 Label、Color、Sprite 等簡單元件顯示 3x3 符號文字，不做真實美術。
5. 開分由後端處理：前端輸入或點擊固定加分，後端增加玩家餘額並持久化到 SQLite。
6. 洗分由後端處理：後端將目前餘額歸零或轉出，回傳已洗出分數並寫入 SQLite。
7. Spin 提供幾個固定押注選項，不使用自由輸入押注。
8. 後端支援可持久化盤面設定：符號、輪帶、賠付表設定可由 SQLite 或 JSON 載入，啟動時提供預設值。
9. 中獎判定採最小規則：只判斷三條橫線，三個相同符號才中獎。
10. Auto Spin 行為：按 AUTO 後連續呼叫後端 Spin，再按一次停止；餘額不足時自動停止。
11. 前後端使用 WebSocket envelope，包含 request id、type、payload。
12. SQLite 保存玩家餘額、交易紀錄、Spin 紀錄、盤面設定與賠付設定。
13. MVP 不需要登入或多玩家，使用單一本機玩家 id。
14. 不涉及真金流，但後端仍需驗證餘額、押注與請求內容，不信任前端結果。
15. 驗證包含 Go domain/app 單元測試，以及 Cocos automation-testing E2E；手動 smoke steps 可作為輔助。
16. MVP 範圍排除真實美術、音效、正式營運後台、登入、真金流、多語系。
17. 主要取捨是先可玩、可持久化、規則清楚，畫面保持樸素。
18. E2E 測試需要可強制設定 spin 盤面，讓 automation-testing 能用固定盤面驗證顯示、金額與賠付結果。

## 使用預設的項目

- 3x3 盤面可用內建 Cocos 元件顯示符號文字。
- 開分、洗分、盤面設定、橫線中獎判定、Auto Spin 停止條件、WebSocket envelope、SQLite 保存資料、單一本機玩家、安全邊界、非目標、主要取捨均符合或接近原問卷建議預設。

## 約束

- Cocos Creator 3.8.x 專案慣例適用。
- 前端只負責呈現、輸入、動畫和使用者狀態回饋。
- Go 後端負責權威遊戲規則、Spin 結果、餘額變更、請求驗證與 SQLite 持久化。
- WebSocket 是 transport，不可把遊戲規則綁死在 socket handler。
- Cocos assets/meta 必須穩定，避免無關 asset churn。
- E2E 必須採用 Cocos automation-testing；若套件或環境不可行，需在 phase 中記錄阻塞並停止，不提供 Playwright/manual fallback 作為替代完成路徑。
- 強制盤面能力必須限定在測試模式、fixture、或明確的後端測試設定中；一般前端 production flow 不可任意指定 spin 結果。

## 不在範圍

- 真實美術、正式 slot reel 動畫、音效。
- 登入、多玩家、玩家管理後台。
- 真金流、正式錢包、正式稽核系統。
- 多語系與完整營運設定 UI。
- 前端即時修改盤面設定 UI，除非後續另行擴 scope。

## 開放問題

- Cocos automation-testing 套件在目前環境的可用性需要在規劃或實作早期驗證。
- 固定押注選項的具體值尚未指定；建議 phase 規劃時先用 `1, 5, 10`。
- 開分固定加分值尚未指定；建議 phase 規劃時先用 `100`，並允許簡單輸入。
- 強制盤面的具體介面尚未指定；建議 phase 規劃時採後端 deterministic fixture/test mode，例如啟動參數、測試設定檔，或僅限測試環境的 WebSocket admin message。

# Phase 01 - 後端領域、SQLite 與設定

## 狀態

已完成。

## 目標

建立後端基礎：slot 領域數學、錢包狀態轉換、SQLite 持久化，以及預設且可設定的盤面、輪帶與賠付表資料。

## 輸入

- `plans/minimal-slot-game/decisions.md`
- `rules/go-backend.md`
- `rules/websocket-protocol.md`
- 目前 repository root

## 範圍

- 新增 `server/` Go module。
- 新增符號、3x3 盤面、輪帶、payline、賠付、spin 評估與錢包操作的 domain packages。
- 新增 SQLite schema 與 repository layer，用於玩家餘額、交易紀錄、spin 紀錄與遊戲設定。
- 第一次啟動時寫入預設設定。
- 使用固定預設：player id `local-player`、開分預設 `100`、押注選項 `1, 5, 10`。
- 在 app/domain 邊界提供測試用強制盤面能力，讓 E2E 可指定下一次 spin 的 3x3 symbols。

## 不在範圍

- WebSocket server。
- Cocos 前端。
- Cocos automation-testing。
- 正式等級 auth、migration framework 或 admin tooling。

## 計畫

1. 檢查現有 repo，並在 `server/` 下選擇最小 Go module layout。
2. 定義 domain types 與可預期的 payout rules。
3. 定義 SQLite schema 與 seed 行為。
4. 實作 balance、credit-in、credit-out、spin 的 repository 與 app service methods。
5. 設計 deterministic fixture/test mode 的強制盤面介面，並確保一般 spin path 不會被前端任意控制。
6. 保持 domain/app 可在沒有 network transport 的情況下被呼叫。

## BDD

- 給定一個新的 SQLite database，當後端初始化時，應建立預設玩家與遊戲設定。
- 給定玩家開分 `100`，當查詢 balance 時，balance 應增加 `100`。
- 給定玩家以 bet `1` spin，當結果被評估時，balance 應扣除 bet 並加上 win。
- 給定請求 credit-out，當玩家有餘額時，balance 應變成 `0` 並回傳洗出分數。
- 給定測試模式已設定下一次強制盤面，當玩家 spin 時，結果應使用該盤面並依同一套 payline rules 計算 win。

## TDD

- 新增 Go tests，測試橫線 paylines 的 payout evaluation。
- 新增 Go tests，測試餘額不足會被拒絕。
- 新增 Go tests，測試 credit-in 與 credit-out persistence。
- 新增 Go tests，測試預設設定 seeding。
- 新增 Go tests，測試 forced board fixture 只影響測試指定的 spin，且 payout 與一般盤面使用相同邏輯。

## 實作

- 實作 `internal/domain`、`internal/app`、`internal/store/sqlite`。
- 只有在 local check 需要初始化 app 時才新增 `cmd/server`；transport 可留到 phase 02。
- 若 standard library 不足，使用簡單 SQLite dependency。
- 強制盤面應實作在後端 app/domain 可測邊界，不應讓正式前端 request payload 直接決定結果。

## E2E

此階段尚未有前端或 transport，因此不適用。改記錄手動 database initialization checks。

## 審查

檢查 domain logic 是否可預期、invalid bet validation 是否正確、persistence 是否正確，以及是否與 WebSocket concerns 分離。
另外確認 forced board fixture 不會繞過正常 payout evaluation 或 wallet validation。

## 修正

在進入 phase 02 前，修正失敗的 Go tests 與 schema 問題。

修正紀錄：

- 修正 spin 交易紀錄的 `balance_after`：`spin_bet` 記錄扣注後餘額，`spin_win` 記錄派彩後最終餘額。
- 將一般 spin 的 RNG 盤面產生納入 `Service` mutex 保護，避免未來 WebSocket 併發 spin 時共用 `math/rand.Rand` 產生 data race。
- 新增 SQLite 測試，驗證 credit-in、spin-bet、spin-win 三筆交易流水的餘額變化。
- 新增併發 spin 測試，覆蓋多個 goroutine 同時呼叫 `Spin` 的路徑。

## 收尾

在 phase verification notes 記錄後端 commands 與預設設定。

完成紀錄：

- 新增 `server/` Go module。
- 新增 `internal/domain`，包含預設設定、3x3 board、reels、三條橫線 payout evaluation、bet validation 與 board validation。
- 新增 `internal/app`，包含 balance、credit-in、credit-out、spin use cases，以及測試用 `ForceNextBoard`。
- 新增 `internal/store/sqlite`，包含 SQLite schema、default seed、player balance、transactions、spin history 與 game settings persistence。
- 新增 `cmd/server`，可用 `SLOT_DB_PATH` 指定 SQLite path 並初始化預設資料。
- 強制盤面在 app/domain 可測邊界提供，不由正式 spin request payload 決定。

## 驗證

- 在 `server/` 執行 `go test ./...`
- 若有 backend init command，手動執行一次

已執行：

- `go test ./...`，通過。
- `SLOT_DB_PATH=<temp-db> go run ./cmd/server`，成功建立 SQLite 檔案並初始化 `local-player` balance `0`。
- 修正後再次執行 `go test ./...`，通過。
- 修正後再次執行 `SLOT_DB_PATH=<temp-db> go run ./cmd/server`，通過。
- 嘗試執行 `go test -race ./...`，目前 Windows 環境缺少 CGO C compiler：`gcc` 不在 `%PATH%`，因此 race detector 未能執行。

## 完成標準

- Go tests 通過。
- SQLite file 可建立並包含預設設定。
- Domain/app code 不依賴 WebSocket transport。
- 測試可設定固定盤面，且正式 spin path 不暴露任意結果控制。

結果：已達成。

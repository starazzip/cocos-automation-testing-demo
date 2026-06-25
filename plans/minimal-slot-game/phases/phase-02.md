# Phase 02 - WebSocket Transport 與 Protocol

## 狀態

已完成。

## 目標

透過小型 WebSocket envelope API 暴露 backend app service，支援 status、credit-in、credit-out、spin 與 settings reads。

## 輸入

- 已完成的 phase 01 backend app service
- `rules/websocket-protocol.md`
- `plans/minimal-slot-game/decisions.md`

## 範圍

- 在 `server/internal/transport/ws` 新增 WebSocket transport。
- 在 `server/cmd/server` 新增可執行 server entrypoint。
- 支援以 `id`、`type`、`payload` 做 request correlation。
- 回傳包含 code 與 message 的 structured errors。
- 支援 message types：
  - `wallet.balance.request`
  - `wallet.credit_in.request`
  - `wallet.credit_out.request`
  - `spin.request`
  - `settings.request`
- 在明確測試模式下支援設定下一次 spin 盤面的測試/fixture message 或啟動設定。

## 不在範圍

- Frontend UI。
- Authentication。
- Multi-player sessions。
- External network deployment。
- Production flow 可用的任意強制盤面 API。

## 計畫

1. 選擇最小 WebSocket dependency。
2. 在有幫助時，定義獨立於 domain types 的 request/response DTOs。
3. 將 envelope types route 到 app service methods。
4. 加上 bet options、missing ids、malformed payloads、insufficient balance 的 validation。
5. 若可行，加入 deterministic/test mode hook，方便 E2E 產生穩定 spin results。
6. 讓強制盤面入口只在 test mode 啟用；未啟用時，相關 message 應回 structured error。

## BDD

- 給定 WebSocket client 已連線，當它請求 balance 時，後端應回傳已持久化的 local player balance。
- 給定 client 發送 credit-in，當 payload 有效時，後端應回傳 updated balance。
- 給定 client 發送 spin，當 balance 足夠時，後端應回傳 3x3 symbols、win、bet 與 updated balance。
- 給定 client 發送 invalid bet，當 request 被處理時，後端應回傳 structured error。
- 給定 test mode 已啟用且 client 設定下一次盤面，當下一次 spin 被處理時，後端應回傳該盤面並正確計算 win/balance。
- 給定 test mode 未啟用，當 client 嘗試設定強制盤面時，後端應回傳 structured error。

## TDD

- 新增 transport tests，測試 valid envelope messages routing。
- 新增 transport tests，測試 malformed JSON 與 unknown message type。
- 若 phase 01 尚未涵蓋 deterministic spin fixtures，補上 app-level tests。
- 新增 transport tests，測試 forced board message 只在 test mode 可用。

## 實作

- 實作 WS server、message router、DTOs 與 structured error responses。
- 加入 local run config，例如 port `8080`。
- 保持 transport thin；handlers 裡不可放 payout 或 wallet math。
- 若採 WebSocket admin/test message，使用清楚命名，例如 `test.force_board.request`，並限制 test mode 才可 route。

## E2E

使用小型 script 或 Go integration test 連到 WebSocket server，執行 credit-in 與 spin。
測試模式下也應覆蓋 force-board 後 spin，確認回傳盤面與金額固定可驗證。

## 審查

檢查 protocol stability、request validation，以及不可洩漏 RNG internals。
確認 forced board 能力不可在一般模式使用，且不會被普通前端流程誤用。

## 修正

修正失敗的 transport tests；若 business rules 漂進 transport，簡化 handler logic 並移回 app/domain。

修正紀錄：

- `settings.request` 改為只回傳 UI-safe 設定：`symbols`、`betOptions`、`defaultBet`、`creditIn`、`localPlayer`。
- `settings.request` 不再回傳 `reels` 與 `payTable`，避免洩漏 RNG internals 或 payout implementation details。
- 新增 transport tests 覆蓋 `wallet.balance.request`、`wallet.credit_out.request`、`settings.request` 與 missing `id` structured error。

## 收尾

記錄 message examples 與 local run command。

完成紀錄：

- 新增 `server/internal/transport/ws`，包含 WebSocket envelope、router、DTO、structured error response 與 test-mode force-board handler。
- `cmd/server` 現在啟動 HTTP server，提供 `/ws` WebSocket endpoint 與 `/healthz`。
- 新增 `SLOT_ADDR` 設定 listen address，預設 `:8080`。
- 新增 `SLOT_TEST_MODE`，只有設定為 `1`、`true`、`yes` 或 `on` 時才允許 `test.force_board.request`。
- 新增 `nhooyr.io/websocket` 作為最小 WebSocket dependency。
- WebSocket origin 限制為本機來源：`localhost:*` 與 `127.0.0.1:*`。

Message examples：

```json
{"id":"1","type":"wallet.balance.request","payload":{}}
{"id":"2","type":"wallet.credit_in.request","payload":{"amount":100}}
{"id":"3","type":"wallet.credit_out.request","payload":{}}
{"id":"4","type":"spin.request","payload":{"bet":1}}
{"id":"5","type":"settings.request","payload":{}}
{"id":"6","type":"test.force_board.request","payload":{"board":[["A","A","A"],["K","Q","K"],["7","7","7"]]}}
```

Local run：

```powershell
cd server
$env:SLOT_ADDR="127.0.0.1:8080"
$env:SLOT_DB_PATH="slot.db"
$env:SLOT_TEST_MODE="1"
go run ./cmd/server
```

## 驗證

- 在 `server/` 執行 `go test ./...`
- 本機 WebSocket smoke request：credit-in 與 spin
- Test mode WebSocket smoke request：force board、credit-in、spin、驗證 board/win/balance

已執行：

- `go test ./...`，通過。
- 本機 WebSocket smoke request 通過：`test.force_board.request`、`wallet.credit_in.request`、`spin.request`。
- Smoke 驗證固定盤面 `[["A","A","A"],["K","Q","K"],["7","7","7"]]`，回傳 `win=30`、`balance=129`。
- 修正後再次執行 `go test ./...`，通過。
- 修正後再次執行本機 WebSocket smoke request，通過；並驗證 `settings.result` 不包含 `reels` 或 `payTable`。

## 完成標準

- WebSocket API 涵蓋 MVP 必要操作。
- Structured errors 可正常運作。
- Backend 所有 Go tests 仍通過。
- Test mode 可強制下一次 spin 盤面；一般模式不可使用該能力。

結果：已達成。

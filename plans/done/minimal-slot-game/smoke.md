# Minimal Slot Game Smoke Test

## Target

本 smoke 驗證最小 3x3 slot MVP 的本機可玩流程、後端 SQLite persistence，以及 Cocos automation E2E 可重複執行。

## Preconditions

- 使用 Cocos Creator 3.8.x 開啟專案。
- Cocos Preview 已啟動，預設為 `http://127.0.0.1:7456`。
- 若要跑 automation E2E，Cocos MCP server 已啟動，預設為 `http://127.0.0.1:3000/mcp`。
- Node dependencies 已安裝：

```powershell
npm install
```

- Go dependencies 可用：

```powershell
go test ./server/...
```

## Local Startup

1. 啟動後端：

```powershell
cd server
$env:SLOT_ADDR='127.0.0.1:8080'
$env:SLOT_DB_PATH='slot.db'
go run ./cmd/server
```

2. 在 Cocos Creator 開啟 `assets/main.scene`。
3. 啟動 Cocos Preview。
4. 確認畫面顯示 `CONNECTED`。

## Reset Behavior

- 預設 DB path 是 `server/slot.db`，由 `SLOT_DB_PATH` 控制。
- 要保留資料：重啟後端時使用同一個 `SLOT_DB_PATH`。
- 要重置資料：停止後端後刪除該 DB 檔，或改用新的 DB path。

```powershell
Remove-Item server\slot.db -ErrorAction SilentlyContinue
```

如果目前 shell 已在 `server/` 目錄，使用：

```powershell
Remove-Item slot.db -ErrorAction SilentlyContinue
```

## Manual Smoke Steps

1. 開啟 Cocos Preview。
   - Expected：connection status 顯示 `CONNECTED`。
   - Failure signal：顯示 `DISCONNECTED`、`ERROR`，或按鈕操作無反應。

2. 點擊 `CREDIT IN`。
   - Expected：`BALANCE` 增加 100，預設從 `BALANCE 0` 變成 `BALANCE 100`。
   - Failure signal：balance 沒變、顯示錯誤，或後端 log 有 WebSocket error。

3. 點擊 `BET 1`、`BET 5`、`BET 10`。
   - Expected：`BET` label 依序更新為 `BET 1`、`BET 5`、`BET 10`。
   - Failure signal：bet label 未更新，或 spin 使用錯誤押注。

4. 選擇 `BET 1`，點擊 `SPIN`。
   - Expected：3x3 盤面更新，`BALANCE` 扣除押注後依結果更新，`WIN` 顯示該次 win。
   - Failure signal：盤面未更新、balance 變成負數、client 自行顯示與後端不一致的結果。

5. 點擊 `AUTO`。
   - Expected：按鈕顯示 auto running 狀態並連續 spin；再次點擊會停止；餘額不足時自動停止。
   - Failure signal：無法停止、餘額不足仍繼續送 spin、或 UI 卡住。

6. 點擊 `CREDIT OUT`。
   - Expected：`BALANCE` 變成 `BALANCE 0`，`WIN` 回到 `WIN 0` 或保持可理解的最後狀態。
   - Failure signal：balance 未歸零，或後端重啟後 balance 又回到洗分前。

7. Persistence check：
   - 點擊 `CREDIT IN`，確認 `BALANCE 100`。
   - 停止後端。
   - 使用同一個 `SLOT_DB_PATH` 重啟後端。
   - 重新整理 Cocos Preview。
   - Expected：balance 仍載入為 `100`。
   - Failure signal：balance 回到 0，表示 SQLite persistence 或 startup path 不正確。

## Automation E2E

Automation E2E 會自行啟動測試模式 backend、automation server 與 Cocos Preview proxy；不要另外手動占用 `8080`、`8000`、`7457`。

完整 automation E2E：

```powershell
npm run test:e2e
```

只看測試清單：

```powershell
npx playwright test --list
```

可視化單條 E2E：

```powershell
$env:E2E_VISUAL='1'
$env:E2E_HOLD_MS='30000'
npx playwright test tests/e2e/cocos-slot.spec.mjs -g 'forced board spin payout' --headed
Remove-Item Env:E2E_VISUAL
Remove-Item Env:E2E_HOLD_MS
```

## Expected Automation Results

- `Cocos E2E: credit-in and credit-out` 通過。
- `Cocos E2E: forced board spin payout` 通過。
- forced board case 使用固定盤面 `A A A / K Q K / 7 7 7`，預期 `BALANCE 129`、`WIN 30`。

## Result Checklist

- [X] Backend starts on `127.0.0.1:8080`.
- [X] Cocos Preview shows `CONNECTED`.
- [X] `CREDIT IN` increases balance by 100.
- [X] Bet selection updates `BET` label.
- [X] `SPIN` updates board, win, and balance from backend result.
- [X] `AUTO` starts, stops, and stops on insufficient balance.
- [X] `CREDIT OUT` sets balance to 0.
- [X] Same `SLOT_DB_PATH` preserves balance after backend restart.
- [X] Deleting or changing DB path resets local state.
- [X] `npm run test:e2e` passes.

## Known Limitations

- 目前 UI 使用 Cocos built-in labels/buttons，沒有正式美術、音效或 reel animation。
- automation preview runtime 只會在 URL 帶 `automation=1` 時啟動；一般 Cocos Preview manual smoke 不會讀取 `testConfig.json`。
- automation E2E 會先進入測試場景，並在 runtime 掛載正式 `main` component。
- `scene_open_scene` 對 `db://assets/main.scene` 曾回傳 `Scene not found`，但 scene list 與 asset list 可查到該 scene；Phase 04/05 不依賴該 MCP call 完成。

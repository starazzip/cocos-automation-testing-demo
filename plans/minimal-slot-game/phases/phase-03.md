# Phase 03 - Cocos 前端 MVP

## 狀態

已完成；場景掛載已由使用者確認。

## 目標

使用內建元件建立最小 Cocos Creator 3.8.x slot MVP 前端場景。

## 輸入

- 已完成的 phase 02 WebSocket API
- `rules/cocos-frontend.md`
- `plans/minimal-slot-game/decisions.md`

## 範圍

- 建立或更新一個 slot MVP scene。
- 使用內建 Label/Color/Sprite 類型元件顯示 3x3 symbols。
- 顯示 balance、win、selected bet 與 connection status。
- 加入 credit-in、credit-out、bet selection、spin、auto spin controls。
- 加入 frontend service 與 WebSocket adapter layers，並與 scene UI code 分離。
- 加入穩定 node names/hooks，供 automation-testing 使用。

## 不在範圍

- Custom art assets。
- Sound。
- Complex reel animation。
- Admin settings UI。

## 計畫

1. 檢查現有 Cocos assets 與 scene setup。
2. 新增 TypeScript protocol types、game client service 與 WebSocket adapter。
3. 新增 scene component，將 UI controls 綁定到 service methods。
4. 依後端回傳內容精準 render symbols。
5. 實作 Auto Spin loop，支援 user toggle 與 insufficient-balance stop。

## BDD

- 給定 backend 已執行，當 scene starts 時，status 應顯示 connected 且可載入 balance。
- 給定使用者點擊 credit-in，當後端回應後，balance 應增加。
- 給定使用者點擊 spin，3x3 grid 應更新為後端 symbols，且 win/balance 應更新。
- 給定 AUTO 已啟用，frontend 應重複 request spin，直到被停止或 balance 不足。

## TDD

若專案沒有 Cocos TypeScript test runner，可略過 frontend unit tests。若略過，需記錄原因並依賴 phase 04 automation-testing。

紀錄：目前專案沒有 frontend unit test runner，略過 Cocos TypeScript unit tests；Phase 04 需以 automation-testing 驗證 UI 行為。

## 實作

- 依 Cocos conventions 在 `assets/scripts/` 下新增 scripts。
- 只建立或修改必要 scene/prefab assets，並保持 `.meta` 穩定。
- 使用 explicit component references 與 stable node names。

完成紀錄：

- 新增 `assets/scripts/protocol.ts`，定義 WebSocket envelope、settings、wallet、spin response 與 structured error types。
- 新增 `assets/scripts/SlotWebSocketAdapter.ts`，負責 WebSocket connection、request id correlation、timeout 與 structured error mapping。
- 新增 `assets/scripts/SlotGameService.ts`，提供 Cocos scene 使用的 settings、balance、credit-in、credit-out、spin API。
- 更新 `assets/main.ts`，在 runtime 建立最小 slot MVP UI：3x3 grid、connection status、balance、win、bet、credit-in、credit-out、spin、auto spin 與 bet buttons。
- 新增 `assets/main.scene` 與對應 `.meta`，場景已掛載 `main` component。
- Stable automation hook node names 已加入：`SlotRoot`、`ConnectionStatusLabel`、`BalanceLabel`、`WinLabel`、`BetLabel`、`ReelGrid`、`Cell_0_0` 到 `Cell_2_2`、`CreditInButton`、`CreditOutButton`、`SpinButton`、`AutoButton`、`Bet1Button`、`Bet5Button`、`Bet10Button`。
- 前端不暴露 `test.force_board.request`，也不在 client 決定 spin outcome；盤面只由 `spin.result.board` render。

## E2E

完整 E2E 要到 phase 04 才適用；此階段先對 local backend 做 manual playthrough。

## 審查

檢查 UI、service、transport adapter 是否分離。確認 client 永遠不決定 spin outcome。

Review 3 結果：

- 通過，未發現需要 `/qdd-phase-fix 3` 的阻塞問題。
- `assets/main.ts` 僅負責 UI、輸入、轉動動畫、WIN 連線動畫與狀態呈現。
- `assets/scripts/SlotGameService.ts` 與 `assets/scripts/SlotWebSocketAdapter.ts` 已和 UI component 分離。
- 前端沒有暴露 `test.force_board.request`，也沒有自行決定最終盤面或 win；最終盤面、win、balance 都來自後端 `spin.result`。
- Stable automation hook node names 已存在，並額外加入 `WinLineOverlay` 供後續視覺/節點檢查使用。
- 剩餘驗證風險：Cocos Preview 互動與 automation-testing 尚待 Phase 04 執行，不作為 Phase 03 阻塞。

## 修正

修正 Cocos compile errors、binding issues 與 protocol mismatches。

## 收尾

記錄任何 manual scene wiring steps 與 local preview/run instructions。

Manual scene wiring：

1. 在 Cocos Creator 3.8.x 開啟專案。
2. 若目前沒有 scene，建立一個 MVP scene。
3. 建立或選擇一個 Canvas/root node，掛上 `main` component。
4. 確認 `websocketUrl` 為 `ws://127.0.0.1:8080/ws`，或依後端 `SLOT_ADDR` 調整。
5. 啟動後端：

```powershell
cd server
$env:SLOT_ADDR="127.0.0.1:8080"
$env:SLOT_DB_PATH="slot.db"
go run ./cmd/server
```

6. 在 Cocos Preview 中操作 `CREDIT IN`、`SPIN`、`AUTO`、`CREDIT OUT`。

目前 repository 已包含 `assets/main.scene` 與 `assets/main.scene.meta`，可直接由 Cocos Creator 開啟場景後預覽。

## 驗證

- 若可用，執行 Cocos TypeScript compile/build check。
- 搭配 backend 手動 local run：credit-in、spin、auto、credit-out。

已執行：

- 針對 Phase 03 前端檔執行 TypeScript focused check，通過：

```powershell
tsc --noEmit --skipLibCheck --target ES2020 --module ESNext --moduleResolution Node --experimentalDecorators --types C:\ProgramData\cocos\editors\Creator\3.8.8\resources\resources\3d\engine\bin\.declarations\cc assets/main.ts assets/scripts/protocol.ts assets/scripts/SlotWebSocketAdapter.ts assets/scripts/SlotGameService.ts
```

- 執行 `cd server && go test ./...`，通過。
- 嘗試執行完整 `tsc --noEmit`，但失敗於 Cocos engine declarations 與 `extensions/cocos-mcp-server` 的既有 Editor 型別缺口，非 Phase 03 前端檔本身。
- 使用者已確認 `main` component 已掛上場景；Cocos Preview playthrough 仍待 Phase 04 automation-testing 驗證。
- Review 3 再次執行 Phase 03 focused TypeScript check，通過。
- Review 3 再次執行 `cd server && go test ./...`，通過。
- Review 3 透過 Cocos MCP 確認目前 scene hierarchy 為 `main > Canvas > main`，且 scene active。

## 完成標準

- Frontend 可對 backend 跑 MVP loop。
- UI 只使用 built-in assets。
- Stable automation hooks 已存在。

結果：前端程式、automation hooks 與場景掛載已完成；Preview 行為仍待 Phase 04 automation-testing 驗證。

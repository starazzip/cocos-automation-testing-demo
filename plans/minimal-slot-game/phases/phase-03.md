# Phase 03 - Cocos 前端 MVP

## 狀態

已規劃。

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

## 實作

- 依 Cocos conventions 在 `assets/scripts/` 下新增 scripts。
- 只建立或修改必要 scene/prefab assets，並保持 `.meta` 穩定。
- 使用 explicit component references 與 stable node names。

## E2E

完整 E2E 要到 phase 04 才適用；此階段先對 local backend 做 manual playthrough。

## 審查

檢查 UI、service、transport adapter 是否分離。確認 client 永遠不決定 spin outcome。

## 修正

修正 Cocos compile errors、binding issues 與 protocol mismatches。

## 收尾

記錄任何 manual scene wiring steps 與 local preview/run instructions。

## 驗證

- 若可用，執行 Cocos TypeScript compile/build check。
- 搭配 backend 手動 local run：credit-in、spin、auto、credit-out。

## 完成標準

- Frontend 可對 backend 跑 MVP loop。
- UI 只使用 built-in assets。
- Stable automation hooks 已存在。

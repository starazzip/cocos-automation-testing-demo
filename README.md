# Cocos Slot Demo

這個分支是導入 E2E framework 前的 demo 專案狀態。

## 結構

| 路徑 | 用途 |
| --- | --- |
| `frontend/` | Cocos Creator 3.8.x slot demo 前端 |
| `server/` | Go WebSocket slot demo 後端 |

## 本地執行

1. 啟動後端：

```powershell
cd server
go run ./cmd/server
```

預設會監聽：

```text
http://127.0.0.1:8080/healthz
ws://127.0.0.1:8080/ws
```

2. 用 Cocos Creator 3.8.x 開啟：

```text
frontend/
```

3. 在 Cocos Creator 按 Preview，開啟遊戲。

## 分支用途

| 分支 | 用途 |
| --- | --- |
| `demo-without-e2e` | 可遊玩的前後端 demo，尚未導入 E2E framework |
| `main` | 依 `cocos-e2e-kit` README 導入 framework 後的完成狀態 |

E2E framework 請從 `starazzip/cocos-e2e-kit` 導入。

# Cocos E2E Framework Smoke

## Target

Phase 03 - Pluggable Adapters And Frontend-Only E2E

## Preconditions

- Cocos Creator 已開啟此專案。
- Cocos Preview 已啟動，預設為 `http://127.0.0.1:7456`。
- Cocos MCP server 已啟動，預設為 `http://127.0.0.1:3000/mcp`。
- 已安裝 npm dependencies。

## Steps

1. 執行：

```powershell
npx playwright test --list
```

Expected:

- 清單包含 `Cocos E2E: credit-in and credit-out`。
- 清單包含 `Cocos E2E: forced board spin payout`。
- 清單包含 `Cocos E2E: frontend-only deterministic spin`。

2. 執行 frontend-only 測項：

```powershell
npx playwright test -g "frontend-only deterministic spin"
```

Expected:

- 測試通過。
- 該測項不需要啟動 Go demo backend。
- 產生的 preview URL 會帶 `automation=1` 與 `slotFixture=frontend-only`。

3. 執行 backend-backed 測項：

```powershell
npx playwright test -g "forced board spin payout"
```

Expected:

- 測試通過。
- Go demo backend adapter 會啟動 test mode server。
- spin 結果顯示 `BALANCE 129`、`WIN 30`。

## Failure Signals

- Test Explorer 沒列出 frontend-only 測項。
- frontend-only 測項嘗試連線 `ws://127.0.0.1:8080/ws`。
- backend-backed 測項無法啟動 Go server 或無法連到 `/healthz`。
- Cocos automation summary 顯示 failed 或未結束。

## Result Checklist

- [ ] `npx playwright test --list` 列出 3 條 Cocos E2E。
- [ ] frontend-only 測項通過。
- [ ] backend-backed forced spin 測項通過。

# VS Code Test Explorer E2E

## 目的

讓 Cocos automation-testing E2E 顯示在 VS Code Test Explorer，並能選擇單條 E2E 執行。

## 前置條件

- VS Code 安裝 `Playwright Test for VSCode` extension。
- Cocos Creator 已開啟此專案。
- Cocos Preview 已啟動，預設位於 `http://127.0.0.1:7456`。
- Cocos MCP server 已啟動，預設位於 `http://127.0.0.1:3000/mcp`。
- 專案依賴已安裝：

```powershell
npm install
```

## 執行方式

在 VS Code Test Explorer 中會看到：

- `Cocos E2E: credit-in and credit-out`
- `Cocos E2E: forced board spin payout`

可以直接點選單條測試執行。

命令列也可執行：

```powershell
npm run test:e2e
```

如果 Preview bundle 已確認是最新，可以略過 rebuild：

```powershell
$env:E2E_SKIP_REBUILD="1"
npm run test:e2e
```

## 運作方式

`tests/e2e/cocos-slot.spec.mjs` 只負責 orchestration：

- 啟動 Go backend test mode。
- 啟動 Cocos automation server。
- 啟動 Cocos Preview proxy。
- 產生只包含單一 automation class 的 `testConfig.json`。
- 呼叫 Cocos MCP refresh/rebuild preview。
- 用 Playwright 開啟 proxy URL，讓 Cocos `automation-framework` 執行真正的 E2E。
- 讀取 automation `/summary` 判斷成功或失敗。

Playwright 不是 fallback，也不取代 Cocos automation assertion；實際測試仍在 `assets/slot-e2e.test.ts` 內執行。

## 新增 E2E

1. 在 `assets/slot-e2e.test.ts` 新增一個獨立 `@testClass`。
2. 在 `tools/e2e-cases.json` 新增對應的 `id`、`title`、`scriptName`、`className`。
3. 執行：

```powershell
npx playwright test --list
```

確認新測試有出現在清單中。

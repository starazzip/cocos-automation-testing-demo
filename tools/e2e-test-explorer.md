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
- `Cocos E2E: frontend-only deterministic spin`

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

`tests/e2e/cocos-slot.spec.mjs` 只負責註冊 Playwright 測試與 sample adapter registry。共用 orchestration 位於 `tools/e2e/runner-core.mjs`：

- 依測項 `fixture.adapter` 選擇環境 adapter。
- `demo-backend` 會啟動 Go backend test mode。
- `frontend-only` 會透過 automation-only query param 使用前端 deterministic fixture，不需要後端程式碼。
- 啟動 Cocos automation server。
- 啟動 Cocos Preview proxy。
- 產生只包含單一 automation class 的 `testConfig.json`。
- 呼叫 Cocos MCP refresh/rebuild preview。
- 用 Playwright 開啟 proxy URL，讓 Cocos `automation-framework` 執行真正的 E2E。
- 讀取 automation `/summary` 判斷成功或失敗。

測項 metadata 分散在 `tests/e2e/cases/*.case.json`。`tools/e2e/case-discovery.mjs` 會讀取、驗證、排序並提供給 Playwright Test Explorer。

Playwright 不是 fallback，也不取代 Cocos automation assertion；實際測試仍在 Cocos automation test class 內執行，例如 `assets/slot-e2e.test.ts`。

## 新增 E2E

1. 在 `assets/slot-e2e.test.ts` 新增一個獨立 `@testClass`。
2. 複製 `tests/e2e/cases/_template.case.json`，在同一資料夾建立 `my-case.case.json`。
3. 填入 `id`、`title`、`automation.scriptName`、`automation.className`。
4. 依需求設定 `fixture.adapter`：
   - `demo-backend`：使用本 repo 的 Go demo backend。
   - `frontend-only`：只使用前端 deterministic fixture。
5. 執行：

```powershell
npx playwright test --list
```

確認新測試有出現在清單中。

# VS Code Test Explorer E2E

## 目的

讓 Cocos automation-testing E2E 顯示在 VS Code Test Explorer，並能選擇單條 E2E 執行。

完整導入流程請先看 repo root `README.md`。本文件只補充 Test Explorer 與目前 demo 專案的對應關係。

## 前置條件

- VS Code 安裝 `Playwright Test for VSCode` extension。
- Cocos Creator 已開啟此專案。
- Cocos Preview 已啟動，預設位於 `http://127.0.0.1:7456`。
- Cocos Creator assets 已 refresh，Preview bundle 已包含最新 `assets/e2e/*.test.ts`。
- 專案依賴已安裝：

```powershell
npm install
```

## 執行方式

在 VS Code Test Explorer 中會看到 `Cocos E2E: <case title>` 格式的測項。

目前 demo 專案包含：

- `Cocos E2E: credit-in and credit-out`
- `Cocos E2E: forced board spin payout`
- `Cocos E2E: frontend-only deterministic spin`

命令列也可列出與執行：

```powershell
npx playwright test --list
npm run test:e2e
```

E2E runner 預設不會呼叫 Cocos Editor API 或自動 rebuild Preview；它會使用目前已啟動的 Cocos Preview bundle。

## 運作方式

初始化到一般專案時，extension 會建立 `tests/e2e/cocos-e2e.spec.mjs`。本 repo 的 slot demo 也使用同名入口，差別是這份 demo spec 會載入本 repo 的 project adapter registry。

共用 orchestration 位於 `tools/e2e/runner-core.mjs`：

- 依測項 `fixture.adapter` 選擇環境 adapter。
- `frontend-only` 不執行後端 setup。若專案需要前端 deterministic fixture，可在 project adapter 加 `previewUrlParams`。
- 本 repo 的 `demo-backend` 只示範如何啟動 Go demo backend。
- 啟動 Cocos automation server。
- 啟動 Cocos Preview proxy。
- 產生只包含單一 automation class 的 `testConfig.json`。
- 用 Playwright 開啟 proxy URL，讓 Cocos `automation-framework` 執行真正的 E2E。
- 讀取 automation `/summary` 判斷成功或失敗。

測項 metadata 分散在 `tests/e2e/cases/*.case.json`。`tools/e2e/case-discovery.mjs` 會讀取、驗證、排序並提供給 Playwright Test Explorer。

Playwright 不是 fallback，也不取代 Cocos automation assertion；實際測試仍在 Cocos automation test class 內執行。

## 新增 E2E

一般專案建議用 extension 建立分檔測項：

```text
Extension > Cocos E2E Framework > 建立 E2E 測項
```

這會建立：

- `tests/e2e/cases/new-e2e-case.case.json`
- `assets/e2e/new-e2e-case.test.ts`

編輯產生的 case metadata 與 Cocos automation class 後，執行：

```text
Extension > Cocos E2E Framework > 重新整理測項索引
```

本 repo 的 slot demo 也可以手動新增：

1. 在 `assets/e2e/<case-id>.test.ts` 新增一個獨立 `@testClass`。
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

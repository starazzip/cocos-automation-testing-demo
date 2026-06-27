# Cocos Automation Testing Demo

這是 Cocos slot demo 專案，用來展示 `starazzip/cocos-e2e-kit` 導入前與導入後的差異。

## 分支

| 分支 | 內容 |
| --- | --- |
| `demo-without-e2e` | 可遊玩的前後端 demo，尚未導入 E2E framework |
| `main` | 已依 `cocos-e2e-kit` 導入 E2E framework，並包含三條 demo E2E |

## 專案結構

| 路徑 | 用途 |
| --- | --- |
| `frontend/` | Cocos Creator 3.8.x slot demo 與 E2E scaffold |
| `server/` | Go WebSocket demo backend |

E2E framework 來源：

```text
https://github.com/starazzip/cocos-e2e-kit
```

## 本地啟動 Demo

1. 啟動後端：

```powershell
cd server
go run ./cmd/server
```

後端預設監聽：

```text
http://127.0.0.1:8080/healthz
ws://127.0.0.1:8080/ws
```

2. 用 Cocos Creator 3.8.x 開啟：

```text
frontend/
```

3. 在 Cocos Creator 按 Preview。

Preview 預設位址：

```text
http://127.0.0.1:7456
```

## 執行 E2E

E2E 指令都在 `frontend/` 執行。

```powershell
cd frontend
npm install
npx playwright install chromium
```

確認 Preview bundle 已包含測項：

```powershell
npm run cocos:wait-preview
```

列出測項：

```powershell
npx playwright test --list
```

執行全部測項：

```powershell
npm run test:e2e
```

執行單一測項：

```powershell
npx playwright test -g "forced board spin payout"
```

觀看自動操作畫面：

```powershell
$env:E2E_VISUAL="1"
$env:E2E_HOLD_MS="3000"
npx playwright test -g "forced board spin payout" --headed
```

觀看全部 E2E：

```powershell
$env:E2E_VISUAL="1"
$env:E2E_HOLD_MS="3000"
npx playwright test --headed
```

## Demo E2E 測項

| 測項 | Metadata | Cocos automation class |
| --- | --- | --- |
| credit-in and credit-out | `frontend/tests/e2e/cases/credit-in-out.case.json` | `frontend/assets/e2e/credit-in-out.test.ts` |
| forced board spin payout | `frontend/tests/e2e/cases/forced-spin.case.json` | `frontend/assets/e2e/forced-spin.test.ts` |
| frontend-only deterministic spin | `frontend/tests/e2e/cases/frontend-only-spin.case.json` | `frontend/assets/e2e/frontend-only-spin.test.ts` |

共用 helper：

```text
frontend/assets/e2e/slot-test-helpers.ts
```

## 在本 Demo 增加測項

1. 用 Cocos Creator 開啟 `frontend/`。

2. 建立測項：

```text
Extension > Cocos E2E Framework > 建立 E2E 測項
```

3. 編輯 metadata：

```text
frontend/tests/e2e/cases/<case-id>.case.json
```

4. 編輯 Cocos automation class：

```text
frontend/assets/e2e/<case-id>.test.ts
```

5. 重新整理索引：

```text
Extension > Cocos E2E Framework > 重新整理測項索引
```

6. 列出並執行：

```powershell
cd frontend
npx playwright test --list
npx playwright test -g "<case title>"
```

## 從導入前分支操作

1. 切到導入前分支：

```powershell
git switch demo-without-e2e
```

2. 確認 demo 可遊玩。

3. 依 `cocos-e2e-kit` README 複製 extension 到 `frontend/extensions/cocos-e2e-framework/`。

4. 用 Cocos Creator 開啟 `frontend/`，執行：

```text
Extension > Cocos E2E Framework > 初始化 Framework
```

5. 設定 demo adapter：

```js
// frontend/tools/e2e/project-environment-adapters.mjs
import { createFrontendOnlyAdapter } from './environment-adapters.mjs';

export function createProjectEnvironmentAdapters() {
    return {
        'frontend-only': createFrontendOnlyAdapter({
            previewUrlParams: {
                slotFixture: 'frontend-only',
            },
        }),
    };
}
```

`slotFixture=frontend-only` 會讓 slot demo 使用前端 fixture，不連 `ws://127.0.0.1:8080/ws`。
若要跑本 demo 的後端測項，需再加入 `main` 中的 `demo-backend` adapter。

6. 新增或搬入 demo 測項。

7. 對照 `main` 查看完成狀態。

## 站點與 Port

| 站點 | 預設位址 | 啟動者 | 用途 |
| --- | --- | --- | --- |
| Cocos Preview | `http://127.0.0.1:7456` | 使用者 | Cocos 預覽頁 |
| E2E automation server | `http://127.0.0.1:8000` | runner | 接收 Cocos automation summary 與 log |
| E2E preview proxy | `http://127.0.0.1:7457` | runner | 代理 Preview，注入單條 case config |
| Demo backend | `http://127.0.0.1:8080` | 使用者或 adapter | Slot demo WebSocket backend |

只跑 E2E 時，可不手動啟動 demo backend。`demo-backend` adapter 會在 `8080` 沒有服務時自動啟動 `server/`。

## 驗證指令

```powershell
cd server
go test ./...
```

```powershell
cd frontend
npm run test:e2e:unit
npx playwright test --list
npm run test:e2e
```

## 常見問題

| 問題 | 處理方式 |
| --- | --- |
| 找不到測項 | 確認 Cocos Creator 已開啟 `frontend/`，Preview 已刷新，再跑 `npm run cocos:wait-preview` |
| adapter not found | 檢查 `frontend/tools/e2e/project-environment-adapters.mjs` 是否註冊 `fixture.adapter` |
| 8080 port 已被使用 | 關閉既有服務，或讓 case 使用已啟動的相容 backend |
| E2E 失敗 | 查看 `frontend/test-results/` 與 `frontend/temp/vscode-e2e/<case-id>/` |

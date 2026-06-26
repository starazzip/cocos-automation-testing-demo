# Cocos E2E Framework

給 Cocos Creator 專案使用的 E2E 測試框架。

Playwright 負責啟動測試環境、開瀏覽器、收集 artifact；Cocos automation class 負責遊戲內操作與 assertion。測項採分檔管理，一個 case 對一個 metadata 與一個 Cocos test class。

## 專案結構

| 區塊 | 位置 | 角色 |
| --- | --- | --- |
| Cocos 前端 | `assets/`、`assets/scripts/`、`assets/main.scene` | slot demo 遊戲 |
| Go 後端 | `server/` | WebSocket demo backend |
| E2E 框架 | `extensions/cocos-e2e-framework/`、`extensions/automation-framework/`、`tools/e2e/`、`tests/e2e/`、`assets/e2e/` | 測試工具、runner、case metadata、Cocos automation class |

slot 遊戲與 Go backend 是本 repo 的 demo fixture。導入其他專案時，framework 預設只提供 `frontend-only`，後端整合由專案自己的 adapter 擴充。

## 如何使用這個 E2E Framework

以下是把框架導入既有 Cocos Creator 3.8.x 專案的流程。

1. 複製 extension：

```text
<your-cocos-project>/extensions/cocos-e2e-framework/
```

2. 用 Cocos Creator 開啟專案。

3. 初始化：

```text
Extension > Cocos E2E Framework > 初始化 Framework
```

初始化會補齊：

```text
playwright.config.mjs
tools/automation-server.mjs
tools/cocos-preview-proxy.mjs
tools/wait-cocos-preview-bundle.mjs
tools/e2e/
tests/e2e/cocos-e2e.spec.mjs
tests/e2e/cases/_template.case.json
tools/e2e/project-environment-adapters.mjs
assets/e2e/_template-e2e.test.ts
extensions/automation-framework/
```

4. 安裝依賴：

```powershell
npm install
npx playwright install chromium
```

5. 檢查設定：

```text
Extension > Cocos E2E Framework > 檢查設定
```

Console 應顯示：

```text
checkSetup: ok=true
```

## 目標專案本地執行 E2E

1. 用 Cocos Creator 開啟專案。

2. 讓 assets refresh 完成。

3. 在 Cocos Creator 內按 Preview / 預覽。

4. 確認遊戲可開啟：

```text
http://127.0.0.1:7456
```

5. 確認 Preview bundle 包含測項：

```powershell
npm run cocos:wait-preview
```

6. 列出測項：

```powershell
npx playwright test --list
```

7. 執行全部測項：

```powershell
npm run test:e2e
```

8. 執行單一測項：

```powershell
npx playwright test -g "<case title>"
```

9. 需要觀看自動操作畫面時，開啟 visual mode：

```powershell
$env:E2E_VISUAL="1"
$env:E2E_HOLD_MS="3000"
npx playwright test -g "<case title>" --headed
```

`E2E_HOLD_MS` 控制測試結束後保留視窗的時間，單位是毫秒。

常用指令：

| 目的 | 指令 |
| --- | --- |
| 列出全部測項 | `npx playwright test --list` |
| 執行全部 E2E | `npm run test:e2e` |
| 執行單一測項 | `npx playwright test -g "<case title>"` |
| 觀看全部 E2E | `$env:E2E_VISUAL="1"; $env:E2E_HOLD_MS="3000"; npx playwright test --headed` |
| 觀看單一測項 | `$env:E2E_VISUAL="1"; $env:E2E_HOLD_MS="3000"; npx playwright test -g "<case title>" --headed` |
| 開啟 Playwright UI | `npm run test:e2e:ui` |

失敗時看：

```text
test-results/
temp/vscode-e2e/<case-id>/
```

## 站點與 Port

| 站點 | 預設位址 | 啟動者 | 用途 |
| --- | --- | --- | --- |
| Cocos Preview | `http://127.0.0.1:7456` | 使用者 | 遊戲預覽頁 |
| E2E automation server | `http://127.0.0.1:8000` | runner | 接收 Cocos automation summary / log |
| E2E preview proxy | `http://127.0.0.1:7457` | runner | 代理 Preview，注入單條 case config |
| Backend fixture | 由專案 adapter 決定；本 repo demo 使用 `http://127.0.0.1:8080` | 使用者或 adapter | 可選的後端 fixture |

## 持續擴充測項

每個測項固定由兩個檔案組成：

```text
tests/e2e/cases/<case-id>.case.json
assets/e2e/<case-id>.test.ts
```

命名規則：

| 欄位 | 規則 |
| --- | --- |
| `id` | 穩定、短、kebab-case |
| `title` | 給 Test Explorer / Playwright 顯示 |
| `automation.scriptName` | 指向 `assets/` 底下的 test script |
| `automation.className` | 對應 `@testClass()` |
| `fixture.adapter` | 預設 `frontend-only`，或專案在 `project-environment-adapters.mjs` 註冊的 adapter |

新增流程：

以下範例以本 repo 的 slot demo 為例。導入其他 Cocos 專案時，請換成自己的 scene、節點名稱與 assertion。

1. 建立測項範本：

```text
Extension > Cocos E2E Framework > 建立 E2E 測項
```

2. 改名並調整 metadata。

```json
{
  "id": "demo-button",
  "title": "demo button updates text",
  "automation": {
    "scriptName": "e2e/demo-button.test.ts",
    "className": "demo_button_e2e"
  },
  "fixture": {
    "adapter": "frontend-only"
  },
  "tags": ["demo"]
}
```

3. 撰寫 `assets/e2e/demo-button.test.ts`。

```ts
import { Button, director, Label, Node } from 'cc';
// @ts-ignore
import { expect, runScene, testCase, testClass, waitForNextFrame } from 'db://automation-framework/runtime/test-framework.mjs';

@runScene('main')
@testClass('demo_button_e2e')
export class DemoButtonE2E {
    @testCase
    async clickButtonAndReadLabel() {
        await waitForNextFrame();

        const buttonNode = findNode('CreditInButton');
        const button = buttonNode.getComponent(Button);
        expect(button).to.not.equal(null);

        buttonNode.emit(Button.EventType.CLICK, button);
        await waitForNextFrame();

        const label = findNode('BalanceLabel').getComponent(Label);
        expect(label).to.not.equal(null);
        expect(label!.string).to.equal('BALANCE 100');
    }
}

function findNode(name: string): Node {
    const scene = director.getScene();
    expect(scene).to.not.equal(null);

    const found = findNodeRecursive(scene!, name);
    expect(found).to.not.equal(null);
    return found!;
}

function findNodeRecursive(node: Node, name: string): Node | null {
    if (node.name === name) return node;
    for (const child of node.children) {
        const found = findNodeRecursive(child, name);
        if (found) return found;
    }
    return null;
}
```

4. 重新整理索引：

```text
Extension > Cocos E2E Framework > 重新整理測項索引
```

5. 確認測項存在：

```powershell
npx playwright test --list
```

6. 執行單條：

```powershell
npx playwright test -g "demo button updates text"
```

本 repo 已有範例：

| Case | Metadata | Cocos test |
| --- | --- | --- |
| credit in/out | `tests/e2e/cases/credit-in-out.case.json` | `assets/e2e/credit-in-out.test.ts` |
| forced spin | `tests/e2e/cases/forced-spin.case.json` | `assets/e2e/forced-spin.test.ts` |
| frontend-only spin | `tests/e2e/cases/frontend-only-spin.case.json` | `assets/e2e/frontend-only-spin.test.ts` |

Demo helper 在：

```text
assets/e2e/slot-test-helpers.ts
```

## Backend Adapter

每條 case 用 `fixture.adapter` 選擇環境。

`fixture.adapter` 的值必須等於 `createProjectEnvironmentAdapters()` 回傳物件的 key。初始化後只有 `frontend-only`；需要後端時，在 `tools/e2e/project-environment-adapters.mjs` 加一個 adapter。

frontend-only：

```json
{
  "fixture": {
    "adapter": "frontend-only"
  }
}
```

預設 registry：

```js
import {
    createFrontendOnlyAdapter,
    resolveEnvironmentAdapter,
} from './environment-adapters.mjs';

export { resolveEnvironmentAdapter };

export function createProjectEnvironmentAdapters() {
    return {
        'frontend-only': createFrontendOnlyAdapter(),
    };
}
```

如果前端需要 query param 切換測試 fixture：

```js
export function createProjectEnvironmentAdapters() {
    return {
        'frontend-only': createFrontendOnlyAdapter({
            previewUrlParams: {
                e2eFixture: 'frontend-only',
            },
        }),
    };
}
```

使用既有後端：

```js
import {
    createFrontendOnlyAdapter,
    resolveEnvironmentAdapter,
} from './environment-adapters.mjs';

export { resolveEnvironmentAdapter };

export function createProjectEnvironmentAdapters() {
    return {
        'frontend-only': createFrontendOnlyAdapter(),
        'external-backend': {
            name: 'external-backend',
            async setup({ waitForHttp }) {
                await waitForHttp('http://127.0.0.1:8080/healthz', 30000);
            },
        },
    };
}
```

由 runner 啟動後端：

```js
import {
    createFrontendOnlyAdapter,
    resolveEnvironmentAdapter,
} from './environment-adapters.mjs';

export { resolveEnvironmentAdapter };

export function createProjectEnvironmentAdapters() {
    return {
        'frontend-only': createFrontendOnlyAdapter(),
        'my-backend': {
            name: 'my-backend',
            unavailableUrls: ['http://127.0.0.1:8080/healthz'],
            async setup({ repoRoot, runPaths, startManagedProcess, waitForHttp }) {
                startManagedProcess('npm', ['run', 'backend:test'], {
                    cwd: repoRoot,
                    logPath: runPaths.logPath('backend.log'),
                });
                await waitForHttp('http://127.0.0.1:8080/healthz', 30000);
            },
        },
    };
}
```

`unavailableUrls` 表示該 port 必須由 runner 管理。若後端已由外部啟動，請使用前一個 external backend 寫法。

本 repo 的 `demo-backend` 只是 adapter 擴充範例，實作位置在：

```text
tools/e2e/project-environment-adapters.mjs
```

它會先檢查 `http://127.0.0.1:8080/healthz`。如果已可連線，直接使用現有後端；如果不可連線，runner 會啟動本 repo 的 Go demo backend。forced-board demo 需要 test mode，`npm run demo:backend` 會用 `SLOT_TEST_MODE=1` 啟動。

使用既有後端時，case 指向 `external-backend`：

```json
{
  "fixture": {
    "adapter": "external-backend"
  }
}
```

由 runner 啟動後端時，case 指向 `my-backend`：

```json
{
  "fixture": {
    "adapter": "my-backend"
  }
}
```

## VS Code Test Explorer

安裝 VS Code extension：

```text
Playwright Test for VSCode
```

測項會顯示為：

```text
Cocos E2E: <case title>
```

更多說明：

```text
tools/e2e-test-explorer.md
```

## 本 Repo Demo 驗證

執行前先開 Cocos Creator Preview。

若要手動打開 Preview 操作本 repo 的 slot demo，先啟動後端：

```powershell
npm run demo:backend
```

成功時會看到：

```text
listening on :8080, websocket /ws, test mode true
```

只跑 E2E 時可以略過這步。`demo-backend` adapter 會在 `8080` 沒有服務時自動啟動本 repo 的 Go demo backend；如果 `8080` 已有服務，則直接使用既有後端。

```powershell
npm run test:e2e:unit
npx playwright test --list
npx playwright test -g "frontend-only deterministic spin"
npx playwright test -g "forced board spin payout"
npm run test:e2e
```

## 常見問題

| 問題 | 處理方式 |
| --- | --- |
| `E2E environment adapter "... " was not found` | 檢查 `tools/e2e/project-environment-adapters.mjs` 是否註冊 adapter |
| 新測項跑不到 | refresh assets，重開 Preview，再跑 `npm run cocos:wait-preview` |
| Test Explorer 沒測項 | 檢查 `.case.json` 不以 `_` 開頭，且 `automation.scriptName` 指到存在檔案 |
| `EADDRINUSE` | 關掉占用 `8000`、`7457`、`8080` 的 process |
| E2E fail | 看 `test-results/` 與 `temp/vscode-e2e/<case-id>/` |

## 功能表

### 插件與 Runner

| 功能 | 入口 | 輸出 |
| --- | --- | --- |
| 初始化框架 | `Extension > Cocos E2E Framework > 初始化 Framework` | 補齊 E2E 檔案與設定 |
| 檢查設定 | `Extension > Cocos E2E Framework > 檢查設定` | Console 顯示 `checkSetup: ok=true` |
| 建立測項 | `Extension > Cocos E2E Framework > 建立 E2E 測項` | 產生 `.case.json` 與 `.test.ts` |
| 更新索引 | `Extension > Cocos E2E Framework > 重新整理測項索引` | Console 顯示 case 數量與 id |
| 列出測項 | `npx playwright test --list` | 顯示 `Cocos E2E: <case title>` |
| 執行測項 | `npm run test:e2e` | Playwright pass/fail |
| 執行單條 | `npx playwright test -g "<title>"` | 只跑符合 title 的 case |
| frontend-only | `"adapter": "frontend-only"` | 不執行後端 setup |
| 自訂 backend | 註冊 `project-environment-adapters.mjs` | 依 adapter 設計等待既有服務或啟動測試服務 |
| 失敗診斷 | `test-results/`、`temp/vscode-e2e/<case-id>/` | trace、log、config、cleanup result |

### Cocos 元件操作

以下範例寫在 `assets/e2e/<case-id>.test.ts`。

| 功能 | 範例 |
| --- | --- |
| 載入場景 | `@runScene('main')` |
| 宣告測試 class | `@testClass('demo_button_e2e')` |
| 宣告測試 method | `@testCase async clickButton() {}` |
| 等待下一 frame | `await waitForNextFrame();` |
| 取得目前場景 | `const scene = director.getScene();` |
| 依名稱找節點 | `const node = findNode('StartButton');` |
| 取得 Button | `const button = node.getComponent(Button);` |
| 點擊 Button | `node.emit(Button.EventType.CLICK, button);` |
| 取得 Label | `const label = findNode('StatusLabel').getComponent(Label);` |
| 讀取 Label 文字 | `const text = label!.string;` |
| 檢查文字 | `expect(label!.string).to.equal('Started');` |
| 檢查 component 存在 | `expect(button).to.not.equal(null);` |
| 檢查數值 | `expect(score).to.equal(100);` |
| 檢查陣列 | `expect(symbols).to.deep.equal(['A', 'A', 'A']);` |
| 等待 async UI | `await waitForNextFrame(); await waitForNextFrame();` |

可重用 helper 範例：

```ts
function findNode(name: string): Node {
    const scene = director.getScene();
    expect(scene).to.not.equal(null);

    const found = findNodeRecursive(scene!, name);
    expect(found).to.not.equal(null);
    return found!;
}

function findNodeRecursive(node: Node, name: string): Node | null {
    if (node.name === name) return node;
    for (const child of node.children) {
        const found = findNodeRecursive(child, name);
        if (found) return found;
    }
    return null;
}
```

# Cocos E2E Framework

這是一套給 Cocos Creator 專案使用的 E2E 測試框架。目標是讓開發者可以用 Cocos Creator extension 導入測試工具、用分檔 metadata 管理測項、用 Cocos automation 執行遊戲內 assertion，並由 Playwright 負責啟動環境、開瀏覽器、串接 VS Code Test Explorer 與收集失敗診斷。

本 repo 內的 slot 遊戲與 Go backend 只是 demo fixture，用來驗證框架可以處理真實專案常見的前端、後端與 deterministic 測試情境。它們不是框架的必要條件。

## 你會得到什麼

- `extensions/cocos-e2e-framework/`：Cocos Creator extension，提供初始化、建立測項、重新整理索引、檢查設定。
- `extensions/automation-framework/`：被導入到目標專案的 Cocos automation runtime extension。
- `tools/e2e/runner-core.mjs`：共用 runner，負責 automation server、Preview proxy、Cocos refresh/rebuild、artifact 與 cleanup。
- `tests/e2e/cases/*.case.json`：分檔測項 metadata，一個 case 一個檔案，避免集中在大型 registry。
- `tools/e2e/environment-adapters.mjs`：可替換的環境 adapter contract，支援 frontend-only、demo backend 或專案自訂後端。
- `tests/e2e/cocos-e2e.spec.mjs`：Playwright Test Explorer 入口；本 repo 的 demo 也使用同一入口檔名。

## 快速開始

以下流程以「把框架導入既有 Cocos Creator 3.8.x 專案」為目標。若你是在維護本 repo，請使用下方「本 Repo 的 Demo 驗證」流程，不要在 repo root 執行初始化或建立教學測項，避免產生 scaffold 檔案污染 demo baseline。

1. 將 extension 放進目標專案：

```text
<your-cocos-project>/extensions/cocos-e2e-framework/
```

2. 用 Cocos Creator 開啟目標專案，確認主選單有：

```text
Extension > Cocos E2E Framework
```

3. 初始化框架。

```text
Extension > Cocos E2E Framework > 初始化 Framework
```

初始化會建立或補齊：

- `playwright.config.mjs`
- `tools/automation-server.mjs`
- `tools/cocos-preview-proxy.mjs`
- `tools/cocos-rebuild-preview.mjs`
- `tools/wait-cocos-preview-bundle.mjs`
- `tools/e2e/*.mjs`
- `tests/e2e/cocos-e2e.spec.mjs`
- `tests/e2e/cases/_template.case.json`
- `tools/e2e/project-environment-adapters.mjs`
- `assets/e2e/_template-e2e.test.ts`
- `extensions/automation-framework/`

4. 安裝依賴與 Playwright browser：

```powershell
npm install
npx playwright install chromium
```

5. 開啟 Cocos Preview，並啟動 Cocos MCP server。

預設位址：

- Cocos Preview：`http://127.0.0.1:7456`
- Cocos MCP：`http://127.0.0.1:3000/mcp`
- E2E automation server：`127.0.0.1:8000`
- E2E preview proxy：`127.0.0.1:7457`
- demo backend adapter：`127.0.0.1:8080`

6. 檢查設定：

```text
Extension > Cocos E2E Framework > 檢查設定
```

Cocos Creator Console 應顯示 `checkSetup: ok=true`。

7. 列出測項：

```powershell
npx playwright test --list
```

8. 執行 E2E：

```powershell
npm run test:e2e
```

如果已確認 Preview bundle 是最新，可以略過 rebuild：

```powershell
$env:E2E_SKIP_REBUILD="1"
npm run test:e2e
```

## 新增一個 Frontend-Only 測項

frontend-only 測項適合無法修改或啟動後端時使用。它只透過前端測試控制點、mock transport 或 client adapter 建立 deterministic 狀態。

以下步驟請在要導入框架的目標 Cocos 專案中操作；不要在本 repo root 建立這個教學測項。

1. 在 Cocos Creator 中建立測項：

```text
Extension > Cocos E2E Framework > 建立 E2E 測項
```

2. 產生的 metadata 會在：

```text
tests/e2e/cases/new-e2e-case.case.json
```

將內容調整成一個「按下按鈕後檢查文字」的 frontend-only 測項：

```json
{
  "id": "new-e2e-case",
  "title": "button click updates text",
  "automation": {
    "scriptName": "e2e/new-e2e-case.test.ts",
    "className": "new_e2e_case"
  },
  "fixture": {
    "adapter": "frontend-only"
  },
  "tags": ["sample"]
}
```

3. Cocos automation class 會在：

```text
assets/e2e/new-e2e-case.test.ts
```

假設場景中有：

- `StartButton`：含 `Button` component。
- `StatusLabel`：含 `Label` component。
- 按下 `StartButton` 後，遊戲邏輯會把 `StatusLabel.string` 改成 `Started`。

把 automation class 改成：

```ts
import { Button, director, Label, Node } from 'cc';
// @ts-ignore
import { expect, runScene, testCase, testClass, waitForNextFrame } from 'db://automation-framework/runtime/test-framework.mjs';

@runScene('main')
@testClass('new_e2e_case')
export class NewE2ECase {
    @testCase
    async buttonClickUpdatesText() {
        await waitForNextFrame();

        const buttonNode = findNode('StartButton');
        const button = buttonNode.getComponent(Button);
        expect(button, 'StartButton should have Button').to.not.equal(null);

        buttonNode.emit(Button.EventType.CLICK, button);
        await waitForNextFrame();

        const statusLabel = findNode('StatusLabel').getComponent(Label);
        expect(statusLabel, 'StatusLabel should have Label').to.not.equal(null);
        expect(statusLabel!.string).to.equal('Started');
    }
}

function findNode(name: string): Node {
    const scene = director.getScene();
    expect(scene, 'scene should be loaded').to.not.equal(null);

    const found = findNodeRecursive(scene!, name);
    expect(found, `${name} should exist`).to.not.equal(null);
    return found!;
}

function findNodeRecursive(node: Node, name: string): Node | null {
    if (node.name === name) {
        return node;
    }
    for (const child of node.children) {
        const found = findNodeRecursive(child, name);
        if (found) {
            return found;
        }
    }
    return null;
}
```

4. 重新整理測項索引：

```text
Extension > Cocos E2E Framework > 重新整理測項索引
```

5. 確認 Test Explorer / Playwright 看得到新測項：

```powershell
npx playwright test --list
```

6. 執行單條測項：

```powershell
npx playwright test -g "button click updates text"
```

## Backend Adapter 寫法

框架核心不綁定 Go、WebSocket 或任何特定後端。每個 case 用 `fixture.adapter` 選擇 adapter。新專案初始化後，預設只有 `frontend-only`：

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

如果專案可以啟動測試後端，可以在 `tools/e2e/project-environment-adapters.mjs` 增加自己的 adapter：

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

對應 case metadata：

```json
{
  "id": "backend-spin",
  "title": "backend spin",
  "automation": {
    "scriptName": "e2e/backend-spin.test.ts",
    "className": "backend_spin_e2e"
  },
  "fixture": {
    "adapter": "my-backend"
  },
  "tags": ["backend"]
}
```

本 repo 的 `demo-backend` adapter 只示範如何啟動 Go demo server。真實專案應用自己的 adapter 表達啟動、health check、deterministic response 與 cleanup。

## VS Code Test Explorer

安裝 VS Code 的 `Playwright Test for VSCode` extension 後，Playwright 會從 `tests/e2e/*.spec.mjs` 讀取 case，顯示為：

```text
Cocos E2E: <case title>
```

每條測項都來自 `tests/e2e/cases/*.case.json`。`tools/e2e/case-discovery.mjs` 會忽略 `_template.case.json`，並檢查 `automation.scriptName` 指向的 Cocos automation script 是否存在。

更多 Test Explorer 細節見 `tools/e2e-test-explorer.md`。

## 本 Repo 的 Demo 驗證

這些命令驗證目前 slot demo、frontend-only case、demo backend adapter 與 runner cleanup：

```powershell
npm run test:e2e:unit
npx playwright test --list
npx playwright test -g "frontend-only deterministic spin"
npx playwright test -g "forced board spin payout"
npm run test:e2e
```

執行 E2E 前請確認 Cocos Creator 已開啟、Preview 已啟動、Cocos MCP server 已啟動，且 `8000`、`7457`、`8080` 沒被其他服務占用。

## 限制

- MVP 交付形式是 Cocos Creator extension；目前不是 npm package。
- 不包含雲端測試平台、完整報表系統或多裝置矩陣。
- Playwright 負責 orchestration 與工具整合，不取代 Cocos automation 的遊戲內 assertion。
- slot demo 與 Go backend 是 fixture，不是導入此框架的必要架構。

## 常見問題

- `E2E environment adapter "... " was not found`：case 的 `fixture.adapter` 沒有在 `tools/e2e/project-environment-adapters.mjs` 註冊。
- `Cannot reach Cocos MCP`：Cocos Creator 內的 MCP server 尚未啟動，或 `COCOS_MCP_URL` 設定錯誤。
- Test Explorer 沒有測項：確認 `tests/e2e/cases/*.case.json` 不以 `_` 開頭，且 `automation.scriptName` 指向 `assets/` 底下存在的檔案。
- `EADDRINUSE 127.0.0.1:8000`、`7457` 或 `8080`：測試 port 被其他 process 占用。
- 失敗診斷：Playwright 失敗時會附上 run directory 內的 `.log`、`.json`、`.txt` artifact；cleanup 狀態可看 `temp/vscode-e2e/<case-id>/cleanup.log`。

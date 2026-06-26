# Cocos E2E Framework Extension

這個 Cocos Creator extension 是框架的 MVP 交付入口。它負責把 E2E runner、Playwright spec、case template、automation template 與 automation-framework extension 導入目標 Cocos 專案。

此 README 的 Cocos UI workflow 是給「目標專案導入」使用。維護本 repo 時，請用 root README 的「本 Repo 的 Demo 驗證」流程驗證，不要在 repo root 建立教學測項。

## Menu

在 Cocos Creator 中開啟專案後，主選單會出現：

```text
Extension > Cocos E2E Framework
```

可用項目：

- `初始化 Framework`：建立或補齊 E2E scaffold。
- `建立 E2E 測項`：建立一組分檔 case metadata 與 Cocos automation class。
- `重新整理測項索引`：讀取 `tests/e2e/cases/*.case.json`。
- `檢查設定`：檢查必要檔案、npm scripts、Playwright dependency 與 automation-framework extension entry。

## Generated Project Files

`初始化 Framework` 會建立或補齊：

- `playwright.config.mjs`
- `tests/e2e/cocos-e2e.spec.mjs`
- `tests/e2e/cases/_template.case.json`
- `tools/e2e/project-environment-adapters.mjs`
- `tools/e2e/case-discovery.mjs`
- `tools/e2e/environment-adapters.mjs`
- `tools/e2e/runner-core.mjs`
- `tools/automation-server.mjs`
- `tools/cocos-preview-proxy.mjs`
- `tools/cocos-rebuild-preview.mjs`
- `tools/wait-cocos-preview-bundle.mjs`
- `assets/e2e/_template-e2e.test.ts`
- `extensions/automation-framework/`

既有檔案預設不會被覆寫。若需要覆寫，呼叫 scaffold API 時必須明確傳入 `overwrite: true`。

## Cocos UI Workflow

一般導入時不需要手寫 Node 指令，直接使用 Cocos Creator menu：

- `Extension > Cocos E2E Framework > 初始化 Framework`
- `Extension > Cocos E2E Framework > 建立 E2E 測項`
- `Extension > Cocos E2E Framework > 重新整理測項索引`
- `Extension > Cocos E2E Framework > 檢查設定`

`建立 E2E 測項` 會產生一組預設檔案：

- `tests/e2e/cases/new-e2e-case.case.json`
- `assets/e2e/new-e2e-case.test.ts`

建立後可編輯 metadata 的 `title`、`automation.className`、`fixture.adapter`，並在 automation class 內撰寫實際遊戲操作與 assertion。

## Adapter Boundary

初始化後的 `tools/e2e/project-environment-adapters.mjs` 只註冊 `frontend-only`。真實專案如果需要後端 fixture，應在該檔案加入自己的 adapter，不要把業務後端假設寫進 runner core。

Adapter 可使用 runner context：

- `repoRoot`
- `e2eCase`
- `runPaths.logPath(fileName)`
- `startManagedProcess(command, args, options)`
- `waitForHttp(url, timeoutMs)`
- `waitForHttpUnavailable(url, timeoutMs)`
- `runCommand(command, args, options)`

## Development Verification

在此 repo 維護 extension 時，至少跑：

```powershell
npm run test:e2e:unit
npx playwright test --list
```

若改到 runner、adapter 或 scaffold template，還要跑本 repo 的 demo E2E：

```powershell
npm run test:e2e
```

# Cocos E2E Framework Smoke

## Target

Final smoke - Cocos E2E Framework after Phase 06

## Preconditions

- Cocos Creator 已開啟此專案。
- Cocos Preview 已啟動，預設為 `http://127.0.0.1:7456`。
- Cocos MCP server 已啟動，預設為 `http://127.0.0.1:3000/mcp`。
- 已安裝 npm dependencies。
- 若要跑完整 E2E，`127.0.0.1:8000`、`127.0.0.1:7457`、`127.0.0.1:8080` 不能被其他服務占用。
- 不要手動啟動 Go demo backend、automation server 或 Cocos preview proxy；E2E runner 會依測項 adapter 自動啟動與清理。
- 本 repo 的 README 範例只做文件驗證；不要在 repo root 執行初始化或建立教學用 `new-e2e-case`、`scene-loads` 測項。

## Steps

1. 閱讀 root README：

```text
README.md
```

Expected:

- 開頭明確說明框架目的是 Cocos E2E framework。
- 清楚說明 slot demo 與 Go backend 只是 demo fixture，不是必要架構。
- 快速開始包含 extension 導入、初始化、安裝依賴、啟動 Cocos Preview/MCP、列出與執行 E2E。

2. 閱讀 extension README：

```text
extensions/cocos-e2e-framework/README.md
```

Expected:

- 說明 `Extension > Cocos E2E Framework` menu。
- 說明初始化會產生的 project files。
- 說明初始化、建立測項、重新整理測項索引、檢查設定都可由 Cocos Creator menu 操作。

3. 透過 Cocos UI 執行 extension setup check：

```text
Extension > Cocos E2E Framework > 檢查設定
```

Expected:

- Cocos Creator Console 顯示 `checkSetup: ok=true`。
- 若缺少檔案、npm script 或 automation-framework extension entry，Console 會列出錯誤。

4. 檢查 README simple example：

```text
README.md > 新增一個 Frontend-Only 測項
```

Expected:

- 建立測項、重新整理測項索引與檢查設定都使用 `Extension > Cocos E2E Framework` menu。
- 範例示範按下 `StartButton` 後檢查 `StatusLabel.string`。
- 範例使用 `Button.EventType.CLICK` 與 `Label.string`。
- 教學不要求使用 `node -e` 建立或檢查測項。

5. 確認 demo automation class 使用新分檔結構，且沒有教學殘留測項污染 demo baseline：

```powershell
Test-Path assets\slot-e2e.test.ts
Get-ChildItem assets\e2e -Filter *.test.ts | Select-Object -ExpandProperty Name
Test-Path tests\e2e\cases\scene-loads.case.json
Test-Path tests\e2e\cases\new-e2e-case.case.json
```

Expected:

- `assets\slot-e2e.test.ts` 不存在。
- `assets\e2e` 包含 `credit-in-out.test.ts`、`forced-spin.test.ts`、`frontend-only-spin.test.ts`。
- `tests\e2e\cases\scene-loads.case.json` 不存在。
- `tests\e2e\cases\new-e2e-case.case.json` 不存在。

6. 確認 Test Explorer / Playwright 能列出 demo 測項：

```powershell
npx playwright test --list
```

Expected:

- 清單包含 `Cocos E2E: credit-in and credit-out`。
- 清單包含 `Cocos E2E: forced board spin payout`。
- 清單包含 `Cocos E2E: frontend-only deterministic spin`。
- 只列出 `tests/e2e/cocos-e2e.spec.mjs` 這 1 個 spec。
- 總數為 3 tests in 1 file。

7. 執行 frontend-only simple demo：

```powershell
npx playwright test -g "frontend-only deterministic spin"
```

Expected:

- 測試通過。
- 該測項不需要啟動 Go demo backend。
- 產生的 preview URL 會帶 `automation=1` 與 `slotFixture=frontend-only`。

8. 執行 backend-backed demo：

```powershell
npx playwright test -g "forced board spin payout"
```

Expected:

- 測試通過。
- Go demo backend 只由 `demo-backend` adapter 啟動。
- `temp/vscode-e2e/forced-spin/backend.log` 與 `temp/vscode-e2e/forced-spin/cleanup.log` 存在。

9. 執行完整 demo E2E：

```powershell
npm run test:e2e
```

Expected:

- `credit-in and credit-out` 通過。
- `forced board spin payout` 通過。
- `frontend-only deterministic spin` 通過。

10. 確認 cleanup 後測試服務沒有殘留：

```powershell
Test-NetConnection 127.0.0.1 -Port 8000 -InformationLevel Quiet
Test-NetConnection 127.0.0.1 -Port 7457 -InformationLevel Quiet
Test-NetConnection 127.0.0.1 -Port 8080 -InformationLevel Quiet
```

Expected:

- 三個指令都回傳 `False`。
- `temp/vscode-e2e/*/cleanup.log` 可用來確認 automation server、preview proxy 與 demo backend 的停止狀態。

## Failure Signals

- README 把 slot demo 或 Go backend 寫成框架必要條件。
- README 快速開始缺少 extension 初始化、case 建立、adapter、CLI 或 Test Explorer 任一核心流程。
- README 或 extension README 把 `node -e` 當成一般導入教學的主要操作方式。
- extension README 的 menu name 與 `extensions/cocos-e2e-framework/package.json` 不一致。
- README simple example 沒有示範 Button click 或 Label text assertion。
- `npx playwright test --list` 出現 `tests/e2e/cocos-slot.spec.mjs`，代表舊 demo wrapper 殘留。
- `npx playwright test --list` 出現 `Cocos E2E: scene loads`，代表教學殘留 case 污染 demo baseline。
- `assets/slot-e2e.test.ts` 仍存在，代表 demo automation class 尚未移到 `assets/e2e/`。
- `tests/e2e/cases/*.case.json` 的 `automation.scriptName` 仍指向 `slot-e2e.test.ts`。
- `tests/e2e/cases/scene-loads.case.json` 或 `tests/e2e/cases/new-e2e-case.case.json` 存在。
- Test Explorer 沒列出 frontend-only 測項。
- frontend-only 測項嘗試連線 `ws://127.0.0.1:8080/ws`。
- 測試結束後 `8000`、`7457` 或 `8080` 仍回傳 `True`，代表 cleanup 可能沒有完成。

## Result Checklist

- [X] root README 可作為第一次導入者入口。
- [X] extension README 說明 menu 與 generated files。
- [X] README simple example 使用 Cocos UI 建立測項。
- [X] README simple example 包含 Button click 與 Label text assertion。
- [X] Cocos UI `檢查設定` 通過。
- [X] demo automation class 已移到 `assets/e2e/` 分檔。
- [X] 沒有教學殘留測項污染 repo root。
- [X] `npx playwright test --list` 列出 3 條 Cocos E2E。
```
Listing tests:
  cocos-e2e.spec.mjs:17:3 › Cocos E2E: credit-in and credit-out
  cocos-e2e.spec.mjs:17:3 › Cocos E2E: forced board spin payout
  cocos-e2e.spec.mjs:17:3 › Cocos E2E: frontend-only deterministic spin
Total: 3 tests in 1 file
```
- [X] frontend-only 測項通過。
- [X] backend-backed 單條測項通過。
- [X] 完整 demo E2E 通過。
- [X] 測試結束後 `8000`、`7457`、`8080` 未被占用。

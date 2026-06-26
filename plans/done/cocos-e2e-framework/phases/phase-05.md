# Phase 05 - Demo Migration And Full Validation

## Status

Implemented.

## Objective

將現有 slot demo 遷移到新的 framework、測項管理、adapter 與 extension 產物上，證明框架可在真實 Cocos preview 流程中使用。

## Inputs

- Phase 01 runner core
- Phase 02 distributed case management
- Phase 03 adapters
- Phase 04 extension MVP
- `assets/slot-e2e.test.ts` 或新測項結構
- `server/`
- `tests/e2e/`
- `tools/`

## Scope

- 讓 slot demo 成為清楚的 sample project，不是框架核心。
- 驗證 backend-backed 與 frontend-only 測項都能在 demo 中執行。
- 驗證 CLI 與 VS Code Test Explorer 單條測試列出與執行。
- 改善測試 log、artifact、失敗訊息與 cleanup。
- 補齊 smoke steps。

## Out Of Scope

- slot 遊戲玩法擴充。
- 產品級後端品質。
- 視覺回歸平台。
- 多瀏覽器/多裝置矩陣。

## Plan

1. 用 extension 或 framework scaffold 產物整理 slot demo 的 E2E layout。
2. 遷移現有 `credit-in-out` 與 `forced-spin` case 到新測項管理方式。
3. 新增或調整一條 frontend-only sample case。
4. 確認 runner cleanup 不留下 Go backend、automation server 或 proxy process。
5. 整理 test artifacts，讓失敗時能快速定位 automation summary 與 logs。

## BDD

- Given demo slot project，When 執行所有 E2E，Then backend-backed 與 frontend-only cases 都能完成。
- Given 開發者在 VS Code Test Explorer 查看測試，When extension/scaffold 已初始化，Then 每條 Cocos E2E case 都能單獨顯示。
- Given 測試失敗，When 開發者查看 test results，Then 可看到 automation summary 與相關 process logs。

## TDD

- 若 Phase 01-04 已涵蓋 pure logic tests，本 phase 主要做 integration verification。
- 對 artifact path、case filtering、cleanup helper 可加 focused tests。

## Implement

- 已確認 slot demo 使用分散式 case metadata：
  - `tests/e2e/cases/credit-in-out.case.json`
  - `tests/e2e/cases/forced-spin.case.json`
  - `tests/e2e/cases/frontend-only-spin.case.json`
- 已確認 `tests/e2e/cocos-slot.spec.mjs` 透過 case discovery 與 adapter registry 執行 demo 測項。
- 已改善 runner 失敗診斷：
  - 失敗時自動附上 run directory 內的 `.log`、`.json`、`.txt` artifacts。
  - 每次 run 產生 `cleanup.log`，記錄 managed process 停止結果與 teardown error。
  - artifact listing 會排除目錄、非診斷副檔名與過大檔案。
- 已同步 phase 5 runner 改動到 extension scaffold template：
  - `extensions/cocos-e2e-framework/templates/project/tools/e2e/runner-core.mjs`
  - `extensions/cocos-e2e-framework/templates/project/tools/e2e/runner-core.test.mjs`

## E2E

- 已執行 `npx playwright test --list`，列出 3 條 Cocos E2E 測項。
- 已執行 `npm run test:e2e`，3 條 demo E2E 全部通過。
- 已執行單條 backend-backed case：`npx playwright test -g "forced board spin payout"`。
- 已執行單條 frontend-only case：`npx playwright test -g "frontend-only deterministic spin"`。
- 已確認 `temp/vscode-e2e/*/cleanup.log` 產生。
- 已確認 `127.0.0.1:8000`、`127.0.0.1:7457`、`127.0.0.1:8080` 在測試後未被占用。

## Review

- 檢查 sample 是否仍有 slot-specific code 滲入 framework core。
- 檢查 Test Explorer 名稱是否清楚且穩定。
- 檢查 cleanup 是否處理成功與失敗兩種路徑。

## Fix

- 修正 demo 遷移、artifact、cleanup、case filtering、adapter selection 的問題。
- 若 Cocos Preview 狀態造成不穩定，記錄前置條件並調整等待或錯誤訊息。

## Wrap Up

- 已在本 phase 檔記錄實際驗證指令與結果。
- 已更新 `smoke.md`，包含 CLI、Test Explorer、backend-backed、frontend-only 與 cleanup/artifact 驗證步驟。

## Verification

- `npm run test:e2e:unit`：31 passed。
- `npx playwright test --list`：列出 3 tests in 1 file。
- `npm run test:e2e`：3 passed。
- `npx playwright test -g "forced board spin payout"`：1 passed。
- `npx playwright test -g "frontend-only deterministic spin"`：1 passed。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`，確認 runner cleanup 後常用測試 ports 已釋放。
- `git diff --check`：通過。

### Independent Review - 2026-06-26

Findings:

1. `tools/e2e/runner-core.mjs:208` 在已有 `runError` 時直接 `await attachRunArtifacts(...)`，若 Playwright attachment 失敗，`finally` 會丟出 attachment error，導致 `tools/e2e/runner-core.mjs:213` 原本要丟出的 setup/automation failure 被遮蔽。這會讓失敗診斷反而只看到 artifact attach 問題，與本 phase BDD「測試失敗時可看到 automation summary 與 process logs」不一致。Review 期間以小型 Node 重現，原始 `setup failed` 被 `attach failed` 取代。
2. `tools/e2e/runner-core.mjs:420` 與 `tools/e2e/runner-core.mjs:423` 在 `waitForProcessExit(...)` resolve 後固定記錄 `stopped: true`，但 `tools/e2e/runner-core.mjs:432` 的 timeout 也會 resolve，沒有區分「真的 exit」與「等到 timeout」。因此 `cleanup.log` 可能誤報 process 已停止，無法可靠支撐本 phase done criteria「cleanup 不留下 Go backend、automation server 或 proxy process」。

Review verification:

- `git diff --check` passed。
- `fc.exe /b tools\e2e\runner-core.mjs extensions\cocos-e2e-framework\templates\project\tools\e2e\runner-core.mjs` passed：template 與 root runner 相同。
- `fc.exe /b tools\e2e\runner-core.test.mjs extensions\cocos-e2e-framework\templates\project\tools\e2e\runner-core.test.mjs` passed：template test 與 root test 相同。
- `node -e "...runCocosE2ECase({ environment.setup throws, testInfo.attach throws })..."` reproduced finding：輸出 `attach failed`，原始 `setup failed` 被遮蔽。

Next action: `/qdd-phase-fix 5`。

### Phase Fix After Review - 2026-06-26

Fixes:

- `tools/e2e/runner-core.mjs` 在 artifact attachment 失敗時不再遮蔽既有 `runError`；若原本已經有 setup/automation failure，仍回報原始失敗，並把 `artifactAttachError=...` 追加到 `cleanup.log`。
- `tools/e2e/runner-core.mjs` 的 process cleanup 結果現在區分 `exited`、`stopped` 與 `timedOut`，`waitForProcessExit()` timeout 不再被視為成功停止。
- 新增 regression tests：
  - artifact attach 失敗時保留原始 setup failure。
  - process exit wait timeout 時回傳 `exited: false` 與 `timedOut: true`。
- 已同步相同修正到 extension scaffold template：
  - `extensions/cocos-e2e-framework/templates/project/tools/e2e/runner-core.mjs`
  - `extensions/cocos-e2e-framework/templates/project/tools/e2e/runner-core.test.mjs`

Fix verification:

- `npm run test:e2e:unit`：33 passed。
- `node -e "...runCocosE2ECase({ environment.setup throws, testInfo.attach throws })..."`：輸出原始 `setup failed` wrapper，不再輸出 `attach failed`。
- `fc.exe /b tools\e2e\runner-core.mjs extensions\cocos-e2e-framework\templates\project\tools\e2e\runner-core.mjs`：no differences。
- `fc.exe /b tools\e2e\runner-core.test.mjs extensions\cocos-e2e-framework\templates\project\tools\e2e\runner-core.test.mjs`：no differences。
- `npx playwright test --list`：列出 3 tests in 1 file。
- `npm run test:e2e`：3 passed。
- `npx playwright test -g "forced board spin payout"`：1 passed。
- `npx playwright test -g "frontend-only deterministic spin"`：1 passed。
- `temp/vscode-e2e/forced-spin/cleanup.log`：cleanup entries 包含 `exited: true`、`stopped: true`、`timedOut: false`。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet`：皆為 `False`。
- `git diff --check`：通過。

Next action: `/qdd-review 5`。

### Independent Review After Fix - 2026-06-26

Findings:

- None.

Review verification:

- `npm run test:e2e:unit` passed：33 tests passed。
- `npx playwright test --list` passed：列出 3 tests in 1 file。
- `npm run test:e2e` passed：3 tests passed。
- `node -e "...runCocosE2ECase({ environment.setup throws, testInfo.attach throws })..."` passed：輸出原始 setup failure wrapper，沒有被 artifact attach failure 遮蔽。
- `fc.exe /b tools\e2e\runner-core.mjs extensions\cocos-e2e-framework\templates\project\tools\e2e\runner-core.mjs` passed：no differences。
- `fc.exe /b tools\e2e\runner-core.test.mjs extensions\cocos-e2e-framework\templates\project\tools\e2e\runner-core.test.mjs` passed：no differences。
- `temp/vscode-e2e/forced-spin/cleanup.log` checked：cleanup entries 包含 `exited: true`、`stopped: true`、`timedOut: false`。
- `Test-NetConnection 127.0.0.1 -Port 8000/7457/8080 -InformationLevel Quiet` checked：皆為 `False`。
- `git diff --check` passed。

Next action: `/qdd-smoke`。

## Done Criteria

- Slot demo 已使用新的框架結構。
- CLI 與 VS Code Test Explorer 都可使用。
- backend-backed 與 frontend-only E2E 都被驗證。
- 失敗時有足夠 logs 與 summary 可診斷。

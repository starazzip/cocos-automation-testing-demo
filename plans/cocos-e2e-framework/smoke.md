# Cocos E2E Framework Smoke

## Target

Phase 04 - Cocos Creator Extension MVP

## Preconditions

- Cocos Creator 已開啟此專案。
- Cocos Preview 已啟動，預設為 `http://127.0.0.1:7456`。
- Cocos MCP server 已啟動，預設為 `http://127.0.0.1:3000/mcp`。
- 已安裝 npm dependencies。
- 若要跑預設完整 E2E，`127.0.0.1:8000` 不能被其他服務佔用。

## Steps

1. 在 Cocos Creator 主選單確認 extension 入口。

Expected:

- `Extension > Cocos E2E Framework` 下可看到初始化、建立測項、重新整理測項索引與檢查設定等項目。

2. 執行 extension setup check：

```powershell
node -e "const m=require('./extensions/cocos-e2e-framework/dist/main.js').methods; const r=m.checkSetup({projectRoot:process.cwd()}); if(!r.ok){console.error(r.errors.join('\n')); process.exit(1)}"
```

Expected:

- 指令成功結束。
- console 顯示 `checkSetup: ok=true`。

3. 執行臨時專案初始化 smoke：

```powershell
node -e "const fs=require('node:fs'), os=require('node:os'), path=require('node:path'); const s=require('./extensions/cocos-e2e-framework/dist/scaffold.js'); const root=fs.mkdtempSync(path.join(os.tmpdir(),'cocos-e2e-smoke-')); try { fs.writeFileSync(path.join(root,'package.json'), '{}\n'); const init=s.initializeFramework({projectRoot:root}); if(init.errors.length){console.error(init.errors.join('\n')); process.exit(1)} const check=s.checkSetup({projectRoot:root}); if(!check.ok){console.error(check.errors.join('\n')); process.exit(1)} require(path.join(root,'extensions/automation-framework/dist/main.js')); console.log('init + checkSetup + automation-framework load ok') } finally { fs.rmSync(root,{recursive:true,force:true}) }"
```

Expected:

- console 顯示 `init + checkSetup + automation-framework load ok`。
- 初始化後的臨時專案包含 runner tools、case template、automation test template 與 automation-framework extension。
- 臨時專案不需要在 `extensions/automation-framework/` 下執行 `npm install`。

4. 執行 extension case index refresh：

```powershell
node -e "const m=require('./extensions/cocos-e2e-framework/dist/main.js').methods; const r=m.refreshCaseIndex({projectRoot:process.cwd()}); console.log(r.cases.map(c=>c.id).join(',')); if(r.cases.length < 3) process.exit(1)"
```

Expected:

- 輸出包含 `credit-in-out`、`forced-spin`、`frontend-only-spin`。

5. 確認 Test Explorer / Playwright 能列出測項：

```powershell
npx playwright test --list
```

Expected:

- 清單包含 `Cocos E2E: credit-in and credit-out`。
- 清單包含 `Cocos E2E: forced board spin payout`。
- 清單包含 `Cocos E2E: frontend-only deterministic spin`。

6. 執行 frontend-only 測項：

```powershell
npx playwright test -g "frontend-only deterministic spin"
```

Expected:

- 測試通過。
- 該測項不需要啟動 Go demo backend。
- 產生的 preview URL 會帶 `automation=1` 與 `slotFixture=frontend-only`。

## Failure Signals

- Cocos Creator 沒有顯示 `Cocos E2E Framework` extension menu。
- `checkSetup` 回報缺少 runner、Playwright、case 目錄或 automation-framework extension。
- `initFramework` 後的臨時專案仍缺少 `tools/e2e/runner-core.mjs` 或 `extensions/automation-framework/package.json`。
- `initFramework` 後載入 `extensions/automation-framework/dist/main.js` 出現 `Cannot find module 'fs-extra'` 或其他 dependency error。
- Test Explorer 沒列出 frontend-only 測項。
- frontend-only 測項嘗試連線 `ws://127.0.0.1:8080/ws`。
- automation server log 顯示 `EADDRINUSE 127.0.0.1:8000`，代表預設 port 被其他服務佔用。

## Result Checklist

- [ ] Cocos Creator 顯示 `Cocos E2E Framework` extension menu。
- [ ] `checkSetup` 通過。
- [ ] 臨時專案 `init + checkSetup + automation-framework load` 通過。
- [ ] `refreshCaseIndex` 讀到 3 條測項。
- [ ] `npx playwright test --list` 列出 3 條 Cocos E2E。
- [ ] frontend-only 測項通過。

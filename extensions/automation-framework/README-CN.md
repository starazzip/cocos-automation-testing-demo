# Cocos Automation Framework

此目錄是為了 Minimal Slot Game 的 Cocos automation-testing E2E，從 `cocos/cocos-test-projects` 歷史版本複製進專案的本地 Cocos Creator extension。

## 來源

- 來源專案：`cocos/cocos-test-projects`
- 追蹤背景：PR #713 之後的歷史版本
- 使用版本：最後仍保留本地 `extensions/automation-framework` 的可用 commit `2e42d11a073ffc32bd711379d92a84bd395d28f4`

後續版本曾改為 package dependency，但本專案需要可直接被 Cocos Creator 3.8.x 載入的本地 extension，因此將此版本的 extension 本體納入版控。

## 版控策略

需要進版控：

- `package.json`
- `package-lock.json`
- `assets/`
- `dist/`
- `i18n/`
- README 檔案

不要進版控：

- `node_modules/`

`dist/*.js` 雖然是編譯產物，但此舊版 extension 的 `package.json` 入口指向 `dist/main.js`，Cocos Creator 會直接載入這些檔案。為了讓其他環境拉下專案後能直接載入 extension，`dist/` 需要保留在版控中。

## 還原依賴

如果本機缺少 extension 依賴，執行：

```bash
cd extensions/automation-framework
npm install
```

`node_modules/` 會在本機產生，但不應提交。

## 用途

此 extension 提供 `db://automation-framework/runtime/test-framework.mjs`，讓 `assets/e2e/*.test.ts` 可以透過 Cocos automation-testing 執行 E2E 測試。

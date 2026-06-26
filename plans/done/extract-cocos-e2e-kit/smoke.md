# Smoke Test - Extract Cocos E2E Kit

## Target

- `starazzip/cocos-e2e-kit` provides reusable Cocos E2E framework.
- `demo-without-e2e` is a playable demo branch without E2E framework.
- `main` is the final demo branch with framework adopted under `frontend/`.

## Automated Checks

### Kit Repo

Run in `D:\Azzip\cocos\cocos-e2e-kit`:

```powershell
npm test
git status -sb
```

Expected:

- 33 tests pass.
- Working tree is clean.

### Demo Backend

Run in `D:\Azzip\cocos\NewProject_1\server`:

```powershell
go test ./...
```

Expected:

- All Go packages pass.

### Demo Frontend E2E

Precondition:

- Open Cocos Creator 3.8.x with `frontend/`.
- Start Preview and confirm `http://127.0.0.1:7456` is reachable.

Run in `D:\Azzip\cocos\NewProject_1\frontend`:

```powershell
npm run test:e2e:unit
npx playwright test --list
npm run test:e2e
```

Expected:

- Unit tests pass.
- Three Playwright tests are listed.
- Three demo E2E tests pass.

## Manual Branch Check

```powershell
git ls-remote --heads origin demo-without-e2e main
```

Expected:

- Remote branch `demo-without-e2e` exists.
- Remote branch `main` exists.

## Result Checklist

- [x] Kit repo pushed.
- [x] `demo-without-e2e` pushed.
- [x] `main` ready to push after final commit.
- [x] Demo E2E passes on `main`.
- [x] Plan ready to archive to `plans/done/extract-cocos-e2e-kit`.

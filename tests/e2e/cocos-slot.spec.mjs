import { test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runCocosE2ECase } from '../../tools/e2e/runner-core.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repoRoot, 'tools/e2e-cases.json'), 'utf8'));

const slotBackendEnvironment = {
  unavailableUrls: ['http://127.0.0.1:8080/healthz'],
  async setup({ repoRoot, runPaths, startManagedProcess, waitForHttp }) {
    startManagedProcess('go', ['run', './cmd/server'], {
      cwd: resolve(repoRoot, 'server'),
      env: {
        SLOT_ADDR: '127.0.0.1:8080',
        SLOT_DB_PATH: resolve(runPaths.runDir, 'slot.db'),
        SLOT_TEST_MODE: '1',
      },
      logPath: runPaths.logPath('backend.log'),
    });
    await waitForHttp('http://127.0.0.1:8080/healthz', 30000);
  },
};

for (const e2eCase of cases) {
  test(`Cocos E2E: ${e2eCase.title}`, async ({ page }, testInfo) => {
    await runCocosE2ECase({
      page,
      testInfo,
      repoRoot,
      e2eCase,
      environment: slotBackendEnvironment,
      options: {
        testConfig: {
          jobPrefix: 'slot-e2e',
        },
      },
    });
  });
}

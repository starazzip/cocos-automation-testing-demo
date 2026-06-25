import { test } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverE2ECases } from '../../tools/e2e/case-discovery.mjs';
import {
  createSlotEnvironmentAdapters,
  resolveEnvironmentAdapter,
} from '../../tools/e2e/environment-adapters.mjs';
import { runCocosE2ECase } from '../../tools/e2e/runner-core.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = discoverE2ECases(repoRoot);
const environmentAdapters = createSlotEnvironmentAdapters();

for (const e2eCase of cases) {
  test(`Cocos E2E: ${e2eCase.title}`, async ({ page }, testInfo) => {
    const environment = resolveEnvironmentAdapter(e2eCase, environmentAdapters);
    await runCocosE2ECase({
      page,
      testInfo,
      repoRoot,
      e2eCase,
      environment,
      options: {
        testConfig: {
          jobPrefix: 'slot-e2e',
        },
      },
    });
  });
}

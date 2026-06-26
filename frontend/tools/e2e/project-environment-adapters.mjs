import { resolve } from 'node:path';

import {
    createFrontendOnlyAdapter,
    normalizeEnvironmentAdapter,
    resolveEnvironmentAdapter,
} from './environment-adapters.mjs';

export { resolveEnvironmentAdapter };

export function createDemoBackendAdapter(options = {}) {
    const host = options.host ?? '127.0.0.1';
    const port = options.port ?? 8080;
    const healthUrl = `http://${host}:${port}/healthz`;
    return normalizeEnvironmentAdapter({
        name: options.name ?? 'demo-backend',
        async setup({ repoRoot, runPaths, startManagedProcess, waitForHttp }) {
            try {
                await waitForHttp(healthUrl, options.externalProbeTimeoutMs ?? 500);
                return;
            } catch {
                // The repo demo backend is managed by the runner only when no external service is running.
            }

            startManagedProcess('go', ['run', './cmd/server'], {
                cwd: resolve(repoRoot, '../server'),
                env: {
                    SLOT_ADDR: `${host}:${port}`,
                    SLOT_DB_PATH: resolve(runPaths.runDir, 'slot.db'),
                    SLOT_TEST_MODE: '1',
                },
                logPath: runPaths.logPath('backend.log'),
            });
            await waitForHttp(healthUrl, options.startupTimeoutMs ?? 30000);
        },
    });
}

export function createProjectEnvironmentAdapters() {
    return {
        'demo-backend': createDemoBackendAdapter(),
        'frontend-only': createFrontendOnlyAdapter({
            previewUrlParams: {
                slotFixture: 'frontend-only',
            },
        }),
    };
}

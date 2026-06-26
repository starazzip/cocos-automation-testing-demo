import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import {
    createDemoBackendAdapter,
    createProjectEnvironmentAdapters,
    resolveEnvironmentAdapter,
} from './project-environment-adapters.mjs';

test('createProjectEnvironmentAdapters registers this repo demo adapters', () => {
    const registry = createProjectEnvironmentAdapters();

    assert.equal(
        resolveEnvironmentAdapter({ id: 'demo-case', fixture: { adapter: 'demo-backend' } }, registry).name,
        'demo-backend',
    );
    assert.equal(
        resolveEnvironmentAdapter({ id: 'frontend-case', fixture: { adapter: 'frontend-only' } }, registry).name,
        'frontend-only',
    );
    assert.deepEqual(registry['frontend-only'].previewUrlParams, {
        slotFixture: 'frontend-only',
    });
});

test('createDemoBackendAdapter starts the demo server through the runner context', async () => {
    const adapter = createDemoBackendAdapter({ port: 9090 });
    const started = [];
    const waitedUrls = [];
    let waitCount = 0;
    await adapter.setup({
        repoRoot: resolve('repo'),
        runPaths: {
            runDir: resolve('run'),
            logPath(fileName) {
                return resolve('logs', fileName);
            },
        },
        startManagedProcess(command, args, options) {
            started.push({ command, args, options });
        },
        async waitForHttp(url) {
            waitedUrls.push(url);
            waitCount += 1;
            if (waitCount === 1) {
                throw new Error('not running yet');
            }
        },
    });

    assert.equal(started.length, 1);
    assert.equal(started[0].command, 'go');
    assert.deepEqual(started[0].args, ['run', './cmd/server']);
    assert.equal(started[0].options.env.SLOT_ADDR, '127.0.0.1:9090');
    assert.equal(started[0].options.env.SLOT_TEST_MODE, '1');
    assert.equal(started[0].options.env.SLOT_DB_PATH, resolve('run', 'slot.db'));
    assert.deepEqual(waitedUrls, [
        'http://127.0.0.1:9090/healthz',
        'http://127.0.0.1:9090/healthz',
    ]);
});

test('createDemoBackendAdapter uses an already running backend', async () => {
    const adapter = createDemoBackendAdapter({ port: 9090 });
    const started = [];
    const waitedUrls = [];

    await adapter.setup({
        repoRoot: resolve('repo'),
        runPaths: {
            runDir: resolve('run'),
            logPath(fileName) {
                return resolve('logs', fileName);
            },
        },
        startManagedProcess(command, args, options) {
            started.push({ command, args, options });
        },
        async waitForHttp(url) {
            waitedUrls.push(url);
        },
    });

    assert.deepEqual(started, []);
    assert.deepEqual(waitedUrls, ['http://127.0.0.1:9090/healthz']);
});

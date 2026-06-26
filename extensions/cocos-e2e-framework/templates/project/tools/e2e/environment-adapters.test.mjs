import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import {
    createDemoBackendAdapter,
    createFrontendOnlyAdapter,
    createSlotEnvironmentAdapters,
    mergeEnvironmentAdapterOptions,
    normalizeEnvironmentAdapter,
    resolveEnvironmentAdapter,
    setupEnvironmentAdapter,
} from './environment-adapters.mjs';

test('resolveEnvironmentAdapter uses fixture adapter or the default adapter', () => {
    const registry = createSlotEnvironmentAdapters();

    assert.equal(
        resolveEnvironmentAdapter({ id: 'default-case' }, registry).name,
        'demo-backend',
    );
    assert.equal(
        resolveEnvironmentAdapter({ id: 'mock-case', fixture: { adapter: 'frontend-only' } }, registry).name,
        'frontend-only',
    );
});

test('resolveEnvironmentAdapter rejects unknown adapters with case context', () => {
    assert.throws(
        () => resolveEnvironmentAdapter(
            { id: 'broken-case', fixture: { adapter: 'missing-adapter' } },
            createSlotEnvironmentAdapters(),
        ),
        /missing-adapter.*broken-case/,
    );
});

test('normalizeEnvironmentAdapter validates adapter contract shape', () => {
    assert.throws(
        () => normalizeEnvironmentAdapter({ name: 'bad', setup: true }),
        /setup must be a function/,
    );
    assert.throws(
        () => normalizeEnvironmentAdapter({ name: 'bad', unavailableUrls: ['ok', 1] }),
        /unavailableUrls\[\] must be a non-empty string/,
    );
});

test('mergeEnvironmentAdapterOptions lets caller options override adapter runtime config', () => {
    const options = mergeEnvironmentAdapterOptions({
        testConfig: {
            jobPrefix: 'caller',
        },
        preview: {
            urlParams: {
                slotFixture: 'caller-fixture',
                visualFixture: '1',
            },
        },
    }, {
        name: 'frontend-only',
        testConfig: {
            jobPrefix: 'adapter',
            localServer: { timeout: 1000 },
        },
        previewUrlParams: {
            slotFixture: 'frontend-only',
        },
    });

    assert.deepEqual(options.testConfig, {
        jobPrefix: 'caller',
        localServer: { timeout: 1000 },
    });
    assert.deepEqual(options.preview.urlParams, {
        slotFixture: 'caller-fixture',
        visualFixture: '1',
    });
});

test('createDemoBackendAdapter starts the demo server through the runner context', async () => {
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

    assert.equal(started.length, 1);
    assert.equal(started[0].command, 'go');
    assert.deepEqual(started[0].args, ['run', './cmd/server']);
    assert.equal(started[0].options.env.SLOT_ADDR, '127.0.0.1:9090');
    assert.equal(started[0].options.env.SLOT_TEST_MODE, '1');
    assert.equal(started[0].options.env.SLOT_DB_PATH, resolve('run', 'slot.db'));
    assert.deepEqual(waitedUrls, ['http://127.0.0.1:9090/healthz']);
});

test('createFrontendOnlyAdapter provides preview params and does not require setup', () => {
    const adapter = createFrontendOnlyAdapter();

    assert.deepEqual(adapter.unavailableUrls, []);
    assert.deepEqual(adapter.previewUrlParams, { slotFixture: 'frontend-only' });
    assert.equal(adapter.setup, undefined);
});

test('setupEnvironmentAdapter wraps setup failures with adapter name and log hint', async () => {
    await assert.rejects(
        () => setupEnvironmentAdapter({
            name: 'broken-adapter',
            async setup() {
                throw new Error('boom');
            },
        }, {
            runPaths: {
                logPath(fileName) {
                    return resolve('logs', fileName);
                },
            },
        }),
        /broken-adapter.*logs.*broken-adapter\.log.*boom/,
    );
});

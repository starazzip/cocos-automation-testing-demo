import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import {
    createFrontendOnlyAdapter,
    mergeEnvironmentAdapterOptions,
    normalizeEnvironmentAdapter,
    resolveEnvironmentAdapter,
    setupEnvironmentAdapter,
} from './environment-adapters.mjs';

test('resolveEnvironmentAdapter uses fixture adapter or the default adapter', () => {
    const registry = {
        'frontend-only': createFrontendOnlyAdapter(),
    };

    assert.equal(
        resolveEnvironmentAdapter({ id: 'default-case' }, registry).name,
        'frontend-only',
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
            { 'frontend-only': createFrontendOnlyAdapter() },
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
                e2eFixture: 'caller-fixture',
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
            e2eFixture: 'frontend-only',
        },
    });

    assert.deepEqual(options.testConfig, {
        jobPrefix: 'caller',
        localServer: { timeout: 1000 },
    });
    assert.deepEqual(options.preview.urlParams, {
        e2eFixture: 'caller-fixture',
        visualFixture: '1',
    });
});

test('createFrontendOnlyAdapter does not require setup or project-specific preview params', () => {
    const adapter = createFrontendOnlyAdapter();

    assert.deepEqual(adapter.unavailableUrls, []);
    assert.deepEqual(adapter.previewUrlParams, {});
    assert.equal(adapter.setup, undefined);
});

test('createFrontendOnlyAdapter accepts project-specific preview params', () => {
    const adapter = createFrontendOnlyAdapter({
        previewUrlParams: {
            e2eFixture: 'frontend-only',
        },
    });

    assert.deepEqual(adapter.previewUrlParams, { e2eFixture: 'frontend-only' });
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

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
    assertAutomationSummaryPassed,
    collectRunArtifacts,
    createAutomationTestConfig,
    createPreviewUrl,
    createRunPaths,
    formatCleanupErrors,
    formatAutomationLogs,
    validateE2ECase,
} from './runner-core.mjs';

const validCase = {
    id: 'forced-spin',
    title: 'forced board spin payout',
    scriptName: 'slot-e2e.test.ts',
    className: 'slot_forced_spin_e2e',
};

test('createAutomationTestConfig maps a case to Cocos automation testConfig', () => {
    const config = createAutomationTestConfig(validCase, {
        jobPrefix: 'slot-e2e',
        localServer: { port: 8123 },
    });

    assert.equal(config.jobId, 'slot-e2e-forced-spin');
    assert.equal(config.localServer.port, 8123);
    assert.deepEqual(config.platforms, [
        {
            platformIndex: 0,
            testScripts: [
                {
                    scriptName: 'slot-e2e.test.ts',
                    classNames: ['slot_forced_spin_e2e'],
                },
            ],
        },
    ]);
});

test('validateE2ECase rejects unsafe ids and missing fields', () => {
    assert.throws(
        () => validateE2ECase({ ...validCase, id: '../forced-spin' }),
        /must only contain/,
    );
    assert.throws(
        () => validateE2ECase({ ...validCase, className: '' }),
        /className/,
    );
});

test('createRunPaths keeps per-case artifacts under the temp root', () => {
    const repoRoot = resolve('repo');
    const paths = createRunPaths(repoRoot, validCase);

    assert.equal(paths.runDir, resolve(repoRoot, 'temp/vscode-e2e/forced-spin'));
    assert.equal(paths.testConfigPath, resolve(paths.runDir, 'testConfig.json'));
    assert.equal(paths.logPath('backend.log'), resolve(paths.runDir, 'backend.log'));
});

test('createPreviewUrl carries automation and optional visual mode', () => {
    assert.equal(createPreviewUrl('http://127.0.0.1:7457'), 'http://127.0.0.1:7457?automation=1');
    assert.equal(createPreviewUrl('http://127.0.0.1:7457', { visualMode: true }), 'http://127.0.0.1:7457?automation=1&visual=1');
    assert.equal(
        createPreviewUrl('http://127.0.0.1:7457', {
            urlParams: { slotFixture: 'frontend-only' },
            visualMode: true,
        }),
        'http://127.0.0.1:7457?automation=1&slotFixture=frontend-only&visual=1',
    );
});

test('assertAutomationSummaryPassed reports failed automation logs', () => {
    const summary = {
        ended: true,
        failed: true,
        logs: [{ state: 'Error', message: 'boom' }],
    };

    assert.throws(
        () => assertAutomationSummaryPassed(summary),
        /Cocos automation failed/,
    );
    assert.equal(formatAutomationLogs(summary), '{"state":"Error","message":"boom"}');
});

test('collectRunArtifacts returns existing E2E diagnostic files in stable order', (t) => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'cocos-e2e-artifacts-'));
    t.after(() => rmSync(repoRoot, { recursive: true, force: true }));
    const paths = createRunPaths(repoRoot, validCase);
    mkdirSync(paths.runDir, { recursive: true });
    writeFileSync(paths.testConfigPath, '{}\n');
    writeFileSync(paths.logPath('preview-proxy.log'), 'proxy log\n');
    writeFileSync(paths.logPath('backend.log'), 'backend log\n');

    const artifacts = collectRunArtifacts(paths);

    assert.deepEqual(artifacts.map((artifact) => artifact.name), [
        'testConfig.json',
        'preview-proxy.log',
        'backend.log',
    ]);
    assert.deepEqual(artifacts.map((artifact) => artifact.contentType), [
        'application/json',
        'text/plain',
        'text/plain',
    ]);
});

test('formatCleanupErrors keeps cleanup failures diagnosable', () => {
    assert.equal(
        formatCleanupErrors([new Error('backend still running'), 'proxy cleanup failed']),
        [
            'Cocos E2E cleanup failed:',
            '- backend still running',
            '- proxy cleanup failed',
        ].join('\n'),
    );
});

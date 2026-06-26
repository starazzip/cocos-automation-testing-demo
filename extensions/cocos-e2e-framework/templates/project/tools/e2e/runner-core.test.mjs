import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    listRunArtifacts,
    runCocosE2ECase,
    validateE2ECase,
    waitForProcessExit,
} from './runner-core.mjs';

const validCase = {
    id: 'sample-case',
    title: 'sample case',
    scriptName: 'e2e/sample-case.test.ts',
    className: 'sample_case_e2e',
};

test('createAutomationTestConfig maps a case to Cocos automation testConfig', () => {
    const config = createAutomationTestConfig(validCase, {
        jobPrefix: 'cocos-e2e',
        localServer: { port: 8123 },
    });

    assert.equal(config.jobId, 'cocos-e2e-sample-case');
    assert.equal(config.localServer.port, 8123);
    assert.deepEqual(config.platforms, [
        {
            platformIndex: 0,
            testScripts: [
                {
                    scriptName: 'e2e/sample-case.test.ts',
                    classNames: ['sample_case_e2e'],
                },
            ],
        },
    ]);
});

test('validateE2ECase rejects unsafe ids and missing fields', () => {
    assert.throws(
        () => validateE2ECase({ ...validCase, id: '../sample-case' }),
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

    assert.equal(paths.runDir, resolve(repoRoot, 'temp/vscode-e2e/sample-case'));
    assert.equal(paths.testConfigPath, resolve(paths.runDir, 'testConfig.json'));
    assert.equal(paths.logPath('backend.log'), resolve(paths.runDir, 'backend.log'));
});

test('listRunArtifacts returns bounded diagnostic log and JSON files', () => {
    const runDir = mkdtempSync(resolve(tmpdir(), 'cocos-e2e-artifacts-'));
    try {
        writeFileSync(resolve(runDir, 'automation-server.log'), 'server log');
        writeFileSync(resolve(runDir, 'testConfig.json'), '{}');
        writeFileSync(resolve(runDir, 'trace.zip'), 'zip content');
        writeFileSync(resolve(runDir, 'large.log'), '0123456789');
        mkdirSync(resolve(runDir, 'nested'));

        assert.deepEqual(listRunArtifacts(runDir, { maxBytes: 9 }), [
            {
                name: 'testConfig.json',
                path: resolve(runDir, 'testConfig.json'),
                size: 2,
            },
        ]);
    } finally {
        rmSync(runDir, { recursive: true, force: true });
    }
});

test('createPreviewUrl carries automation and optional visual mode', () => {
    assert.equal(createPreviewUrl('http://127.0.0.1:7457'), 'http://127.0.0.1:7457?automation=1');
    assert.equal(createPreviewUrl('http://127.0.0.1:7457', { visualMode: true }), 'http://127.0.0.1:7457?automation=1&visual=1');
    assert.equal(
        createPreviewUrl('http://127.0.0.1:7457', {
            urlParams: { e2eFixture: 'frontend-only' },
            visualMode: true,
        }),
        'http://127.0.0.1:7457?automation=1&e2eFixture=frontend-only&visual=1',
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

    const artifacts = collectRunArtifacts(paths, [
        'testConfig.json',
        'preview-proxy.log',
        'backend.log',
    ]);

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

test('runCocosE2ECase preserves the original failure when artifact attachment fails', async (t) => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'cocos-e2e-attach-mask-'));
    t.after(() => rmSync(repoRoot, { recursive: true, force: true }));
    const e2eCase = { ...validCase, id: 'attach-mask' };

    await assert.rejects(
        () => runCocosE2ECase({
            page: { goto: async () => {} },
            testInfo: {
                attach: async () => {
                    throw new Error('attach failed');
                },
            },
            repoRoot,
            e2eCase,
            environment: {
                name: 'review-env',
                setup: async () => {
                    throw new Error('setup failed');
                },
            },
            options: {
                tempRoot: 'temp/e2e',
                unavailableTimeoutMs: 50,
                automation: { summaryUrl: 'http://127.0.0.1:1/summary' },
                previewProxy: { testConfigUrl: 'http://127.0.0.1:1/testConfig.json' },
            },
        }),
        /setup failed/,
    );

    const cleanupLog = readFileSync(resolve(repoRoot, 'temp/e2e/attach-mask/cleanup.log'), 'utf8');
    assert.match(cleanupLog, /artifactAttachError=attach failed/);
});

test('waitForProcessExit reports timeout without marking the process exited', async () => {
    const child = new EventEmitter();
    child.exitCode = null;
    child.signalCode = null;

    assert.deepEqual(await waitForProcessExit(child, 1), {
        exited: false,
        timedOut: true,
        exitCode: null,
        signalCode: null,
    });
});

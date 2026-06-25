import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import {
    assertAutomationSummaryPassed,
    createAutomationTestConfig,
    createPreviewUrl,
    createRunPaths,
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

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { createPreviewBundlePatterns, discoverE2ECases } from './case-discovery.mjs';

test('discoverE2ECases loads distributed case metadata in deterministic id order', (t) => {
    const repoRoot = createFixtureProject(t);
    writeAsset(repoRoot, 'slot-e2e.test.ts');
    writeCase(repoRoot, 'z.case.json', {
        id: 'z-case',
        title: 'Z case',
        automation: {
            scriptName: 'slot-e2e.test.ts',
            className: 'z_e2e',
        },
        tags: ['z'],
    });
    writeCase(repoRoot, 'a.case.json', {
        id: 'a-case',
        title: 'A case',
        automation: {
            scriptName: 'slot-e2e.test.ts',
            classNames: ['a_e2e'],
        },
    });
    writeCase(repoRoot, '_template.case.json', {
        id: 'ignored-template',
        title: 'Ignored template',
        automation: {
            scriptName: 'missing.ts',
            className: 'ignored_e2e',
        },
    });

    const cases = discoverE2ECases(repoRoot);

    assert.deepEqual(cases.map((e2eCase) => e2eCase.id), ['a-case', 'z-case']);
    assert.equal(cases[0].scriptName, 'slot-e2e.test.ts');
    assert.deepEqual(cases[0].classNames, ['a_e2e']);
    assert.equal(cases[0].sourcePath, 'tests/e2e/cases/a.case.json');
    assert.deepEqual(cases[1].tags, ['z']);
});

test('discoverE2ECases rejects duplicate ids with file context', (t) => {
    const repoRoot = createFixtureProject(t);
    writeAsset(repoRoot, 'slot-e2e.test.ts');
    writeCase(repoRoot, 'one.case.json', validCase({ id: 'same-id', className: 'one_e2e' }));
    writeCase(repoRoot, 'two.case.json', validCase({ id: 'same-id', className: 'two_e2e' }));

    assert.throws(
        () => discoverE2ECases(repoRoot),
        /duplicate case id "same-id"/,
    );
});

test('discoverE2ECases rejects missing required automation fields', (t) => {
    const repoRoot = createFixtureProject(t);
    writeAsset(repoRoot, 'slot-e2e.test.ts');
    writeCase(repoRoot, 'broken.case.json', {
        id: 'broken',
        title: 'Broken',
        automation: {
            scriptName: 'slot-e2e.test.ts',
        },
    });

    assert.throws(
        () => discoverE2ECases(repoRoot),
        /automation\.className/,
    );
});

test('discoverE2ECases rejects metadata pointing at a missing Cocos script', (t) => {
    const repoRoot = createFixtureProject(t);
    writeCase(repoRoot, 'missing-script.case.json', validCase({
        id: 'missing-script',
        scriptName: 'missing.ts',
        className: 'missing_e2e',
    }));

    assert.throws(
        () => discoverE2ECases(repoRoot),
        /was not found under assets/,
    );
});

test('discoverE2ECases rejects non-object case metadata with file context', (t) => {
    const repoRoot = createFixtureProject(t);
    writeCase(repoRoot, 'null.case.json', null);

    assert.throws(
        () => discoverE2ECases(repoRoot),
        /null\.case\.json: case metadata must be a JSON object/,
    );
});

test('createPreviewBundlePatterns includes scripts and automation class names once', () => {
    const patterns = createPreviewBundlePatterns([
        {
            id: 'one',
            title: 'One',
            scriptName: 'slot-e2e.test.ts',
            className: 'one_e2e',
        },
        {
            id: 'two',
            title: 'Two',
            scriptName: 'slot-e2e.test.ts',
            classNames: ['two_e2e'],
        },
    ]);

    assert.deepEqual(patterns, ['one_e2e', 'slot-e2e.test.ts', 'two_e2e']);
});

function createFixtureProject(t) {
    const repoRoot = mkdtempSync(join(tmpdir(), 'cocos-e2e-cases-'));
    mkdirSync(resolve(repoRoot, 'assets'), { recursive: true });
    mkdirSync(resolve(repoRoot, 'tests/e2e/cases'), { recursive: true });
    mkdirSync(resolve(repoRoot, 'tools'), { recursive: true });
    t.after(() => rmSync(repoRoot, { recursive: true, force: true }));
    return repoRoot;
}

function writeAsset(repoRoot, name) {
    writeFileSync(resolve(repoRoot, 'assets', name), '');
}

function writeCase(repoRoot, fileName, content) {
    writeFileSync(resolve(repoRoot, 'tests/e2e/cases', fileName), `${JSON.stringify(content, null, 2)}\n`);
}

function validCase(overrides = {}) {
    return {
        id: overrides.id ?? 'case-id',
        title: overrides.title ?? `Case ${overrides.id ?? 'case-id'}`,
        automation: {
            scriptName: overrides.scriptName ?? 'slot-e2e.test.ts',
            className: overrides.className ?? 'case_e2e',
        },
        tags: overrides.tags,
    };
}

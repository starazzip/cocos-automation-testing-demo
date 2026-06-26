import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const scaffold = require('../../extensions/cocos-e2e-framework/dist/scaffold.js');

test('initializeFramework creates project scaffold without overwriting existing config', (t) => {
    const projectRoot = createFixtureProject(t);
    writeFileSync(resolve(projectRoot, 'package.json'), `${JSON.stringify({
        scripts: {
            'test:e2e': 'custom e2e command',
        },
    }, null, 2)}\n`);
    writeFileSync(resolve(projectRoot, 'playwright.config.mjs'), 'custom config\n');

    const result = scaffold.initializeFramework({ projectRoot });

    assert.equal(result.errors.length, 0);
    assert.ok(result.updated.some((entry) => entry.path === 'package.json'));
    assert.ok(result.skipped.some((entry) => entry.path === 'playwright.config.mjs'));
    assert.equal(readFileSync(resolve(projectRoot, 'playwright.config.mjs'), 'utf8'), 'custom config\n');

    const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));
    assert.equal(packageJson.scripts['test:e2e'], 'custom e2e command');
    assert.equal(packageJson.scripts['cocos:rebuild-preview'], 'node tools/cocos-rebuild-preview.mjs');
    assert.equal(packageJson.devDependencies['@playwright/test'], '^1.61.1');
    assert.ok(existsSync(resolve(projectRoot, 'tests/e2e/cases/_template.case.json')));
    assert.ok(existsSync(resolve(projectRoot, 'assets/e2e/_template-e2e.test.ts')));
    assert.ok(existsSync(resolve(projectRoot, 'tools/automation-server.mjs')));
    assert.ok(existsSync(resolve(projectRoot, 'tools/e2e/runner-core.mjs')));
    assert.ok(existsSync(resolve(projectRoot, 'tools/e2e/case-discovery.test.mjs')));
    assert.ok(!existsSync(resolve(projectRoot, 'tools/e2e/extension-scaffold.test.mjs')));
    assert.ok(existsSync(resolve(projectRoot, 'tools/e2e/project-environment-adapters.mjs')));
    assert.ok(existsSync(resolve(projectRoot, 'extensions/automation-framework/package.json')));

    const setup = scaffold.checkSetup({ projectRoot });
    assert.equal(setup.ok, true, setup.errors.join('\n'));
});

test('initializeFramework creates a loadable automation-framework extension', (t) => {
    const projectRoot = createFixtureProject(t);
    writeFileSync(resolve(projectRoot, 'package.json'), '{}\n');

    const result = scaffold.initializeFramework({ projectRoot });

    assert.equal(result.errors.length, 0);
    assert.ok(!existsSync(resolve(projectRoot, 'extensions/automation-framework/node_modules/fs-extra')));

    const extensionMain = require(resolve(projectRoot, 'extensions/automation-framework/dist/main.js'));
    assert.equal(typeof extensionMain.load, 'function');
    assert.equal(typeof extensionMain.unload, 'function');
});

test('checkSetup detects automation-framework runtime load failures', (t) => {
    const projectRoot = createFixtureProject(t);
    writeFileSync(resolve(projectRoot, 'package.json'), '{}\n');
    scaffold.initializeFramework({ projectRoot });
    writeFileSync(
        resolve(projectRoot, 'extensions/automation-framework/dist/main.js'),
        "'use strict';\nrequire('definitely-missing-cocos-e2e-test-dependency');\n",
    );

    const result = scaffold.checkSetup({ projectRoot });

    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('automation-framework extension cannot load')));
    assert.ok(result.errors.some((error) => error.includes('definitely-missing-cocos-e2e-test-dependency')));
});

test('createCase writes distributed metadata and Cocos automation class', (t) => {
    const projectRoot = createFixtureProject(t);

    const result = scaffold.createCase({
        projectRoot,
        id: 'spin-win',
        title: 'spin win',
        adapter: 'frontend-only',
    });

    assert.deepEqual(result.created.map((entry) => entry.path).sort(), [
        'assets/e2e/spin-win.test.ts',
        'tests/e2e/cases/spin-win.case.json',
    ]);

    const metadata = JSON.parse(readFileSync(resolve(projectRoot, 'tests/e2e/cases/spin-win.case.json'), 'utf8'));
    assert.equal(metadata.id, 'spin-win');
    assert.equal(metadata.automation.scriptName, 'e2e/spin-win.test.ts');
    assert.equal(metadata.automation.className, 'spin_win_e2e');
    assert.equal(metadata.fixture.adapter, 'frontend-only');

    const automation = readFileSync(resolve(projectRoot, 'assets/e2e/spin-win.test.ts'), 'utf8');
    assert.match(automation, /@testClass\('spin_win_e2e'\)/);
    assert.match(automation, /export class SpinWinE2E/);
});

test('createCase rejects unsafe ids and existing files without overwrite', (t) => {
    const projectRoot = createFixtureProject(t);
    scaffold.createCase({ projectRoot, id: 'same-case', title: 'same case' });

    assert.throws(
        () => scaffold.createCase({ projectRoot, id: '../escape', title: 'escape' }),
        /id must only contain/,
    );
    assert.throws(
        () => scaffold.createCase({ projectRoot, id: 'same-case', title: 'same case' }),
        /Refusing to overwrite/,
    );
});

test('refreshCaseIndex lists distributed case files and ignores templates', (t) => {
    const projectRoot = createFixtureProject(t);
    mkdirSync(resolve(projectRoot, 'tests/e2e/cases'), { recursive: true });
    writeFileSync(resolve(projectRoot, 'tests/e2e/cases/_template.case.json'), '{}\n');
    writeFileSync(resolve(projectRoot, 'tests/e2e/cases/b.case.json'), JSON.stringify({
        id: 'b',
        title: 'B case',
        fixture: { adapter: 'frontend-only' },
    }));
    writeFileSync(resolve(projectRoot, 'tests/e2e/cases/a.case.json'), JSON.stringify({
        id: 'a',
        title: 'A case',
        fixture: { adapter: 'demo-backend' },
    }));

    const index = scaffold.refreshCaseIndex({ projectRoot });

    assert.deepEqual(index.cases.map((e2eCase) => e2eCase.id), ['a', 'b']);
    assert.deepEqual(index.cases.map((e2eCase) => e2eCase.adapter), ['demo-backend', 'frontend-only']);
});

test('checkSetup validates the current repository scaffold', () => {
    const result = scaffold.checkSetup({ projectRoot: repoRoot });

    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.deepEqual(result.errors, []);
});

test('extension package metadata messages map to exported methods', () => {
    const packagePath = resolve(repoRoot, 'extensions/cocos-e2e-framework/package.json');
    const mainPath = resolve(repoRoot, 'extensions/cocos-e2e-framework/dist/main.js');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const main = require(mainPath);

    assert.equal(packageJson.package_version, 2);
    assert.equal(packageJson.main, './dist/main.js');
    assert.ok(existsSync(mainPath));

    for (const message of Object.values(packageJson.contributions.messages)) {
        for (const methodName of message.methods) {
            assert.equal(typeof main.methods[methodName], 'function', methodName);
        }
    }
});

test('resolveProjectPath rejects paths escaping the project root', (t) => {
    const projectRoot = createFixtureProject(t);

    assert.throws(
        () => scaffold.resolveProjectPath(projectRoot, '../outside.txt'),
        /inside the project/,
    );
    assert.throws(
        () => scaffold.resolveProjectPath(projectRoot, 'C:/outside.txt'),
        /inside the project/,
    );
});

function createFixtureProject(t) {
    const projectRoot = mkdtempSync(join(tmpdir(), 'cocos-e2e-extension-'));
    t.after(() => rmSync(projectRoot, { recursive: true, force: true }));
    return projectRoot;
}

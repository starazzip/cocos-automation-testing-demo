'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CASES_DIR = 'tests/e2e/cases';
const AUTOMATION_DIR = 'assets/e2e';

const REQUIRED_FILES = [
    'package.json',
    'playwright.config.mjs',
    'tools/automation-server.mjs',
    'tools/cocos-preview-proxy.mjs',
    'tools/cocos-rebuild-preview.mjs',
    'tools/wait-cocos-preview-bundle.mjs',
    'tools/e2e/case-discovery.mjs',
    'tools/e2e/environment-adapters.mjs',
    'tools/e2e/runner-core.mjs',
    CASES_DIR,
    'extensions/automation-framework/package.json',
    'extensions/automation-framework/dist/main.js',
    'extensions/automation-framework/dist/removeTestScripts.js',
];

const REQUIRED_SCRIPTS = {
    'cocos:rebuild-preview': 'node tools/cocos-rebuild-preview.mjs',
    'cocos:wait-preview': 'node tools/wait-cocos-preview-bundle.mjs',
    'test:e2e': 'playwright test',
    'test:e2e:unit': 'node --test tools/e2e/*.test.mjs',
    'test:e2e:ui': 'playwright test --ui',
};

const REQUIRED_DEV_DEPENDENCIES = {
    '@playwright/test': '^1.61.1',
};

const FRAMEWORK_TEMPLATE_ROOT = path.resolve(__dirname, '../templates/project');
const FRAMEWORK_FILES = [
    'tools/automation-server.mjs',
    'tools/cocos-preview-proxy.mjs',
    'tools/cocos-rebuild-preview.mjs',
    'tools/wait-cocos-preview-bundle.mjs',
    'tools/e2e/case-discovery.mjs',
    'tools/e2e/case-discovery.test.mjs',
    'tools/e2e/environment-adapters.mjs',
    'tools/e2e/environment-adapters.test.mjs',
    'tools/e2e/runner-core.mjs',
    'tools/e2e/runner-core.test.mjs',
    'extensions/automation-framework/package.json',
    'extensions/automation-framework/package-lock.json',
    'extensions/automation-framework/README-CN.md',
    'extensions/automation-framework/README-EN.md',
    'extensions/automation-framework/dist/builder.js',
    'extensions/automation-framework/dist/hooks.js',
    'extensions/automation-framework/dist/main.js',
    'extensions/automation-framework/dist/removeTestScripts.js',
    'extensions/automation-framework/i18n/en.js',
    'extensions/automation-framework/i18n/zh.js',
    'extensions/automation-framework/assets/runtime.meta',
    'extensions/automation-framework/assets/runtime/main.ts',
    'extensions/automation-framework/assets/runtime/main.ts.meta',
    'extensions/automation-framework/assets/runtime/test-framework.mjs',
    'extensions/automation-framework/assets/runtime/test-framework.mjs.meta',
];

function initializeFramework(options = {}) {
    const projectRoot = normalizeProjectRoot(options.projectRoot);
    const result = emptyResult();
    const sourceRoot = resolveFrameworkSourceRoot(options);

    applyPackagePatch(projectRoot, options, result);
    copyFrameworkFiles(projectRoot, sourceRoot, options, result);
    for (const file of initialTemplates()) {
        writeProjectFile(projectRoot, file.path, file.content, options, result);
    }

    return result;
}

function createCase(options = {}) {
    const projectRoot = normalizeProjectRoot(options.projectRoot);
    const id = safeCaseId(options.id || 'new-e2e-case');
    const title = nonEmptyString(options.title || titleFromId(id), 'title');
    const adapter = safeName(options.adapter || 'frontend-only', 'adapter');
    const className = safeClassName(options.className || `${id.replace(/[^A-Za-z0-9]/g, '_')}_e2e`);
    const scriptName = safeRelativePath(options.scriptName || `${AUTOMATION_DIR.replace(/^assets\//, '')}/${id}.test.ts`, 'scriptName');
    const result = emptyResult();

    const casePath = `${CASES_DIR}/${id}.case.json`;
    const automationPath = `assets/${scriptName}`;
    assertWritableNewFile(projectRoot, casePath, options);
    assertWritableNewFile(projectRoot, automationPath, options);

    const metadata = {
        id,
        title,
        automation: {
            scriptName,
            className,
        },
        fixture: {
            adapter,
        },
        tags: options.tags || ['sample'],
    };

    writeProjectFile(projectRoot, casePath, `${JSON.stringify(metadata, null, 2)}\n`, options, result);
    writeProjectFile(projectRoot, automationPath, automationTestTemplate({
        className,
        exportedClassName: exportedClassNameFrom(className),
        sceneName: options.sceneName || 'main',
    }), options, result);
    return result;
}

function refreshCaseIndex(options = {}) {
    const projectRoot = normalizeProjectRoot(options.projectRoot);
    const casesDir = resolveProjectPath(projectRoot, CASES_DIR);
    if (!fs.existsSync(casesDir)) {
        return { cases: [] };
    }

    const cases = fs.readdirSync(casesDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => name.endsWith('.case.json') && !name.startsWith('_'))
        .sort()
        .map((name) => {
            const relativePath = `${CASES_DIR}/${name}`;
            try {
                const parsed = JSON.parse(fs.readFileSync(resolveProjectPath(projectRoot, relativePath), 'utf8'));
                return {
                    id: parsed.id || '',
                    title: parsed.title || '',
                    adapter: parsed.fixture?.adapter || '',
                    sourcePath: relativePath,
                };
            } catch (error) {
                return {
                    id: '',
                    title: '',
                    adapter: '',
                    sourcePath: relativePath,
                    error: error.message,
                };
            }
        });

    return { cases };
}

function checkSetup(options = {}) {
    const projectRoot = normalizeProjectRoot(options.projectRoot);
    const errors = [];
    const warnings = [];
    const files = [];

    for (const relativePath of REQUIRED_FILES) {
        const target = resolveProjectPath(projectRoot, relativePath);
        const exists = fs.existsSync(target);
        files.push({ path: relativePath, exists });
        if (!exists) {
            errors.push(`Missing required file or directory: ${relativePath}`);
        }
    }

    const e2eSpecExists = fs.existsSync(resolveProjectPath(projectRoot, 'tests/e2e/cocos-e2e.spec.mjs'))
        || fs.existsSync(resolveProjectPath(projectRoot, 'tests/e2e/cocos-slot.spec.mjs'));
    if (!e2eSpecExists) {
        errors.push('Missing Playwright E2E spec: tests/e2e/cocos-e2e.spec.mjs');
    }

    const automationFrameworkMainPath = resolveProjectPath(projectRoot, 'extensions/automation-framework/dist/main.js');
    if (fs.existsSync(automationFrameworkMainPath)) {
        const loadError = requireCommonJsFile(automationFrameworkMainPath);
        if (loadError) {
            errors.push(`automation-framework extension cannot load: ${loadError.message}`);
        }
    }

    const packagePath = resolveProjectPath(projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            for (const [name, command] of Object.entries(REQUIRED_SCRIPTS)) {
                if (packageJson.scripts?.[name] !== command) {
                    warnings.push(`package.json script "${name}" is missing or differs from the scaffold default`);
                }
            }
            for (const name of Object.keys(REQUIRED_DEV_DEPENDENCIES)) {
                if (!packageJson.devDependencies?.[name] && !packageJson.dependencies?.[name]) {
                    errors.push(`Missing npm dependency: ${name}`);
                }
            }
        } catch (error) {
            errors.push(`package.json is not valid JSON: ${error.message}`);
        }
    }

    return {
        ok: errors.length === 0,
        errors,
        warnings,
        files,
    };
}

function initialTemplates() {
    return [
        {
            path: 'playwright.config.mjs',
            content: playwrightConfigTemplate(),
        },
        {
            path: 'tests/e2e/cocos-e2e.spec.mjs',
            content: playwrightSpecTemplate(),
        },
        {
            path: 'tests/e2e/cases/_template.case.json',
            content: `${JSON.stringify({
                id: 'my-e2e-case',
                title: 'short readable test title',
                automation: {
                    scriptName: 'e2e/my-e2e-case.test.ts',
                    className: 'my_e2e_case',
                },
                fixture: {
                    adapter: 'frontend-only',
                },
                tags: ['sample'],
            }, null, 2)}\n`,
        },
        {
            path: 'tools/e2e/project-environment-adapters.mjs',
            content: projectEnvironmentAdaptersTemplate(),
        },
        {
            path: 'assets/e2e/_template-e2e.test.ts',
            content: automationTestTemplate({
                className: 'my_e2e_case',
                exportedClassName: 'MyE2ECase',
                sceneName: 'main',
            }),
        },
    ];
}

function applyPackagePatch(projectRoot, options, result) {
    const packagePath = resolveProjectPath(projectRoot, 'package.json');
    let packageJson = {
        scripts: {},
        devDependencies: {},
    };
    let exists = fs.existsSync(packagePath);

    if (exists) {
        try {
            packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        } catch (error) {
            result.errors.push(`package.json is not valid JSON: ${error.message}`);
            return;
        }
    }

    packageJson.scripts = packageJson.scripts || {};
    packageJson.devDependencies = packageJson.devDependencies || {};

    let changed = !exists;
    for (const [name, command] of Object.entries(REQUIRED_SCRIPTS)) {
        if (!packageJson.scripts[name]) {
            packageJson.scripts[name] = command;
            changed = true;
        }
    }
    for (const [name, version] of Object.entries(REQUIRED_DEV_DEPENDENCIES)) {
        if (!packageJson.dependencies?.[name] && !packageJson.devDependencies[name]) {
            packageJson.devDependencies[name] = version;
            changed = true;
        }
    }

    if (!changed) {
        result.skipped.push({ path: 'package.json', reason: 'already configured' });
        return;
    }
    if (options.dryRun) {
        result.updated.push({ path: 'package.json', dryRun: true });
        return;
    }

    fs.mkdirSync(path.dirname(packagePath), { recursive: true });
    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    result[exists ? 'updated' : 'created'].push({ path: 'package.json' });
}

function copyFrameworkFiles(projectRoot, sourceRoot, options, result) {
    for (const relativePath of FRAMEWORK_FILES) {
        const source = resolveSourcePath(sourceRoot, relativePath);
        if (!fs.existsSync(source)) {
            result.errors.push(`Framework template is missing: ${relativePath}`);
            continue;
        }
        writeProjectFile(projectRoot, relativePath, fs.readFileSync(source), options, result);
    }
}

function writeProjectFile(projectRoot, relativePath, content, options, result) {
    const target = resolveProjectPath(projectRoot, relativePath);
    const exists = fs.existsSync(target);

    if (exists && !options.overwrite) {
        result.skipped.push({ path: relativePath, reason: 'exists' });
        return;
    }
    if (options.dryRun) {
        result[exists ? 'updated' : 'created'].push({ path: relativePath, dryRun: true });
        return;
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    result[exists ? 'updated' : 'created'].push({ path: relativePath });
}

function resolveFrameworkSourceRoot(options = {}) {
    const roots = [
        options.frameworkSourceRoot,
        process.env.COCOS_E2E_FRAMEWORK_SOURCE,
        FRAMEWORK_TEMPLATE_ROOT,
    ].filter(Boolean);

    for (const root of roots) {
        const normalized = path.resolve(root);
        if (fs.existsSync(resolveSourcePath(normalized, 'tools/e2e/runner-core.mjs'))) {
            return normalized;
        }
    }
    throw new Error('Cannot find Cocos E2E framework templates. Reinstall the cocos-e2e-framework extension or pass frameworkSourceRoot.');
}

function resolveSourcePath(sourceRoot, relativePath) {
    const safePath = safeRelativePath(relativePath, 'source path');
    const root = path.resolve(sourceRoot);
    const target = path.resolve(root, safePath);
    const relative = path.relative(root, target);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Source path must stay inside framework template root: ${relativePath}`);
    }
    return target;
}

function assertWritableNewFile(projectRoot, relativePath, options) {
    const target = resolveProjectPath(projectRoot, relativePath);
    if (fs.existsSync(target) && !options.overwrite) {
        throw new Error(`Refusing to overwrite existing file: ${relativePath}`);
    }
}

function resolveProjectPath(projectRoot, relativePath) {
    const safePath = safeRelativePath(relativePath, 'path');
    const root = normalizeProjectRoot(projectRoot);
    const target = path.resolve(root, safePath);
    const relative = path.relative(root, target);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Path must stay inside project root: ${relativePath}`);
    }
    return target;
}

function requireCommonJsFile(filePath) {
    let resolved = '';
    try {
        resolved = require.resolve(filePath);
        delete require.cache[resolved];
        require(resolved);
        return null;
    } catch (error) {
        return error;
    } finally {
        if (resolved) {
            delete require.cache[resolved];
        }
    }
}

function normalizeProjectRoot(projectRoot) {
    const root = projectRoot || process.cwd();
    if (typeof root !== 'string' || root.trim() === '') {
        throw new Error('projectRoot must be a non-empty string');
    }
    return path.resolve(root);
}

function safeRelativePath(value, field) {
    const text = nonEmptyString(value, field).replace(/\\/g, '/');
    if (text.startsWith('/') || /^[A-Za-z]:/.test(text) || text.split('/').includes('..')) {
        throw new Error(`${field} must be a relative path inside the project`);
    }
    return text;
}

function safeCaseId(value) {
    const id = safeName(value, 'id');
    if (!/^[A-Za-z0-9._-]+$/.test(id)) {
        throw new Error('id must only contain letters, numbers, dot, underscore, or dash');
    }
    return id;
}

function safeName(value, field) {
    return nonEmptyString(value, field).trim();
}

function safeClassName(value) {
    const className = safeName(value, 'className');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(className)) {
        throw new Error('className must be a valid TypeScript identifier');
    }
    return className;
}

function nonEmptyString(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${field} must be a non-empty string`);
    }
    return value;
}

function titleFromId(id) {
    return id.replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function exportedClassNameFrom(className) {
    const name = className
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((part) => part.toLowerCase() === 'e2e'
            ? 'E2E'
            : `${part[0].toUpperCase()}${part.slice(1)}`)
        .join('');
    return /^[A-Za-z_]/.test(name) ? name : `E2E${name}`;
}

function emptyResult() {
    return {
        created: [],
        updated: [],
        skipped: [],
        errors: [],
    };
}

function playwrightConfigTemplate() {
    return `import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  reporter: [['list']],
  use: {
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
});
`;
}

function playwrightSpecTemplate() {
    return `import { test } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverE2ECases } from '../../tools/e2e/case-discovery.mjs';
import { createProjectEnvironmentAdapters, resolveEnvironmentAdapter } from '../../tools/e2e/project-environment-adapters.mjs';
import { runCocosE2ECase } from '../../tools/e2e/runner-core.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = discoverE2ECases(repoRoot);
const environmentAdapters = createProjectEnvironmentAdapters();

for (const e2eCase of cases) {
  test(\`Cocos E2E: \${e2eCase.title}\`, async ({ page }, testInfo) => {
    const environment = resolveEnvironmentAdapter(e2eCase, environmentAdapters, {
      defaultAdapter: 'frontend-only',
    });
    await runCocosE2ECase({
      page,
      testInfo,
      repoRoot,
      e2eCase,
      environment,
    });
  });
}
`;
}

function projectEnvironmentAdaptersTemplate() {
    return `import {
    createFrontendOnlyAdapter,
    resolveEnvironmentAdapter,
} from './environment-adapters.mjs';

export { resolveEnvironmentAdapter };

export function createProjectEnvironmentAdapters() {
    return {
        'frontend-only': createFrontendOnlyAdapter(),
    };
}
`;
}

function automationTestTemplate({ className, exportedClassName, sceneName }) {
    return `import { director } from 'cc';
// @ts-ignore
import { expect, runScene, testCase, testClass, waitForNextFrame } from 'db://automation-framework/runtime/test-framework.mjs';

@runScene('${sceneName}')
@testClass('${className}')
export class ${exportedClassName} {
    @testCase
    async sceneLoads() {
        await waitForNextFrame();
        expect(director.getScene(), 'scene should be loaded').to.not.equal(null);
    }
}
`;
}

module.exports = {
    REQUIRED_DEV_DEPENDENCIES,
    FRAMEWORK_FILES,
    REQUIRED_FILES,
    REQUIRED_SCRIPTS,
    checkSetup,
    createCase,
    initializeFramework,
    refreshCaseIndex,
    requireCommonJsFile,
    resolveFrameworkSourceRoot,
    resolveProjectPath,
};

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, relative, resolve, sep } from 'node:path';

import { validateE2ECase } from './runner-core.mjs';

export const DEFAULT_CASES_DIR = 'tests/e2e/cases';
export const DEFAULT_SCRIPT_ROOT = 'assets';
export const CASE_FILE_SUFFIX = '.case.json';

export function discoverE2ECases(repoRoot, options = {}) {
    const casesDir = resolve(repoRoot, options.casesDir ?? DEFAULT_CASES_DIR);
    if (!existsSync(casesDir)) {
        return [];
    }

    const files = readdirSync(casesDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => name.endsWith(CASE_FILE_SUFFIX) && !name.startsWith('_'))
        .sort()
        .map((name) => resolve(casesDir, name));

    const seenIds = new Map();
    const cases = files.map((filePath) => {
        const e2eCase = readCaseFile(repoRoot, filePath, options);
        const previousPath = seenIds.get(e2eCase.id);
        if (previousPath) {
            throw caseError(filePath, `duplicate case id "${e2eCase.id}" already defined in ${previousPath}`);
        }
        seenIds.set(e2eCase.id, e2eCase.sourcePath);
        return e2eCase;
    });

    return cases.sort((left, right) => left.id.localeCompare(right.id));
}

export function createPreviewBundlePatterns(cases) {
    const patterns = new Set();
    for (const e2eCase of cases) {
        const validCase = validateE2ECase(e2eCase);
        patterns.add(validCase.scriptName);
        for (const className of validCase.classNames) {
            patterns.add(className);
        }
    }
    return [...patterns].sort();
}

function readCaseFile(repoRoot, filePath, options) {
    let parsed;
    try {
        parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw caseError(filePath, `invalid JSON: ${error.message}`);
    }
    validateCaseObject(parsed, filePath);

    const automation = parsed.automation ?? {};
    const classNames = normalizeClassNames(parsed, automation, filePath);
    const scriptName = normalizeRelativePath(requiredString(automation.scriptName ?? parsed.scriptName, 'automation.scriptName', filePath), 'automation.scriptName', filePath);
    validateScriptExists(repoRoot, scriptName, filePath, options);

    const normalized = validateE2ECase({
        id: requiredString(parsed.id, 'id', filePath),
        title: requiredString(parsed.title, 'title', filePath),
        scriptName,
        classNames,
        tags: normalizeTags(parsed.tags, filePath),
        sourcePath: normalizePath(relative(repoRoot, filePath)),
    });

    return {
        ...normalized,
        className: normalized.classNames.length === 1 ? normalized.classNames[0] : undefined,
    };
}

function validateCaseObject(value, filePath) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw caseError(filePath, 'case metadata must be a JSON object');
    }
}

function normalizeClassNames(parsed, automation, filePath) {
    const rawClassNames = automation.classNames ?? parsed.classNames;
    if (Array.isArray(rawClassNames)) {
        if (rawClassNames.length === 0) {
            throw caseError(filePath, 'automation.classNames must not be empty');
        }
        return rawClassNames.map((className) => requiredString(className, 'automation.classNames[]', filePath));
    }
    return [requiredString(automation.className ?? parsed.className, 'automation.className', filePath)];
}

function normalizeTags(tags, filePath) {
    if (tags === undefined) {
        return [];
    }
    if (!Array.isArray(tags)) {
        throw caseError(filePath, 'tags must be an array of strings');
    }
    return tags.map((tag) => requiredString(tag, 'tags[]', filePath));
}

function validateScriptExists(repoRoot, scriptName, filePath, options) {
    const scriptRoot = resolve(repoRoot, options.scriptRoot ?? DEFAULT_SCRIPT_ROOT);
    const scriptPath = resolve(scriptRoot, scriptName);
    if (!isInside(scriptRoot, scriptPath)) {
        throw caseError(filePath, `automation.scriptName "${scriptName}" must stay inside ${normalizePath(relative(repoRoot, scriptRoot))}`);
    }
    if (!existsSync(scriptPath)) {
        throw caseError(filePath, `automation script "${scriptName}" was not found under ${normalizePath(relative(repoRoot, scriptRoot))}`);
    }
}

function requiredString(value, field, filePath) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw caseError(filePath, `missing required string field "${field}"`);
    }
    return value.trim();
}

function normalizeRelativePath(value, field, filePath) {
    const normalized = normalizePath(value);
    if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized) || normalized.split('/').includes('..')) {
        throw caseError(filePath, `${field} must be a relative path inside the configured script root`);
    }
    return normalized;
}

function isInside(root, target) {
    const relativePath = relative(root, target);
    return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith(sep));
}

function normalizePath(value) {
    return value.replace(/\\/g, '/');
}

function caseError(filePath, message) {
    return new Error(`${normalizePath(filePath)}: ${message}`);
}

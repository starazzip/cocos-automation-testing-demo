'use strict';

const {
    checkSetup,
    createCase,
    initializeFramework,
    refreshCaseIndex,
} = require('./scaffold');

function projectRootFrom(options) {
    if (options && typeof options.projectRoot === 'string' && options.projectRoot.trim() !== '') {
        return options.projectRoot;
    }
    if (global.Editor && Editor.Project && typeof Editor.Project.path === 'string') {
        return Editor.Project.path;
    }
    return process.cwd();
}

function withProjectRoot(options) {
    return {
        ...(options || {}),
        projectRoot: projectRootFrom(options),
    };
}

function logResult(action, result) {
    const summary = [
        `created=${result.created?.length || 0}`,
        `updated=${result.updated?.length || 0}`,
        `skipped=${result.skipped?.length || 0}`,
        `errors=${result.errors?.length || 0}`,
    ].join(' ');
    console.log(`[Cocos E2E Framework] ${action}: ${summary}`);
}

exports.methods = {
    initFramework(options = {}) {
        const result = initializeFramework(withProjectRoot(options));
        logResult('initFramework', result);
        return result;
    },

    createCase(options = {}) {
        const result = createCase(withProjectRoot(options));
        logResult('createCase', result);
        return result;
    },

    refreshCaseIndex(options = {}) {
        const result = refreshCaseIndex(withProjectRoot(options));
        console.log(`[Cocos E2E Framework] refreshCaseIndex: cases=${result.cases.length}`);
        return result;
    },

    checkSetup(options = {}) {
        const result = checkSetup(withProjectRoot(options));
        console.log(`[Cocos E2E Framework] checkSetup: ok=${result.ok} errors=${result.errors.length} warnings=${result.warnings.length}`);
        return result;
    },
};

exports.load = function load() {
    console.log('[Cocos E2E Framework] extension loaded');
};

exports.unload = function unload() {};

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const fs = require('node:fs');

function processJudge(processLike) {
    const argv = Array.isArray(processLike?.argv) ? processLike.argv : [];
    const requiredArgs = ['--project', '--testConfig', '--platformIndex', '--build', 'configPath'];
    let matchedCount = 0;

    if (argv.length < 9) {
        return false;
    }

    for (const requiredArg of requiredArgs) {
        for (const arg of argv) {
            if (String(arg).includes(requiredArg)) {
                matchedCount += 1;
            }
        }
    }

    return matchedCount === requiredArgs.length;
}

function getArgv(name) {
    const index = process.argv.indexOf(name);
    return index === -1 ? '' : process.argv[index + 1] || '';
}

function readJsonSync(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonSync(filePath, value) {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function updataJsonObject(target, key, patch) {
    const firstPatchKey = Object.keys(patch)[0];

    if (Object.prototype.hasOwnProperty.call(target, key)) {
        if (JSON.stringify(target[key][firstPatchKey]) !== JSON.stringify(patch[firstPatchKey])) {
            target[key] = Object.assign(target[key], patch);
        } else {
            console.log('no changes required');
        }
    } else {
        console.log(`field ${key} does not exist`);
    }

    return target;
}

async function startTest(processLike, packageName) {
    const autoTestEnabled = processJudge(processLike);
    const automationPackage = {
        'automation-framework': {
            AutoTest: '',
            __version__: '1.0.0',
        },
    };
    const argv = Array.isArray(processLike?.argv) ? processLike.argv : [];
    const lastArg = String(argv[argv.length - 1] || '');

    if (!autoTestEnabled && globalThis.Editor?.Panel?.has) {
        if (!(await globalThis.Editor.Panel.has(packageName))) {
            console.log('developer open panel');
        }
    }

    if (!lastArg.includes('configPath')) {
        return;
    }

    const configPath = lastArg.split('=')[1];
    if (!configPath) {
        return;
    }

    const config = readJsonSync(configPath);
    updataJsonObject(config, 'packages', automationPackage);

    if (config.packages?.[packageName]) {
        config.packages[packageName].AutoTest = autoTestEnabled;
    }

    writeJsonSync(configPath, config);
}

exports.getArgv = getArgv;
exports.processJudge = processJudge;
exports.startTest = startTest;
exports.updataJsonObject = updataJsonObject;

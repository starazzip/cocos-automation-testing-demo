import { basename, dirname, extname, resolve } from 'node:path';
import { appendFileSync, createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { get } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

import {
    mergeEnvironmentAdapterOptions,
    normalizeEnvironmentAdapter,
    setupEnvironmentAdapter,
    teardownEnvironmentAdapter,
} from './environment-adapters.mjs';

const DEFAULT_TEMP_ROOT = 'temp/vscode-e2e';
const DEFAULT_AUTOMATION_PORT = 8000;
const DEFAULT_PREVIEW_PROXY_PORT = 7457;
const DEFAULT_RUN_ARTIFACT_FILES = [
    'testConfig.json',
    'automation-server.log',
    'preview-proxy.log',
    'preview-prepare.log',
    'backend.log',
    'cleanup.log',
];

export function validateE2ECase(e2eCase) {
    if (!e2eCase || typeof e2eCase !== 'object') {
        throw new Error('E2E case must be an object');
    }

    const id = requiredString(e2eCase, 'id');
    if (!/^[A-Za-z0-9._-]+$/.test(id)) {
        throw new Error(`E2E case id "${id}" must only contain letters, numbers, dot, underscore, or dash`);
    }

    const classNames = Array.isArray(e2eCase.classNames)
        ? e2eCase.classNames.map((className) => assertNonEmptyString(className, 'classNames[]'))
        : [requiredString(e2eCase, 'className')];

    return {
        ...e2eCase,
        id,
        title: requiredString(e2eCase, 'title'),
        scriptName: requiredString(e2eCase, 'scriptName'),
        classNames,
    };
}

export function createAutomationTestConfig(e2eCase, options = {}) {
    const validCase = validateE2ECase(e2eCase);
    const localServer = {
        ip: '127.0.0.1',
        port: DEFAULT_AUTOMATION_PORT,
        timeout: 5000,
        ...(options.localServer ?? {}),
    };

    return {
        jobId: `${options.jobPrefix ?? 'cocos-e2e'}-${validCase.id}`,
        localServer,
        platforms: [
            {
                platformIndex: options.platformIndex ?? 0,
                testScripts: [
                    {
                        scriptName: validCase.scriptName,
                        classNames: validCase.classNames,
                    },
                ],
            },
        ],
    };
}

export function createRunPaths(repoRoot, e2eCase, options = {}) {
    const validCase = validateE2ECase(e2eCase);
    const tempRoot = options.tempRoot ?? DEFAULT_TEMP_ROOT;
    const runDir = resolve(repoRoot, tempRoot, validCase.id);

    return {
        runDir,
        testConfigPath: resolve(runDir, 'testConfig.json'),
        logPath(fileName) {
            return resolve(runDir, fileName);
        },
    };
}

export async function runCocosE2ECase({
    page,
    testInfo,
    repoRoot,
    e2eCase,
    environment = {},
    options = {},
}) {
    const validCase = validateE2ECase(e2eCase);
    const environmentAdapter = normalizeEnvironmentAdapter(environment);
    const settings = createRunnerSettings(mergeEnvironmentAdapterOptions(options, environmentAdapter));
    const runPaths = createRunPaths(repoRoot, validCase, { tempRoot: settings.tempRoot });

    rmSync(runPaths.runDir, { recursive: true, force: true });
    mkdirSync(runPaths.runDir, { recursive: true });

    const testConfig = createAutomationTestConfig(validCase, {
        ...settings.testConfig,
        localServer: {
            ip: '127.0.0.1',
            port: settings.automation.port,
            timeout: 5000,
            ...(settings.testConfig.localServer ?? {}),
        },
    });
    writeFileSync(runPaths.testConfigPath, JSON.stringify(testConfig, null, 2));

    const processes = [];
    const context = {
        repoRoot,
        e2eCase: validCase,
        runPaths,
        settings,
        environment: environmentAdapter,
        startManagedProcess(command, args, processOptions) {
            const child = startProcess(command, args, processOptions);
            processes.push(child);
            return child;
        },
        registerProcess(child) {
            processes.push(child);
            return child;
        },
        startProcess,
        waitForHttp,
        waitForHttpUnavailable,
        runCommand,
        delay,
    };

    let runError;
    try {
        await waitForUnavailableUrls([
            ...environmentAdapter.unavailableUrls,
            settings.automation.summaryUrl,
            settings.previewProxy.testConfigUrl,
        ], settings.unavailableTimeoutMs);

        processes.push(...collectProcesses(await setupEnvironmentAdapter(environmentAdapter, context)));

        processes.push(startProcess(settings.automation.command, settings.automation.args, {
            cwd: repoRoot,
            env: {
                AUTOMATION_PORT: String(settings.automation.port),
                ...settings.automation.env,
            },
            logPath: runPaths.logPath(settings.automation.logFile),
        }));
        await waitForHttp(settings.automation.summaryUrl, settings.automation.startupTimeoutMs);

        processes.push(startProcess(settings.previewProxy.command, settings.previewProxy.args, {
            cwd: repoRoot,
            env: {
                TEST_CONFIG: runPaths.testConfigPath,
                COCOS_PROXY_PORT: String(settings.previewProxy.port),
                ...settings.previewProxy.env,
            },
            logPath: runPaths.logPath(settings.previewProxy.logFile),
        }));
        await waitForHttp(settings.previewProxy.testConfigUrl, settings.previewProxy.startupTimeoutMs);

        if (settings.preview.prepareCommand && process.env[settings.preview.prepareSkipEnv] !== '1') {
            await runCommand(settings.preview.prepareCommand, settings.preview.prepareArgs, {
                cwd: repoRoot,
                logPath: runPaths.logPath(settings.preview.prepareLogFile),
                timeoutMs: settings.preview.prepareTimeoutMs,
            });
        }

        const visualMode = process.env[settings.visual.enabledEnv] === '1';
        await page.goto(createPreviewUrl(settings.previewProxy.baseUrl, {
            visualMode,
            urlParams: settings.preview.urlParams,
        }), {
            waitUntil: 'domcontentloaded',
            timeout: settings.preview.gotoTimeoutMs,
        });

        const summary = await waitForAutomationSummary(settings.automation.summaryUrl, settings.automation.summaryTimeoutMs);
        await attachAutomationSummary(testInfo, summary);
        assertAutomationSummaryPassed(summary);

        if (visualMode) {
            await delay(Number(process.env[settings.visual.holdEnv] ?? settings.visual.defaultHoldMs));
        }
    } catch (error) {
        runError = error;
    } finally {
        const cleanupResults = await stopManagedProcesses(processes);
        let teardownError;
        try {
            await teardownEnvironmentAdapter(environmentAdapter, context);
        } catch (error) {
            teardownError = error;
            if (!runError) {
                runError = error;
            }
        }
        writeCleanupLog(runPaths, cleanupResults, teardownError);
        if ((runError && settings.artifacts.attachOnFailure) || settings.artifacts.attachOnSuccess) {
            try {
                await attachRunArtifacts(testInfo, runPaths, settings.artifacts);
            } catch (error) {
                appendCleanupLog(runPaths, [`artifactAttachError=${errorMessage(error)}`]);
                if (!runError) {
                    runError = error;
                }
            }
        }
    }

    if (runError) {
        throw runError;
    }
}

export function createPreviewUrl(baseUrl, options = {}) {
    const searchParams = new URLSearchParams({ automation: '1' });
    for (const [key, value] of Object.entries(options.urlParams ?? {})) {
        searchParams.set(key, String(value));
    }
    if (options.visualMode) {
        searchParams.set('visual', '1');
    }
    return `${baseUrl}?${searchParams.toString()}`;
}

export async function waitForAutomationSummary(summaryUrl, timeoutMs) {
    const startedAt = Date.now();
    let lastSummary = null;
    while (Date.now() - startedAt < timeoutMs) {
        lastSummary = JSON.parse(await httpGet(summaryUrl));
        if (lastSummary.ended || lastSummary.failed) {
            return lastSummary;
        }
        await delay(500);
    }
    throw new Error(`Cocos automation did not finish within ${timeoutMs}ms. Last summary: ${JSON.stringify(lastSummary, null, 2)}`);
}

export function assertAutomationSummaryPassed(summary) {
    if (summary?.ended !== true) {
        throw new Error(`Cocos automation did not end.\n${formatAutomationLogs(summary)}`);
    }
    if (summary?.failed === true) {
        throw new Error(`Cocos automation failed.\n${formatAutomationLogs(summary)}`);
    }
}

export function formatAutomationLogs(summary, limit = 30) {
    return (summary?.logs ?? [])
        .map((entry) => JSON.stringify(entry))
        .slice(-limit)
        .join('\n');
}

export function listRunArtifacts(runPaths, options = {}) {
    const runDir = typeof runPaths === 'string' ? runPaths : runPaths.runDir;
    if (!runDir || !existsSync(runDir)) {
        return [];
    }

    const maxBytes = options.maxBytes ?? 5 * 1024 * 1024;
    const extensions = new Set(options.extensions ?? ['.json', '.log', '.txt']);
    return readdirSync(runDir)
        .map((fileName) => {
            const filePath = resolve(runDir, fileName);
            const stat = statSync(filePath);
            return { name: fileName, path: filePath, size: stat.size, isFile: stat.isFile() };
        })
        .filter((artifact) => artifact.isFile)
        .filter((artifact) => artifact.size <= maxBytes)
        .filter((artifact) => extensions.has(extname(artifact.name).toLowerCase()))
        .map(({ name, path, size }) => ({ name, path, size }))
        .sort((left, right) => left.name.localeCompare(right.name));
}

export function collectRunArtifacts(runPaths, fileNames = DEFAULT_RUN_ARTIFACT_FILES) {
    const runDir = typeof runPaths === 'string' ? runPaths : runPaths.runDir;
    if (!runDir || !existsSync(runDir)) {
        return [];
    }
    return fileNames
        .map((fileName) => {
            const filePath = resolve(runDir, fileName);
            if (!existsSync(filePath) || !statSync(filePath).isFile()) {
                return undefined;
            }
            return {
                name: fileName,
                path: filePath,
                contentType: artifactContentType(fileName),
            };
        })
        .filter(Boolean);
}

export function formatCleanupErrors(errors) {
    return [
        'Cocos E2E cleanup failed:',
        ...errors.map((error) => `- ${error instanceof Error ? error.message : String(error)}`),
    ].join('\n');
}

export function startProcess(command, args, options = {}) {
    const out = createLogStream(options.logPath);
    const child = spawn(command, args, {
        cwd: options.cwd ?? process.cwd(),
        env: { ...process.env, ...(options.env ?? {}) },
        shell: process.platform === 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.e2eProcessName = options.name ?? `${command} ${args.join(' ')}`.trim();
    child.stdout.pipe(out, { end: false });
    child.stderr.pipe(out, { end: false });
    child.on('exit', (code, signal) => {
        out.write(`\n[exit code=${code} signal=${signal}]\n`);
        out.end();
    });
    return child;
}

export async function runCommand(command, args, options = {}) {
    const child = startProcess(command, args, options);
    const timeoutMs = options.timeoutMs ?? 30000;
    const result = await waitForProcess(child, timeoutMs);
    if (result.code !== 0) {
        throw new Error(`${command} ${args.join(' ')} failed with code ${result.code}. See ${options.logPath}`);
    }
}

export function waitForHttp(url, timeoutMs) {
    return waitForUrl(url, timeoutMs, true);
}

export function waitForHttpUnavailable(url, timeoutMs) {
    return waitForUrl(url, timeoutMs, false);
}

export function httpGet(url) {
    return new Promise((resolve, reject) => {
        get(url, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                if ((response.statusCode ?? 500) >= 400) {
                    reject(new Error(`${url} returned ${response.statusCode}: ${body}`));
                    return;
                }
                resolve(body);
            });
        }).on('error', reject);
    });
}

async function waitForUnavailableUrls(urls, timeoutMs) {
    for (const url of urls) {
        await waitForHttpUnavailable(url, timeoutMs);
    }
}

async function waitForUrl(url, timeoutMs, reachable) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        try {
            await httpGet(url);
            if (reachable) {
                return;
            }
        } catch {
            if (!reachable) {
                return;
            }
        }
        await delay(reachable ? 500 : 250);
    }

    if (reachable) {
        throw new Error(`${url} was not reachable within ${timeoutMs}ms`);
    }
    throw new Error(`${url} is still reachable after ${timeoutMs}ms`);
}

function waitForProcess(child, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            void stopProcess(child);
            reject(new Error(`process timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        child.on('exit', (code, signal) => {
            clearTimeout(timer);
            resolve({ code, signal });
        });
    });
}

async function stopManagedProcesses(processes) {
    const results = [];
    for (const child of processes.reverse()) {
        results.push(await stopProcess(child));
    }
    return results;
}

function stopProcess(child) {
    const result = {
        name: child.e2eProcessName ?? `pid ${child.pid}`,
        pid: child.pid,
        exitCode: child.exitCode,
        signalCode: child.signalCode,
        exited: child.exitCode !== null,
        stopped: false,
        timedOut: false,
    };
    if (child.exitCode !== null) {
        return Promise.resolve(result);
    }
    if (process.platform === 'win32') {
        const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { shell: true, stdio: 'ignore' });
        return waitForProcessExit(killer, 5000).then(async (killerResult) => {
            const exitResult = await waitForProcessExit(child, 5000);
            return {
                ...result,
                exitCode: child.exitCode,
                signalCode: child.signalCode,
                exited: exitResult.exited,
                stopped: exitResult.exited,
                timedOut: exitResult.timedOut,
                killCommand: killerResult,
            };
        });
    }
    child.kill('SIGTERM');
    return waitForProcessExit(child, 5000).then((exitResult) => ({
        ...result,
        exitCode: child.exitCode,
        signalCode: child.signalCode,
        exited: exitResult.exited,
        stopped: exitResult.exited,
        timedOut: exitResult.timedOut,
    }));
}

export function waitForProcessExit(child, timeoutMs) {
    return new Promise((resolve) => {
        if (child.exitCode !== null) {
            resolve({
                exited: true,
                timedOut: false,
                exitCode: child.exitCode,
                signalCode: child.signalCode,
            });
            return;
        }

        const onExit = (code, signal) => {
            clearTimeout(timer);
            resolve({
                exited: true,
                timedOut: false,
                exitCode: code,
                signalCode: signal,
            });
        };

        const timer = setTimeout(() => {
            child.off?.('exit', onExit);
            resolve({
                exited: child.exitCode !== null,
                timedOut: child.exitCode === null,
                exitCode: child.exitCode,
                signalCode: child.signalCode,
            });
        }, timeoutMs);
        child.once('exit', onExit);
    });
}

function createLogStream(logPath) {
    mkdirSync(dirname(logPath), { recursive: true });
    return createWriteStream(logPath, { flags: 'a' });
}

function writeCleanupLog(runPaths, cleanupResults, teardownError) {
    const lines = [
        `cleanupAt=${new Date().toISOString()}`,
        ...cleanupResults.map((result) => JSON.stringify(result)),
    ];
    if (teardownError) {
        lines.push(`teardownError=${teardownError instanceof Error ? teardownError.message : String(teardownError)}`);
    }
    writeFileSync(runPaths.logPath('cleanup.log'), `${lines.join('\n')}\n`);
}

function appendCleanupLog(runPaths, lines) {
    appendFileSync(runPaths.logPath('cleanup.log'), `${lines.join('\n')}\n`);
}

function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

function createRunnerSettings(options) {
    const automationPort = options.automation?.port ?? DEFAULT_AUTOMATION_PORT;
    const previewProxyPort = options.previewProxy?.port ?? DEFAULT_PREVIEW_PROXY_PORT;

    return {
        tempRoot: options.tempRoot ?? DEFAULT_TEMP_ROOT,
        unavailableTimeoutMs: options.unavailableTimeoutMs ?? 5000,
        testConfig: options.testConfig ?? {},
        automation: {
            command: 'node',
            args: ['tools/automation-server.mjs'],
            port: automationPort,
            summaryUrl: `http://127.0.0.1:${automationPort}/summary`,
            startupTimeoutMs: 10000,
            summaryTimeoutMs: 90000,
            logFile: 'automation-server.log',
            env: {},
            ...(options.automation ?? {}),
        },
        previewProxy: {
            command: 'node',
            args: ['tools/cocos-preview-proxy.mjs'],
            port: previewProxyPort,
            baseUrl: `http://127.0.0.1:${previewProxyPort}`,
            testConfigUrl: `http://127.0.0.1:${previewProxyPort}/testConfig.json`,
            startupTimeoutMs: 10000,
            logFile: 'preview-proxy.log',
            env: {},
            ...(options.previewProxy ?? {}),
        },
        preview: {
            prepareCommand: undefined,
            prepareArgs: [],
            prepareSkipEnv: 'E2E_SKIP_PREVIEW_PREPARE',
            prepareLogFile: 'preview-prepare.log',
            prepareTimeoutMs: 90000,
            gotoTimeoutMs: 30000,
            urlParams: {},
            ...(options.preview ?? {}),
        },
        visual: {
            enabledEnv: 'E2E_VISUAL',
            holdEnv: 'E2E_HOLD_MS',
            defaultHoldMs: 10000,
            ...(options.visual ?? {}),
        },
        artifacts: {
            attachOnFailure: true,
            attachOnSuccess: false,
            maxBytes: 5 * 1024 * 1024,
            ...(options.artifacts ?? {}),
        },
    };
}

function collectProcesses(setupResult) {
    if (!setupResult) {
        return [];
    }
    if (Array.isArray(setupResult)) {
        return setupResult;
    }
    if (Array.isArray(setupResult.processes)) {
        return setupResult.processes;
    }
    return [setupResult];
}

async function attachAutomationSummary(testInfo, summary) {
    if (!testInfo?.attach) {
        return;
    }
    await testInfo.attach('automation-summary', {
        body: JSON.stringify(summary, null, 2),
        contentType: 'application/json',
    });
}

async function attachRunArtifacts(testInfo, runPaths, options = {}) {
    if (!testInfo?.attach) {
        return;
    }
    for (const artifact of listRunArtifacts(runPaths, options)) {
        await testInfo.attach(`e2e-artifact:${basename(artifact.name)}`, {
            path: artifact.path,
            contentType: artifactContentType(artifact.name),
        });
    }
}

function artifactContentType(fileName) {
    return extname(fileName).toLowerCase() === '.json'
        ? 'application/json'
        : 'text/plain';
}

function requiredString(source, field) {
    return assertNonEmptyString(source[field], field);
}

function assertNonEmptyString(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`E2E case is missing required string field "${field}"`);
    }
    return value.trim();
}

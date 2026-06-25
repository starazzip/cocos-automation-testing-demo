import { expect, test } from '@playwright/test';
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { get } from 'node:http';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repoRoot, 'tools/e2e-cases.json'), 'utf8'));

for (const e2eCase of cases) {
  test(`Cocos E2E: ${e2eCase.title}`, async ({ page }, testInfo) => {
    const runDir = resolve(repoRoot, 'temp/vscode-e2e', e2eCase.id);
    const testConfigPath = resolve(runDir, 'testConfig.json');
    const dbPath = resolve(runDir, 'slot.db');
    rmSync(runDir, { recursive: true, force: true });
    mkdirSync(runDir, { recursive: true });

    writeFileSync(testConfigPath, JSON.stringify(createTestConfig(e2eCase), null, 2));

    const processes = [];
    try {
      await waitForHttpUnavailable('http://127.0.0.1:8080/healthz', 5000);
      await waitForHttpUnavailable('http://127.0.0.1:8000/summary', 5000);
      await waitForHttpUnavailable('http://127.0.0.1:7457/testConfig.json', 5000);

      processes.push(startProcess('go', ['run', './cmd/server'], {
        cwd: resolve(repoRoot, 'server'),
        env: {
          SLOT_ADDR: '127.0.0.1:8080',
          SLOT_DB_PATH: dbPath,
          SLOT_TEST_MODE: '1',
        },
        logPath: resolve(runDir, 'backend.log'),
      }));
      await waitForHttp('http://127.0.0.1:8080/healthz', 30000);

      processes.push(startProcess('node', ['tools/automation-server.mjs'], {
        cwd: repoRoot,
        env: { AUTOMATION_PORT: '8000' },
        logPath: resolve(runDir, 'automation-server.log'),
      }));
      await waitForHttp('http://127.0.0.1:8000/summary', 10000);

      processes.push(startProcess('node', ['tools/cocos-preview-proxy.mjs'], {
        cwd: repoRoot,
        env: { TEST_CONFIG: testConfigPath },
        logPath: resolve(runDir, 'preview-proxy.log'),
      }));
      await waitForHttp('http://127.0.0.1:7457/testConfig.json', 10000);

      if (process.env.E2E_SKIP_REBUILD !== '1') {
        await runCommand('npm', ['run', 'cocos:rebuild-preview'], {
          cwd: repoRoot,
          logPath: resolve(runDir, 'cocos-rebuild-preview.log'),
          timeoutMs: 90000,
        });
      }

      const visualMode = process.env.E2E_VISUAL === '1';
      const searchParams = new URLSearchParams({ automation: '1' });
      if (visualMode) {
        searchParams.set('visual', '1');
      }
      await page.goto(`http://127.0.0.1:7457?${searchParams.toString()}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const summary = await waitForAutomationSummary(90000);
      await testInfo.attach('automation-summary', {
        body: JSON.stringify(summary, null, 2),
        contentType: 'application/json',
      });

      expect(summary.ended, formatLogs(summary)).toBe(true);
      expect(summary.failed, formatLogs(summary)).toBe(false);
      if (visualMode) {
        await delay(Number(process.env.E2E_HOLD_MS ?? 10000));
      }
    } finally {
      for (const child of processes.reverse()) {
        await stopProcess(child);
      }
    }
  });
}

function createTestConfig(e2eCase) {
  return {
    jobId: `slot-e2e-${e2eCase.id}`,
    localServer: {
      ip: '127.0.0.1',
      port: 8000,
      timeout: 5000,
    },
    platforms: [
      {
        platformIndex: 0,
        testScripts: [
          {
            scriptName: e2eCase.scriptName,
            classNames: [e2eCase.className],
          },
        ],
      },
    ],
  };
}

function startProcess(command, args, options = {}) {
  const out = createLogStream(options.logPath);
  const child = spawn(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...(options.env ?? {}) },
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.pipe(out, { end: false });
  child.stderr.pipe(out, { end: false });
  child.on('exit', (code, signal) => {
    out.write(`\n[exit code=${code} signal=${signal}]\n`);
    out.end();
  });
  return child;
}

function createLogStream(logPath) {
  mkdirSync(dirname(logPath), { recursive: true });
  return createWriteStream(logPath, { flags: 'a' });
}

async function runCommand(command, args, options = {}) {
  const child = startProcess(command, args, options);
  const timeoutMs = options.timeoutMs ?? 30000;
  const result = await waitForProcess(child, timeoutMs);
  if (result.code !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.code}. See ${options.logPath}`);
  }
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

function stopProcess(child) {
  if (child.exitCode !== null) {
    return Promise.resolve();
  }
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { shell: true, stdio: 'ignore' });
    return waitForProcessExit(killer, 5000);
  }
  child.kill('SIGTERM');
  return waitForProcessExit(child, 5000);
}

function waitForProcessExit(child, timeoutMs) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, timeoutMs);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function waitForHttp(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await httpGet(url);
      return;
    } catch {
      await delay(500);
    }
  }
  throw new Error(`${url} was not reachable within ${timeoutMs}ms`);
}

async function waitForHttpUnavailable(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await httpGet(url);
    } catch {
      return;
    }
    await delay(250);
  }
  throw new Error(`${url} is still reachable after ${timeoutMs}ms`);
}

async function waitForAutomationSummary(timeoutMs) {
  const startedAt = Date.now();
  let lastSummary = null;
  while (Date.now() - startedAt < timeoutMs) {
    lastSummary = JSON.parse(await httpGet('http://127.0.0.1:8000/summary'));
    if (lastSummary.ended || lastSummary.failed) {
      return lastSummary;
    }
    await delay(500);
  }
  throw new Error(`Cocos automation did not finish within ${timeoutMs}ms. Last summary: ${JSON.stringify(lastSummary, null, 2)}`);
}

function httpGet(url) {
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

function formatLogs(summary) {
  return (summary.logs ?? [])
    .map((entry) => JSON.stringify(entry))
    .slice(-30)
    .join('\n');
}

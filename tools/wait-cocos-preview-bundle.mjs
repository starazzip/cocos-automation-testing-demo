import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { createPreviewBundlePatterns, discoverE2ECases } from './e2e/case-discovery.mjs';

const previewRoot = resolve(process.env.COCOS_PREVIEW_ROOT || 'temp/programming/packer-driver/targets/preview');
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fallbackPatterns = [
    'e2e/_template-e2e.test.ts',
    'my_e2e_case',
];

export async function waitForPreviewBundle(options = {}) {
    const patterns = options.patterns || process.argv.slice(2);
    const expectedPatterns = patterns.length > 0 ? patterns : defaultPreviewBundlePatterns();
    const timeoutMs = options.timeoutMs ?? Number(process.env.COCOS_PREVIEW_WAIT_MS || 60000);
    const intervalMs = options.intervalMs ?? 1000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const missing = findMissingPatterns(expectedPatterns);
        if (missing.length === 0) {
            console.log(`Cocos preview bundle is ready: ${expectedPatterns.join(', ')}`);
            return;
        }
        await delay(intervalMs);
    }

    const missing = findMissingPatterns(expectedPatterns);
    throw new Error(`Cocos preview bundle did not include ${missing.join(', ')} within ${timeoutMs}ms. Start Cocos Preview once, then run this command again.`);
}

function defaultPreviewBundlePatterns() {
    const patterns = createPreviewBundlePatterns(discoverE2ECases(repoRoot));
    return patterns.length > 0 ? patterns : fallbackPatterns;
}

function findMissingPatterns(patterns) {
    const haystack = readPreviewText();
    return patterns.filter((pattern) => !haystack.includes(pattern));
}

function readPreviewText() {
    if (!existsSync(previewRoot)) {
        return '';
    }

    const files = [];
    collectTextFiles(previewRoot, files);
    return files.map((file) => readFileSync(file, 'utf8')).join('\n');
}

function collectTextFiles(dir, output) {
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            collectTextFiles(fullPath, output);
            continue;
        }
        if (/\.(json|js|mjs)$/i.test(entry)) {
            output.push(fullPath);
        }
    }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    waitForPreviewBundle().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

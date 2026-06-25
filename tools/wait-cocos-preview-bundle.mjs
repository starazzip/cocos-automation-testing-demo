import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const previewRoot = resolve(process.env.COCOS_PREVIEW_ROOT || 'temp/programming/packer-driver/targets/preview');

export async function waitForPreviewBundle(options = {}) {
    const patterns = options.patterns || process.argv.slice(2);
    const expectedPatterns = patterns.length > 0 ? patterns : ['slot-e2e.test.ts', 'slot_forced_spin_e2e', 'slot_credit_in_out_e2e'];
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

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const serverRoot = resolve(projectRoot, '../server');

const child = spawn('go', ['run', './cmd/server'], {
    cwd: serverRoot,
    env: {
        ...process.env,
        SLOT_TEST_MODE: process.env.SLOT_TEST_MODE ?? '1',
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
});

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }
    process.exit(code ?? 0);
});

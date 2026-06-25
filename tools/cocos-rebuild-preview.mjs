import { request } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { waitForPreviewBundle } from './wait-cocos-preview-bundle.mjs';

const mcpUrl = new URL(process.env.COCOS_MCP_URL || 'http://127.0.0.1:3000/mcp');
const refreshFolder = process.env.COCOS_REFRESH_FOLDER || 'db://assets';

async function main() {
    await callTool('project_refresh_assets', { folder: refreshFolder });

    // Give Creator a short beat to react to the asset-db refresh before polling preview output.
    await delay(500);
    await waitForPreviewBundle({
        patterns: ['slot-e2e.test.ts', 'slot_forced_spin_e2e', 'slot_credit_in_out_e2e'],
        timeoutMs: Number(process.env.COCOS_PREVIEW_WAIT_MS || 60000),
        intervalMs: 1000,
    });
}

function callTool(name, args) {
    const body = JSON.stringify({
        jsonrpc: '2.0',
        id: `cocos-${Date.now()}`,
        method: 'tools/call',
        params: {
            name,
            arguments: args,
        },
    });

    return new Promise((resolve, reject) => {
        const req = request({
            hostname: mcpUrl.hostname,
            port: mcpUrl.port || 80,
            path: mcpUrl.pathname,
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body),
            },
        }, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if ((res.statusCode ?? 500) >= 400) {
                    reject(new Error(`Cocos MCP returned HTTP ${res.statusCode}: ${data}`));
                    return;
                }

                const response = JSON.parse(data);
                if (response.error) {
                    reject(new Error(`Cocos MCP ${name} failed: ${response.error.message}`));
                    return;
                }

                const toolText = response.result?.content?.[0]?.text;
                const toolResult = toolText ? JSON.parse(toolText) : {};
                if (toolResult.success === false) {
                    reject(new Error(`Cocos MCP ${name} failed: ${toolResult.error || toolResult.message || 'unknown error'}`));
                    return;
                }

                console.log(`Cocos MCP ${name} ok`);
                resolve(toolResult);
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Cannot reach Cocos MCP at ${mcpUrl.href}. Open Cocos Creator, enable cocos-mcp-server, and start the server. ${error.message}`));
        });
        req.write(body);
        req.end();
    });
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});

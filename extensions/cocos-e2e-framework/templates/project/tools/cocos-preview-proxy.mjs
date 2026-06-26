import { createReadStream } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { resolve } from 'node:path';

const listenPort = Number(process.env.COCOS_PROXY_PORT || 7457);
const targetHost = process.env.COCOS_PREVIEW_HOST || '127.0.0.1';
const targetPort = Number(process.env.COCOS_PREVIEW_PORT || 7456);
const testConfigPath = resolve(process.env.TEST_CONFIG || 'tools/testConfig.slot-e2e.json');

const server = createServer((clientRequest, clientResponse) => {
    if (clientRequest.method === 'GET' && clientRequest.url?.startsWith('/testConfig.json')) {
        clientResponse.writeHead(200, {
            'content-type': 'application/json',
            'cache-control': 'no-store',
        });
        createReadStream(testConfigPath).pipe(clientResponse);
        return;
    }

    const proxyRequest = httpRequest({
        hostname: targetHost,
        port: targetPort,
        method: clientRequest.method,
        path: clientRequest.url,
        headers: clientRequest.headers,
    }, (proxyResponse) => {
        clientResponse.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
        proxyResponse.pipe(clientResponse);
    });

    proxyRequest.on('error', (error) => {
        clientResponse.writeHead(502, { 'content-type': 'text/plain' });
        clientResponse.end(`preview proxy failed: ${error.message}`);
    });

    clientRequest.pipe(proxyRequest);
});

server.listen(listenPort, '127.0.0.1', () => {
    console.log(`cocos preview proxy listening on http://127.0.0.1:${listenPort}`);
    console.log(`proxy target http://${targetHost}:${targetPort}`);
    console.log(`serving ${testConfigPath} as /testConfig.json`);
});

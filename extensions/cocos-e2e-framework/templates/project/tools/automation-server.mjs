import { createHash } from 'node:crypto';
import { createServer } from 'node:http';

const port = Number(process.env.AUTOMATION_PORT || 8000);
const logs = [];
let ended = false;
let failed = false;

const server = createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
        response.writeHead(204, corsHeaders());
        response.end();
        return;
    }

    if (request.method === 'POST' && request.url?.startsWith('/runtime/')) {
        const body = await readBody(request);
        logs.push({ url: request.url, body });
        if (request.url === '/runtime/scriptRunError') {
            failed = true;
        }
        response.writeHead(200, {
            ...corsHeaders(),
            'content-type': 'application/json',
        });
        response.end(JSON.stringify({ ok: true }));
        return;
    }

    if (request.method === 'GET' && request.url === '/summary') {
        response.writeHead(200, {
            ...corsHeaders(),
            'content-type': 'application/json',
        });
        response.end(JSON.stringify({ ended, failed, logs }, null, 2));
        return;
    }

    response.writeHead(404);
    response.end('not found');
});

server.on('upgrade', (request, socket) => {
    if (request.url !== '/ws/caster') {
        socket.destroy();
        return;
    }

    const key = request.headers['sec-websocket-key'];
    const accept = createHash('sha1')
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest('base64');

    socket.write([
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        '',
    ].join('\r\n'));

    socket.on('data', (buffer) => {
        for (const message of decodeFrames(buffer)) {
            if (message.startsWith('type:ping_')) {
                continue;
            }

            const payload = safeJSON(message);
            if (!payload) {
                continue;
            }

            logs.push({ ws: payload });
            if (payload.state === 'Error') {
                failed = true;
            }
            if (payload.state === 'End') {
                ended = true;
            }
            if (payload.id) {
                sendFrame(socket, JSON.stringify({ id: payload.id, state: 'Msg_Ok' }));
            }
        }
    });
    socket.on('error', (error) => {
        logs.push({ socketError: error.message });
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(`automation server listening on http://127.0.0.1:${port}`);
});

function readBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        request.on('error', reject);
    });
}

function corsHeaders() {
    return {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type',
    };
}

function safeJSON(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function decodeFrames(buffer) {
    const messages = [];
    let offset = 0;

    while (offset + 2 <= buffer.length) {
        const first = buffer[offset++];
        const second = buffer[offset++];
        const opcode = first & 0x0f;
        const masked = (second & 0x80) !== 0;
        let length = second & 0x7f;

        if (length === 126) {
            if (offset + 2 > buffer.length) {
                break;
            }
            length = buffer.readUInt16BE(offset);
            offset += 2;
        } else if (length === 127) {
            if (offset + 8 > buffer.length) {
                break;
            }
            const high = buffer.readUInt32BE(offset);
            const low = buffer.readUInt32BE(offset + 4);
            length = high * 2 ** 32 + low;
            offset += 8;
        }

        const mask = masked ? buffer.subarray(offset, offset + 4) : null;
        if (masked) {
            offset += 4;
        }
        if (offset + length > buffer.length) {
            break;
        }

        const payload = Buffer.from(buffer.subarray(offset, offset + length));
        offset += length;
        if (mask) {
            for (let index = 0; index < payload.length; index++) {
                payload[index] ^= mask[index % 4];
            }
        }
        if (opcode === 1) {
            messages.push(payload.toString('utf8'));
        }
    }

    return messages;
}

function sendFrame(socket, message) {
    const payload = Buffer.from(message);
    let header;
    if (payload.length < 126) {
        header = Buffer.from([0x81, payload.length]);
    } else {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(payload.length, 2);
    }
    socket.write(Buffer.concat([header, payload]));
}

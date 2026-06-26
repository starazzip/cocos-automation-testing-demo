import { Envelope, ProtocolError } from './protocol';

type PendingRequest = {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    timer: number;
};

export class SlotWebSocketAdapter {
    private socket: WebSocket | null = null;
    private nextID = 1;
    private pending = new Map<string, PendingRequest>();

    constructor(
        private readonly url: string,
        private readonly timeoutMs = 5000,
    ) {}

    get connected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    connect(): Promise<void> {
        if (this.connected) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const socket = new WebSocket(this.url);
            this.socket = socket;

            socket.onopen = () => resolve();
            socket.onerror = () => reject(new Error('websocket connection failed'));
            socket.onclose = () => this.rejectAll(new Error('websocket closed'));
            socket.onmessage = (event) => this.handleMessage(String(event.data));
        });
    }

    close(): void {
        this.socket?.close();
        this.socket = null;
        this.rejectAll(new Error('websocket closed'));
    }

    async request<TPayload = unknown, TResult = unknown>(type: string, payload?: TPayload): Promise<TResult> {
        await this.connect();
        if (!this.socket || !this.connected) {
            throw new Error('websocket is not connected');
        }

        const id = `cocos-${this.nextID++}`;
        const envelope: Envelope<TPayload> = { id, type, payload };
        const result = new Promise<TResult>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`request timed out: ${type}`));
            }, this.timeoutMs) as unknown as number;
            this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timer });
        });

        this.socket.send(JSON.stringify(envelope));
        return result;
    }

    private handleMessage(raw: string): void {
        let envelope: Envelope;
        try {
            envelope = JSON.parse(raw) as Envelope;
        } catch (error) {
            return;
        }

        if (!envelope.id) {
            return;
        }
        const pending = this.pending.get(envelope.id);
        if (!pending) {
            return;
        }
        this.pending.delete(envelope.id);
        clearTimeout(pending.timer);

        if (envelope.type === 'error' && envelope.error) {
            pending.reject(new ProtocolError(envelope.error));
            return;
        }
        pending.resolve(envelope.payload);
    }

    private rejectAll(error: Error): void {
        for (const [id, pending] of this.pending) {
            clearTimeout(pending.timer);
            pending.reject(error);
            this.pending.delete(id);
        }
    }
}

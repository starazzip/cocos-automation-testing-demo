import { _decorator, Button, Canvas, Color, Component, director, Graphics, Label, Node, Sprite, UITransform, Vec3 } from 'cc';
import { SlotGameService, type SlotGameAdapter } from './scripts/SlotGameService';
import { SlotWebSocketAdapter } from './scripts/SlotWebSocketAdapter';
import { BalancePayload, Board, CreditOutPayload, PaylineWin, ProtocolError, SettingsPayload, SpinPayload } from './scripts/protocol';

const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {
    @property
    websocketUrl = 'ws://127.0.0.1:8080/ws';

    @property
    creditInAmount = 100;

    @property
    spinAnimationSeconds = 2;

    @property
    reelTickSeconds = 0.08;

    private service: SlotGameService | null = null;
    private settings: SettingsPayload | null = null;
    private selectedBet = 1;
    private balance = 0;
    private win = 0;
    private autoSpin = false;
    private spinInFlight = false;
    private reelAnimationToken = 0;
    private winLineAnimationToken = 0;

    private statusLabel: Label | null = null;
    private balanceLabel: Label | null = null;
    private winLabel: Label | null = null;
    private betLabel: Label | null = null;
    private autoButtonLabel: Label | null = null;
    private winLineGraphics: Graphics | null = null;
    private cells: Label[][] = [];

    start() {
        this.buildUI();
        this.service = new SlotGameService(createSlotGameAdapter(this.websocketUrl));
        this.connectAndRefresh();
    }

    onDestroy() {
        this.autoSpin = false;
        this.service?.close();
    }

    private async connectAndRefresh(): Promise<void> {
        if (!this.service) {
            return;
        }
        this.setStatus('CONNECTING');
        try {
            await this.service.connect();
            this.settings = await this.service.settings();
            this.selectedBet = this.settings.defaultBet;
            const balance = await this.service.balance();
            this.balance = balance.balance;
            this.setStatus('CONNECTED');
            this.render();
        } catch (error) {
            this.setStatus(this.errorText(error));
        }
    }

    private async creditIn(): Promise<void> {
        if (!this.service) {
            return;
        }
        try {
            const result = await this.service.creditIn(this.creditInAmount);
            this.balance = result.balance;
            this.setStatus('CREDIT IN');
            this.render();
        } catch (error) {
            this.setStatus(this.errorText(error));
        }
    }

    private async creditOut(): Promise<void> {
        if (!this.service) {
            return;
        }
        this.stopAuto();
        try {
            const result = await this.service.creditOut();
            this.balance = result.balance;
            this.win = 0;
            this.setStatus(`PAID OUT ${result.paidOut}`);
            this.render();
        } catch (error) {
            this.setStatus(this.errorText(error));
        }
    }

    private async spinOnce(): Promise<boolean> {
        if (!this.service || this.spinInFlight) {
            return false;
        }
        this.spinInFlight = true;
        this.setStatus('SPINNING');
        this.win = 0;
        this.clearWinLines();
        this.render();
        const animation = this.playReelSpinAnimation(this.spinAnimationSeconds);
        try {
            const result = await this.service.spin(this.selectedBet);
            await animation;
            this.balance = result.balance;
            this.win = result.win;
            this.renderBoard(result.board);
            this.setStatus(result.win > 0 ? `WIN ${result.win}` : 'NO WIN');
            this.render();
            if (result.win > 0) {
                await this.playWinLineAnimation(result.lines);
            }
            return true;
        } catch (error) {
            this.stopReelSpinAnimation();
            this.clearWinLines();
            this.setStatus(this.errorText(error));
            if (error instanceof ProtocolError && error.code === 'insufficient_balance') {
                this.stopAuto();
            }
            return false;
        } finally {
            this.spinInFlight = false;
        }
    }

    private async playReelSpinAnimation(seconds: number): Promise<void> {
        const token = ++this.reelAnimationToken;
        const durationMs = Math.max(0, seconds * 1000);
        const startedAt = Date.now();

        while (this.reelAnimationToken === token && Date.now() - startedAt < durationMs) {
            this.renderRandomBoard();
            await this.delay(this.reelTickSeconds * 1000);
        }
    }

    private stopReelSpinAnimation(): void {
        this.reelAnimationToken++;
    }

    private async toggleAuto(): Promise<void> {
        if (this.autoSpin) {
            this.stopAuto();
            return;
        }
        this.autoSpin = true;
        this.render();
        while (this.autoSpin) {
            const ok = await this.spinOnce();
            if (!ok || this.balance < this.selectedBet) {
                this.stopAuto();
                break;
            }
            await this.delay(650);
        }
    }

    private stopAuto(): void {
        this.autoSpin = false;
        this.render();
    }

    private selectBet(bet: number): void {
        this.selectedBet = bet;
        this.render();
    }

    private buildUI(): void {
        const uiParent = this.resolveUIParent();
        uiParent.getChildByName('SlotRoot')?.destroy();

        const root = new Node('SlotRoot');
        root.setParent(uiParent);
        root.setPosition(new Vec3(0, 0, 0));
        root.addComponent(UITransform).setContentSize(720, 520);

        this.statusLabel = this.createLabel(root, 'ConnectionStatusLabel', 'DISCONNECTED', 22, new Vec3(0, 230, 0), 420, 34);
        this.balanceLabel = this.createLabel(root, 'BalanceLabel', 'BALANCE 0', 28, new Vec3(-210, 180, 0), 260, 40);
        this.winLabel = this.createLabel(root, 'WinLabel', 'WIN 0', 28, new Vec3(210, 180, 0), 220, 40);
        this.betLabel = this.createLabel(root, 'BetLabel', 'BET 1', 24, new Vec3(0, 180, 0), 160, 36);

        const grid = new Node('ReelGrid');
        grid.setParent(root);
        grid.addComponent(UITransform).setContentSize(300, 300);
        grid.setPosition(new Vec3(0, 20, 0));
        for (let row = 0; row < 3; row++) {
            this.cells[row] = [];
            for (let col = 0; col < 3; col++) {
                const cell = this.createCell(grid, row, col);
                this.cells[row][col] = cell;
            }
        }
        this.winLineGraphics = this.createWinLineOverlay(grid);

        this.createButton(root, 'CreditInButton', 'CREDIT IN', new Vec3(-255, -180, 0), () => this.creditIn());
        this.createButton(root, 'CreditOutButton', 'CREDIT OUT', new Vec3(-85, -180, 0), () => this.creditOut());
        this.createButton(root, 'SpinButton', 'SPIN', new Vec3(85, -180, 0), () => this.spinOnce());
        this.autoButtonLabel = this.createButton(root, 'AutoButton', 'AUTO', new Vec3(255, -180, 0), () => this.toggleAuto());

        this.createButton(root, 'Bet1Button', 'BET 1', new Vec3(-170, -235, 0), () => this.selectBet(1), 120);
        this.createButton(root, 'Bet5Button', 'BET 5', new Vec3(0, -235, 0), () => this.selectBet(5), 120);
        this.createButton(root, 'Bet10Button', 'BET 10', new Vec3(170, -235, 0), () => this.selectBet(10), 120);

        this.render();
    }

    private createLabel(parent: Node, name: string, text: string, fontSize: number, position: Vec3, width: number, height: number): Label {
        const node = new Node(name);
        node.setParent(parent);
        node.setPosition(position);
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = new Color(245, 245, 245, 255);
        return label;
    }

    private createCell(parent: Node, row: number, col: number): Label {
        const node = new Node(`Cell_${row}_${col}`);
        node.setParent(parent);
        node.setPosition(new Vec3((col - 1) * 96, (1 - row) * 96, 0));
        node.addComponent(UITransform).setContentSize(84, 84);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(36, 44, 58, 255);
        graphics.strokeColor = new Color(104, 128, 166, 255);
        graphics.lineWidth = 4;
        graphics.roundRect(-42, -42, 84, 84, 8);
        graphics.fill();
        graphics.stroke();

        const labelNode = new Node(`Cell_${row}_${col}_Label`);
        labelNode.setParent(node);
        labelNode.addComponent(UITransform).setContentSize(84, 84);
        const label = labelNode.addComponent(Label);
        label.string = '-';
        label.fontSize = 36;
        label.lineHeight = 42;
        label.color = new Color(255, 235, 140, 255);
        return label;
    }

    private createWinLineOverlay(parent: Node): Graphics {
        const node = new Node('WinLineOverlay');
        node.setParent(parent);
        node.addComponent(UITransform).setContentSize(300, 300);
        return node.addComponent(Graphics);
    }

    private createButton(parent: Node, name: string, text: string, position: Vec3, onClick: () => void, width = 150): Label {
        const node = new Node(name);
        node.setParent(parent);
        node.setPosition(position);
        node.addComponent(UITransform).setContentSize(width, 44);
        const sprite = node.addComponent(Sprite);
        sprite.color = new Color(66, 92, 130, 255);
        node.addComponent(Button);
        node.on(Button.EventType.CLICK, onClick, this);

        const labelNode = new Node(`${name}Label`);
        labelNode.setParent(node);
        labelNode.addComponent(UITransform).setContentSize(width, 44);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 18;
        label.lineHeight = 24;
        label.color = new Color(255, 255, 255, 255);
        return label;
    }

    private resolveUIParent(): Node {
        let current: Node | null = this.node;
        while (current) {
            if (current.getComponent(Canvas)) {
                return current;
            }
            current = current.parent;
        }

        const canvasNode = director.getScene()?.getChildByName('Canvas');
        if (canvasNode?.getComponent(Canvas)) {
            return canvasNode;
        }

        return this.node;
    }

    private render(): void {
        if (this.balanceLabel) {
            this.balanceLabel.string = `BALANCE ${this.balance}`;
        }
        if (this.winLabel) {
            this.winLabel.string = `WIN ${this.win}`;
        }
        if (this.betLabel) {
            this.betLabel.string = `BET ${this.selectedBet}`;
        }
        if (this.autoButtonLabel) {
            this.autoButtonLabel.string = this.autoSpin ? 'STOP' : 'AUTO';
        }
    }

    private renderBoard(board: Board): void {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const symbol = board[row]?.[col] ?? '-';
                this.cells[row][col].string = symbol;
            }
        }
    }

    private renderRandomBoard(): void {
        const symbols = this.settings?.symbols.length ? this.settings.symbols : ['A', 'K', 'Q', 'J', '7'];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const index = Math.floor(Math.random() * symbols.length);
                this.cells[row][col].string = symbols[index];
            }
        }
    }

    private async playWinLineAnimation(lines: PaylineWin[]): Promise<void> {
        if (!lines.length) {
            this.clearWinLines();
            return;
        }

        const token = ++this.winLineAnimationToken;
        for (let frame = 0; frame < 8 && this.winLineAnimationToken === token; frame++) {
            const bright = frame % 2 === 0;
            this.drawWinLines(lines, bright);
            await this.delay(120);
        }

        if (this.winLineAnimationToken === token) {
            this.drawWinLines(lines, true);
        }
    }

    private drawWinLines(lines: PaylineWin[], bright: boolean): void {
        const graphics = this.winLineGraphics;
        if (!graphics) {
            return;
        }

        graphics.clear();
        graphics.lineWidth = bright ? 10 : 5;
        graphics.strokeColor = bright ? new Color(255, 224, 64, 255) : new Color(255, 224, 64, 120);

        for (const line of lines) {
            if (line.row < 0 || line.row > 2) {
                continue;
            }
            const y = (1 - line.row) * 96;
            graphics.moveTo(-134, y);
            graphics.lineTo(134, y);
            graphics.stroke();
        }
    }

    private clearWinLines(): void {
        this.winLineAnimationToken++;
        this.winLineGraphics?.clear();
    }

    private setStatus(text: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = text;
        }
    }

    private errorText(error: unknown): string {
        if (error instanceof ProtocolError) {
            return `ERROR ${error.code}`;
        }
        if (error instanceof Error) {
            return `ERROR ${error.message}`;
        }
        return 'ERROR';
    }

    private delay(secondsMs: number): Promise<void> {
        return new Promise((resolve) => {
            this.scheduleOnce(() => resolve(), secondsMs / 1000);
        });
    }
}

function createSlotGameAdapter(websocketUrl: string): SlotGameAdapter {
    if (isFrontendOnlyAutomationFixture()) {
        return new FrontendOnlySlotAdapter();
    }
    return new SlotWebSocketAdapter(websocketUrl);
}

function isFrontendOnlyAutomationFixture(): boolean {
    const locationLike = (globalThis as { location?: { search?: string } }).location;
    const search = locationLike?.search ?? '';
    if (!search) {
        return false;
    }
    const params = new URLSearchParams(search);
    return params.get('automation') === '1' && params.get('slotFixture') === 'frontend-only';
}

class FrontendOnlySlotAdapter implements SlotGameAdapter {
    private balance = 0;
    private spinID = 1;

    connect(): Promise<void> {
        return Promise.resolve();
    }

    close(): void {
        // No external connection is opened for the frontend-only fixture.
    }

    request<TPayload = unknown, TResult = unknown>(type: string, payload?: TPayload): Promise<TResult> {
        switch (type) {
            case 'settings.request':
                return Promise.resolve(this.settings() as TResult);
            case 'wallet.balance.request':
                return Promise.resolve({ balance: this.balance } as TResult);
            case 'wallet.credit_in.request':
                return Promise.resolve(this.creditIn(payload) as TResult);
            case 'wallet.credit_out.request':
                return Promise.resolve(this.creditOut() as TResult);
            case 'spin.request':
                return Promise.resolve(this.spin(payload) as TResult);
            default:
                return Promise.reject(new ProtocolError({
                    code: 'unsupported_request',
                    message: `unsupported frontend fixture request: ${type}`,
                }));
        }
    }

    private settings(): SettingsPayload {
        return {
            symbols: ['A', 'K', 'Q', 'J', '7'],
            betOptions: [1, 5, 10],
            defaultBet: 1,
            creditIn: 100,
            localPlayer: 'frontend-fixture-player',
        };
    }

    private creditIn(payload: unknown): BalancePayload {
        const amount = amountFromPayload(payload, 100);
        this.balance += amount;
        return { balance: this.balance };
    }

    private creditOut(): CreditOutPayload {
        const paidOut = this.balance;
        this.balance = 0;
        return { paidOut, balance: this.balance };
    }

    private spin(payload: unknown): SpinPayload {
        const bet = amountFromPayload(payload, 1, 'bet');
        if (this.balance < bet) {
            throw new ProtocolError({
                code: 'insufficient_balance',
                message: 'insufficient balance',
            });
        }

        const board: Board = [
            ['A', 'A', 'A'],
            ['K', 'Q', 'K'],
            ['7', '7', '7'],
        ];
        const win = 30;
        this.balance = this.balance - bet + win;
        return {
            spinId: this.spinID++,
            board,
            bet,
            win,
            balance: this.balance,
            lines: [
                { row: 0, symbol: 'A', count: 3, win: 10 },
                { row: 2, symbol: '7', count: 3, win: 20 },
            ],
        };
    }
}

function amountFromPayload(payload: unknown, fallback: number, field = 'amount'): number {
    if (!payload || typeof payload !== 'object') {
        return fallback;
    }
    const value = (payload as Record<string, unknown>)[field];
    return typeof value === 'number' ? value : fallback;
}

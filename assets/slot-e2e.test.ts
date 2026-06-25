import { Button, Canvas, director, Label, Node } from 'cc';
import { main as SlotMain } from './main';
// @ts-ignore
import { expect, runScene, sleep, testCase, testClass, waitForNextFrame } from 'db://automation-framework/runtime/test-framework.mjs';

type Envelope<T = unknown> = {
    id: string;
    type: string;
    payload?: T;
    error?: {
        code: string;
        message: string;
        details?: string;
    };
};

type Board = string[][];

const forcedBoard: Board = [
    ['A', 'A', 'A'],
    ['K', 'Q', 'K'],
    ['7', '7', '7'],
];

@runScene('main')
@testClass('slot_credit_in_out_e2e')
export class SlotCreditInOutE2E {
    @testCase
    async creditInAndCreditOut() {
        await prepareSlot();
        await visualStep();

        await clickButton('CreditOutButton');
        await visualStep();
        await waitForLabel('BalanceLabel', 'BALANCE 0', 3000);

        await clickButton('CreditInButton');
        await visualStep();
        await waitForLabel('BalanceLabel', 'BALANCE 100', 3000);

        await clickButton('CreditOutButton');
        await visualStep();
        await waitForLabel('BalanceLabel', 'BALANCE 0', 3000);
        await waitForLabel('WinLabel', 'WIN 0', 3000);
    }
}

@runScene('main')
@testClass('slot_forced_spin_e2e')
export class SlotForcedSpinE2E {
    @testCase
    async creditInAndSpinWithForcedBoard() {
        await prepareSlot();
        await visualStep();

        await clickButton('CreditOutButton');
        await visualStep();
        await waitForLabel('BalanceLabel', 'BALANCE 0', 3000);

        await clickButton('CreditInButton');
        await visualStep();
        await waitForLabel('BalanceLabel', 'BALANCE 100', 3000);

        await backendRequest('test.force_board.request', { board: forcedBoard }, 'test.force_board.result', isOkPayload);
        await visualStep();
        await clickButton('SpinButton');
        await visualStep();

        await waitForLabel('BalanceLabel', 'BALANCE 129', 6000);
        await waitForLabel('WinLabel', 'WIN 30', 6000);
        assertBoard(forcedBoard);
        await visualStep();
    }
}

async function prepareSlot(): Promise<void> {
    await loadMainScene();
    await mountSlotFixture();
    await waitForSlotReady();
}

async function loadMainScene(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        director.loadScene('main', (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
    await waitForNextFrame();
    await waitForNextFrame();
}

async function waitForSlotReady(): Promise<void> {
    await waitForNextFrame();
    await waitForLabel('ConnectionStatusLabel', 'CONNECTED', 5000);
}

async function mountSlotFixture(): Promise<void> {
    if (tryGetLabel('ConnectionStatusLabel')) {
        return;
    }

    const scene = director.getScene();
    expect(scene, 'scene should be loaded').to.not.equal(null);

    const parent = findCanvasNode() ?? scene!;
    parent.getChildByName('SlotE2ERoot')?.destroy();

    const root = new Node('SlotE2ERoot');
    root.setParent(parent);
    root.addComponent(SlotMain);

    await waitForNextFrame();
    await waitForNextFrame();
}

async function clickButton(name: string): Promise<void> {
    const node = await waitForButtonNode(name, 3000);
    const button = node!.getComponent(Button);
    expect(button, `${name} should have Button`).to.not.equal(null);
    node!.emit(Button.EventType.CLICK, button);
    await waitForNextFrame();
}

async function waitForButtonNode(name: string, timeoutMs: number): Promise<Node> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const node = findNodeWithComponent(name, Button);
        if (node) {
            return node;
        }
        await sleep(0.1);
    }

    const node = findNodeWithComponent(name, Button);
    expect(node, `${name} should exist with Button`).to.not.equal(null);
    return node!;
}

function assertBoard(board: Board): void {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const label = getLabel(`Cell_${row}_${col}_Label`);
            expect(label.string, `Cell_${row}_${col}`).to.equal(board[row][col]);
        }
    }
}

async function waitForLabel(name: string, expected: string, timeoutMs: number): Promise<void> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const label = tryGetLabel(name);
        if (label?.string === expected) {
            return;
        }
        await sleep(0.1);
    }

    expect(getLabel(name).string, name).to.equal(expected);
}

function getLabel(name: string): Label {
    const label = tryGetLabel(name);
    expect(label, `${name} should have Label. Scene tree: ${sceneTree()}`).to.not.equal(null);
    return label!;
}

function tryGetLabel(name: string): Label | null {
    const scene = director.getScene();
    if (!scene) {
        return null;
    }
    return findLabelRecursive(scene, name);
}

async function waitForNode(name: string, timeoutMs: number): Promise<Node> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const node = findNode(name);
        if (node) {
            return node;
        }
        await sleep(0.1);
    }

    const node = findNode(name);
    expect(node, `${name} should exist`).to.not.equal(null);
    return node!;
}

function findNode(name: string): Node | null {
    const scene = director.getScene();
    if (!scene) {
        return null;
    }
    return findNodeRecursive(scene, name);
}

function findNodeWithComponent<T>(name: string, component: new (...args: never[]) => T): Node | null {
    const scene = director.getScene();
    if (!scene) {
        return null;
    }
    return findNodeWithComponentRecursive(scene, name, component);
}

function findCanvasNode(): Node | null {
    const scene = director.getScene();
    if (!scene) {
        return null;
    }
    return findNodeByComponentRecursive(scene, Canvas);
}

function findNodeRecursive(node: Node, name: string): Node | null {
    if (node.name === name) {
        return node;
    }
    for (const child of node.children) {
        const found = findNodeRecursive(child, name);
        if (found) {
            return found;
        }
    }
    return null;
}

function findLabelRecursive(node: Node, name: string): Label | null {
    if (node.name === name) {
        const label = node.getComponent(Label);
        if (label) {
            return label;
        }
    }
    for (const child of node.children) {
        const found = findLabelRecursive(child, name);
        if (found) {
            return found;
        }
    }
    return null;
}

function findNodeWithComponentRecursive<T>(node: Node, name: string, component: new (...args: never[]) => T): Node | null {
    if (node.name === name && node.getComponent(component as never)) {
        return node;
    }
    for (const child of node.children) {
        const found = findNodeWithComponentRecursive(child, name, component);
        if (found) {
            return found;
        }
    }
    return null;
}

function findNodeByComponentRecursive<T>(node: Node, component: new (...args: never[]) => T): Node | null {
    if (node.getComponent(component as never)) {
        return node;
    }
    for (const child of node.children) {
        const found = findNodeByComponentRecursive(child, component);
        if (found) {
            return found;
        }
    }
    return null;
}

function sceneTree(): string {
    const scene = director.getScene();
    if (!scene) {
        return '<no scene>';
    }
    const lines: string[] = [];
    collectSceneTree(scene, lines, 0);
    return lines.join(' | ');
}

function collectSceneTree(node: Node, lines: string[], depth: number): void {
    if (lines.length >= 80) {
        return;
    }
    const components = node.components.map((component) => component.constructor.name).join(',');
    lines.push(`${' '.repeat(depth * 2)}${node.name}[${components}]`);
    for (const child of node.children) {
        collectSceneTree(child, lines, depth + 1);
    }
}

async function visualStep(): Promise<void> {
    const delaySeconds = visualDelaySeconds();
    if (delaySeconds > 0) {
        await sleep(delaySeconds);
    }
}

function visualDelaySeconds(): number {
    const locationLike = (globalThis as { location?: { search?: string } }).location;
    const search = locationLike?.search ?? '';
    if (!search.includes('visual=1')) {
        return 0;
    }
    return 0.8;
}

function backendRequest<TPayload>(
    type: string,
    payload: TPayload,
    expectedType: string,
    validatePayload: (payload: unknown) => boolean,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket('ws://127.0.0.1:8080/ws');
        const id = `automation-${Date.now()}`;
        const timer = setTimeout(() => {
            socket.close();
            reject(new Error(`${type} timed out`));
        }, 5000);

        socket.onopen = () => {
            const envelope: Envelope<TPayload> = { id, type, payload };
            socket.send(JSON.stringify(envelope));
        };
        socket.onerror = () => {
            clearTimeout(timer);
            reject(new Error(`${type} websocket failed`));
        };
        socket.onmessage = (event) => {
            clearTimeout(timer);
            const response = JSON.parse(String(event.data)) as Envelope;
            socket.close();
            if (response.id !== id) {
                reject(new Error(`${type} response id mismatch: ${response.id}`));
                return;
            }
            if (response.type === 'error') {
                reject(new Error(`${response.error?.code}: ${response.error?.message}`));
                return;
            }
            if (response.type !== expectedType) {
                reject(new Error(`${type} response type mismatch: ${response.type}`));
                return;
            }
            if (!validatePayload(response.payload)) {
                reject(new Error(`${type} response payload is invalid`));
                return;
            }
            resolve();
        };
    });
}

function isOkPayload(payload: unknown): boolean {
    return typeof payload === 'object'
        && payload !== null
        && 'ok' in payload
        && (payload as { ok?: unknown }).ok === true;
}

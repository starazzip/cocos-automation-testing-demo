export type SymbolName = string;
export type Board = SymbolName[][];

export interface Envelope<T = unknown> {
    id?: string;
    type: string;
    payload?: T;
    error?: ErrorPayload;
}

export interface ErrorPayload {
    code: string;
    message: string;
    details?: string;
}

export interface BalancePayload {
    balance: number;
}

export interface CreditOutPayload {
    paidOut: number;
    balance: number;
}

export interface SpinPayload {
    spinId: number;
    board: Board;
    bet: number;
    win: number;
    balance: number;
    lines: PaylineWin[];
}

export interface PaylineWin {
    row: number;
    symbol: SymbolName;
    count: number;
    win: number;
}

export interface SettingsPayload {
    symbols: SymbolName[];
    betOptions: number[];
    defaultBet: number;
    creditIn: number;
    localPlayer: string;
}

export class ProtocolError extends Error {
    readonly code: string;
    readonly details?: string;

    constructor(error: ErrorPayload) {
        super(error.message);
        this.name = 'ProtocolError';
        this.code = error.code;
        this.details = error.details;
    }
}

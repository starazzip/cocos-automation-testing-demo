import { BalancePayload, CreditOutPayload, SettingsPayload, SpinPayload } from './protocol';
import { SlotWebSocketAdapter } from './SlotWebSocketAdapter';

export class SlotGameService {
    private settingsCache: SettingsPayload | null = null;

    constructor(private readonly adapter: SlotWebSocketAdapter) {}

    connect(): Promise<void> {
        return this.adapter.connect();
    }

    close(): void {
        this.adapter.close();
    }

    settings(): Promise<SettingsPayload> {
        return this.adapter.request<Record<string, never>, SettingsPayload>('settings.request', {}).then((settings) => {
            this.settingsCache = settings;
            return settings;
        });
    }

    balance(): Promise<BalancePayload> {
        return this.adapter.request<Record<string, never>, BalancePayload>('wallet.balance.request', {});
    }

    creditIn(amount?: number): Promise<BalancePayload> {
        const value = amount ?? this.settingsCache?.creditIn ?? 100;
        return this.adapter.request<{ amount: number }, BalancePayload>('wallet.credit_in.request', { amount: value });
    }

    creditOut(): Promise<CreditOutPayload> {
        return this.adapter.request<Record<string, never>, CreditOutPayload>('wallet.credit_out.request', {});
    }

    spin(bet: number): Promise<SpinPayload> {
        return this.adapter.request<{ bet: number }, SpinPayload>('spin.request', { bet });
    }
}

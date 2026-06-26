// @ts-ignore
import { runScene, testCase, testClass } from 'db://automation-framework/runtime/test-framework.mjs';
import {
    assertBoard,
    clickButton,
    forcedBoard,
    prepareSlot,
    visualStep,
    waitForLabel,
} from './slot-test-helpers';

@runScene('main')
@testClass('slot_frontend_only_spin_e2e')
export class SlotFrontendOnlySpinE2E {
    @testCase
    async creditInAndSpinWithoutBackend() {
        await prepareSlot();
        await visualStep();

        await clickButton('CreditOutButton');
        await visualStep();
        await waitForLabel('BalanceLabel', 'BALANCE 0', 3000);

        await clickButton('CreditInButton');
        await visualStep();
        await waitForLabel('BalanceLabel', 'BALANCE 100', 3000);

        await clickButton('SpinButton');
        await visualStep();

        await waitForLabel('BalanceLabel', 'BALANCE 129', 6000);
        await waitForLabel('WinLabel', 'WIN 30', 6000);
        assertBoard(forcedBoard);
        await visualStep();
    }
}

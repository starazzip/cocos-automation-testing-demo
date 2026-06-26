// @ts-ignore
import { runScene, testCase, testClass } from 'db://automation-framework/runtime/test-framework.mjs';
import {
    assertBoard,
    backendRequest,
    clickButton,
    forcedBoard,
    isOkPayload,
    prepareSlot,
    visualStep,
    waitForLabel,
} from './slot-test-helpers';

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

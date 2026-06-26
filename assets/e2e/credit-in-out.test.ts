// @ts-ignore
import { runScene, testCase, testClass } from 'db://automation-framework/runtime/test-framework.mjs';
import { clickButton, prepareSlot, visualStep, waitForLabel } from './slot-test-helpers';

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

import { director } from 'cc';
// @ts-ignore
import { expect, runScene, testCase, testClass, waitForNextFrame } from 'db://automation-framework/runtime/test-framework.mjs';

@runScene('main')
@testClass('my_e2e_case')
export class MyE2ECase {
    @testCase
    async sceneLoads() {
        await waitForNextFrame();
        expect(director.getScene(), 'scene should be loaded').to.not.equal(null);
    }
}

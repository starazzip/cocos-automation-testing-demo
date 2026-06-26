/**
 * 技术指导: hao.wang、xin.Li
 * Author: xiaolong.he
 * Date: 2021-12-01
 */

import { Game, game } from 'cc';
import { EDITOR } from 'cc/env';
// @ts-ignore
import { Runner } from 'db://automation-framework/runtime/test-framework.mjs';

/**
 *  注册监听游戏事件
 */
let started = false;

function automationEnabled() {
    const locationLike = (globalThis as { location?: { search?: string } }).location;
    return locationLike?.search?.includes('automation=1') === true;
}

function runOnce() {
    if (EDITOR || started || !automationEnabled()) {
        return;
    }
    started = true;
    Runner.run();
}

game.on(Game.EVENT_GAME_INITED, () => {
    game.onStart = runOnce;
}, this);

if (!EDITOR) {
    setTimeout(runOnce, 0);
}

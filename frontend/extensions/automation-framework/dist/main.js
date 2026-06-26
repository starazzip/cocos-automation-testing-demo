'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const automation = require('./removeTestScripts.js');

exports.load = async function load() {
    await automation.startTest(process, 'automation-framework');
};

exports.methods = {};

exports.unload = function unload() {};

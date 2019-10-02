'use strict';
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

describe('commands/deploy.js', function () {

    var app = require('../commands/deploy');
    const stackName = 'kelch-test';

    it('getStackInfo', async () => {
        var result = await app.getStackInfo(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'StackId', 'check: having property "StackId"');
    });

    it('getStackOutput', async () => {
        var result = await app.getStackOutput(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'KelchAPIGatewayOutput', 'check: having property "KelchAPIGatewayOutput"');
    });

    it('displayEndpoint', async () => {
        await app.displayEndpoint(stackName, ['/test', '/test/todo']);
    });

});

